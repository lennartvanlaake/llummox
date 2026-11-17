import { renderToStaticMarkup } from "react-dom/server";
import { BoardEmpty } from "./board.tsx";
import type { TaskEvent } from "./events.ts";
import { hasTasks, loadTask } from "./model.ts";
import { TaskCard, TaskDelete } from "./task-card.tsx";

type Change = {
  taskId: string;
  created: boolean;
  deleted: boolean;
};

function coalesce(events: TaskEvent[]): Change[] {
  const changes = new Map<string, Change>();
  for (const event of events) {
    const change = changes.get(event.taskId) ?? {
      taskId: event.taskId,
      created: false,
      deleted: false,
    };
    if (event.type === "task.created") change.created = true;
    if (event.type === "task.deleted") change.deleted = true;
    changes.set(event.taskId, change);
  }
  return [...changes.values()];
}

export function renderTaskEvents(events: TaskEvent[]): string {
  const changes = coalesce(events);
  let html = "";
  let emptyChanged = false;

  for (const change of changes) {
    if (change.deleted) {
      html += renderToStaticMarkup(<TaskDelete id={change.taskId} />);
      emptyChanged = true;
      continue;
    }

    if (change.created) emptyChanged = true;
    const task = loadTask(change.taskId);
    if (!task) continue;

    const oob = change.created ? "afterbegin:#board" : "outerHTML";
    html += renderToStaticMarkup(<TaskCard task={task} oob={oob} />);
  }

  if (emptyChanged) {
    html += renderToStaticMarkup(
      <BoardEmpty hidden={hasTasks()} oob="outerHTML" />,
    );
  }

  return html;
}
