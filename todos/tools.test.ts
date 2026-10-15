import { test, expect, describe, beforeAll } from "bun:test";
import { eq } from "drizzle-orm";
import { setupDatabase, db } from "./db";
import { subtasksTable } from "./schema";
import {
  updateTaskTool,
  createSubtaskTool,
  updateSubtaskWorkerTool,
} from "./tools";
import { createTask, getTask, getSubtask } from "./crud";
import { logger } from "../shared/utils";

describe("scrum task tools", () => {
  beforeAll(async () => {
    setupDatabase(":memory:");
  });


  //  // OLD
  // test("update_task errors on a missing task", async () => {
  //   // Required status present so zod passes; the missing-task check fires.
  //   const res = (await testInvokeTool(updateTaskTool, {
  //     taskId: "nope",
  //     status: "done",
  //     notes: "x",
  //   })) as any;
  //   expect(res.isError).toBe(true);
  //   expect(res.content[0].text).toContain("nope");
  // });
  //
  // NEW
  //
  test("update_task errors on a missing task", async () => {
    const res = await updateTaskTool.execute("_", {
      taskId: "nope",
      status: "done",
      notes: "x",
    }, undefined, undefined, undefined)
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain("nope");
  });

  test("update_task updates status and notes (prompt is static, set out of band)", async () => {
    const task = await createTask({ prompt: "T" });
    const taskId = task.id;

    const res = (await testInvokeTool(updateTaskTool, {
      taskId,
      status: "done",
      notes: "needs design review",
    })) as any;
    expect(res.isError).toBe(false);

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

    const res = (await testInvokeTool(updateTaskTool, {
      taskId,
      notes: "",
    })) as any;
    expect(res.isError).toBe(false);

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
    const made = (await testInvokeTool(createSubtaskTool, {
      title: "Write agenda",
      description: "Draft the meeting agenda",
      taskId,
    })) as any;
    expect(made.content[0].text).toContain("subTaskId");
    const subtaskId: string = JSON.parse(made.content[0].text).subTaskId;

    // status + notes in one call (merged tool)
    const res = await testInvokeTool(updateSubtaskWorkerTool, {
      subtaskId,
      status: "done",
      notes: "wait on spec",
    });
    expect(res.isError).toBe(false);
    expect(res.content[0].text).toContain("error");

    const fetched = await db
      .select()
      .from(subtasksTable)
      .where(eq(subtasksTable.id, subtaskId));

    expect(fetched[0]!.status).toBe("done");
    expect(fetched[0]!.notes).toBe("wait on spec");
  });

  test("update_subtask errors on a missing subtask", async () => {
    const res = await testInvokeTool(updateSubtaskWorkerTool, {
      subtaskId: "ghost",
      status: "done",
      notes: "x",
    });
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain("ghost");
  });
});
