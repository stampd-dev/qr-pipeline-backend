import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import {
  getSuccessResponse,
  getErrorResponse,
} from "../../utils/handler-response";
import { getUnassignedCode } from "../../queries/get-unassigned-code";
import { updateQrCodeDynamo } from "../../commands/update-qr-code-dynamo";
import { addRippleEvent } from "../../commands/add-ripple-event";
import { createQrCodePresignedUrl } from "../../commands/create-qr-code-presigned-url";
import { S3Client } from "@aws-sdk/client-s3";

const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient());
const tableName = process.env.REFERRER_STATS_TABLE_NAME!;
const s3Client = new S3Client();
const bucketName = process.env.QR_BATCH_OUTPUT_BUCKET_NAME!;
interface AddNewReferrerBody {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  nickname: string; //calc as first name + last name from form
  ip: string;
}

export const handler = async (event: any) => {
  console.log("[AddNewReferrer] Handler invoked", {
    event: JSON.stringify(event, null, 2),
  });

  const body: AddNewReferrerBody =
    typeof event.body === "string" ? JSON.parse(event.body) : event.body;

  console.log("[AddNewReferrer] Parsed request body", { body });

  if (!body.first_name || !body.last_name || !body.email || !body.phone) {
    console.error("[AddNewReferrer] Missing required fields");
    return getErrorResponse({
      statusCode: 400,
      body: { error: "Missing required fields" },
    });
  }

  const unassignedCode = await getUnassignedCode({
    client: dynamoClient,
    tableName,
  });

  if (!unassignedCode) {
    console.error("[AddNewReferrer] No unassigned code found");
    return getErrorResponse({
      statusCode: 404,
      body: { error: "No unassigned code found" },
    });
  }

  console.log("[AddNewReferrer] Unassigned code found", { unassignedCode });

  const updatedRecord = await updateQrCodeDynamo({
    client: dynamoClient,
    referalCode: unassignedCode,
    tableName,
    ip: body.ip,
    registered: true,
    firstName: body.first_name,
    lastName: body.last_name,
    email: body.email,
    phone: body.phone,
    nickname: body.first_name + " " + body.last_name,
  });

  const latestLocation = [...updatedRecord.splashLocations].sort(
    (a, b) =>
      new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime()
  )[0];
  const { lat, lon, city, country } = latestLocation;

  console.log("[AddNewReferrer] Updated record", { updatedRecord });

  await addRippleEvent({
    code: unassignedCode,
    lat,
    lon,
    location: `${city}, ${country}`,
    referrer: updatedRecord.referrerName,
    client: dynamoClient,
    distanceFromOriginal: 0,
  });

  const qrCodeDownloadUrl = await createQrCodePresignedUrl({
    referalCode: unassignedCode,
    client: s3Client,
    bucketName: bucketName,
    virtualOnly: true,
  });

  return getSuccessResponse({
    success: true,
    message: "Referrer added",
    new_referrer: updatedRecord,
    qr_code_download_url: qrCodeDownloadUrl,
    referral_link: `https://main.d19hohaefmsqg9.amplifyapp.com/?ref=${unassignedCode}`,
  });
};
