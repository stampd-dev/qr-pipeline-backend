import { Table } from "aws-cdk-lib/aws-dynamodb";
import { createTable } from "./table";
import { Construct } from "constructs";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { createBucket } from "./bucket";

/** Control Tables Output Model Here */
type TableOutput = {
  RefererStats: Table;
};

const tablesConfig: {
  tableName: string;
  partitionKey: string;
  sortKey?: string;
}[] = [
  {
    tableName: "QRP-RefererStats",
    partitionKey: "id",
  },
];

export const createTables = (scope: Construct) => {
  const tableResults: { [tableName: string]: Table } = {};

  tablesConfig.forEach((table) => {
    tableResults[table.tableName] = createTable({
      id: table.tableName,
      props: table,
      scope,
    });
  });

  return tableResults as TableOutput;
};

/** Control Buckets Output Model Here */
type BucketOutput = {
  CsvInput: Bucket;
  QRBatchOutput: Bucket;
};

const bucketsConfig: {
  bucketName: string;
}[] = [
  {
    bucketName: "QRP-CsvInput",
  },
  {
    bucketName: "QRP-QRBatchOutput",
  },
];

export const createBuckets = (scope: Construct) => {
  const bucketResults: { [bucketName: string]: Bucket } = {};

  bucketsConfig.forEach((bucket) => {
    bucketResults[bucket.bucketName] = createBucket({
      id: bucket.bucketName,
      props: bucket,
      scope,
    });
  });

  return bucketResults as BucketOutput;
};
