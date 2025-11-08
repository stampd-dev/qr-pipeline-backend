import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { createQrCodeDynamo } from "../../commands/create-qr-code-dynamo";
import { getCsvInputs } from "../../queries/get-csv-inputs";
import { S3Client } from "@aws-sdk/client-s3";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { generateAndUploadQrCode } from "../../commands/create-qr-code-s3";

const s3Client = new S3Client();
const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient());
const bucketName = process.env.CSV_INPUT_BUCKET_NAME!;

type SQSEvent = {
  Records: Array<{
    body: string;
    messageId: string;
    receiptHandle: string;
  }>;
};

type QueueMessage = {
  batchId: string;
};

const processBatch = async (batchId: string): Promise<void> => {
  const csvInputs = await getCsvInputs({
    batchId,
    client: s3Client,
    bucketName,
  });

  if (!csvInputs) {
    throw new Error(`CSV inputs not found for batchId: ${batchId}`);
  }

  /**
   * CSV Inputs are in the format:
   * referalCode
   * email
   * name
   */
  const csvInputLines = csvInputs.split("\n").filter((line) => line.trim());

  for (const csvInputLine of csvInputLines) {
    const [
      referalCode,
      email,
      name,
      first_name,
      last_name,
      phone_number,
      coin_number,
      kickstarter_tag,
      kick_starter_url,
    ] = csvInputLine.split(",");

    await createQrCodeDynamo({
      referalCode: kick_starter_url.split("ref=")[1],
      referrerEmail: email,
      referrerName: name,
      client: dynamoClient,
      tableName: process.env.REFERRER_STATS_TABLE_NAME!,
      firstName: first_name,
      lastName: last_name,
      phoneNumber: phone_number,
      referrerTag: kickstarter_tag,
      coinNumber: coin_number,
      kickstarterUrl: kick_starter_url,
    });
    await generateAndUploadQrCode({
      referalCode,
      client: s3Client,
      bucketName: process.env.QR_BATCH_OUTPUT_BUCKET_NAME!,
    });
  }
};

export const handler = async (event: SQSEvent): Promise<void> => {
  console.log("SQS event received", JSON.stringify(event, null, 2));

  if (!event.Records || event.Records.length === 0) {
    console.warn("No records found in SQS event");
    return;
  }

  for (const record of event.Records) {
    try {
      const message: QueueMessage = JSON.parse(record.body);
      const { batchId } = message;

      if (!batchId) {
        throw new Error(`Missing batchId in message: ${record.messageId}`);
      }

      console.log(`Processing batch: ${batchId}`);
      await processBatch(batchId);
      console.log(`Successfully processed batch: ${batchId}`);
    } catch (error) {
      console.error(`Error processing record ${record.messageId}:`, error);
      throw error;
    }
  }
};
