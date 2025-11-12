import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { calculateDistance } from "../utils/calculate-distance";

const originalLocation = {
  lat: 40.699561,
  lon: -73.974303,
};

export const backfillDistanceFromOriginal = async ({
  client,
  tableName,
  lat,
  lon,
  rippleSK,
}: {
  client: DynamoDBDocumentClient;
  tableName: string;
  lat: number;
  lon: number;
  rippleSK: string;
}) => {
  console.log(
    "[BackfillDistanceFromOriginal] Backfilling distance from original",
    {
      tableName,
      lat,
      lon,
      rippleSK,
    }
  );
  const distanceFromOriginal = calculateDistance(originalLocation, {
    lat,
    lon,
  });
  const command = new UpdateCommand({
    TableName: tableName,
    Key: { PK: `RIPPLE`, SK: rippleSK },
    UpdateExpression: "SET distanceFromOriginal = :distanceFromOriginal",
    ExpressionAttributeValues: {
      ":distanceFromOriginal": distanceFromOriginal,
    },
  });
  await client.send(command);
  console.log(
    "[BackfillDistanceFromOriginal] Distance from original backfilled",
    {
      rippleSK,
      distanceFromOriginal,
    }
  );
  return distanceFromOriginal;
};
