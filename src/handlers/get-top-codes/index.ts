import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { getBiggestSplashers } from "../../queries/get-biggest-splashers";
import { getSuccessResponse } from "../../utils/handler-response";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { getFurthestRipples } from "../../queries/get-furthest-ripples";

const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient());
const tableName = process.env.REFERRER_STATS_TABLE_NAME!;

type GetTopCodesResponse = {
  success: boolean;
  message: string;
  furthest: {
    location: string;
    referrer: string;
    distanceFromOriginal: number;
  }[];
  most: {
    referrer: string;
    totalUniqueScans: number;
  }[];
};

export const handler = async (event: any) => {
  console.log("[ListAllMetrics] Handler invoked", {
    event: JSON.stringify(event, null, 2),
  });

  const most = await getBiggestSplashers({
    client: dynamoClient,
    tableName,
    ProjectionExpression: "referrerName, uniqueScans",
  });

  const furthest = await getFurthestRipples({
    client: dynamoClient,
    tableName: process.env.RIPPLES_TABLE_NAME!,
    ProjectionExpression: "referrer, distanceFromOriginal, location",
  });

  const responseBody: GetTopCodesResponse = {
    message: "Top codes fetched successfully",
    success: true,
    most: most.map((referrer) => ({
      referrer: referrer.referrerName,
      totalUniqueScans: referrer.uniqueScans,
    })),
    furthest: furthest.map((ripple) => ({
      location: ripple.location,
      referrer:
        ripple.referrer === "Default Pirate Coin"
          ? "Noones Ark Organization"
          : ripple.referrer === "test code"
          ? "Scootz McGootz"
          : ripple.referrer,
      distanceFromOriginal: ripple.distanceFromOriginal,
    })),
  };

  console.log("[GetTopCodes]", responseBody);

  return getSuccessResponse(responseBody);
};
