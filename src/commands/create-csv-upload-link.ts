import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const createPresignedCsvUploadUrl = async ({
  client,
  bucketName,
  batchId,
}: {
  bucketName: string;
  client: S3Client;
  batchId: string;
}): Promise<string> => {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: `csv-uploads/${batchId}.csv`,
  });
  const presignedUrl = await getSignedUrl(client, command, {
    expiresIn: 3600,
  });
  return presignedUrl;
};
