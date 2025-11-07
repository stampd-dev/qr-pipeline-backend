import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { createQrCodeDynamo } from "../../commands/create-qr-code-dynamo";
import { getCsvInputs } from "../../queries/get-csv-inputs";
import { S3Client } from "@aws-sdk/client-s3";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { generateAndUploadQrCode } from "../../commands/create-qr-code-s3";

const s3Client = new S3Client();
const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient());
const bucketName = process.env.CSV_INPUT_BUCKET_NAME!;

export const handler = async (event: any) => {
  console.log("event", event);
  const { batchId } = JSON.parse(event.body || "{}");

  const csvInputs = await getCsvInputs({
    batchId,
    client: s3Client,
    bucketName,
  });

  if (!csvInputs) {
    throw new Error("CSV inputs not found");
  }

  /**
   * CSV Inputs are in the format:
   * referalCode
   * email
   * name
   */
  const csvInputLines = csvInputs.split("\n");
  for (const csvInputLine of csvInputLines) {
    const [referalCode, email, name] = csvInputLine.split(",");
    await createQrCodeDynamo({
      referalCode,
      referrerEmail: email,
      referrerName: name,
      client: dynamoClient,
      tableName: process.env.REFERRER_STATS_TABLE_NAME!,
    });
    await generateAndUploadQrCode({
      referalCode,
      client: s3Client,
      bucketName: process.env.QR_BATCH_OUTPUT_BUCKET_NAME!,
    });
  }
};
