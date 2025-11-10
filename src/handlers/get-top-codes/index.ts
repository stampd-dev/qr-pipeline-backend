import { SplashLocation } from "../../types/dynamo";
import { getSuccessResponse } from "../../utils/handler-response";

type GetTopCodesResponse = {
  success: boolean;
  message: string;
  mostRipples: {
    first: {
      name: string;
      totalUniqueScans: number;
    };
    second: {
      name: string;
      totalUniqueScans: number;
    };
  };
  furthestRipples: {
    first: {
      name: string;
      locations: SplashLocation[];
    };
    second: {
      name: string;
      locations: SplashLocation[];
    };
  };
};

const mockTopCodes: GetTopCodesResponse = {
  success: true,
  message: "Top codes fetched successfully",
  furthestRipples: {
    first: {
      name: "Code 1",
      locations: [
        {
          city: "Austin",
          region: "Texas",
          country: "US",
          lat: 30.2672,
          lon: -97.7431,
          totalScans: 100,
          uniqueIps: 100,
          firstSeenAt: "2025-01-01T00:00:00.000Z",
          lastSeenAt: "2025-01-01T00:00:00.000Z",
        },
        {
          city: "Los Angeles",
          region: "California",
          country: "US",
          lat: 34.0522,
          lon: -118.2437,
          totalScans: 100,
          uniqueIps: 100,
          firstSeenAt: "2025-01-01T00:00:00.000Z",
          lastSeenAt: "2025-01-01T00:00:00.000Z",
        },
      ],
    },
    second: {
      name: "Code 2",
      locations: [
        {
          city: "Chicago",
          region: "Illinois",
          country: "US",
          lat: 41.8781,
          lon: -87.6298,
          totalScans: 100,
          uniqueIps: 100,
          firstSeenAt: "2025-01-01T00:00:00.000Z",
          lastSeenAt: "2025-01-01T00:00:00.000Z",
        },
      ],
    },
  },
  mostRipples: {
    first: {
      name: "Code 1",
      totalUniqueScans: 100,
    },
    second: {
      name: "Code 2",
      totalUniqueScans: 50,
    },
  },
};

export const handler = async (event: any) => {
  console.log("[ListAllMetrics] Handler invoked", {
    event: JSON.stringify(event, null, 2),
  });

  console.log(
    "[ListAllMetrics] Handler completed (not yet implemented returning mock)",
    JSON.stringify(mockTopCodes, null, 2)
  );

  return getSuccessResponse(mockTopCodes);
};
