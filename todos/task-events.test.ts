import { beforeEach, describe, expect, it } from "bun:test";
import * as crud from "./crud.ts";
import { db, setupDatabase } from "./db.ts";
import { taskEventsTable } from "./schema.ts";

function events() {
  return db.select().from(taskEventsTable).all();
}

describe("task events", () => {
  beforeEach(() => {
    setupDatabase(":memory:");
  });

  it("records task and subtask mutations", async () => {
    const task = await crud.createTask({ prompt: "T" });
    expect(events().map((event) => event.type)).toEqual(["task.created"]);

    const subtask = await crud.createSubtask({
      taskId: task.id,
      title: "S",
      description: "d",
    });
    expect(events().at(-1)).toMatchObject({
      taskId: task.id,
      type: "subtask.created",
    });

    await crud.updateSubtask(subtask.id, { status: "done" });
    expect(
      events().some(
        (event) =>
          event.type === "subtask.updated" && event.taskId === task.id,
      ),
    ).toBe(true);

    await crud.deleteSubtask(subtask.id);
    expect(events().at(-1)).toMatchObject({
      taskId: task.id,
      type: "subtask.deleted",
    });

    await crud.deleteTask(task.id);
    expect(events().at(-1)).toMatchObject({
      taskId: task.id,
      type: "task.deleted",
    });
  });

  it("records task updates", async () => {
    const task = await crud.createTask({ prompt: "T" });
    await crud.updateTask(task.id, { status: "in-progress" });
    expect(events().at(-1)?.type).toBe("task.updated");
  });
});
