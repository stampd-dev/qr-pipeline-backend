import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { RefererStats } from "../types/dynamo";

export const createQrCodeDynamo = async ({
  referalCode,
  client,
  tableName,
  referrerEmail,
  referrerName,
}: {
  referalCode: string;
  client: DynamoDBDocumentClient;
  tableName: string;
  referrerEmail: string;
  referrerName: string;
}) => {
  const Item: RefererStats = {
    PK: `REFERER`,
    SK: referalCode,
    referalCode,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    totalScans: 0,
    uniqueScans: 0,
    ipUsage: {},
    referrerEmail,
    referrerName,
  };

  const command = new PutCommand({
    TableName: tableName,
    Item,
    ConditionExpression:
      "attribute_not_exists(PK) AND attribute_not_exists(SK)",
  });

  await client.send(command);

  return Item;
};
