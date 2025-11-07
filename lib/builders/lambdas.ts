import { Construct } from "constructs";
import { createNodejsFn } from "../constructs/node-js-fn/nodejs-fn";
import { QRPBuckets } from "./buckets";
import { QRPTables } from "./tables";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";

export type QRPLambdas = {
  /** Ingestion Lambdas */
  CreatePresignedCsvUploadUrlLambda: NodejsFunction;

  /** Digestion Lambdas */
  ProcessQRBatchLambda: NodejsFunction;

  /** Metrics Lambdas */
  AddMetricsByQRBatchLambda: NodejsFunction;
  ListQRMetrics: NodejsFunction;
  ListMetricsByQRCodeLambda: NodejsFunction;
};

export const createLambdas = ({
  buckets,
  tables,
  scope,
}: {
  buckets: QRPBuckets;
  tables: QRPTables;
  scope: Construct;
}): QRPLambdas => {
  return {
    AddMetricsByQRBatchLambda: createNodejsFn({
      id: "QRP-AddMetricsByQRBatchLambda",
      props: {
        functionName: "QRP-AddMetricsByQRBatchLambda",
        handler: "index.handler",
        entry: "src/handlers/add-metrics-to-code/index.ts",
      },
      scope,
      environment: {
        REFERRER_STATS_TABLE_NAME: tables.RefererStats.tableName,
      },
      permissions: {
        tables: {
          full: [tables.RefererStats],
        },
      },
    }),
    CreatePresignedCsvUploadUrlLambda: createNodejsFn({
      environment: {
        CSV_INPUT_BUCKET_NAME: buckets.CsvInput.bucketName,
      },
      scope,
      id: "QRP-CreatePresignedCsvUploadUrlLambda",
      props: {
        functionName: "QRP-CreatePresignedCsvUploadUrlLambda",
        handler: "index.handler",
        entry: "src/handlers/create-csv-upload-link/index.ts",
      },
      permissions: {
        buckets: {
          full: [buckets.CsvInput],
        },
      },
    }),
    ListMetricsByQRCodeLambda: createNodejsFn({
      environment: {
        REFERRER_STATS_TABLE_NAME: tables.RefererStats.tableName,
      },
      scope,
      id: "QRP-ListMetricsByQRCodeLambda",
      props: {
        functionName: "QRP-ListMetricsByQRCodeLambda",
        handler: "index.handler",
        entry: "src/handlers/list-metrics-by-code/index.ts",
      },
      permissions: {
        tables: {
          read: [tables.RefererStats],
        },
      },
    }),
    ListQRMetrics: createNodejsFn({
      environment: {
        REFERRER_STATS_TABLE_NAME: tables.RefererStats.tableName,
      },
      scope,
      id: "QRP-ListQRMetrics",
      props: {
        functionName: "QRP-ListQRMetrics",
        handler: "index.handler",
        entry: "src/handlers/list-all-metrics/index.ts",
      },
      permissions: {
        tables: {
          read: [tables.RefererStats],
        },
      },
    }),
    ProcessQRBatchLambda: createNodejsFn({
      environment: {
        QR_BATCH_OUTPUT_BUCKET_NAME: buckets.QRBatchOutput.bucketName,
        REFERRER_STATS_TABLE_NAME: tables.RefererStats.tableName,
        CSV_INPUT_BUCKET_NAME: buckets.CsvInput.bucketName,
      },
      scope,
      id: "QRP-ProcessQRBatchLambda",
      props: {
        functionName: "QRP-ProcessQRBatchLambda",
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
      },
    }),
  };
};
