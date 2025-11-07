import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export const createBucket = ({
  id,
  props,
  scope,
}: {
  scope: Construct;
  id: string;
  props: {
    bucketName: string;
  };
}) => {
  const { bucketName } = props;
  return new cdk.aws_s3.Bucket(scope, id, {
    bucketName,
    removalPolicy: cdk.RemovalPolicy.RETAIN,
    blockPublicAccess: cdk.aws_s3.BlockPublicAccess.BLOCK_ALL,
    encryption: cdk.aws_s3.BucketEncryption.S3_MANAGED,
    versioned: true,
  });
};
