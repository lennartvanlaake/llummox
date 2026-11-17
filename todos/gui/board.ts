import { TASK_STATUSES } from "../constants.ts";
import type { TaskStatusType } from "../constants.ts";
import { getSubtasksAll, listTasks } from "../crud.ts";
import type { SubtasksRow, TasksRow } from "../schema.ts";

export type StatusColumn = {
  status: TaskStatusType;
  label: string;
  subtasks: SubtasksRow[];
};

export type TaskLane = {
  task: TasksRow;
  columns: StatusColumn[];
  total: number;
  done: number;
};

const STATUS_LABELS: Record<TaskStatusType, string> = {
  todo: "To do",
  "in-progress": "In progress",
  blocked: "Blocked",
  done: "Done",
};

// ponytail: board order is a UI choice, separate from the storage vocabulary in
// TASK_STATUSES (which lists done before blocked).
const COLUMN_ORDER: readonly TaskStatusType[] = [
  "todo",
  "in-progress",
  "blocked",
  "done",
];

export function isTaskStatus(value: string): value is TaskStatusType {
  return (TASK_STATUSES as readonly string[]).includes(value);
}

export function statusLabel(status: string): string {
  return isTaskStatus(status) ? STATUS_LABELS[status] : status;
}

export function buildLanes(
  tasks: TasksRow[],
  subtasks: SubtasksRow[],
): TaskLane[] {
  const byTask = new Map<string, SubtasksRow[]>();
  for (const subtask of subtasks) {
    const list = byTask.get(subtask.taskId);
    if (list) list.push(subtask);
    else byTask.set(subtask.taskId, [subtask]);
  }

  // ponytail: UUIDv7 ids are time-ordered, so newest tasks sort first without
  // a second column; use createdAt if ids ever stop being UUIDv7.
  return [...tasks]
    .sort((a, b) => b.id.localeCompare(a.id))
    .map((task) => {
      const own = (byTask.get(task.id) ?? []).sort(
        (a, b) => a.order - b.order,
      );
      const columns: StatusColumn[] = COLUMN_ORDER.map((status) => ({
        status,
        label: STATUS_LABELS[status],
        subtasks: own.filter((subtask) => subtask.status === status),
      }));

      // ponytail: an out-of-vocabulary status would otherwise vanish from the
      // board; show it with the todo column until the status is constrained
      // in the database.
      const known = new Set<string>(TASK_STATUSES);
      const unknown = own.filter((subtask) => !known.has(subtask.status));
      if (unknown.length > 0) columns[0]!.subtasks.push(...unknown);

      return {
        task,
        columns,
        total: own.length,
        done: own.filter((subtask) => subtask.status === "done").length,
      };
    });
}

export function loadLanes(): TaskLane[] {
  return buildLanes(listTasks(), getSubtasksAll());
}
