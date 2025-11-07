import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";

export const getCsvInputs = async ({
  batchId,
  client,
  bucketName,
}: {
  batchId: string;
  client: S3Client;
  bucketName: string;
}) => {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: `csv-uploads/${batchId}.csv`,
  });
  const response = await client.send(command);
  return response.Body?.transformToString("utf-8");
};
