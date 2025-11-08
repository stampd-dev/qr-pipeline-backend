import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { RefererStats, SplashLocation } from "../types/dynamo";

const currentDate = new Date().toISOString();
const eventStart = new Date("2025-11-12T00:00:00.000Z").toISOString();

const defaultSplashLocation: SplashLocation = {
  city: "Brooklyn",
  region: "New York",
  country: "US",
  lat: 40.699561,
  lon: -73.974303,
  totalScans: 0, // starts at 0; increment when scans happen
  uniqueIps: 0,
  firstSeenAt: eventStart < currentDate ? eventStart : currentDate,
  lastSeenAt: eventStart < currentDate ? eventStart : currentDate,
};

export const createQrCodeDynamo = async ({
  referalCode,
  client,
  tableName,
  referrerEmail,
  referrerName,
  firstName,
  lastName,
  phoneNumber,
  referrerTag,
  coinNumber,
  kickstarterUrl,
}: {
  referalCode: string;
  client: DynamoDBDocumentClient;
  tableName: string;
  referrerEmail: string;
  referrerName: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  referrerTag: string;
  coinNumber: string;
  kickstarterUrl: string;
}) => {
  const Item: RefererStats = {
    PK: `REFERER`,
    SK: referalCode,
    referalCode,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    totalScans: 0,
    uniqueScans: 0,
    ipUsage: {},
    referrerEmail,
    referrerName,
    firstName,
    lastName,
    phoneNumber,
    referrerTag,
    coinNumber,
    kickstarterUrl,
    splashLocations: [defaultSplashLocation],
  };

  const command = new PutCommand({
    TableName: tableName,
    Item,
    ConditionExpression:
      "attribute_not_exists(PK) AND attribute_not_exists(SK)",
  });

  await client.send(command);

  return Item;
};
