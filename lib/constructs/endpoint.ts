import * as apiv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as apiv2i from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as lambda from "aws-cdk-lib/aws-lambda";

export const createEndpoint = ({
  props,
  api,
}: {
  props: {
    path: string;
    methods: apiv2.HttpMethod[];
    handler: lambda.IFunction;
    authorizer?: apiv2.IHttpRouteAuthorizer; // Add optional parameter
  };
  api: apiv2.HttpApi;
}) => {
  return api.addRoutes({
    ...props,
    integration: new apiv2i.HttpLambdaIntegration(
      `${props.path}:${props.methods.join(",")}`,
      props.handler
    ),
  });
};
