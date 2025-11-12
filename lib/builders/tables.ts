import { Construct } from "constructs";
import { createTable } from "../constructs/table";
import { AttributeType, Table } from "aws-cdk-lib/aws-dynamodb";

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
      globalSecondaryIndexes: [
        {
          name: "UNIQUE_SCANS_INDEX_N",
          partitionKey: {
            name: "PK",
            type: AttributeType.STRING,
          },
          sortKey: {
            name: "uniqueScans",
            type: AttributeType.NUMBER,
          },
        },
      ],
    }),
    Ripples: createTable({
      id: "QRP-Ripples",
      props: {
        tableName: "QRP-Ripples",
        partitionKey: "PK",
        sortKey: "SK",
      },
      scope,
      globalSecondaryIndexes: [
        {
          name: "FURTHEST_RIPPLES_INDEX",
          partitionKey: {
            name: "PK",
            type: AttributeType.STRING,
          },
          sortKey: {
            name: "distanceFromOriginal",
            type: AttributeType.NUMBER,
          },
        },
        {
          name: "MOST_RECENT_RIPPLES_INDEX",
          partitionKey: {
            name: "PK",
            type: AttributeType.STRING,
          },
          sortKey: {
            name: "lastSeenAt",
            type: AttributeType.STRING,
          },
        },
      ],
    }),
  };
};
