import { beforeEach, describe, expect, it } from "bun:test";
import { createSubtask, createTask, listSubtasks, listTasks } from "./crud";
import { all, setupDatabase } from "./db";
import type { TaskEventRow } from "./types";

describe("setupDatabase", () => {
  beforeEach(() => {
    setupDatabase(":memory:");
  });

  it("migrates and round-trips task -> subtask", () => {
    const task = createTask({ prompt: "Task A" });
    const subtask = createSubtask({
      taskId: task.id,
      title: "Sub A",
      description: "d",
    });

    expect(listTasks().map((row) => row.id)).toEqual([task.id]);
    expect(listSubtasks(task.id).map((row) => row.id)).toEqual([subtask.id]);

    const events = all<TaskEventRow>("task-events/list.sql");
    expect(events.map((event) => event.type)).toEqual([
      "task.created",
      "subtask.created",
    ]);
  });
});
