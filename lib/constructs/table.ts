import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export const createTable = ({
  id,
  props,
  scope,
}: {
  scope: Construct;
  id: string;
  props: {
    tableName: string;
    partitionKey: string;
    sortKey?: string;
  };
}) => {
  const { tableName, partitionKey, sortKey } = props;
  return new cdk.aws_dynamodb.Table(scope, id, {
    tableName,
    billingMode: cdk.aws_dynamodb.BillingMode.PAY_PER_REQUEST,
    removalPolicy: cdk.RemovalPolicy.RETAIN,
    encryption: cdk.aws_dynamodb.TableEncryption.AWS_MANAGED,
    deletionProtection: true,
    partitionKey: {
      name: partitionKey,
      type: cdk.aws_dynamodb.AttributeType.STRING,
    },
    sortKey: sortKey
      ? {
          name: sortKey,
          type: cdk.aws_dynamodb.AttributeType.STRING,
        }
      : undefined,
  });
};
