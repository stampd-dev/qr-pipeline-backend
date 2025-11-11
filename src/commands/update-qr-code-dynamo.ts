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
  fingerprint?: string;
  /** Optional: injectable clock for tests */
  now?: Date;
  registered?: boolean;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  nickname?: string;
};

export const updateQrCodeDynamo = async ({
  referalCode,
  client,
  tableName,
  ip,
  fingerprint,
  now = new Date(),
  registered = false,
  firstName = "",
  lastName = "",
  email = "",
  phone = "",
  nickname = "",
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
  const fingerprintUsage = existingItem.fingerprintUsage ?? {};
  const isUniqueIp = !ipUsage[ip];
  const isUniqueFingerprint = fingerprint
    ? !fingerprintUsage[fingerprint]
    : false;

  // If fingerprint is provided, use it as primary check for uniqueness
  // Otherwise fall back to IP-based check
  const isUniqueScan = fingerprint ? isUniqueFingerprint : isUniqueIp;

  let splashLocations = existingItem.splashLocations ?? [];

  // Only resolve location + touch splashLocations for NEW fingerprints (or new IPs if no fingerprint)
  const shouldUpdateSplashLocation = fingerprint
    ? isUniqueFingerprint
    : isUniqueIp;

  if (shouldUpdateSplashLocation) {
    console.log("[UpdateQrCodeDynamo] Updating splash location", {
      fingerprint,
      ip,
      existingItem,
    });
    const resolved = await resolveIpLocation(ip);
    splashLocations = upsertSplashLocation({
      existing: splashLocations,
      resolved,
      isUniqueIp: isUniqueScan,
      nowIso,
    });
  } else {
    console.log(
      "[UpdateQrCodeDynamo] Skipping splash location update for existing fingerprint",
      {
        fingerprint,
        existingItem,
      }
    );
    splashLocations = existingItem.splashLocations ?? [];
  }

  const updatedItem: RefererStats = {
    ...existingItem,
    updatedAt: nowIso,
    totalScans: (existingItem.totalScans ?? 0) + 1,
    uniqueScans: (existingItem.uniqueScans ?? 0) + (isUniqueScan ? 1 : 0),
    ipUsage: {
      ...ipUsage,
      [ip]: (ipUsage[ip] || 0) + 1,
    },
    fingerprintUsage: fingerprint
      ? {
          ...fingerprintUsage,
          [fingerprint]: (fingerprintUsage[fingerprint] || 0) + 1,
        }
      : fingerprintUsage,
    splashLocations,
    ...(registered ? { registered: true } : {}),
    ...(firstName ? { firstName } : {}),
    ...(lastName ? { lastName } : {}),
    ...(email ? { referrerEmail: email } : {}),
    ...(phone ? { phoneNumber: phone } : {}),
    ...(nickname ? { referrerName: nickname } : {}),
  };

  const command = new PutCommand({
    TableName: tableName,
    Item: updatedItem,
  });

  await client.send(command);

  return updatedItem;
};
