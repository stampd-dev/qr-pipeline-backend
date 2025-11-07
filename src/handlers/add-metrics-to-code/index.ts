import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { updateQrCodeDynamo } from "../../commands/update-qr-code-dynamo";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient());
const tableName = process.env.REFERRER_STATS_TABLE_NAME!;

export const handler = async (event: any) => {
  console.log("event", event);
  const { referalCode, ip } = JSON.parse(event.body || "{}");

  const updatedItem = await updateQrCodeDynamo({
    referalCode,
    ip,
    client: dynamoClient,
    tableName,
  });

  return {
    statusCode: 200,
    body: JSON.stringify(updatedItem),
  };
};
