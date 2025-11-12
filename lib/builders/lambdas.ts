import { Construct } from "constructs";
import { createNodejsFn } from "../constructs/node-js-fn/nodejs-fn";
import { QRPBuckets } from "./buckets";
import { QRPTables } from "./tables";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { QRPQueues } from "./sqs";
import { environment } from "../../environment";

export type QRPLambdas = {
  /** Ingestion Lambdas */
  CreateBatchesFromInputFn: NodejsFunction;

  /** Digestion Fns */
  ProcessQRBatchFn: NodejsFunction;

  /** Metrics Fns */
  AddNewReferrerFn: NodejsFunction;
  GetMetricsByCodeFn: NodejsFunction;
  GetTopCodesFn: NodejsFunction;
  RegisterCodeFn: NodejsFunction;
  UpdateCodeMetricsFn: NodejsFunction;

  /** System Updates */
  BackfillRippleEventsFn: NodejsFunction;
};

export const createLambdas = ({
  buckets,
  tables,
  scope,
  queues,
}: {
  buckets: QRPBuckets;
  tables: QRPTables;
  scope: Construct;
  queues: QRPQueues;
}): QRPLambdas => {
  return {
    BackfillRippleEventsFn: createNodejsFn({
      id: "QRP-BackfillRippleEvents",
      props: {
        functionName: "QRP-BackfillRippleEvents",
        handler: "index.handler",
        entry: "src/handlers/backfill-ripple-events/index.ts",
      },
      scope,
      environment: {
        RIPPLES_TABLE_NAME: tables.Ripples.tableName,
      },
      permissions: {
        tables: {
          full: [tables.Ripples],
        },
      },
    }),
    RegisterCodeFn: createNodejsFn({
      id: "QRP-RegisterCode",
      props: {
        functionName: "QRP-RegisterCode",
        handler: "index.handler",
        entry: "src/handlers/register-code/index.ts",
      },
      scope,
      environment: {
        REFERRER_STATS_TABLE_NAME: tables.RefererStats.tableName,
        RIPPLES_TABLE_NAME: tables.Ripples.tableName,
        QR_BATCH_OUTPUT_BUCKET_NAME: buckets.QRBatchOutput.bucketName,
        IPINFO_TOKEN: environment.ipinfoToken,
      },
      permissions: {
        tables: {
          full: [tables.RefererStats],
          write: [tables.Ripples],
        },
        buckets: {
          full: [buckets.QRBatchOutput],
        },
      },
    }),
    AddNewReferrerFn: createNodejsFn({
      id: "QRP-AddNewReferrer",
      props: {
        functionName: "QRP-AddNewReferrer",
        handler: "index.handler",
        entry: "src/handlers/add-new-referrer/index.ts",
      },
      scope,
      environment: {
        REFERRER_STATS_TABLE_NAME: tables.RefererStats.tableName,
        QR_BATCH_OUTPUT_BUCKET_NAME: buckets.QRBatchOutput.bucketName,
        RIPPLES_TABLE_NAME: tables.Ripples.tableName,
        IPINFO_TOKEN: environment.ipinfoToken,
      },
      permissions: {
        tables: {
          full: [tables.RefererStats],
          write: [tables.Ripples],
        },
        buckets: {
          full: [buckets.QRBatchOutput],
        },
      },
    }),
    UpdateCodeMetricsFn: createNodejsFn({
      id: "QRP-UpdateCode",
      props: {
        functionName: "QRP-UpdateCodeMetrics",
        handler: "index.handler",
        entry: "src/handlers/update-code-metrics/index.ts",
      },
      scope,
      environment: {
        REFERRER_STATS_TABLE_NAME: tables.RefererStats.tableName,
        IPINFO_TOKEN: environment.ipinfoToken,
        RIPPLES_TABLE_NAME: tables.Ripples.tableName,
      },
      permissions: {
        tables: {
          full: [tables.RefererStats],
          write: [tables.Ripples],
        },
      },
    }),
    GetMetricsByCodeFn: createNodejsFn({
      environment: {
        REFERRER_STATS_TABLE_NAME: tables.RefererStats.tableName,
        QR_BATCH_OUTPUT_BUCKET_NAME: buckets.QRBatchOutput.bucketName,
        IPINFO_TOKEN: environment.ipinfoToken,
        RIPPLES_TABLE_NAME: tables.Ripples.tableName,
      },
      scope,
      id: "QRP-GetMetricsByCode",
      props: {
        functionName: "QRP-GetMetricsByCode",
        handler: "index.handler",
        entry: "src/handlers/get-metrics-by-code/index.ts",
      },
      permissions: {
        tables: {
          full: [tables.RefererStats],
          write: [tables.Ripples],
        },
        buckets: {
          full: [buckets.QRBatchOutput],
        },
      },
    }),
    GetTopCodesFn: createNodejsFn({
      environment: {
        REFERRER_STATS_TABLE_NAME: tables.RefererStats.tableName,
        UNIQUE_SCANS_INDEX_NAME: "UNIQUE_SCANS_INDEX_N",
        FURTHEST_RIPPLES_INDEX_NAME: "FURTHEST_RIPPLES_INDEX",
      },
      scope,
      id: "QRP-GetTopCodes",
      props: {
        functionName: "QRP-GetTopCodes",
        handler: "index.handler",
        entry: "src/handlers/get-top-codes/index.ts",
      },
      permissions: {
        tables: {
          read: [tables.RefererStats],
        },
        globalSecondaryIndexes: [
          {
            tableArn: tables.RefererStats.tableArn,
            indexName: "UNIQUE_SCANS_INDEX_N",
          },
          {
            tableArn: tables.RefererStats.tableArn,
            indexName: "FURTHEST_RIPPLES_INDEX",
          },
        ],
      },
    }),
    CreateBatchesFromInputFn: createNodejsFn({
      environment: {
        CSV_INPUT_BUCKET_NAME: buckets.CsvInput.bucketName,
        PROCESS_BATCH_QUEUE_URL: queues.processBatchQueue.queueUrl,
      },
      scope,
      id: "QRP-CreateBatchesFromInput",
      props: {
        functionName: "QRP-CreateBatchesFromInput",
        handler: "index.handler",
        entry: "src/handlers/create-batches-from-input/index.ts",
      },
      permissions: {
        buckets: {
          full: [buckets.CsvInput],
        },
        queues: {
          send: queues.processBatchQueue,
        },
      },
    }),
    ProcessQRBatchFn: createNodejsFn({
      environment: {
        QR_BATCH_OUTPUT_BUCKET_NAME: buckets.QRBatchOutput.bucketName,
        REFERRER_STATS_TABLE_NAME: tables.RefererStats.tableName,
        CSV_INPUT_BUCKET_NAME: buckets.CsvInput.bucketName,
        PROCESS_BATCH_QUEUE_URL: queues.processBatchQueue.queueUrl,
      },
      scope,
      id: "QRP-ProcessQRBatch",
      props: {
        functionName: "QRP-ProcessQRBatch",
        handler: "index.handler",
        entry: "src/handlers/process-qr-batch/index.ts",
      },
      permissions: {
        buckets: {
          read: [buckets.CsvInput],
          write: [buckets.QRBatchOutput],
        },
        tables: {
          write: [tables.RefererStats],
        },
        queues: {
          consume: queues.processBatchQueue,
        },
      },
      needsSharp: true,
    }),
  };
};
