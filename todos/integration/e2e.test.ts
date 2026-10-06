import { describe, it, expect, beforeEach } from "bun:test";
import { setupDatabase } from "../db";
import { workOnPlan, workOnTask } from "../agents";
import { listSubtasks, listTasks } from "../crud.ts";
import { registerTelemetry } from "ai";
import { DevToolsTelemetry } from "@ai-sdk/devtools";

describe("Test the todo worker agent", () => {
  beforeEach(() => {
    setupDatabase(":memory:");
    registerTelemetry(DevToolsTelemetry() as any);
  });

  // findings: relative/absolute path issues
  it("Worker agent picks up the work", async () => {
    await workOnPlan(["Create subtasks for calculating 1+1, 1+2 and 2+2."], {});

    const all = await listTasks();
    expect(all.length).toBeGreaterThan(0);
    const subtasks = listSubtasks(all[0]!.id);
    expect(subtasks.length).toBeGreaterThan(0);
  }, 0);
});
