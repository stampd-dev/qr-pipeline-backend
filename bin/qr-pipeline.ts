#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { QrPipelineStack } from "../lib/qr-pipeline-stack";
import { environment } from "../environment";

const app = new cdk.App();
new QrPipelineStack(app, "QrPipelineStack", {
  stackName: process.env.STACK_NAME || "QrPipelineStack",
  environment: environment,
});
