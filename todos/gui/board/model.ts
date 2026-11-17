import type { TaskStatusType } from "../../constants.ts";
import {
  getSubtasksAll,
  getTask,
  listSubtasks,
  listTasks,
} from "../../crud.ts";
import type { SubtasksRow, TasksRow } from "../../schema.ts";

export type Lane = {
  status: TaskStatusType;
  label: string;
  subtasks: SubtasksRow[];
};

export type TaskView = {
  task: TasksRow;
  lanes: Lane[];
  total: number;
  done: number;
};

const STATUS_LABELS: Record<TaskStatusType, string> = {
  todo: "To do",
  "in-progress": "In progress",
  blocked: "Blocked",
  done: "Done",
};

const LANE_ORDER: readonly TaskStatusType[] = [
  "todo",
  "in-progress",
  "blocked",
  "done",
];

export function statusLabel(status: string): string {
  return STATUS_LABELS[status as TaskStatusType] ?? status;
}

export function buildTaskView(
  task: TasksRow,
  subtasks: SubtasksRow[],
): TaskView {
  const own = [...subtasks].sort((a, b) => a.order - b.order);
  return {
    task,
    lanes: LANE_ORDER.map((status) => ({
      status,
      label: STATUS_LABELS[status] ?? status,
      subtasks: own.filter((subtask) => subtask.status === status),
    })),
    total: own.length,
    done: own.filter((subtask) => subtask.status === "done").length,
  };
}

export function buildTaskViews(
  tasks: TasksRow[],
  subtasks: SubtasksRow[],
): TaskView[] {
  const byTask = new Map<string, SubtasksRow[]>();
  for (const subtask of subtasks) {
    const list = byTask.get(subtask.taskId);
    if (list) list.push(subtask);
    else byTask.set(subtask.taskId, [subtask]);
  }

  // ponytail: UUIDv7 ids are time-ordered, so newest tasks sort first without
  // a second query; use createdAt if ids ever stop being UUIDv7.
  return [...tasks]
    .sort((a, b) => b.id.localeCompare(a.id))
    .map((task) => buildTaskView(task, byTask.get(task.id) ?? []));
}

export function loadTasks(): TaskView[] {
  return buildTaskViews(listTasks(), getSubtasksAll());
}

export function loadTask(taskId: string): TaskView | undefined {
  const task = getTask(taskId);
  if (!task) return undefined;
  return buildTaskView(task, listSubtasks(taskId));
}

export function hasTasks(): boolean {
  return listTasks().length > 0;
}
