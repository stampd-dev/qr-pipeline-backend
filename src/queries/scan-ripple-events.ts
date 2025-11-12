import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { RippleEvent } from "../types/dynamo";

export const scanRippleEvents = async ({
  client,
  tableName,
  ProjectionExpression,
}: {
  client: DynamoDBDocumentClient;
  tableName: string;
  ProjectionExpression?: string;
}) => {
  console.log("[ScanRippleEvents] Scanning ripple events", {
    tableName,
  });
  const command = new ScanCommand({
    TableName: tableName,
    FilterExpression: "attribute_not_exists(distanceFromOriginal)",
    ProjectionExpression,
  });
  const response = await client.send(command);
  return response.Items as RippleEvent[];
};
