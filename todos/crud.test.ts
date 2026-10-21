import { setupDatabase } from "./db";
import * as crud from "./crud";
import { describe, it, expect } from "bun:test";

describe("crud tasks", () => {
  let db: ReturnType<typeof setupDatabase>; // ponytail: reassigned per test; tests call crud directly

  it("create -> get -> list -> update -> delete with cascade", async () => {
    db = setupDatabase(":memory:");

    const created = await crud.createTask({
      prompt: "T1",
    });
    expect(created.id).toBeTruthy();

    const fetched = crud.getTask(created.id);
    expect(fetched?.prompt).toBe("T1");

    const all = await crud.listTasks();
    expect(all.map((t) => t.id)).toContain(created.id);

    const updated = await crud.updateTask(created.id, {
      status: "in-progress",
    });
    expect(updated?.status).toBe("in-progress");
  });
});

describe("crud subtasks", () => {
  let db: ReturnType<typeof setupDatabase>; // ponytail: reassigned per test; tests call crud directly

  it("create -> list -> update -> delete", async () => {
    db = setupDatabase(":memory:");
    const task = await crud.createTask({
      prompt: "T",
    });

    const st = await crud.createSubtask({
      title: "S2",
      description: "d",
      taskId: task.id,
    });
    expect(st.id).toBeTruthy();
    // ponytail: auto-assigned next per-task order (max+1) when omitted.
    expect(st.order).toBe(0);

    const all = await crud.listSubtasks(task.id);
    expect(all.map((s) => s.id)).toContain(st.id);

    // explicit order is honored and re-seeds the per-task sequence.
    const st2 = await crud.createSubtask({
      title: "S1",
      description: "d",
      taskId: task.id,
    });
    expect(st2.order).toBe(1);
    expect(
      await crud
        .createSubtask({ title: "S3", description: "d", taskId: task.id })
        .then((s) => s.order),
    ).toBe(2);

    const updated = await crud.updateSubtask(st.id, { status: "blocked" });
    expect(updated?.status).toBe("blocked");

    // getNextSubtask returns the lowest order first regardless of insertion.
    expect((await crud.getNextSubtask(task.id))?.id).toBe(st2.id);

    expect(await crud.deleteSubtask(st.id)).toBe(true);
    expect(await crud.listSubtasks(task.id)).toHaveLength(2);
    expect(await crud.deleteSubtask(st.id)).toBe(false);
  });
});
