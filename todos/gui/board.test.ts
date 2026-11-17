import { describe, expect, it } from "bun:test";
import type { SubtasksRow, TasksRow } from "../schema.ts";
import { buildLanes, statusLabel } from "./board.ts";

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

describe("buildLanes", () => {
  it("groups subtasks by status, preserves order and counts done", () => {
    const tasks = [task("0001", "Task one")];
    const subtasks = [
      subtask("s3", "0001", "done", 2),
      subtask("s1", "0001", "todo", 0),
      subtask("s2", "0001", "in-progress", 1),
      subtask("s4", "0001", "done", 3),
    ];

    const [lane] = buildLanes(tasks, subtasks);
    expect(lane?.task.prompt).toBe("Task one");
    expect(lane?.total).toBe(4);
    expect(lane?.done).toBe(2);
    expect(lane?.columns.map((column) => column.status)).toEqual([
      "todo",
      "in-progress",
      "blocked",
      "done",
    ]);
    expect(lane?.columns[0]?.subtasks.map((item) => item.id)).toEqual(["s1"]);
    expect(lane?.columns[1]?.subtasks.map((item) => item.id)).toEqual(["s2"]);
    expect(lane?.columns[2]?.subtasks).toHaveLength(0);
    expect(lane?.columns[3]?.subtasks.map((item) => item.id)).toEqual([
      "s3",
      "s4",
    ]);
  });

  it("sorts tasks newest first by UUIDv7 id", () => {
    const lanes = buildLanes(
      [task("0001", "older"), task("0003", "newer"), task("0002", "middle")],
      [],
    );
    expect(lanes.map((lane) => lane.task.prompt)).toEqual([
      "newer",
      "middle",
      "older",
    ]);
  });

  it("keeps unknown statuses visible in the todo column", () => {
    const [lane] = buildLanes(
      [task("0001", "Task")],
      [subtask("s1", "0001", "mystery", 0)],
    );
    expect(lane?.columns[0]?.subtasks.map((item) => item.id)).toEqual(["s1"]);
  });

  it("leaves a task with no subtasks as an empty lane", () => {
    const [lane] = buildLanes([task("0001", "Task")], []);
    expect(lane?.total).toBe(0);
    expect(lane?.done).toBe(0);
    expect(lane?.columns.every((column) => column.subtasks.length === 0)).toBe(
      true,
    );
  });

  it("labels known and unknown statuses", () => {
    expect(statusLabel("in-progress")).toBe("In progress");
    expect(statusLabel("blocked")).toBe("Blocked");
    expect(statusLabel("mystery")).toBe("mystery");
  });
});
