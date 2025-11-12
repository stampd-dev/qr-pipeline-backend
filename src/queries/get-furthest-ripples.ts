import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { RippleEvent } from "../types/dynamo";

export const getFurthestRipples = async ({
  client,
  tableName,
  ProjectionExpression,
}: {
  client: DynamoDBDocumentClient;
  tableName: string;
  ProjectionExpression?: string;
}) => {
  console.log("[GetFurthestRipples] Getting furthest ripples", {
    tableName,
  });
  const command = new QueryCommand({
    TableName: tableName,
    IndexName: "FURTHEST_RIPPLES_INDEX",
    KeyConditionExpression: "PK = :pk",
    ExpressionAttributeValues: {
      ":pk": "RIPPLE",
    },
    Limit: 5,
    ScanIndexForward: false,
    ProjectionExpression,
  });
  const response = await client.send(command);
  return response.Items as RippleEvent[];
};
