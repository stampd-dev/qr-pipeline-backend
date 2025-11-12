import { scanRippleEvents } from "../../queries/scan-ripple-events";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { backfillDistanceFromOriginal } from "../../commands/backfill-distance-from-original";
import { getSuccessResponse } from "../../utils/handler-response";

const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient());
const tableName = process.env.RIPPLES_TABLE_NAME!;

export const handler = async (event: any) => {
  console.log("[BackfillRippleEvents] Handler invoked", {
    event: JSON.stringify(event, null, 2),
  });

  const rippleEvents = await scanRippleEvents({
    client: dynamoClient,
    tableName,
    ProjectionExpression: "lat, lon, SK",
  });

  console.log("[BackfillRippleEvents] Found ripple events", {
    rippleEvents: rippleEvents.length,
  });

  for (const rippleEvent of rippleEvents) {
    await backfillDistanceFromOriginal({
      client: dynamoClient,
      tableName,
      lat: rippleEvent.lat,
      lon: rippleEvent.lon,
      rippleSK: rippleEvent.SK,
    });
  }

  return getSuccessResponse({
    success: true,
    message: "Ripple events backfilled successfully",
    rippleEvents: rippleEvents.length,
  });
};
