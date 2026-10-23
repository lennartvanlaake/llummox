import { test, expect, describe, beforeAll } from "bun:test";
import { eq } from "drizzle-orm";
import { setupDatabase, db } from "./db";
import { subtasksTable } from "./schema";
import {
  updateTaskTool,
  updateTaskData,
  getTaskData,
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

test("get_task_data returns the full data object when no filter", async () => {
  const task = await createTask({ prompt: "T", data: { a: 1, b: 2 } });
  const taskId = task.id;

  const res = await invokeTool(getTaskData, { taskId });
  expect(res.result.isError).toBe(false);
  expect(res.text).toContain("1");
  expect(res.text).toContain("2");
});

test("get_task_data applies a jq-style filter", async () => {
  const task = await createTask({ prompt: "T", data: { a: { b: "c" } } });
  const taskId = task.id;

  const res = await invokeTool(getTaskData, {
    taskId,
    filter: '.a | output { "b": .b }',
  });
  expect(res.result.isError).toBe(false);
  expect(res.text).toContain("c");
});

test("get_task_data errors on a missing task", async () => {
  const res = await invokeTool(getTaskData, { taskId: "ghost" });
  expect(res.result.isError).toBe(true);
  expect(res.text).toContain("ghost");
});

test("updates a nested field at a path", async () => {
  const task = await createTask({
    prompt: "T",
    data: { friends: ["Tom", "Jane"] },
  });
  const taskId = task.id;

  const res = await invokeTool(updateTaskData, {
    taskId,
    jsCommand: "data.friends[1] = 'Andy'",
  });
  expect(res.result.isError).toBe(false);

  const fetched = getTask(taskId)!;
  expect((fetched.data as any).friends).toEqual(["Tom", "Andy"]);
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
    expect(made.text).toBe("ok");

    // create returns "ok" now, so look the new subtask up by task.
    const rows = await db
      .select({ id: subtasksTable.id, status: subtasksTable.status })
      .from(subtasksTable)
      .where(eq(subtasksTable.taskId, taskId))
      .orderBy(subtasksTable.order);
    const subtaskId = rows.at(-1)!.id;
    expect(rows.at(-1)!.status).toBe("todo");

    // status + notes in one call (merged tool)
    const res = await invokeTool(updateSubtaskWorkerTool, {
      subtaskId,
      status: "done",
      notes: "wait on spec",
    });
    expect(res.result.isError).toBe(false);
    expect(res.text).toBe("ok");

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
