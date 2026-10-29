import { eq, and, max } from "drizzle-orm";
import { Type } from "@earendil-works/pi-ai";
import {
  tasksTable,
  subtasksTable,
  type SubtasksRow,
  type TasksInsert,
  type SubtasksInsert,
} from "./schema";
import { db } from "./db";
import { randomUUIDv7 } from "bun";
import { TaskStatus } from "./constants";
import { compileSchema } from "json-schema-library";
import { logger } from "../shared/utils";

//
// ---- Tasks ----
//
export function getTask(id: string) {
  return db.select().from(tasksTable).where(eq(tasksTable.id, id)).get();
}

export async function createTask(values: Omit<TasksInsert, "id" | "status">) {
  const insert = await db
    .insert(tasksTable)
    .values({ id: randomUUIDv7(), status: TaskStatus["todo"], ...values })
    .returning();
  return insert.at(0)!;
}

export async function updateTask(id: string, input: Partial<TasksInsert>) {
  const task = getTask(id);
  if (!task) {
    throw new Error(`Task with id ${id} does not exist`);
  }
  const merged = { ...task, ...input };
  return (
    await db
      .update(tasksTable)
      .set(merged)
      .where(eq(tasksTable.id, id))
      .returning()
  ).at(0)!;
}

export function listTasks() {
  return db.select().from(tasksTable);
}

export async function deleteTask(id: string) {
  const subtaskIds = (
    await db
      .select({ id: subtasksTable.id })
      .from(subtasksTable)
      .where(eq(subtasksTable.taskId, id))
  ).map((r) => r.id);
  for (const sid of subtaskIds) await deleteSubtask(sid);
  const row = await db
    .delete(tasksTable)
    .where(eq(tasksTable.id, id))
    .returning();
  return row.length > 0;
}
//
// ---- Subtasks ----
//
export function getSubtask(subtaskId: string) {
  return db
    .select()
    .from(subtasksTable)
    .where(eq(subtasksTable.id, subtaskId))
    .get();
}

export function listSubtasks(taskId: string): SubtasksRow[] {
  return db
    .select()
    .from(subtasksTable)
    .where(eq(subtasksTable.taskId, taskId))
    .orderBy(subtasksTable.order)
    .all();
}

// ponytail: all subtasks across every task in one scan.
export function getSubtasksAll() {
  return db.select().from(subtasksTable).all();
}

// ponytail: O(n) scan per update, global lock. Per-task locks if concurrency matters.
export async function recomputeTaskStatus(taskId: string) {
  const subtasks = await listSubtasks(taskId);
  if (subtasks.length === 0) {
    return TaskStatus["todo"];
  }
  const done = subtasks.filter((s) => s.status === TaskStatus["done"]);
  const active = subtasks.some((s) => s.status !== TaskStatus["todo"]);
  // ponytail: task is done only when ALL subtasks are done; an in-progress
  // subtask keeps the task in-progress even alongside a done one.
  if (done.length === subtasks.length) return TaskStatus["done"];
  else if (active) return TaskStatus["in-progress"];
  else return TaskStatus["todo"];
}

export function getNextSubtask(taskId: string) {
  const progress = db
    .select()
    .from(subtasksTable)
    .where(
      and(
        eq(subtasksTable.status, TaskStatus["in-progress"]),
        eq(subtasksTable.taskId, taskId),
      ),
    )
    .get();
  if (progress) {
    return progress;
  }
  const todo = db
    .select()
    .from(subtasksTable)
    .where(
      and(
        eq(subtasksTable.status, TaskStatus["todo"]),
        eq(subtasksTable.taskId, taskId),
      ),
    )
    .orderBy(subtasksTable.order)
    .limit(1)
    .get();

  if (todo) {
    return todo;
  }
  return null;
}

export async function createSubtask(
  values: Omit<SubtasksInsert, "id" | "status">,
) {
  try {
    if (values.schema) {
      const schemaResult = Type.Script(values.schema)
      if (!schemaResult.hasOwnProperty("Schema")) {
        throw new Error("Schema must be defied as ```type Schema = ...```. Found " + values.schema)
      }
      logger.info(schemaResult)
    }
  } catch (e) {
    throw new Error(`TS schema provided in schema is incorrect. ${(e as any).message}`)
  }
  const lastMax = db
    .select({ value: max(subtasksTable.order) })
    .from(subtasksTable)
    .where(eq(subtasksTable.taskId, values.taskId))
    .get()?.value;
  const order = lastMax === null || lastMax === undefined ? 0 : lastMax! + 1;
  const insert = await db
    .insert(subtasksTable)
    .values({
      id: randomUUIDv7(),
      status: TaskStatus["todo"],
      order,
      ...values,
    })
    .returning();
  return insert.at(0)!;
}

export async function updateSubtask(
  id: string,
  input: Partial<SubtasksInsert>,
) {
  const subtask = getSubtask(id);
  if (!subtask) {
    throw new Error(`No subtask with id ${id}`);
  }
  const updated = (await db
    .update(subtasksTable)
    .set(input)
    .where(eq(subtasksTable.id, id))
    .returning()) as SubtasksRow[];
  const parent = getTask(subtask.taskId!);
  if (parent) {
    await updateTask(parent.id, {
      status: await recomputeTaskStatus(parent.id),
    });
  }
  return updated.at(0)!;
}

export async function deleteSubtask(id: string) {
  const row = (await db
    .delete(subtasksTable)
    .where(eq(subtasksTable.id, id))
    .returning()) as SubtasksRow[];
  return row.length > 0;
}
