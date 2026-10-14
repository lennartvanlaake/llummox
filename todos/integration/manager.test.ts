import { describe, it, expect, beforeEach } from "bun:test";
import { setupDatabase } from "../db";
import { createTask, deleteTask } from "../crud.ts";
import { createTaskWithSubs } from "../agents";
import { listSubtasks } from "../crud.ts";
// ponytail: `ai`/`@ai-sdk` removed — telemetry registration dropped from tests.

describe("Test the todo manager agent (creates subtasks only)", () => {
  beforeEach(() => {
    setupDatabase(":memory:");
  });

  it("Creates subtasks when asked, under a pre-existing task", async () => {
    const task = await createTask({ prompt: "do maths" });
    await createTaskWithSubs({
      prompt: "Create subtasks for calculating 1+1, 1+2 and 2+2. Do three subtasks.",
    });

    const subtasks = await listSubtasks(task.id);
    expect(subtasks.length).toBe(3);

    await deleteTask(task.id);
  }, 0);

  it("Generates subtasks without explicit instructions", async () => {
    const task = await createTask({ prompt: "build a treehouse" });
    await createTaskWithSubs({
      prompt: "Help me plan the building of my treehouse",
    });

    const subtasks = await listSubtasks(task.id);
    expect(subtasks.length).toBeGreaterThan(0);

    await deleteTask(task.id);
  }, 0);
});
