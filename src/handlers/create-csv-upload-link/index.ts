import { S3Client } from "@aws-sdk/client-s3";
import { createPresignedCsvUploadUrl } from "../../commands/create-csv-upload-link";

const client = new S3Client();
const bucketName = process.env.CSV_INPUT_BUCKET_NAME!;

export const handler = async (event: any) => {
  console.log("[CreateCsvUploadLink] Handler invoked", {
    event: JSON.stringify(event, null, 2),
    bucketName,
  });

  const { batchId } = JSON.parse(event.body || "{}");
  console.log("[CreateCsvUploadLink] Parsed request body", { batchId });

  if (!batchId) {
    console.error("[CreateCsvUploadLink] Missing batchId in request body");
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing 'batchId' in request body" }),
    };
  }

  console.log("[CreateCsvUploadLink] Creating presigned URL", {
    batchId,
    bucketName,
  });
  const presignedUrl = await createPresignedCsvUploadUrl({
    bucketName,
    batchId,
    client,
  });
  console.log("[CreateCsvUploadLink] Presigned URL created successfully", {
    batchId,
    urlLength: presignedUrl.length,
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ presignedUrl }),
  };
};
