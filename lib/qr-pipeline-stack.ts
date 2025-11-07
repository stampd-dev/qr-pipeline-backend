import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Environment } from "../environment";
import { createBuckets, createTables } from "./constructs";
import { createLambdas } from "./builders/lambdas";
import { createApis } from "./builders/apis";
import { createEndpoints } from "./builders/endpoints";

interface QrPipelineStackProps extends cdk.StackProps {
  environment: Environment;
}

export class QrPipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: QrPipelineStackProps) {
    super(scope, id, props);

    const buckets = createBuckets(this);
    const tables = createTables(this);
    const lambdas = createLambdas({ buckets, tables, scope: this });
    const apis = createApis(this);
    createEndpoints({ lambdas, apis });
  }
}
