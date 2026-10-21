import { test, expect, describe, beforeAll } from "bun:test";
import { eq } from "drizzle-orm";
import { setupDatabase, db } from "./db";
import { subtasksTable } from "./schema";
import {
  updateTaskTool,
  createSubtaskTool,
  updateSubtaskWorkerTool,
} from "./tools";
import { createTask, getTask } from "./crud";
import { logger } from "../shared/utils";
import { invokeTool } from "../shared/testing";

describe("scrum task tools", () => {
  beforeAll(async () => {
    setupDatabase(":memory:");
  });

  test("update_task errors on a missing task", async () => {
    const res = await invokeTool(updateTaskTool, {
      taskId: "nope",
      status: "done",
      notes: "x",
    });
    expect(res.result.isError).toBe(true);
    expect(res.text).toContain("nope");
  });

  test("update_task updates status and notes (prompt is static, set out of band)", async () => {
    const task = await createTask({ prompt: "T" });
    const taskId = task.id;

    const res = await invokeTool(updateTaskTool, {
      taskId,
      status: "done",
      notes: "needs design review",
    });
    expect(res.result.isError).toBe(false);

    const fetched = getTask(taskId)!;
    expect(fetched.prompt).toBe("T");
    expect(fetched.status).toBe("done");
    expect(fetched.notes).toBe("needs design review");
  });

  test("update_task clears notes given empty string", async () => {
    const task = await createTask({
      prompt: "T",
      notes: "x",
    });
    const taskId = task.id;

    const res = await invokeTool(updateTaskTool, {
      taskId,
      notes: "",
    });
    expect(res.result.isError).toBe(false);

    const fetched = getTask(taskId)!;
    expect(fetched.notes).toBe("");
  });
});

describe("scrum subtask tools", () => {
  let taskId: string;

  beforeAll(async () => {
    setupDatabase(":memory:");
    const task = await createTask({ prompt: "T" });
    taskId = task.id;
  });

  test("create_subtask then update_subtask sets status + notes together", async () => {
    const made = (await invokeTool(createSubtaskTool, {
      title: "Write agenda",
      description: "Draft the meeting agenda",
      taskId,
    })) as any;
    expect(made.text).toContain("subTaskId");
    const subtaskId: string = JSON.parse(made.text).subTaskId;
    // ponytail: order auto-assigned (max+1) when the tool omits it.
    expect(made.text).toContain("order");

    // status + notes in one call (merged tool)
    const res = await invokeTool(updateSubtaskWorkerTool, {
      subtaskId,
      status: "done",
      notes: "wait on spec",
    });
    expect(res.result.isError).toBe(false);
    expect(res.text).toContain("error");

    const fetched = await db
      .select()
      .from(subtasksTable)
      .where(eq(subtasksTable.id, subtaskId));

    expect(fetched[0]!.status).toBe("done");
    expect(fetched[0]!.notes).toBe("wait on spec");
  });

  test("update_subtask errors on a missing subtask", async () => {
    const res = await invokeTool(updateSubtaskWorkerTool, {
      subtaskId: "ghost",
      status: "done",
      notes: "x",
    });
    expect(res.result.isError).toBe(true);
    expect(res.text).toContain("ghost");
  });
});
