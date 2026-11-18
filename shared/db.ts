import Database, { type SQLQueryBindings } from "bun:sqlite";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { migrate } from "./migrate.ts";
import { logger } from "./utils.ts";

type Params = Extract<SQLQueryBindings, Record<string, unknown>>;
type Statement = ReturnType<Database["query"]>;
type Dir = string | URL;

export type DbConfig = {
  /** Directory of one-statement `.sql` files, e.g. `new URL("./queries/", import.meta.url)`. */
  queriesDir: Dir;
  /** Directory of numbered `001_name.sql` migrations. */
  migrationsDir: Dir;
  onMigration?: (file: string) => void;
};

function dirPath(dir: Dir) {
  return typeof dir === "string" ? dir : fileURLToPath(dir);
}

/**
 * Build the SQLite helpers for one sub-project.
 *
 * Call `setupDatabase(path)` once before using `all`/`get`/`run`; call it again
 * with `":memory:"` in tests to get a fresh migrated connection.
 */
export function createDb({
  queriesDir,
  migrationsDir,
  onMigration = (file) => logger.info(`Applied migration ${file}`),
}: DbConfig) {
  const queryRoot = dirPath(queriesDir);
  const migrationRoot = dirPath(migrationsDir);

  // ponytail: one shared connection per sub-project; setupDatabase re-points it.
  let db: Database;
  const statements = new Map<string, Statement>();

  function readQuery(file: string) {
    return readFileSync(join(queryRoot, file), "utf8");
  }

  function statement(file: string) {
    let stmt = statements.get(file);
    if (!stmt) {
      stmt = db.query(readQuery(file));
      statements.set(file, stmt);
    }
    return stmt;
  }

  function all<T>(file: string, params?: Params): T[] {
    const stmt = statement(file);
    return (params ? stmt.all(params) : stmt.all()) as T[];
  }

  function get<T>(file: string, params?: Params): T | undefined {
    const stmt = statement(file);
    return ((params ? stmt.get(params) : stmt.get()) ?? undefined) as
      | T
      | undefined;
  }

  function run(file: string, params?: Params) {
    const stmt = statement(file);
    return params ? stmt.run(params) : stmt.run();
  }

  function setupDatabase(path: string) {
    try {
      const sqlite = new Database(path);
      // SQLite enables FK enforcement per connection, not per database file.
      sqlite.run("PRAGMA foreign_keys = ON");
      db = sqlite;
      // Statements are bound to one connection; drop them before re-pointing db.
      statements.clear();
      migrate(db, migrationRoot, onMigration);
      return db;
    } catch (error) {
      console.error("Failed to setup database:", error);
      throw error;
    }
  }

  return {
    get db() {
      return db;
    },
    readQuery,
    all,
    get,
    run,
    setupDatabase,
  };
}
