import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { RefererStats } from "../../types/dynamo";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { getQrCodeDynamo } from "../../queries/get-qr-code-dynamo";
import {
  getSuccessResponse,
  getErrorResponse,
} from "../../utils/handler-response";
import type { APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { S3Client } from "@aws-sdk/client-s3";
import { createQrCodePresignedUrl } from "../../commands/create-qr-code-presigned-url";

const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient());
const tableName = process.env.REFERRER_STATS_TABLE_NAME!;
const s3Client = new S3Client();
const bucketName = process.env.QR_BATCH_OUTPUT_BUCKET_NAME!;
export type GetMetricsByCodeRequest = {
  code: string;
};

export type GetMetricsByCodeResponse = {
  success: boolean;
  message: string;
  registered: boolean;
  record: RefererStats;
  qr_code_download_url: string;
  referral_link: string;
};
export const handler = async (
  event: any
): Promise<APIGatewayProxyStructuredResultV2> => {
  console.log("[ListMetricsByCode] Handler invoked", {
    event: JSON.stringify(event, null, 2),
  });

  const body: GetMetricsByCodeRequest =
    typeof event.body === "string" ? JSON.parse(event.body) : event.body;

  const currentRecord = await getQrCodeDynamo({
    referalCode: body.code,
    client: dynamoClient,
    tableName,
  });

  if (!currentRecord) {
    console.error("[ListMetricsByCode] Code not found", {
      code: body.code,
    });
    return getErrorResponse({
      statusCode: 404,
      body: { error: "Code not found" },
    });
  }

  if (currentRecord.registered) {
    console.log("[ListMetricsByCode] Code is registered", {
      code: body.code,
      currentRecord,
    });
    return getSuccessResponse({
      success: true,
      message: "Code found",
      registered: true,
      record: currentRecord,
    });
  }

  console.log("[ListMetricsByCode] Code is not registered", {
    code: body.code,
    currentRecord,
  });
  const qrCodeDownloadUrl = await createQrCodePresignedUrl({
    referalCode: body.code,
    client: s3Client,
    bucketName: bucketName,
  });

  return getSuccessResponse({
    success: true,
    message: "Code found",
    registered: false,
    record: currentRecord,
    qr_code_download_url: qrCodeDownloadUrl,
    referral_link: `https://main.d19hohaefmsqg9.amplifyapp.com/?ref=${body.code}`,
  });
};
