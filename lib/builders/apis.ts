import { HttpApi } from "aws-cdk-lib/aws-apigatewayv2";
import { Construct } from "constructs";
import { createApi } from "../constructs/api";

export type QRPApis = {
  AdminApi: HttpApi;
  PublicMetricsApi: HttpApi;
};

export const createApis = (scope: Construct) => {
  return {
    AdminApi: createApi(scope, "QRP-AdminApi", {
      apiName: "QRP-AdminApi",
      
    }),
    PublicMetricsApi: createApi(scope, "QRP-PublicMetricsApi", {
      apiName: "QRP-PublicMetricsApi",
    }),
  };
};
