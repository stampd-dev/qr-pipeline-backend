import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import { Duration } from "aws-cdk-lib";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { handleSqsPermissions, handleStoragePermissions } from "./utils";
import { Queue } from "aws-cdk-lib/aws-sqs";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";

export const createNodejsFn = ({
  id,
  props,
  scope,
  environment,
  permissions,
  needsSharp,
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
    globalSecondaryIndexes?: {
      tableArn: string;
      indexName: string;
    }[];
  };
  needsSharp?: boolean;
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
      ...(needsSharp && {
        commandHooks: {
          beforeBundling(inputDir: string, outputDir: string): string[] {
            return [
              // Install sharp with Linux platform binaries for Lambda
              `cd ${inputDir} && npm install --platform=linux --arch=x64 --ignore-scripts=false --include=optional --no-save sharp`,
            ];
          },
          beforeInstall(): string[] {
            return [];
          },
          afterBundling(): string[] {
            return [];
          },
        },
        // Explicitly include sharp from node_modules (don't bundle it, include as external)
        // This tells the bundler to include sharp from node_modules with its native binaries
        nodeModules: ["sharp"],
      }),
    },
  });

  if (permissions.globalSecondaryIndexes) {
    fn.addToRolePolicy(
      new PolicyStatement({
        actions: ["dynamodb:Query"],
        resources: permissions.globalSecondaryIndexes.map(
          (index) => `${index.tableArn}/index/${index.indexName}`
        ),
      })
    );
  }

  handleStoragePermissions({ ...permissions, fn });
  handleSqsPermissions({ fn, permissions: permissions.queues });

  return fn;
};
