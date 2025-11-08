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
   * Header: name,first_name,last_name,email,phone_number,coin_number,kickstarter_tag,kick_starter_url
   * Data rows follow
   */
  // Normalize line endings and split
  const normalizedCsv = csvInputs
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
  const allLines = normalizedCsv.split("\n").filter((line) => line.trim());

  console.log("[ProcessQRBatch] Parsed CSV lines", {
    batchId,
    totalLines: allLines.length,
    firstLine: allLines[0]?.substring(0, 200),
    firstLineIsHeader:
      allLines[0]?.toLowerCase().includes("name") ||
      allLines[0]?.toLowerCase().includes("first"),
  });

  // Skip the header row (first line)
  if (allLines.length < 2) {
    console.error(
      "[ProcessQRBatch] CSV must contain at least header and one data row",
      {
        batchId,
        lineCount: allLines.length,
      }
    );
    throw new Error("CSV must contain at least a header and one data row");
  }

  const csvInputLines = allLines.slice(1); // Skip header
  console.log("[ProcessQRBatch] Data lines after skipping header", {
    batchId,
    headerLine: allLines[0],
    dataLineCount: csvInputLines.length,
    firstDataLine: csvInputLines[0]?.substring(0, 200),
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

      // Validate required fields
      if (!kick_starter_url || !kick_starter_url.includes("ref=")) {
        throw new Error(
          `Invalid kick_starter_url in line ${i + 1}: ${kick_starter_url}`
        );
      }

      const referalCode = kick_starter_url.split("ref=")[1];

      if (!referalCode) {
        throw new Error(
          `Could not extract referalCode from URL: ${kick_starter_url}`
        );
      }

      // Handle empty optional fields - provide empty string defaults
      const firstName = (first_name || "").trim();
      const lastName = (last_name || "").trim();
      const phoneNumber = (phone_number || "").trim();

      console.log("[ProcessQRBatch] Extracted data from CSV line", {
        batchId,
        lineIndex: i + 1,
        referalCode,
        email: email?.trim(),
        name: name?.trim(),
        firstName,
        lastName,
        phoneNumber,
        hasFirstName: !!firstName,
        hasLastName: !!lastName,
        hasPhoneNumber: !!phoneNumber,
      });

      console.log("[ProcessQRBatch] Creating DynamoDB record", {
        batchId,
        referalCode,
        tableName: process.env.REFERRER_STATS_TABLE_NAME!,
      });
      await createQrCodeDynamo({
        referalCode,
        referrerEmail: (email || "").trim(),
        referrerName: (name || "").trim(),
        client: dynamoClient,
        tableName: process.env.REFERRER_STATS_TABLE_NAME!,
        firstName,
        lastName,
        phoneNumber,
        referrerTag: (kickstarter_tag || "").trim(),
        coinNumber: (coin_number || "").trim(),
        kickstarterUrl: (kick_starter_url || "").trim(),
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
        batchId,
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

export const handler = async (
  event: SQSEvent
): Promise<{ batchItemFailures: Array<{ itemIdentifier: string }> }> => {
  console.log("[ProcessQRBatch] Handler invoked", {
    recordCount: event.Records?.length || 0,
    event: JSON.stringify(event, null, 2),
  });

  if (!event.Records || event.Records.length === 0) {
    console.warn("[ProcessQRBatch] No records found in SQS event");
    return { batchItemFailures: [] };
  }

  console.log("[ProcessQRBatch] Processing SQS records", {
    recordCount: event.Records.length,
    messageIds: event.Records.map((r) => r.messageId),
  });

  const batchItemFailures: Array<{ itemIdentifier: string }> = [];
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
        // Mark as failed for DLQ processing
        batchItemFailures.push({ itemIdentifier: record.messageId });
        failureCount++;
        continue;
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
      // Mark this specific record as failed for partial batch failure reporting
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  console.log("[ProcessQRBatch] Handler completed", {
    totalRecords: event.Records.length,
    successCount,
    failureCount,
    batchItemFailures: batchItemFailures.length,
  });

  // Return batch item failures so SQS knows which messages to retry/send to DLQ
  return { batchItemFailures };
};
