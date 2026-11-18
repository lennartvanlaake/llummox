import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import Database from "bun:sqlite";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { createDb } from "./db.ts";

type Row = { id: string; name: string };

describe("createDb", () => {
  let dir: string;
  let store: ReturnType<typeof createDb>;
  let open: Database | undefined;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "db-"));
    mkdirSync(join(dir, "migrations"));
    mkdirSync(join(dir, "queries"));
    writeFileSync(
      join(dir, "migrations", "001_initial.sql"),
      "CREATE TABLE things (id TEXT PRIMARY KEY, name TEXT NOT NULL);",
    );
    writeFileSync(
      join(dir, "queries", "insert.sql"),
      "INSERT INTO things (id, name) VALUES (:id, :name) RETURNING *;",
    );
    writeFileSync(
      join(dir, "queries", "get.sql"),
      "SELECT * FROM things WHERE id = :id;",
    );
    writeFileSync(
      join(dir, "queries", "list.sql"),
      "SELECT * FROM things ORDER BY id;",
    );
    store = createDb({
      queriesDir: join(dir, "queries"),
      migrationsDir: join(dir, "migrations"),
    });
  });

  afterEach(() => {
    open?.close();
    rmSync(dir, { recursive: true, force: true });
  });

  test("applies migrations and round-trips query files", () => {
    open = store.setupDatabase(":memory:");

    expect(open).toBeInstanceOf(Database);
    expect(store.readQuery("insert.sql")).toContain("INSERT INTO things");

    store.run("insert.sql", { id: "a", name: "A" });

    expect(store.get<Row>("get.sql", { id: "a" })).toEqual({
      id: "a",
      name: "A",
    });
    expect(store.all<Row>("list.sql")).toEqual([{ id: "a", name: "A" }]);
  });

  test("re-pointing the database clears cached statements", () => {
    const first = store.setupDatabase(":memory:");
    store.run("insert.sql", { id: "a", name: "A" });
    first.close();

    open = store.setupDatabase(":memory:");

    expect(open).not.toBe(first);
    expect(store.all<Row>("list.sql")).toEqual([]);
  });

  test("accepts file URLs for its directories", () => {
    const urlStore = createDb({
      queriesDir: pathToFileURL(join(dir, "queries")),
      migrationsDir: pathToFileURL(join(dir, "migrations")),
    });

    open = urlStore.setupDatabase(":memory:");
    urlStore.run("insert.sql", { id: "b", name: "B" });

    expect(urlStore.all<Row>("list.sql")).toEqual([{ id: "b", name: "B" }]);
  });
});
