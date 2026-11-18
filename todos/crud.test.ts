import { setupDatabase } from "./db";
import * as crud from "./crud";
import { describe, it, expect } from "bun:test";

describe("crud tasks", () => {
  it("create -> get -> list -> update -> delete with cascade", () => {
    setupDatabase(":memory:");

    const created = crud.createTask({
      prompt: "T1",
    });
    expect(created.id).toBeTruthy();

    const fetched = crud.getTask(created.id);
    expect(fetched?.prompt).toBe("T1");

    const all = crud.listTasks();
    expect(all.map((t) => t.id)).toContain(created.id);

    const updated = crud.updateTask(created.id, {
      status: "in-progress",
    });
    expect(updated?.status).toBe("in-progress");
    expect(crud.deleteTask(created.id)).toBe(true);
    expect(crud.getTask(created.id)).toBeUndefined();
  });
});

describe("crud subtasks", () => {
  it("create -> list -> update -> delete", () => {
    setupDatabase(":memory:");
    const task = crud.createTask({
      prompt: "T",
    });

    const st = crud.createSubtask({
      title: "S2",
      description: "d",
      schema: "type Schema = { a: string }",
      taskId: task.id,
    });
    expect(st.id).toBeTruthy();
    // ponytail: auto-assigned next per-task order (max+1) when omitted.
    expect(st.order).toBe(0);

    const all = crud.listSubtasks(task.id);
    expect(all.map((s) => s.id)).toContain(st.id);

    // explicit order is honored and re-seeds the per-task sequence.
    const st2 = crud.createSubtask({
      title: "S1",
      description: "d",
      taskId: task.id,
    });
    expect(st2.order).toBe(1);
    expect(
      crud.createSubtask({ title: "S3", description: "d", taskId: task.id })
        .order,
    ).toBe(2);

    const updated = crud.updateSubtask(st.id, { status: "blocked" });
    expect(updated?.status).toBe("blocked");

    // getNextSubtask returns the lowest order first regardless of insertion.
    expect(crud.getNextSubtask(task.id)?.id).toBe(st2.id);

    expect(crud.deleteSubtask(st.id)).toBe(true);
    expect(crud.listSubtasks(task.id)).toHaveLength(2);
    expect(crud.deleteSubtask(st.id)).toBe(false);
  });

  it("rejects an invalid TS schema", () => {
    setupDatabase(":memory:");
    const task = crud.createTask({
      prompt: "T",
    });

    expect(() =>
      crud.createSubtask({
        title: "S2",
        description: "d",
        schema: "foobar",
        taskId: task.id,
      }),
    ).toThrow("Schema must be defined");
  });
});
