import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { getQrCodeDynamo } from "../queries/get-qr-code-dynamo";
import { RefererStats } from "../types/dynamo"; // <- keep your actual import
import {
  resolveIpLocation,
  upsertSplashLocation,
} from "../helpers/splash-helpers";

type UpdateQrCodeDynamoArgs = {
  referalCode: string;
  client: DynamoDBDocumentClient;
  tableName: string;
  ip: string;
  /** Optional: injectable clock for tests */
  now?: Date;
};

export const updateQrCodeDynamo = async ({
  referalCode,
  client,
  tableName,
  ip,
  now = new Date(),
}: UpdateQrCodeDynamoArgs): Promise<RefererStats> => {
  const existingItem = await getQrCodeDynamo({
    referalCode,
    client,
    tableName,
  });

  if (!existingItem) {
    throw new Error("QR code not found");
  }

  const nowIso = now.toISOString();

  const ipUsage = existingItem.ipUsage ?? {};
  const isUniqueIp = !ipUsage[ip];

  let splashLocations = existingItem.splashLocations ?? [];

  // Only resolve location + touch splashLocations for NEW IPs
  if (isUniqueIp) {
    const resolved = await resolveIpLocation(ip);
    splashLocations = upsertSplashLocation({
      existing: splashLocations,
      resolved,
      isUniqueIp,
      nowIso,
    });
  }

  const updatedItem: RefererStats = {
    ...existingItem,
    updatedAt: nowIso,
    totalScans: (existingItem.totalScans ?? 0) + 1,
    uniqueScans: (existingItem.uniqueScans ?? 0) + (isUniqueIp ? 1 : 0),
    ipUsage: {
      ...ipUsage,
      [ip]: (ipUsage[ip] || 0) + 1,
    },
    splashLocations,
  };

  const command = new PutCommand({
    TableName: tableName,
    Item: updatedItem,
  });

  await client.send(command);

  return updatedItem;
};
