import type { TasksRow } from "../../types.ts";
import { statusLabel } from "./model.ts";

export function TaskInfo({ task }: { task: TasksRow }) {
  const data =
    task.data == null ? "" : (JSON.stringify(task.data, null, 2) ?? "");

  return (
    <details className="info" data-fold={`task-info:${task.id}`}>
      <summary>Task info</summary>
      <div className="info-body">
        <dl className="meta">
          <dt>ID</dt>
          <dd>
            <code>{task.id}</code>
          </dd>
          <dt>Status</dt>
          <dd>{statusLabel(task.status)}</dd>
          <dt>Created</dt>
          <dd>{String(task.createdAt)}</dd>
        </dl>
        {task.notes ? (
          <>
            <h4>Notes</h4>
            <p className="pre-wrap">{task.notes}</p>
          </>
        ) : null}
        {data ? (
          <>
            <h4>Data</h4>
            <pre>
              <code>{data}</code>
            </pre>
          </>
        ) : null}
      </div>
    </details>
  );
}
