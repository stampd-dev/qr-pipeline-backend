import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";

const client = new SQSClient();

export const sendBatchToQueue = async ({
  batchId,
  queueUrl,
  virtualOnly,
}: {
  batchId: string;
  queueUrl: string;
  virtualOnly: boolean;
}) => {
  const command = new SendMessageCommand({
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify({ batchId, virtualOnly }),
  });
  await client.send(command);
};
