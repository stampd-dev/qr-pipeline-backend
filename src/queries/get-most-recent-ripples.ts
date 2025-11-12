import {
  DynamoDBDocumentClient,
  QueryCommand,
  QueryCommandInput,
} from "@aws-sdk/lib-dynamodb";
import { RippleEvent } from "../types/dynamo";
import { getReferrerName } from "../handlers/get-top-codes/utils";

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
    Limit: 100,
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

  const unformattedResults = response.Items as RippleEvent[];

  /** Create a unique set from the ripples from the item property code */
  const uniqueCodes: { location: string; referrer: string; code: string }[] =
    [];
  unformattedResults.forEach((ripple) => {
    if (!uniqueCodes.some((code) => code.code === ripple.code)) {
      uniqueCodes.push({
        location: ripple.location,
        referrer: ripple.referrer,
        code: ripple.code,
      });
    }
  });

  const formattedResults = uniqueCodes.map((code) => ({
    location: code.location,
    referrer: getReferrerName(code.referrer),
    code: code.code,
  }));

  return formattedResults;
};
