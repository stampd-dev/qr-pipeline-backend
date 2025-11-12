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
}): Promise<
  {
    distanceFromOriginal: number;
    referrer: string;
    code: string;
    location: string;
  }[]
> => {
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

  const unformattedResults = response.Items as RippleEvent[];
  const uniqueCodes: {
    distanceFromOriginal: number;
    referrer: string;
    code: string;
    location: string;
  }[] = [];
  unformattedResults.forEach((ripple) => {
    if (!uniqueCodes.some((code) => code.code === ripple.code)) {
      uniqueCodes.push({
        distanceFromOriginal: ripple.distanceFromOriginal,
        referrer: ripple.referrer,
        code: ripple.code,
        location: ripple.location,
      });
    }
  });

  return uniqueCodes.slice(0, 5);
};
