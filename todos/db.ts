import Database from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { fileURLToPath } from "node:url";
import { logger } from "../shared/utils";

// ponytail: the drizzle client for the shared module-level connection.
// `let` so tests can re-point it at a fresh :memory: DB via setupDatabase();
// production calls setupDatabase("./todos.db") once at startup.
export let db: ReturnType<typeof drizzle>;

export function setupDatabase(path: string) {
  try {
    const sqlite = new Database(path); // ponytail: local const, shadowed so the
    // exported `db` reassignment inside still targets the module-level binding
    // Enable FK enforcement so cascade works (SQLite defaults to off).
    sqlite.run("PRAGMA foreign_keys = ON");
    db = drizzle({ client: sqlite });
    // Vite (which Astro uses) does not provide Bun's `import.meta.dir`, so
    // resolve the migrations relative to this module's URL instead.
    const migrationsFolder = fileURLToPath(new URL("./drizzle", import.meta.url));
    logger.info(`Folder = ${migrationsFolder}`)
    migrate(db, { migrationsFolder });
    // ponytail: `migrate` resets SQLite's FK pragma back to OFF, so
    // re-enable it right after so FK constraints actually take effect.
    sqlite.run("PRAGMA foreign_keys = ON");
  } catch (error) {
    console.error("Failed to setup database:", error);
    throw error;
  }
}
