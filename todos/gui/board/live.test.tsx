import { beforeEach, describe, expect, it } from "bun:test";
import {
  createSubtask,
  createTask,
  deleteTask,
  updateTask,
} from "../../crud.ts";
import { all, setupDatabase } from "../../db.ts";
import type { TaskEventRow } from "../../types.ts";
import { renderTaskEvents } from "./live.tsx";

function events() {
  return all<TaskEventRow>("task-events/list.sql");
}

describe("task event rendering", () => {
  beforeEach(() => {
    setupDatabase(":memory:");
  });

  it("renders a new task as an OOB append", async () => {
    const task = await createTask({ prompt: "T" });
    const html = renderTaskEvents(events());

    expect(html).toContain(`id="task-${task.id}"`);
    expect(html).toContain('hx-swap-oob="afterbegin:#board"');
    expect(html).toContain('id="board-empty"');
  });

  it("renders a task update as an OOB replacement", async () => {
    const task = await createTask({ prompt: "T" });
    await updateTask(task.id, { status: "in-progress" });

    const html = renderTaskEvents(events());

    expect(html).toContain(`id="task-${task.id}"`);
    expect(html).toContain('hx-swap-oob="outerHTML"');
  });

  it("renders a task deletion and refreshes the empty state", async () => {
    const task = await createTask({ prompt: "T" });
    await deleteTask(task.id);

    const html = renderTaskEvents(events());

    expect(html).toContain(`id="task-${task.id}"`);
    expect(html).toContain('hx-swap-oob="delete"');
    expect(html).toContain('id="board-empty"');
  });

  it("coalesces multiple events for one task", async () => {
    const task = await createTask({ prompt: "T" });
    await createSubtask({
      taskId: task.id,
      title: "S",
      description: "d",
    });

    const html = renderTaskEvents(events());

    expect(html.match(new RegExp(`id="task-${task.id}"`, "g"))).toHaveLength(
      1,
    );
    expect(html).toContain('hx-swap-oob="afterbegin:#board"');
  });
});
