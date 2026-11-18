import type { TaskEventType } from "./constants.ts";

export type TasksRow = {
  id: string;
  status: string;
  prompt: string;
  data: unknown;
  notes: string | null;
  createdAt: number;
};

export type SubtasksRow = {
  id: string;
  status: string;
  taskId: string;
  title: string;
  description: string;
  schema: string | null;
  result: string | null;
  createdAt: number;
  order: number;
};

export type TaskEventRow = {
  id: number;
  taskId: string;
  type: TaskEventType;
  createdAt: number;
};

export type NewTask = {
  prompt: string;
  data?: unknown;
  notes?: string | null;
};

export type TaskUpdate = Partial<
  Pick<TasksRow, "status" | "prompt" | "data" | "notes">
>;

export type NewSubtask = {
  taskId: string;
  title: string;
  description: string;
  schema?: string | null;
  result?: string | null;
  order?: number;
};

export type SubtaskUpdate = Partial<
  Pick<
    SubtasksRow,
    "status" | "title" | "description" | "schema" | "result" | "order"
  >
>;
