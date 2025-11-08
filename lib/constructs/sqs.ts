import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import { Duration } from "aws-cdk-lib";

export const createSqs = ({
  id,
  props,
  scope,
}: {
  scope: Construct;
  id: string;
  props: {
    queueName: string;
  };
}) => {
  const deadLetterQueue = new cdk.aws_sqs.Queue(scope, `${id}DeadLetterQueue`, {
    queueName: `${props.queueName}DeadLetterQueue`,
    visibilityTimeout: Duration.seconds(180),
    encryption: cdk.aws_sqs.QueueEncryption.SQS_MANAGED,
  });
  return new cdk.aws_sqs.Queue(scope, id, {
    queueName: props.queueName,
    visibilityTimeout: Duration.seconds(180),
    deadLetterQueue: {
      queue: deadLetterQueue,
      maxReceiveCount: 3,
    },
    encryption: cdk.aws_sqs.QueueEncryption.SQS_MANAGED,
  });
};
