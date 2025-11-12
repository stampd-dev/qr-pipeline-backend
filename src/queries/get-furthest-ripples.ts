import {
  DynamoDBDocumentClient,
  QueryCommand,
  QueryCommandInput,
} from "@aws-sdk/lib-dynamodb";
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

  const commandInput: QueryCommandInput = {
    TableName: tableName,
    IndexName: "FURTHEST_RIPPLES_INDEX",
    KeyConditionExpression: "PK = :pk",
    ExpressionAttributeValues: {
      ":pk": "RIPPLE",
    },
    Limit: 5,
    ScanIndexForward: false,
  };
  const command = new QueryCommand(commandInput);

  if (ProjectionExpression?.includes("location")) {
    commandInput.ProjectionExpression = "#location";
    commandInput.ExpressionAttributeNames = {
      "#location": "location",
    };
  }
  const response = await client.send(command);
  return response.Items as RippleEvent[];
};
