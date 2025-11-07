import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { getQrCodeDynamo } from "../queries/get-qr-code-dynamo";
import { RefererStats } from "../types/dynamo";

export const updateQrCodeDynamo = async ({
  referalCode,
  client,
  tableName,
  ip,
}: {
  referalCode: string;
  client: DynamoDBDocumentClient;
  tableName: string;
  ip: string;
}) => {
  const existingItem = await getQrCodeDynamo({
    referalCode,
    client,
    tableName,
  });

  if (!existingItem) {
    throw new Error("QR code not found");
  }

  const isUniqueIp = !existingItem.ipUsage[ip];

  if (isUniqueIp) {
    existingItem.uniqueScans++;
  }

  const updatedItem: RefererStats = {
    ...existingItem,
    totalScans: existingItem.totalScans + 1,
    ipUsage: {
      ...existingItem.ipUsage,
      [ip]: (existingItem.ipUsage[ip] || 0) + 1,
    },
  };

  const command = new PutCommand({
    TableName: tableName,
    Item: updatedItem,
  });

  await client.send(command);

  return updatedItem;
};
