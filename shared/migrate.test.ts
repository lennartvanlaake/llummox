import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import Database from "bun:sqlite";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { migrate } from "./migrate.ts";

describe("migrate", () => {
  let dir: string;
  let db: Database;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "migrate-"));
    db = new Database(":memory:");
  });

  afterEach(() => {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  });

  test("applies numbered files once in order", () => {
    writeFileSync(join(dir, "002_second.sql"), "CREATE TABLE second (id TEXT);");
    writeFileSync(join(dir, "001_first.sql"), "CREATE TABLE first (id TEXT);");

    migrate(db, dir);

    expect(
      db.query("SELECT name FROM schema_migrations ORDER BY name").all(),
    ).toEqual([{ name: "001_first.sql" }, { name: "002_second.sql" }]);
    expect(
      db
        .query(
          "SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('first', 'second') ORDER BY name",
        )
        .all(),
    ).toEqual([{ name: "first" }, { name: "second" }]);

    migrate(db, dir);
    expect(
      db.query("SELECT COUNT(*) AS count FROM schema_migrations").get(),
    ).toEqual({ count: 2 });
  });

  test("rolls back a failed migration", () => {
    writeFileSync(
      join(dir, "001_bad.sql"),
      "CREATE TABLE partial (id TEXT);\nSELECT * FROM missing;",
    );

    expect(() => migrate(db, dir)).toThrow();

    expect(
      db.query("SELECT name FROM sqlite_master WHERE name = 'partial'").get(),
    ).toBeFalsy();
    expect(
      db.query("SELECT COUNT(*) AS count FROM schema_migrations").get(),
    ).toEqual({ count: 0 });
  });

  test("rejects non-numbered filenames", () => {
    writeFileSync(join(dir, "initial.sql"), "CREATE TABLE nope (id TEXT);");
    expect(() => migrate(db, dir)).toThrow("expected 001_name.sql");
  });
});
