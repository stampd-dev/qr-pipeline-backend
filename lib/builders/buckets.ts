import { Bucket } from "aws-cdk-lib/aws-s3";
import { createBucket } from "../constructs/bucket";
import { Construct } from "constructs";

export type QRPBuckets = {
  CsvInput: Bucket;
  QRBatchOutput: Bucket;
};

export const createBuckets = (scope: Construct) => {
  return {
    CsvInput: createBucket({
      id: "QRPCsvInput",
      props: {
        bucketName: "QRPCsvInput",
      },
      scope,
    }),
    QRBatchOutput: createBucket({
      id: "QRPBatchOutput",
      props: {
        bucketName: "QRPBatchOutput",
      },
      scope,
    }),
  };
};
