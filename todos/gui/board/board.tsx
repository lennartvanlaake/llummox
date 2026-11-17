import type { TaskView } from "./model.ts";
import { TaskCard } from "./task-card.tsx";

export function BoardEmpty({
  hidden,
  oob,
}: {
  hidden: boolean;
  oob?: string;
}) {
  return (
    <p
      id="board-empty"
      className="empty"
      hidden={hidden}
      hx-swap-oob={oob}
    >
      No tasks yet.
    </p>
  );
}

export function Board({ tasks }: { tasks: TaskView[] }) {
  return (
    <>
      <BoardEmpty hidden={tasks.length > 0} />
      <div className="board">
        {tasks.map((task) => (
          <TaskCard key={task.task.id} task={task} />
        ))}
      </div>
    </>
  );
}
