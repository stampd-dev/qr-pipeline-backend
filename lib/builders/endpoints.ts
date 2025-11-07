import { createEndpoint } from "../constructs/endpoint";
import { QRPLambdas } from "./lambdas";
import { QRPApis } from "./apis";
import { HttpMethod, HttpRoute } from "aws-cdk-lib/aws-apigatewayv2";

export type QRPEndpoints = {
  Admin: {
    CreatePresignedCsvUploadUrlEndpoint: HttpRoute[];
    AddMetricsByQRCodeEndpoint: HttpRoute[];
  };
  PublicMetrics: {
    ListMetricsByQRCodeEndpoint: HttpRoute[];
    ListQRMetricsEndpoint: HttpRoute[];
  };
};

export const createEndpoints = ({
  lambdas,
  apis,
}: {
  lambdas: QRPLambdas;
  apis: QRPApis;
}): QRPEndpoints => {
  return {
    Admin: {
      CreatePresignedCsvUploadUrlEndpoint: createEndpoint({
        api: apis.AdminApi,
        props: {
          path: "/admin/create-presigned-csv-upload-url",
          methods: [HttpMethod.POST],
          handler: lambdas.CreatePresignedCsvUploadUrlLambda,
        },
      }),
      AddMetricsByQRCodeEndpoint: createEndpoint({
        api: apis.AdminApi,
        props: {
          path: "/admin/add-metrics-by-qr-code",
          methods: [HttpMethod.POST],
          handler: lambdas.AddMetricsByQRBatchLambda,
        },
      }),
    },
    PublicMetrics: {
      ListMetricsByQRCodeEndpoint: createEndpoint({
        api: apis.PublicMetricsApi,
        props: {
          path: "/public-metrics/list-metrics-by-qr-code",
          methods: [HttpMethod.GET],
          handler: lambdas.ListMetricsByQRCodeLambda,
        },
      }),
      ListQRMetricsEndpoint: createEndpoint({
        api: apis.PublicMetricsApi,
        props: {
          path: "/public-metrics/list-qr-metrics",
          methods: [HttpMethod.GET],
          handler: lambdas.ListQRMetrics,
        },
      }),
    },
  };
};
