import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { RefererStats } from "../../types/dynamo";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { getQrCodeDynamo } from "../../queries/get-qr-code-dynamo";

const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient());
const tableName = process.env.REFERRER_STATS_TABLE_NAME!;

export type GetMetricsByCodeRequest = {
  code: string;
};

export type GetMetricsByCodeResponse = {
  success: boolean;
  message: string;
  registered: boolean;
  record: RefererStats;
};
export const handler = async (
  event: any
): Promise<{
  statusCode: number;
  body: GetMetricsByCodeResponse;
}> => {
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
    return {
      statusCode: 404,
      body: {
        success: false,
        message: "Code not found",
        registered: false,
        record: {} as RefererStats,
      },
    };
  }

  if (currentRecord.referrerEmail) {
    return {
      statusCode: 200,
      body: {
        success: true,
        message: "Code found",
        registered: true,
        record: currentRecord,
      },
    };
  }

  console.log("[ListMetricsByCode] Handler completed (not yet implemented)");
  return {
    statusCode: 200,
    body: {
      success: true,
      message: "Code found",
      registered: false,
      record: currentRecord,
    },
  };
};
