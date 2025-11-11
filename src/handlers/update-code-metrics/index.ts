import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { updateQrCodeDynamo } from "../../commands/update-qr-code-dynamo";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { addRippleEvent } from "../../commands/add-ripple-event";
import { SplashLocation } from "../../types/dynamo";

const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient());
const tableName = process.env.REFERRER_STATS_TABLE_NAME!;

export const handler = async (event: any) => {
  console.log("[AddMetricsToCode] Handler invoked", {
    event: JSON.stringify(event, null, 2),
    tableName,
  });

  const { referalCode, ip } = JSON.parse(event.body || "{}");
  console.log("[AddMetricsToCode] Parsed request body", { referalCode, ip });

  if (!referalCode) {
    console.error("[AddMetricsToCode] Missing referalCode in request body");
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing 'referalCode' in request body" }),
    };
  }

  if (!ip) {
    console.error("[AddMetricsToCode] Missing ip in request body");
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing 'ip' in request body" }),
    };
  }

  console.log("[AddMetricsToCode] Updating QR code metrics", {
    referalCode,
    ip,
    tableName,
  });
  const updatedItem = await updateQrCodeDynamo({
    referalCode,
    ip,
    client: dynamoClient,
    tableName,
  });
  console.log("[AddMetricsToCode] QR code metrics updated successfully", {
    referalCode,
    ip,
    totalScans: updatedItem.totalScans,
    uniqueScans: updatedItem.uniqueScans,
  });

  const { splashLocations, referrerName } = updatedItem;
  const newestLocation = [...splashLocations].sort(
    (a, b) =>
      new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime()
  )[0];

  const { lat, lon, city, country } = newestLocation;

  await addRippleEvent({
    code: referalCode,
    lat,
    lon,
    location: `${city}, ${country}`,
    referrer: referrerName,
    client: dynamoClient,
  });

  return {
    statusCode: 200,
    body: JSON.stringify(updatedItem),
  };
};
