import type { TaskView } from "./model.ts";
import { StatusBadge } from "./status-badge.tsx";
import { SubtaskCard } from "./subtask-card.tsx";
import { TaskInfo } from "./task-info.tsx";

export function TaskCard({
  task,
  oob,
}: {
  task: TaskView;
  oob?: string;
}) {
  const taskRow = task.task;

  return (
    <article
      id={`task-${taskRow.id}`}
      className="task card"
      data-task-id={taskRow.id}
      hx-swap-oob={oob}
    >
      <header className="task-head">
        <StatusBadge status={taskRow.status} />
        <h2 className="task-title">{taskRow.prompt}</h2>
        <span className="task-count">{`${task.done}/${task.total} done`}</span>
      </header>
      <TaskInfo task={taskRow} />
      <div className="task-lanes">
        {task.lanes.map((lane) => (
          <section
            key={lane.status}
            className="lane"
            data-status={lane.status}
          >
            <h3 className="lane-title">
              <span>{lane.label}</span>
              <span className="muted">{lane.subtasks.length}</span>
            </h3>
            {lane.subtasks.length === 0 ? (
              <p className="empty small">None</p>
            ) : (
              lane.subtasks.map((subtask) => (
                <SubtaskCard key={subtask.id} subtask={subtask} />
              ))
            )}
          </section>
        ))}
      </div>
    </article>
  );
}

export function TaskDelete({ id }: { id: string }) {
  return <div id={`task-${id}`} hx-swap-oob="delete" />;
}
