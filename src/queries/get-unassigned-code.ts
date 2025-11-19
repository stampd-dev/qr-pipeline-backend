import {
  DynamoDBDocumentClient,
  QueryCommand,
  QueryCommandInput,
} from "@aws-sdk/lib-dynamodb";

export const getUnassignedCode = async ({
  client,
  tableName,
}: {
  client: DynamoDBDocumentClient;
  tableName: string;
}) => {
  const QueryParams: QueryCommandInput = {
    TableName: tableName,
    KeyConditionExpression: "PK = :pk",
    ExpressionAttributeValues: {
      ":pk": "REFERER",
      ":registered": false,
      ":referrerName": "unassigned",
      ":virtualOnly": true,
    },
    FilterExpression:
      "(attribute_not_exists(registered) OR registered = :registered) AND referrerName = :referrerName AND virtualOnly = :virtualOnly",
    Limit: 1,
  };

  console.log("[GetUnassignedCode] Query params", { QueryParams });
  const command = new QueryCommand(QueryParams);
  const response = await client.send(command);
  console.log("[GetUnassignedCode] Response", { response });
  return response.Items?.[0]?.referalCode as string | undefined;
};
