import { test, expect, describe, beforeAll } from "bun:test";
import { eq } from "drizzle-orm";
import { setupDatabase, db } from "./db";
import { subtasksTable } from "./schema";
import { createSubtask, createTask, getTask } from "./crud";
import { logger } from "../shared/utils";
import { invokeTool } from "../shared/testing";
import { renderTodoManagerTools, renderTodoWorkerTools } from "./tools";

const ts = String.raw
export const resultOnly = ts`
    type Schema = {
	result: string
    }
  `

let managerTools: ReturnType<typeof renderTodoManagerTools>;
let workerTools: ReturnType<typeof renderTodoWorkerTools>;
let task: ReturnType<typeof createTask>;
let subtask: ReturnType<typeof createSubtask>;
let taskId: string;
beforeAll(async () => {
  setupDatabase(":memory:");
  task = await createTask({ prompt: "T" });
  taskId = task.id;
  subtask = await createSubtask({ taskId: taskId, title: "bla", description: "blup" })
  managerTools = renderTodoManagerTools(taskId, resultOnly)
  workerTools = renderTodoWorkerTools(subtask.id, resultOnly)
});


test("update_task updates status and notes (prompt is static, set out of band)", async () => {
  const task = await createTask({ prompt: "T" });
  const taskId = task.id;

  const res = await invokeTool(managerTools.updateTaskTool, {
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

  const res = await invokeTool(managerTools.updateTaskTool, {
    notes: "",
  });
  expect(res.result.isError).toBe(false);

  const fetched = getTask(taskId)!;
  expect(fetched.notes).toBe("");
});

test("get_task_data returns the full data object when no filter", async () => {
  const task = await createTask({ prompt: "T", data: { a: 1, b: 2 } });
  const taskId = task.id;

  const res = await invokeTool(managerTools.getTaskData, { taskId });
  expect(res.result.isError).toBe(false);
  expect(res.text).toContain("1");
  expect(res.text).toContain("2");
});

test("get_task_data applies a jq-style filter", async () => {

  const res = await invokeTool(managerTools.getTaskData, {
    filter: '.a | output { "b": .b }',
  });
  expect(res.result.isError).toBe(false);
  expect(res.text).toContain("c");
});

test("updates a nested field at a path", async () => {

  const res = await invokeTool(managerTools.getTaskData, {
    jsCommand: "data.friends[1] = 'Andy'",
  });
  expect(res.result.isError).toBe(false);

  const fetched = getTask(taskId)!;
  expect((fetched.data as any).friends).toEqual(["Tom", "Andy"]);
});

test("create_subtask then update_subtask sets status + notes together", async () => {
  const made = (await invokeTool(managerTools.createSubtaskTool, {
    title: "Write agenda",
    description: "Draft the meeting agenda",
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
  const res = await invokeTool(workerTools.updateSubtaskWorkerTool, {
    status: "done",
  });
  expect(res.result.isError).toBe(false);
  expect(res.text).toBe("ok");

  const fetched = await db
    .select()
    .from(subtasksTable)
    .where(eq(subtasksTable.id, subtaskId));

  expect(fetched[0]!.status).toBe("done");
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
