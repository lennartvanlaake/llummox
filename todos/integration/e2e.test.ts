import { describe, it, expect, beforeEach } from "bun:test";
import { setupDatabase } from "../db";
import {
  createPiWorkerAgent,
  workOnPlan,
} from "../agents";
import { listSubtasks, listTasks } from "../crud.ts";
// ponytail: `ai`/`@ai-sdk` removed — telemetry registration dropped from tests.

describe("Test the todo worker agent", () => {
  beforeEach(() => {
    setupDatabase(":memory:");
  });

  // findings: relative/absolute path issues
  it("Pi worker agent does actual work", async () => {
    const piWorker = await createPiWorkerAgent({
      cwd: "/tmp",
    });

    await workOnPlan([
      {
        prompt: "Create subtasks for calculating 1+1, 1+2 and 2+2.",
        worker: piWorker,
        cwd: "/tmp",
      },
    ]);

    const all = await listTasks();
    expect(all.length).toBeGreaterThan(0);
    const subtasks = listSubtasks(all[0]!.id);
    expect(subtasks.length).toBeGreaterThan(0);
    subtasks.forEach((st) => {
      expect(st.status).toBe("done")
    })
  }, 0);
});
