import Database from "bun:sqlite";
import { readQuery } from "../../db.ts";
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
  // This connection polls only, but keep FK behavior consistent with the app.
  db.run("PRAGMA foreign_keys = ON");
  const latest = db
    .query(readQuery("task-events/latest.sql"))
    .get() as { id: number };
  let lastId = latest.id;

  const timer = setInterval(() => {
    try {
      const events = db
        .query(readQuery("task-events/since.sql"))
        .all({ id: lastId }) as TaskEvent[];
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
