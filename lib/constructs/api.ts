import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export const createApi = (
  scope: Construct,
  id: string,
  props: { apiName: string }
) => {
  const { apiName } = props;
  return new cdk.aws_apigatewayv2.HttpApi(scope, id, {
    apiName,
    corsPreflight: {
      allowOrigins: ["*"],
      allowHeaders: ["*"],
      allowMethods: [
        cdk.aws_apigatewayv2.CorsHttpMethod.GET,
        cdk.aws_apigatewayv2.CorsHttpMethod.POST,
        cdk.aws_apigatewayv2.CorsHttpMethod.PUT,
        cdk.aws_apigatewayv2.CorsHttpMethod.PATCH,
        cdk.aws_apigatewayv2.CorsHttpMethod.DELETE,
        cdk.aws_apigatewayv2.CorsHttpMethod.OPTIONS,
      ],
    },
  });
};
