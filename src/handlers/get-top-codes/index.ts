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
    ProjectionExpression: "referrer, distanceFromOriginal",
  });

  console.log("[GetTopCodes] most splashers", {
    most,
    furthest,
  });

  return getSuccessResponse({
    most,
    furthest: furthest.map((ripple) => ({
      referrer:
        ripple.referrer === "Default Pirate Coin"
          ? "Noones Ark Organization"
          : ripple.referrer === "test code"
          ? "Scootz McGootz"
          : ripple.referrer,
      distanceFromOriginal: ripple.distanceFromOriginal,
    })),
  });
};
