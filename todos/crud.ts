import { randomUUIDv7 } from "bun";
import { parseTsSchema } from "../shared/agent/schema.ts";
import { TaskStatus } from "./constants.ts";
import { all, get } from "./db.ts";
import type {
  NewSubtask,
  NewTask,
  SubtaskUpdate,
  SubtasksRow,
  TaskUpdate,
  TasksRow,
} from "./types.ts";

type TaskDbRow = Omit<TasksRow, "data"> & { data: string | null };

function parseTask(row: TaskDbRow): TasksRow {
  return { ...row, data: row.data ? JSON.parse(row.data) : {} };
}

//
// ---- Tasks ----
//
export function getTask(id: string) {
  const row = get<TaskDbRow>("tasks/get.sql", { id });
  return row ? parseTask(row) : undefined;
}

export function createTask(values: NewTask) {
  const row = get<TaskDbRow>("tasks/create.sql", {
    id: randomUUIDv7(),
    status: TaskStatus.todo,
    prompt: values.prompt,
    data: JSON.stringify(values.data ?? {}),
    notes: values.notes ?? null,
  })!;
  return parseTask(row);
}

export function updateTask(id: string, input: TaskUpdate) {
  const task = getTask(id);
  if (!task) {
    throw new Error(`Task with id ${id} does not exist`);
  }
  const merged = { ...task, ...input };
  const row = get<TaskDbRow>("tasks/update.sql", {
    id,
    status: merged.status,
    prompt: merged.prompt,
    data: JSON.stringify(merged.data ?? {}),
    notes: merged.notes ?? null,
  })!;
  return parseTask(row);
}

export function listTasks(): TasksRow[] {
  return all<TaskDbRow>("tasks/list.sql").map(parseTask);
}

export function deleteTask(id: string) {
  for (const subtask of listSubtasks(id)) deleteSubtask(subtask.id);
  return get<TaskDbRow>("tasks/delete.sql", { id }) !== undefined;
}

//
// ---- Subtasks ----
//
export function getSubtask(id: string) {
  return get<SubtasksRow>("subtasks/get.sql", { id });
}

export function listSubtasks(taskId: string): SubtasksRow[] {
  return all<SubtasksRow>("subtasks/list.sql", { taskId });
}

// ponytail: all subtasks across every task in one scan.
export function getSubtasksAll() {
  return all<SubtasksRow>("subtasks/listAll.sql");
}

// ponytail: O(n) scan per update. Per-task locks if concurrency matters.
export function recomputeTaskStatus(taskId: string) {
  const subtasks = listSubtasks(taskId);
  if (subtasks.length === 0) {
    return TaskStatus.todo;
  }
  const done = subtasks.filter((s) => s.status === TaskStatus.done);
  const active = subtasks.some((s) => s.status !== TaskStatus.todo);
  // ponytail: task is done only when ALL subtasks are done; an in-progress
  // subtask keeps the task in-progress even alongside a done one.
  if (done.length === subtasks.length) return TaskStatus.done;
  if (active) return TaskStatus["in-progress"];
  return TaskStatus.todo;
}

export function getNextSubtask(taskId: string) {
  const inProgress = get<SubtasksRow>("subtasks/nextInProgress.sql", {
    taskId,
    status: TaskStatus["in-progress"],
  });
  if (inProgress) return inProgress;

  return (
    get<SubtasksRow>("subtasks/nextTodo.sql", {
      taskId,
      status: TaskStatus.todo,
    }) ?? null
  );
}

export function createSubtask(values: NewSubtask) {
  try {
    if (values.schema) {
      parseTsSchema(values.schema);
    }
  } catch (e) {
    throw new Error(
      `TS schema provided in schema is incorrect. ${(e as Error).message}`,
    );
  }

  const next = get<{ order: number }>("subtasks/nextOrder.sql", {
    taskId: values.taskId,
  })!;
  return get<SubtasksRow>("subtasks/create.sql", {
    id: randomUUIDv7(),
    status: TaskStatus.todo,
    taskId: values.taskId,
    title: values.title,
    description: values.description,
    schema: values.schema ?? null,
    result: values.result ?? null,
    order: values.order ?? next.order,
  })!;
}

export function updateSubtask(id: string, input: SubtaskUpdate) {
  const subtask = getSubtask(id);
  if (!subtask) {
    throw new Error(`No subtask with id ${id}`);
  }
  const merged = { ...subtask, ...input };
  const updated = get<SubtasksRow>("subtasks/update.sql", {
    id,
    status: merged.status,
    title: merged.title,
    description: merged.description,
    schema: merged.schema ?? null,
    result: merged.result ?? null,
    order: merged.order,
  })!;

  const parent = getTask(subtask.taskId);
  if (parent) {
    updateTask(parent.id, { status: recomputeTaskStatus(parent.id) });
  }
  return updated;
}

export function deleteSubtask(id: string) {
  return get<SubtasksRow>("subtasks/delete.sql", { id }) !== undefined;
}
