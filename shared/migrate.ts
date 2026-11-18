import Database from "bun:sqlite";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

type AppliedRow = { name: string };

/**
 * Apply every pending `.sql` migration in `dir`, in filename order.
 *
 * Migration filenames must be numbered: `001_initial.sql`, `002_add_notes.sql`.
 * Each file is applied once and recorded in `schema_migrations`.
 */
export function migrate(
  db: Database,
  dir: string,
  onApplied?: (file: string) => void,
) {
  db.run(
    "CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, appliedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
  );

  const applied = new Set(
    (db.query("SELECT name FROM schema_migrations").all() as AppliedRow[]).map(
      (row) => row.name,
    ),
  );

  const files = readdirSync(dir)
    .filter((file) => file.endsWith(".sql"))
    .sort(
      (a, b) =>
        Number(a.split("_")[0]) - Number(b.split("_")[0]),
    );

  for (const file of files) {
    if (!/^\d{3,}_[a-z0-9_]+\.sql$/.test(file)) {
      throw new Error(
        `Invalid migration filename "${file}": expected 001_name.sql`,
      );
    }
    if (applied.has(file)) continue;

    const sql = readFileSync(join(dir, file), "utf8");
    db.transaction(() => {
      db.exec(sql);
      db
        .query("INSERT INTO schema_migrations (name) VALUES (:name)")
        .run({ name: file });
    })();
    onApplied?.(file);
  }
}

if (import.meta.main) {
  const [dir, dbPath] = process.argv.slice(2);
  if (!dir || !dbPath) {
    console.error(
      "Usage: bun run shared/migrate.ts <migrations-dir> <db-path>",
    );
    process.exit(1);
  }

  const db = new Database(dbPath);
  db.run("PRAGMA foreign_keys = ON");
  migrate(db, resolve(dir), (file) => console.log(`Applied ${file}`));
  console.log(`Migrations up to date: ${dbPath}`);
}
