import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Table } from "aws-cdk-lib/aws-dynamodb";

const handleDynamoDBPermissions = ({
  fn,
  permissions,
}: {
  fn: NodejsFunction;
  permissions: {
    read?: Table[];
    write?: Table[];
    full?: Table[];
  };
}) => {
  if (permissions.read && permissions.read.length > 0) {
    permissions.read.forEach((table) => {
      table.grantReadData(fn);
    });
  }

  if (permissions.write && permissions.write.length > 0) {
    permissions.write.forEach((table) => {
      table.grantWriteData(fn);
    });
  }

  if (permissions.full && permissions.full.length > 0) {
    permissions.full.forEach((table) => {
      table.grantReadWriteData(fn);
    });
  }
};

const handleS3Permissions = ({
  fn,
  permissions,
}: {
  fn: NodejsFunction;
  permissions: {
    read?: Bucket[];
    write?: Bucket[];
    full?: Bucket[];
  };
}) => {
  if (permissions.read && permissions.read.length > 0) {
    permissions.read.forEach((bucket) => {
      bucket.grantRead(fn);
    });
  }

  if (permissions.write && permissions.write.length > 0) {
    permissions.write.forEach((bucket) => {
      bucket.grantWrite(fn);
    });
  }

  if (permissions.full && permissions.full.length > 0) {
    permissions.full.forEach((bucket) => {
      bucket.grantReadWrite(fn);
    });
  }
};

export const handleStoragePermissions = ({
  fn,
  tables,
  buckets,
}: {
  fn: NodejsFunction;
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
}) => {
  if (tables) {
    handleDynamoDBPermissions({ fn, permissions: tables });
  }
  if (buckets) {
    handleS3Permissions({ fn, permissions: buckets });
  }
};
