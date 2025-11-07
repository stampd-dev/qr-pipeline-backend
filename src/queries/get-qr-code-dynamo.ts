import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { RefererStats } from "../types/dynamo";

export const getQrCodeDynamo = async ({
  referalCode,
  client,
  tableName,
}: {
  referalCode: string;
  client: DynamoDBDocumentClient;
  tableName: string;
}): Promise<RefererStats | undefined> => {
  const command = new GetCommand({
    TableName: tableName,
    Key: {
      PK: `REFERER`,
      SK: referalCode,
    },
  });
  const response = await client.send(command);
  return response.Item as RefererStats | undefined;
};
