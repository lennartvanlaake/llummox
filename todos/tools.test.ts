import { beforeAll, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { setupDatabase, db } from "./db";
import { subtasksTable } from "./schema";
import { createTask, getTask } from "./crud";
import { invokeTool } from "../shared/testing";
import {
  renderTodoManagerTools,
  renderTodoWorkerTools,
} from "./tools";

const ts = String.raw;
const resultOnly = ts`
  type Schema = {
    result: string
  }
`;

beforeAll(() => {
  setupDatabase(":memory:");
});

describe("todo manager tools", () => {
  test("update_task updates status and notes", async () => {
    const task = await createTask({ prompt: "T" });
    const tools = renderTodoManagerTools(task.id, resultOnly);

    const res = await invokeTool(tools.updateTaskTool, {
      status: "done",
      notes: "needs design review",
    });
    expect(res.result.isError).toBe(false);

    const fetched = getTask(task.id)!;
    expect(fetched.prompt).toBe("T");
    expect(fetched.status).toBe("done");
    expect(fetched.notes).toBe("needs design review");
  });

  test("update_task clears notes given empty string", async () => {
    const task = await createTask({ prompt: "T", notes: "x" });
    const tools = renderTodoManagerTools(task.id, resultOnly);

    const res = await invokeTool(tools.updateTaskTool, { notes: "" });
    expect(res.result.isError).toBe(false);
    expect(getTask(task.id)!.notes).toBe("");
  });

  test("get_task_data returns the full data object", async () => {
    const task = await createTask({
      prompt: "T",
      data: { a: 1, b: 2 },
    });
    const tools = renderTodoManagerTools(task.id, resultOnly);

    const res = await invokeTool(tools.getTaskData, {});
    expect(res.result.isError).toBe(false);
    expect(res.text).toContain("1");
    expect(res.text).toContain("2");
  });

  test("get_task_data applies a jq-style filter", async () => {
    const task = await createTask({
      prompt: "T",
      data: { a: { b: "c" } },
    });
    const tools = renderTodoManagerTools(task.id, resultOnly);

    const res = await invokeTool(tools.getTaskData, {
      filter: ".a",
    });
    expect(res.result.isError).toBe(false);
    expect(res.text).toContain("c");
  });

  test("updates a nested field with updateTaskData", async () => {
    const task = await createTask({
      prompt: "T",
      data: { friends: ["Tom", "Sue"] },
    });
    // No schema here: this test is about the jsCommand edit, not validation.
    const tools = renderTodoManagerTools(task.id);

    const res = await invokeTool(tools.updateTaskData, {
      jsCommand: "data.friends[1] = 'Andy'",
    });
    expect(res.result.isError).toBe(false);

    const fetched = getTask(task.id)!;
    expect((fetched.data as any).friends).toEqual(["Tom", "Andy"]);
  });
});

describe("todo worker tools", () => {
  test("create_subtask then worker reports its result", async () => {
    const task = await createTask({ prompt: "T" });
    const manager = renderTodoManagerTools(task.id, resultOnly);

    const made = await invokeTool(manager.createSubtaskTool, {
      title: "Write agenda",
      description: "Draft the meeting agenda",
    });
    expect(made.text).toContain("Success");

    const rows = await db
      .select({
        id: subtasksTable.id,
        status: subtasksTable.status,
      })
      .from(subtasksTable)
      .where(eq(subtasksTable.taskId, task.id))
      .orderBy(subtasksTable.order);
    const subtaskId = rows.at(-1)!.id;
    expect(rows.at(-1)!.status).toBe("todo");

    const worker = renderTodoWorkerTools(subtaskId, resultOnly);
    const res = await invokeTool(worker.workerResultTool, {
      resultJSON: JSON.stringify({ result: "done" }),
    });
    expect(res.result.isError).toBe(false);
    expect(res.text).toBe("ok");

    const fetched = await db
      .select()
      .from(subtasksTable)
      .where(eq(subtasksTable.id, subtaskId));
    expect(fetched[0]!.status).toBe("done");
  });

  test("worker result errors on a missing subtask", async () => {
    const worker = renderTodoWorkerTools("ghost", resultOnly);
    const res = await invokeTool(worker.workerResultTool, {
      resultJSON: JSON.stringify({ result: "x" }),
    });

    expect(res.result.isError).toBe(true);
    expect(res.text).toContain("ghost");
  });
});
