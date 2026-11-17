import { describe, expect, it } from "bun:test";
import { getSubtasksAll, listTasks } from "../../crud.ts";
import { setupDatabase } from "../../db.ts";
import { seedFixtures } from "./run.ts";

describe("fixture seed", () => {
  it("creates varied lanes and subtasks", async () => {
    setupDatabase(":memory:");

    const counts = await seedFixtures();
    const tasks = listTasks();
    const subtasks = getSubtasksAll();

    expect(counts).toEqual({ tasks: 7, subtasks: 20 });
    expect(tasks).toHaveLength(7);
    expect(subtasks).toHaveLength(20);

    expect(new Set(tasks.map((task) => task.status))).toEqual(
      new Set(["todo", "in-progress", "blocked", "done"]),
    );
    expect(new Set(subtasks.map((subtask) => subtask.status))).toEqual(
      new Set(["todo", "in-progress", "blocked", "done"]),
    );

    expect(
      tasks.some(
        (task) =>
          !subtasks.some((subtask) => subtask.taskId === task.id),
      ),
    ).toBe(true);
    expect(subtasks.some((subtask) => subtask.schema)).toBe(true);
    expect(subtasks.some((subtask) => subtask.result)).toBe(true);
    expect(tasks.some((task) => task.notes)).toBe(true);
    expect(tasks.some((task) => task.data != null)).toBe(true);
  });
});
