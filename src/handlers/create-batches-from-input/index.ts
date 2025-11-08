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
  console.log("event", event);

  const { key } = event;

  const csvInputs = await getRawCsvInputs({
    key,
    client: s3Client,
    bucketName,
  });

  if (!csvInputs) {
    throw new Error("CSV inputs not found");
  }

  /** Split the csv into batches of 21 */
  const resusableHeader = csvInputs.split("\n")[0];
  const csvInputLines = csvInputs.split("\n").filter((line) => line.trim());

  const batches = chunk(csvInputLines, 21);

  for (const batch of batches) {
    const batchId = uuidv4();
    const newBatch = await createCsvBatch({
      batchId,
      client: s3Client,
      bucketName,
      csvInputs: [resusableHeader, ...batch].join("\n"),
    });
    await sendBatchToQueue({
      batchId: newBatch.batchId,
      queueUrl: processBatchQueueUrl,
    });
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Hello, world!" }),
  };
};
