import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { RefererStats } from "../types/dynamo";

export const getBiggestSplashers = async ({
  client,
  tableName,
  ProjectionExpression,
}: {
  client: DynamoDBDocumentClient;
  tableName: string;
  ProjectionExpression?: string;
}) => {
  console.log("[GetBiggestSplashers] Getting biggest splashers", {
    tableName,
  });
  const command = new QueryCommand({
    TableName: tableName,
    IndexName: "UNIQUE_SCANS_INDEX_N",
    KeyConditionExpression: "PK = :pk",
    ExpressionAttributeValues: {
      ":pk": "REFERER",
      ":registered": true,
    },
    FilterExpression:
      "attribute_exists(registered) AND registered = :registered",
    Limit: 5,
    ScanIndexForward: false,
    ProjectionExpression,
  });
  const response = await client.send(command);
  return response.Items as RefererStats[];
};
