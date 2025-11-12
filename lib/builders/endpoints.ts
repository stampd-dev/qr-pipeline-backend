import { createEndpoint } from "../constructs/endpoint";
import { QRPLambdas } from "./lambdas";
import { QRPApis } from "./apis";
import { HttpMethod, HttpRoute } from "aws-cdk-lib/aws-apigatewayv2";

export type QRPEndpoints = {
  Admin: {
    RegisterCodeEndpoint: HttpRoute[];
    AddNewReferrerEndpoint: HttpRoute[];
    UpdateCodeMetricsEndpoint: HttpRoute[];
    CreateBatchesFromInputEndpoint: HttpRoute[];
  };
  PublicMetrics: {
    GetTopCodesEndpoint: HttpRoute[];
    GetMetricsByCodeEndpoint: HttpRoute[];
    GetMostRecentRipplesEndpoint: HttpRoute[];
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
      UpdateCodeMetricsEndpoint: createEndpoint({
        api: apis.AdminApi,
        props: {
          path: "/admin/update-code-metrics",
          methods: [HttpMethod.POST],
          handler: lambdas.UpdateCodeMetricsFn,
        },
      }),
      CreateBatchesFromInputEndpoint: createEndpoint({
        api: apis.AdminApi,
        props: {
          path: "/admin/create-batches-from-input",
          methods: [HttpMethod.POST],
          handler: lambdas.CreateBatchesFromInputFn,
        },
      }),
      RegisterCodeEndpoint: createEndpoint({
        api: apis.AdminApi,
        props: {
          path: "/admin/register-code",
          methods: [HttpMethod.POST],
          handler: lambdas.RegisterCodeFn,
        },
      }),
      AddNewReferrerEndpoint: createEndpoint({
        api: apis.AdminApi,
        props: {
          path: "/admin/add-new-referrer",
          methods: [HttpMethod.POST],
          handler: lambdas.AddNewReferrerFn,
        },
      }),
    },
    PublicMetrics: {
      GetMetricsByCodeEndpoint: createEndpoint({
        api: apis.PublicMetricsApi,
        props: {
          path: "/public-metrics/get-metrics-by-code",
          methods: [HttpMethod.POST],
          handler: lambdas.GetMetricsByCodeFn,
        },
      }),
      GetTopCodesEndpoint: createEndpoint({
        api: apis.PublicMetricsApi,
        props: {
          path: "/public-metrics/get-top-codes",
          methods: [HttpMethod.GET],
          handler: lambdas.GetTopCodesFn,
        },
      }),
      GetMostRecentRipplesEndpoint: createEndpoint({
        api: apis.PublicMetricsApi,
        props: {
          path: "/public-metrics/get-most-recent-ripples",
          methods: [HttpMethod.GET],
          handler: lambdas.GetMostRecentRipplesFn,
        },
      }),
    },
  };
};
