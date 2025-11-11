import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const createQrCodePresignedUrl = async ({
  referalCode,
  client,
  bucketName,
}: {
  referalCode: string;
  client: S3Client;
  bucketName: string;
}) => {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: `raw-codes/${referalCode}.png`,
  });
  const presignedUrl = await getSignedUrl(client, command, {
    expiresIn: 3600,
  });
  return presignedUrl;
};
