import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";

const client = new SQSClient();

export const sendBatchToQueue = async ({
  batchId,
  queueUrl,
}: {
  batchId: string;
  queueUrl: string;
}) => {
  const command = new SendMessageCommand({
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify({ batchId }),
  });
  await client.send(command);
};
