import {
  DynamoDBDocumentClient,
  QueryCommand,
  QueryCommandInput,
} from "@aws-sdk/lib-dynamodb";
import { RippleEvent } from "../types/dynamo";

export const getMostRecentRipples = async ({
  client,
  tableName,
  ProjectionExpression,
}: {
  client: DynamoDBDocumentClient;
  tableName: string;
  ProjectionExpression?: string;
}) => {
  const commandInput: QueryCommandInput = {
    TableName: tableName,
    IndexName: "MOST_RECENT_RIPPLES_INDEX",
    KeyConditionExpression: "PK = :pk",
    ExpressionAttributeValues: {
      ":pk": "RIPPLE",
    },
    Limit: 5,
    ScanIndexForward: false,
  };
  const command = new QueryCommand(commandInput);
  if (ProjectionExpression?.includes("location")) {
    commandInput.ProjectionExpression = ProjectionExpression.replace(
      "location",
      "#location"
    );
    commandInput.ExpressionAttributeNames = {
      ...commandInput.ExpressionAttributeNames,
      "#location": "location",
    };
  }
  const response = await client.send(command);
  console.log("[GetMostRecentRipples] Response", response);

  return response.Items as RippleEvent[];
};
