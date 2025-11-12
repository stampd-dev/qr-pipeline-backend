import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { RefererStats } from "../types/dynamo";

export const getBiggestSplashers = async ({
  client,
  tableName,
}: {
  client: DynamoDBDocumentClient;
  tableName: string;
}) => {
  const command = new QueryCommand({
    TableName: tableName,
    IndexName: "UNIQUE_SCANS_INDEX",
    KeyConditionExpression: "PK = :pk",
    ExpressionAttributeValues: {
      ":pk": "REFERER",
    },
    Limit: 5,
    ScanIndexForward: false,
  });
  const response = await client.send(command);
  return response.Items as RefererStats[];
};
