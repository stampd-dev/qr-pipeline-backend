import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { getQrCodeDynamo } from "../../queries/get-qr-code-dynamo";
import {
  getErrorResponse,
  getSuccessResponse,
} from "../../utils/handler-response";
import { updateQrCodeDynamo } from "../../commands/update-qr-code-dynamo";
import { addRippleEvent } from "../../commands/add-ripple-event";
import { createQrCodePresignedUrl } from "../../commands/create-qr-code-presigned-url";
import { S3Client } from "@aws-sdk/client-s3";
import { calculateDistance } from "../../utils/calculate-distance";

const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient());
const tableName = process.env.REFERRER_STATS_TABLE_NAME!;
const s3Client = new S3Client();
const bucketName = process.env.QR_BATCH_OUTPUT_BUCKET_NAME!;

const originalLocation = {
  lat: 40.699561,
  lon: -73.974303,
};

interface RegisterCodeBody {
  code: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nickname: string; //calc as first name + last name from form
  ip: string;
  fingerprint?: string;
}

export const handler = async (event: any) => {
  console.log("[RegisterCode] Handler invoked", {
    event: JSON.stringify(event, null, 2),
  });

  const body: RegisterCodeBody =
    typeof event.body === "string" ? JSON.parse(event.body) : event.body;

  console.log("[RegisterCode] Parsed request body", { body });

  const currentRecord = await getQrCodeDynamo({
    referalCode: body.code,
    client: dynamoClient,
    tableName,
  });

  if (!currentRecord) {
    console.error("[RegisterCode] Code not found", {
      code: body.code,
    });
    return getErrorResponse({
      statusCode: 404,
      body: { error: "Code not found" },
    });
  }

  console.log("[RegisterCode] Code found", {
    code: body.code,
    currentRecord,
  });

  if (currentRecord.registered) {
    console.error("[RegisterCode] Code is already registered", {
      code: body.code,
    });
    return getErrorResponse({
      statusCode: 400,
      body: { error: "Code is already registered" },
    });
  }

  const updatedRecord = await updateQrCodeDynamo({
    client: dynamoClient,
    referalCode: body.code,
    tableName,
    ip: body.ip,
    fingerprint: body.fingerprint,
    registered: true,
    firstName: body.firstName,
    lastName: body.lastName,
    email: body.email,
    phone: body.phone,
    nickname: body.nickname,
  });

  console.log("[RegisterCode] Code updated", {
    code: body.code,
    updatedRecord: JSON.stringify(updatedRecord, null, 2),
  });

  const latestLocation = [...updatedRecord.splashLocations].sort(
    (a, b) =>
      new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime()
  )[0];

  const { lat, lon, city, country } = latestLocation;

  const distanceFromOriginal = calculateDistance(originalLocation, {
    lat,
    lon,
  });

  await addRippleEvent({
    code: body.code,
    lat,
    lon,
    location: `${city}, ${country}`,
    referrer: updatedRecord.referrerName,
    client: dynamoClient,
    distanceFromOriginal,
  });

  const qrCodeDownloadUrl = await createQrCodePresignedUrl({
    referalCode: body.code,
    client: s3Client,
    bucketName: bucketName,
  });

  return getSuccessResponse({
    success: true,
    message: "Code registered",
    new_referrer: updatedRecord,
    qr_code_download_url: qrCodeDownloadUrl,
    referral_link: `https://main.d19hohaefmsqg9.amplifyapp.com/?ref=${body.code}`,
  });
};
