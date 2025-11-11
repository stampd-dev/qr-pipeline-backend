import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { getQrCodeDynamo } from "../../queries/get-qr-code-dynamo";
import {
  getErrorResponse,
  getSuccessResponse,
} from "../../utils/handler-response";
import { updateQrCodeDynamo } from "../../commands/update-qr-code-dynamo";

const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient());
const tableName = process.env.REFERRER_STATS_TABLE_NAME!;

interface RegisterCodeBody {
  code: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nickname: string; //calc as first name + last name from form
  ip: string;
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
    registered: true,
    firstName: body.firstName,
    lastName: body.lastName,
    email: body.email,
    phone: body.phone,
    nickname: body.nickname,
  });

  console.log("[RegisterCode] Code updated", {
    code: body.code,
    updatedRecord,
  });

  return getSuccessResponse({
    success: true,
    message: "Code registered",
  });
};
