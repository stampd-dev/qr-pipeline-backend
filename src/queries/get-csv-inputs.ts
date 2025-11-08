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

export const getRawCsvInputs = async ({
  key,
  client,
  bucketName,
}: {
  key: string;
  client: S3Client;
  bucketName: string;
}) => {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });
  const response = await client.send(command);
  return response.Body?.transformToString("utf-8");
};
