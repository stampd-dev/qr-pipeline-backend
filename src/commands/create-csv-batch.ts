import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export const createCsvBatch = async ({
  batchId,
  client,
  bucketName,
  csvInputs,
}: {
  batchId: string;
  client: S3Client;
  bucketName: string;
  csvInputs: string;
}) => {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: `csv-uploads/${batchId}.csv`,
    Body: csvInputs,
    ContentType: "text/csv",
  });
  await client.send(command);
  return {
    batchId,
  };
};
