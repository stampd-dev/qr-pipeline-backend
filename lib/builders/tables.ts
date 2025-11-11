import { Construct } from "constructs";
import { createTable } from "../constructs/table";
import { Table } from "aws-cdk-lib/aws-dynamodb";

export type QRPTables = {
  RefererStats: Table;
  Ripples: Table;
};

export const createTables = (scope: Construct): QRPTables => {
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
    Ripples: createTable({
      id: "QRP-Ripples",
      props: {
        tableName: "QRP-Ripples",
        partitionKey: "PK",
        sortKey: "SK",
      },
      scope,
    }),
  };
};
