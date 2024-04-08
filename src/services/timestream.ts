// src/timestream.ts
import {
  TimestreamWriteClient,
  ListDatabasesCommand,
  ListTablesCommand,
} from "@aws-sdk/client-timestream-write";
import {
  TimestreamQueryClient,
  QueryCommand,
} from "@aws-sdk/client-timestream-query";

let tsw: TimestreamWriteClient | null = null;
let tsq: TimestreamQueryClient | null = null;

type AwsCredentials = {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
};

export const setConfiguration = (
  region: string,
  credentials: AwsCredentials
) => {
  tsw = new TimestreamWriteClient({
    region,
    credentials,
  });

  tsq = new TimestreamQueryClient({
    region,
    credentials,
  });
};

export const listDatabases = async () => {
  if (!tsw) throw new Error("TimestreamWriteClient is not initialized");
  return tsw.send(new ListDatabasesCommand({}));
};

export const listTables = async (databaseName: string) => {
  if (!tsw) throw new Error("TimestreamWriteClient is not initialized");
  return tsw.send(
    new ListTablesCommand({
      DatabaseName: databaseName,
    })
  );
};

export const query = async (queryString: string) => {
  if (!tsq) throw new Error("TimestreamQueryClient is not initialized");
  return tsq.send(new QueryCommand({ QueryString: queryString }));
};

// Add other utility functions as needed.
