import { afterAll, expect, it } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createTask } from "../../crud.ts";
import { setupDatabase } from "../../db.ts";
import { watchTaskEvents } from "../board/events.ts";

const dir = mkdtempSync(join(tmpdir(), "todos-gui-"));
const dbPath = join(dir, "todos.db");

afterAll(() => {
  rmSync(dir, { recursive: true, force: true });
});

it("detects a task event made by another connection", async () => {
  setupDatabase(dbPath);

  const events: { taskId: string; type: string }[] = [];
  const stopWatching = watchTaskEvents(
    dbPath,
    (batch) => {
      events.push(...batch);
    },
    20,
  );

  try {
    const task = await createTask({ prompt: "Detected task" });

    const deadline = Date.now() + 2000;
    while (events.length === 0 && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 20));
    }

    expect(events[0]?.taskId).toBe(task.id);
    expect(events[0]?.type).toBe("task.created");
  } finally {
    stopWatching();
  }
});
