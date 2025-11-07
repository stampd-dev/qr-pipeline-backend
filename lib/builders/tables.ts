import { Construct } from "constructs";
import { createTable } from "../constructs/table";
import { Table } from "aws-cdk-lib/aws-dynamodb";

export type QRPTables = {
  RefererStats: Table;
};

export const createTables = (scope: Construct) => {
  return {
    RefererStats: createTable({
      id: "QRP-RefererStats",
      props: {
        tableName: "QRP-RefererStats",
        partitionKey: "PK",
        sortKey: "SK",
      },
      scope,
    }),
  };
};
