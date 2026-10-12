import { describe, it, expect, beforeEach } from "bun:test";
import { setupDatabase } from "../db";
import { workOnPlan, workOnTask, workerSystemPrompt } from "../agents";
import { listSubtasks, listTasks } from "../crud.ts";
import { registerTelemetry } from "ai";
import { DevToolsTelemetry } from "@ai-sdk/devtools";
import { createPiSession } from "../pi.ts";

describe("Test the todo worker agent", () => {
  beforeEach(() => {
    setupDatabase(":memory:");
    registerTelemetry(DevToolsTelemetry() as any);
  });

  // findings: relative/absolute path issues
  it("Pi worker agent does actual work", async () => {
    const piWorker = await createPiSession({
      cwd: "/tmp",
      systemPrompt: workerSystemPrompt,
    });

    await workOnPlan([
      {
        prompt: "Create subtasks for calculating 1+1, 1+2 and 2+2.",
        worker: piWorker,
      },
    ]);

    const all = await listTasks();
    expect(all.length).toBeGreaterThan(0);
    const subtasks = listSubtasks(all[0]!.id);
    expect(subtasks.length).toBeGreaterThan(0);
  }, 0);
});
