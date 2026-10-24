import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Database } from "./types";

// ponytail: one process owns this JSON file; move to SQLite before using multiple server processes.
// Next may bundle routes separately; share the queue across bundles and development reloads.
const processState = globalThis as typeof globalThis & {
  memoFlowStoreQueue?: Promise<unknown>;
};

function dataFile() {
  return (
    process.env.MEMOFLOW_DATA_FILE || path.join(process.cwd(), "data/db.json")
  );
}

async function writeDatabase(database: Database) {
  const file = dataFile();
  await mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.${randomUUID()}.tmp`;
  await writeFile(temporary, `${JSON.stringify(database, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
    flush: true,
  });
  await rename(temporary, file);
}

async function loadDatabase(): Promise<Database> {
  let contents: string;
  try {
    contents = await readFile(dataFile(), "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    contents = await readFile(
      path.join(process.cwd(), "data/seed.json"),
      "utf8",
    );
    await writeDatabase(JSON.parse(contents));
  }
  const database = JSON.parse(contents) as Database;
  if (
    !Array.isArray(database.notes) ||
    !Array.isArray(database.actionItems) ||
    !Array.isArray(database.feedback)
  ) {
    throw new Error("MemoFlow database is invalid; restore a valid backup.");
  }
  return database;
}

function serialize<T>(operation: () => Promise<T>): Promise<T> {
  const result = (processState.memoFlowStoreQueue ?? Promise.resolve()).then(
    operation,
  );
  processState.memoFlowStoreQueue = result.catch(() => undefined);
  return result;
}

export function readDatabase(): Promise<Database> {
  return serialize(loadDatabase);
}

export function updateDatabase<T>(
  mutate: (database: Database) => T,
): Promise<T> {
  return serialize(async () => {
    const database = await loadDatabase();
    const result = mutate(database);
    await writeDatabase(database);
    return result;
  });
}
