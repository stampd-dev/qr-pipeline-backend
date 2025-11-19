import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

export const getUnassignedCode = async ({
  client,
  tableName,
}: {
  client: DynamoDBDocumentClient;
  tableName: string;
}) => {
  const command = new QueryCommand({
    TableName: tableName,
    KeyConditionExpression: "PK = :pk",
    ExpressionAttributeValues: {
      ":pk": "REFERER",
      ":registered": false,
      ":referrerName": "unassigned",
      ":virtualOnly": true,
    },
    FilterExpression:
      "registered = :registered AND referrerName = :referrerName AND virtualOnly = :virtualOnly",
    Limit: 1,
    ProjectionExpression: "referalCode",
  });
  const response = await client.send(command);
  return response.Items?.[0]?.referalCode as string | undefined;
};
