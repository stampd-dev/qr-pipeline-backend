import { getMostRecentRipples } from "../../queries/get-most-recent-ripples";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { getSuccessResponse } from "../../utils/handler-response";

type GetMostRecentRipplesResponse = {
  success: boolean;
  message: string;
  ripples: { location: string; referrer: string }[];
};

const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient());
const tableName = process.env.RIPPLES_TABLE_NAME!;

export const handler = async (event: any) => {
  console.log("[GetMostRecentRipples] Handler invoked", {
    event: JSON.stringify(event, null, 2),
  });

  const ripples = await getMostRecentRipples({
    client: dynamoClient,
    tableName,
    ProjectionExpression: "location, referrer",
  });

  const responseBody: GetMostRecentRipplesResponse = {
    success: true,
    message: "Most recent ripples fetched successfully",
    ripples: ripples.map((ripple) => ({
      location: ripple.location,
      referrer: ripple.referrer,
    })),
  };
  console.log("[GetMostRecentRipples]", responseBody);

  return getSuccessResponse(responseBody);
};
