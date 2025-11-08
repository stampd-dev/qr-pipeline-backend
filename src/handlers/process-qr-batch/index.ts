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
  console.log("[ProcessQRBatch] Starting batch processing", {
    batchId,
    bucketName,
    s3Key: `csv-uploads/${batchId}.csv`,
  });

  const csvInputs = await getCsvInputs({
    batchId,
    client: s3Client,
    bucketName,
  });

  if (!csvInputs) {
    console.error("[ProcessQRBatch] CSV inputs not found", {
      batchId,
      bucketName,
    });
    throw new Error(`CSV inputs not found for batchId: ${batchId}`);
  }

  console.log("[ProcessQRBatch] CSV fetched successfully", {
    batchId,
    csvLength: csvInputs.length,
  });

  /**
   * CSV Inputs are in the format:
   * referalCode
   * email
   * name
   */
  const csvInputLines = csvInputs.split("\n").filter((line) => line.trim());
  console.log("[ProcessQRBatch] Parsed CSV lines", {
    batchId,
    totalLines: csvInputLines.length,
    firstLine: csvInputLines[0]?.substring(0, 100),
  });

  let processedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < csvInputLines.length; i++) {
    const csvInputLine = csvInputLines[i];
    console.log("[ProcessQRBatch] Processing CSV line", {
      batchId,
      lineIndex: i + 1,
      totalLines: csvInputLines.length,
      linePreview: csvInputLine.substring(0, 100),
    });

    try {
      const [
        name,
        first_name,
        last_name,
        email,
        phone_number,
        coin_number,
        kickstarter_tag,
        kick_starter_url,
      ] = csvInputLine.split(",");

      const referalCode = kick_starter_url.split("ref=")[1];
      console.log("[ProcessQRBatch] Extracted data from CSV line", {
        batchId,
        lineIndex: i + 1,
        referalCode,
        email,
        name,
      });

      console.log("[ProcessQRBatch] Creating DynamoDB record", {
        batchId,
        referalCode,
        tableName: process.env.REFERRER_STATS_TABLE_NAME!,
      });
      await createQrCodeDynamo({
        referalCode,
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
      console.log("[ProcessQRBatch] DynamoDB record created", {
        batchId,
        referalCode,
      });

      console.log("[ProcessQRBatch] Generating and uploading QR code", {
        batchId,
        referalCode,
        outputBucket: process.env.QR_BATCH_OUTPUT_BUCKET_NAME!,
      });
      await generateAndUploadQrCode({
        referalCode,
        client: s3Client,
        bucketName: process.env.QR_BATCH_OUTPUT_BUCKET_NAME!,
      });
      console.log("[ProcessQRBatch] QR code generated and uploaded", {
        batchId,
        referalCode,
      });

      processedCount++;
    } catch (error) {
      errorCount++;
      console.error("[ProcessQRBatch] Error processing CSV line", {
        batchId,
        lineIndex: i + 1,
        line: csvInputLine,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  console.log("[ProcessQRBatch] Batch processing completed", {
    batchId,
    totalLines: csvInputLines.length,
    processedCount,
    errorCount,
  });
};

export const handler = async (event: SQSEvent): Promise<void> => {
  console.log("[ProcessQRBatch] Handler invoked", {
    recordCount: event.Records?.length || 0,
    event: JSON.stringify(event, null, 2),
  });

  if (!event.Records || event.Records.length === 0) {
    console.warn("[ProcessQRBatch] No records found in SQS event");
    return;
  }

  console.log("[ProcessQRBatch] Processing SQS records", {
    recordCount: event.Records.length,
    messageIds: event.Records.map((r) => r.messageId),
  });

  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < event.Records.length; i++) {
    const record = event.Records[i];
    console.log("[ProcessQRBatch] Processing record", {
      recordIndex: i + 1,
      totalRecords: event.Records.length,
      messageId: record.messageId,
    });

    try {
      const message: QueueMessage = JSON.parse(record.body);
      console.log("[ProcessQRBatch] Parsed queue message", {
        messageId: record.messageId,
        message,
      });

      const { batchId } = message;

      if (!batchId) {
        console.error("[ProcessQRBatch] Missing batchId in message", {
          messageId: record.messageId,
          message,
        });
        throw new Error(`Missing batchId in message: ${record.messageId}`);
      }

      console.log("[ProcessQRBatch] Starting batch processing", {
        messageId: record.messageId,
        batchId,
      });
      await processBatch(batchId);
      console.log("[ProcessQRBatch] Successfully processed batch", {
        messageId: record.messageId,
        batchId,
      });
      successCount++;
    } catch (error) {
      failureCount++;
      console.error("[ProcessQRBatch] Error processing record", {
        messageId: record.messageId,
        recordIndex: i + 1,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  console.log("[ProcessQRBatch] Handler completed", {
    totalRecords: event.Records.length,
    successCount,
    failureCount,
  });
};
