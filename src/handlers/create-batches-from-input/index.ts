import { S3Client } from "@aws-sdk/client-s3";
import { getRawCsvInputs } from "../../queries/get-csv-inputs";
import { createCsvBatch } from "../../commands/create-csv-batch";
import { v4 as uuidv4 } from "uuid";
import { sendBatchToQueue } from "../../commands/send-batch-to-queue";

const s3Client = new S3Client();
const bucketName = process.env.CSV_INPUT_BUCKET_NAME!;
const processBatchQueueUrl = process.env.PROCESS_BATCH_QUEUE_URL!;

const chunk = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

export const handler = async (event: any) => {
  console.log("[CreateBatchesFromInput] Handler invoked", {
    event: JSON.stringify(event, null, 2),
    bucketName,
  });

  const { key } = JSON.parse(event.body || "{}");
  console.log("[CreateBatchesFromInput] Parsed request body", { key });

  if (!key) {
    console.error("[CreateBatchesFromInput] Missing 'key' in request body");
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing 'key' in request body" }),
    };
  }

  console.log("[CreateBatchesFromInput] Fetching CSV from S3", {
    key,
    bucketName,
  });
  const csvInputs = await getRawCsvInputs({
    key,
    client: s3Client,
    bucketName,
  });

  if (!csvInputs) {
    console.error("[CreateBatchesFromInput] CSV inputs not found", {
      key,
      bucketName,
    });
    throw new Error("CSV inputs not found");
  }

  console.log("[CreateBatchesFromInput] CSV fetched successfully", {
    key,
    csvLength: csvInputs.length,
  });

  /** Split the csv into batches of 21 */
  const allLines = csvInputs.split("\n").filter((line) => line.trim());
  console.log("[CreateBatchesFromInput] Parsed CSV lines", {
    totalLines: allLines.length,
    firstLine: allLines[0]?.substring(0, 100),
  });

  if (allLines.length < 2) {
    console.error("[CreateBatchesFromInput] CSV validation failed", {
      lineCount: allLines.length,
      key,
    });
    throw new Error("CSV must contain at least a header and one data row");
  }

  const resusableHeader = allLines[0];
  const csvInputLines = allLines.slice(1); // Exclude header from data lines
  console.log("[CreateBatchesFromInput] Prepared data lines", {
    header: resusableHeader,
    dataLineCount: csvInputLines.length,
  });

  const batches = chunk(csvInputLines, 21);
  console.log("[CreateBatchesFromInput] Created batches", {
    batchCount: batches.length,
    batchSize: 21,
    totalDataLines: csvInputLines.length,
  });

  const createdBatchIds: string[] = [];
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const batchId = uuidv4();
    console.log("[CreateBatchesFromInput] Processing batch", {
      batchIndex: i + 1,
      batchId,
      batchSize: batch.length,
    });

    const newBatch = await createCsvBatch({
      batchId,
      client: s3Client,
      bucketName,
      csvInputs: [resusableHeader, ...batch].join("\n"),
    });
    console.log("[CreateBatchesFromInput] Created CSV batch file", {
      batchId: newBatch.batchId,
      s3Key: `csv-uploads/${newBatch.batchId}.csv`,
    });

    await sendBatchToQueue({
      batchId: newBatch.batchId,
      queueUrl: processBatchQueueUrl,
    });
    console.log("[CreateBatchesFromInput] Sent batch to queue", {
      batchId: newBatch.batchId,
      queueUrl: processBatchQueueUrl,
    });

    createdBatchIds.push(newBatch.batchId);
  }

  console.log("[CreateBatchesFromInput] Handler completed successfully", {
    totalBatches: createdBatchIds.length,
    batchIds: createdBatchIds,
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Hello, world!" }),
  };
};
