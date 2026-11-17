import Database from "bun:sqlite";
import type { TaskEventType } from "../../constants.ts";

export type TaskEvent = {
  id: number;
  taskId: string;
  type: TaskEventType;
};

export function watchTaskEvents(
  dbPath: string,
  onChange: (events: TaskEvent[]) => void,
  intervalMs = 500,
) {
  const db = new Database(dbPath);
  const latest = db
    .query("SELECT COALESCE(MAX(id), 0) AS id FROM task_events")
    .get() as { id: number };
  let lastId = latest.id;

  const timer = setInterval(() => {
    try {
      const events = db
        .query(
          "SELECT id, taskId, type FROM task_events WHERE id > ? ORDER BY id",
        )
        .all(lastId) as TaskEvent[];
      if (events.length === 0) return;
      lastId = events[events.length - 1]!.id;
      onChange(events);
    } catch (error) {
      console.error("Failed to poll task events:", error);
    }
  }, intervalMs);

  return () => {
    clearInterval(timer);
    db.close();
  };
}
