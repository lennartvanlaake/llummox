import Database from "bun:sqlite";
import { afterAll, expect, it } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setupDatabase } from "../../db.ts";
import { createDbWatcher } from "../events.ts";

const dir = mkdtempSync(join(tmpdir(), "todos-gui-"));
const dbPath = join(dir, "todos.db");

afterAll(() => {
  rmSync(dir, { recursive: true, force: true });
});

it("detects a commit made by another connection", async () => {
  setupDatabase(dbPath);

  let version = 0;
  const watcher = createDbWatcher(
    dbPath,
    (next) => {
      version = next;
    },
    20,
  );

  const writer = new Database(dbPath);
  try {
    writer.run(
      "INSERT INTO tasks (id, status, prompt) VALUES (?, ?, ?)",
      ["0001", "todo", "Detected task"],
    );

    const deadline = Date.now() + 2000;
    while (version === 0 && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 20));
    }

    expect(version).toBeGreaterThan(0);
  } finally {
    writer.close();
    watcher.close();
  }
});
