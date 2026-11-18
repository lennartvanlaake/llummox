import { describe, expect, it } from "bun:test";
import type { SubtasksRow, TasksRow } from "../types.ts";
import { buildTaskViews, statusLabel } from "./board/model.ts";

function task(
  id: string,
  prompt: string,
  status = "todo",
): TasksRow {
  return { id, status, prompt, data: {}, notes: null, createdAt: 0 };
}

function subtask(
  id: string,
  taskId: string,
  status: string,
  order: number,
  title = id,
): SubtasksRow {
  return {
    id,
    status,
    taskId,
    title,
    description: `${title} description`,
    schema: null,
    result: null,
    createdAt: 0,
    order,
  };
}

describe("buildTaskViews", () => {
  it("groups subtasks by status lane, preserves order and counts done", () => {
    const tasks = [task("0001", "Task one")];
    const subtasks = [
      subtask("s3", "0001", "done", 2),
      subtask("s1", "0001", "todo", 0),
      subtask("s2", "0001", "in-progress", 1),
      subtask("s4", "0001", "done", 3),
    ];

    const [taskView] = buildTaskViews(tasks, subtasks);
    expect(taskView?.task.prompt).toBe("Task one");
    expect(taskView?.total).toBe(4);
    expect(taskView?.done).toBe(2);
    expect(taskView?.lanes.map((lane) => lane.status)).toEqual([
      "todo",
      "in-progress",
      "blocked",
      "done",
    ]);
    expect(taskView?.lanes[0]?.subtasks.map((item) => item.id)).toEqual(["s1"]);
    expect(taskView?.lanes[1]?.subtasks.map((item) => item.id)).toEqual(["s2"]);
    expect(taskView?.lanes[2]?.subtasks).toHaveLength(0);
    expect(taskView?.lanes[3]?.subtasks.map((item) => item.id)).toEqual([
      "s3",
      "s4",
    ]);
  });

  it("sorts tasks newest first by UUIDv7 id", () => {
    const views = buildTaskViews(
      [task("0001", "older"), task("0003", "newer"), task("0002", "middle")],
      [],
    );
    expect(views.map((view) => view.task.prompt)).toEqual([
      "newer",
      "middle",
      "older",
    ]);
  });

  it("leaves a task with no subtasks as an empty task view", () => {
    const [taskView] = buildTaskViews([task("0001", "Task")], []);
    expect(taskView?.total).toBe(0);
    expect(taskView?.done).toBe(0);
    expect(
      taskView?.lanes.every((lane) => lane.subtasks.length === 0),
    ).toBe(true);
  });

  it("labels known and unknown statuses", () => {
    expect(statusLabel("in-progress")).toBe("In progress");
    expect(statusLabel("blocked")).toBe("Blocked");
    expect(statusLabel("mystery")).toBe("mystery");
  });
});
