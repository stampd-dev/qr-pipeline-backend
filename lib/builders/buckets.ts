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
      id: "qrpcsvinputs",
      props: {
        bucketName: "qrpcsvinputs",
      },
      scope,
    }),
    QRBatchOutput: createBucket({
      id: "qrpbatchoutputs",
      props: {
        bucketName: "qrpbatchoutputs",
      },
      scope,
    }),
  };
};
