import type { SubtasksRow } from "../../types.ts";
import { StatusBadge } from "./status-badge.tsx";

export function SubtaskCard({ subtask }: { subtask: SubtasksRow }) {
  return (
    <details className="subtask" data-fold={`subtask:${subtask.id}`}>
      <summary>
        <span className="subtask-summary">
          <span className="order">#{subtask.order}</span>
          <span className="subtask-title">{subtask.title}</span>
          <StatusBadge status={subtask.status} />
        </span>
      </summary>
      <div className="subtask-body">
        <h4>Description</h4>
        <p className="pre-wrap">{subtask.description}</p>
        {subtask.schema ? (
          <>
            <h4>Schema</h4>
            <pre>
              <code>{subtask.schema}</code>
            </pre>
          </>
        ) : null}
        <h4>Result</h4>
        {subtask.result ? (
          <pre>
            <code>{subtask.result}</code>
          </pre>
        ) : (
          <p className="muted">No result yet.</p>
        )}
        <small className="muted">
          ID: <code>{subtask.id}</code>
        </small>
      </div>
    </details>
  );
}
