#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { QrPipelineStack } from "../lib/qr-pipeline-stack";
import { environment } from "../environment";

const app = new cdk.App();
new QrPipelineStack(app, environment.stackName, {
  stackName: environment.stackName,
  environment: environment,
});
