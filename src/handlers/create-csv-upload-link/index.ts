import { S3Client } from "@aws-sdk/client-s3";
import { createPresignedCsvUploadUrl } from "../../commands/s3";

const client = new S3Client();
const bucketName = process.env.CSV_INPUT_BUCKET_NAME!;

export const handler = async (event: any) => {
  console.log("event", event);
  const { batchId } = JSON.parse(event.body || "{}");

  const presignedUrl = await createPresignedCsvUploadUrl({
    bucketName,
    batchId,
    client,
  });
  return {
    statusCode: 200,
    body: JSON.stringify({ presignedUrl }),
  };
};
