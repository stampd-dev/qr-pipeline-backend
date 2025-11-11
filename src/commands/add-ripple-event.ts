import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

interface AddRippleEventArgs {
  code: string;

  // Basic location (lat/lon) for positioning on the "water surface"
  lat: number;
  lon: number;

  location: string;
  referrer: string;

  client: DynamoDBDocumentClient;
}

export const addRippleEvent = async ({
  code,
  lat,
  lon,
  location,
  referrer,
  client,
}: AddRippleEventArgs) => {
  const Item = {
    PK: `RIPPLE`,
    SK: `${Date.now()}`,
    code,
    lat,
    lon,
    location,
    referrer,
    firstSeenAt: new Date().toISOString(),
    lastSeenAt: new Date().toISOString(),
  };

  const command = new PutCommand({
    TableName: process.env.RIPPLES_TABLE_NAME!,
    Item,
  });

  await client.send(command);
  console.log("[AddRippleEvent] Ripple event added successfully", Item);
  return Item;
};
