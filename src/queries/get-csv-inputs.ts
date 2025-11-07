import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";

export const getCsvInputs = async ({
  batchId,
  client,
}: {
  batchId: string;
  client: S3Client;
}) => {
  const command = new GetObjectCommand({
    Bucket: process.env.CSV_INPUT_BUCKET_NAME!,
    Key: `csv-uploads/${batchId}.csv`,
  });
  const response = await client.send(command);
  return response.Body?.transformToString("utf-8");
};
