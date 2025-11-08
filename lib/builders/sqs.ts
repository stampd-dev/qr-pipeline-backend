import { Queue } from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";
import { createSqs } from "../constructs/sqs";

export type QRPQueues = {
  processBatchQueue: Queue;
};

export const createQueues = (scope: Construct): QRPQueues => {
  return {
    processBatchQueue: createSqs({
      id: "processBatchQueue",
      props: {
        queueName: "processBatchQueue",
      },
      scope,
    }),
  };
};
