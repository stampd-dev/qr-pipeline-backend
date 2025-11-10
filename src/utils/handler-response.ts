import type { APIGatewayProxyStructuredResultV2 } from "aws-lambda";

export const getSuccessResponse = (
  body: object
): APIGatewayProxyStructuredResultV2 => {
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(body),
  };
};

export const getErrorResponse = ({
  statusCode,
  body,
}: {
  statusCode: number;
  body: object;
}): APIGatewayProxyStructuredResultV2 => {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(body),
  };
};
