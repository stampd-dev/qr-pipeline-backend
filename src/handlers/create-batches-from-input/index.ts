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

  const { key } =
    typeof event.body === "string" ? JSON.parse(event.body) : event.body;

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
    firstChars: csvInputs.substring(0, 200),
    lastChars: csvInputs.substring(Math.max(0, csvInputs.length - 200)),
    hasBOM: csvInputs.charCodeAt(0) === 0xfeff,
  });

  // Remove BOM if present (UTF-8 BOM is 0xFEFF)
  let cleanedCsv = csvInputs;
  if (cleanedCsv.charCodeAt(0) === 0xfeff) {
    cleanedCsv = cleanedCsv.slice(1);
    console.log("[CreateBatchesFromInput] Removed BOM from CSV");
  }

  // Trim leading/trailing whitespace
  cleanedCsv = cleanedCsv.trim();

  // Normalize line endings: handle both \r\n (Windows) and \n (Unix)
  // Replace \r\n with \n, then replace any remaining \r with \n
  const normalizedCsv = cleanedCsv.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Count raw newlines for diagnostics
  const rawNewlineCount = (csvInputs.match(/\n/g) || []).length;
  const rawCarriageReturnCount = (csvInputs.match(/\r/g) || []).length;

  console.log("[CreateBatchesFromInput] Line ending analysis", {
    rawNewlineCount,
    rawCarriageReturnCount,
    normalizedLength: normalizedCsv.length,
  });

  /** Split the csv into batches of 21 */
  // Split on newlines and filter out empty lines
  const allLines = normalizedCsv.split("\n").filter((line) => line.trim());

  console.log("[CreateBatchesFromInput] Parsed CSV lines", {
    totalLines: allLines.length,
    firstLine: allLines[0]?.substring(0, 200),
    firstLineLength: allLines[0]?.length,
    secondLine: allLines[1]?.substring(0, 200),
    secondLineLength: allLines[1]?.length,
    lastLine: allLines[allLines.length - 1]?.substring(0, 200),
    lastLineLength: allLines[allLines.length - 1]?.length,
    sampleLines: allLines.slice(0, 5).map((line, idx) => ({
      index: idx,
      length: line.length,
      preview: line.substring(0, 100),
      hasCommas: (line.match(/,/g) || []).length,
    })),
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
      batchPreview: batch.slice(0, 2).map((line) => line.substring(0, 50)),
    });

    // Construct the batch CSV: header + data rows
    const batchCsvContent = [resusableHeader, ...batch].join("\n");

    console.log("[CreateBatchesFromInput] Batch CSV content details", {
      batchId,
      batchIndex: i + 1,
      headerLength: resusableHeader.length,
      batchRowCount: batch.length,
      batchCsvLength: batchCsvContent.length,
      batchCsvLineCount: (batchCsvContent.match(/\n/g) || []).length + 1,
      firstLinePreview: batchCsvContent.substring(0, 150),
    });

    const newBatch = await createCsvBatch({
      batchId,
      client: s3Client,
      bucketName,
      csvInputs: batchCsvContent,
    });
    console.log("[CreateBatchesFromInput] Created CSV batch file", {
      batchId: newBatch.batchId,
      s3Key: `csv-uploads/${newBatch.batchId}.csv`,
      expectedRows: batch.length + 1, // +1 for header
    });

    // await sendBatchToQueue({
    //   batchId: newBatch.batchId,
    //   queueUrl: processBatchQueueUrl,
    // });
    // console.log("[CreateBatchesFromInput] Sent batch to queue", {
    //   batchId: newBatch.batchId,
    //   queueUrl: processBatchQueueUrl,
    // });

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
