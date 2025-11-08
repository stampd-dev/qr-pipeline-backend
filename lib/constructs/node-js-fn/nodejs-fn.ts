import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import { Duration } from "aws-cdk-lib";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { handleStoragePermissions } from "./utils";
import { Queue } from "aws-cdk-lib/aws-sqs";

export const createNodejsFn = ({
  id,
  props,
  scope,
  environment,
  permissions,
}: {
  scope: Construct;
  id: string;
  props: {
    functionName: string;
    handler: string;
    entry: string;
  };
  environment: Record<string, string>;
  permissions: {
    tables?: {
      read?: Table[];
      write?: Table[];
      full?: Table[];
    };
    buckets?: {
      read?: Bucket[];
      write?: Bucket[];
      full?: Bucket[];
    };
    queues?: {
      consume?: Queue;
      send?: Queue;
    };
  };
}) => {
  const fn = new NodejsFunction(scope, id, {
    functionName: props.functionName,
    entry: props.entry,
    handler: props.handler,
    runtime: lambda.Runtime.NODEJS_LATEST,
    memorySize: 1024,
    timeout: Duration.seconds(30),
    environment,
    bundling: {
      minify: true,
      target: "node18",
    },
  });

  handleStoragePermissions({ ...permissions, fn });

  return fn;
};
