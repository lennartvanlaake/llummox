import { fileURLToPath } from "node:url";
import { setupDatabase } from "../db.ts";
import { createApp } from "./app.tsx";
import type { TaskEvent } from "./board/events.ts";
import { watchTaskEvents } from "./board/events.ts";
import { renderTaskEvents } from "./board/live.tsx";
import { createClients } from "./utilities/events.ts";

const dbPath =
  process.env.TODO_DB ??
  process.env.TODO_GUI_DB ??
  fileURLToPath(new URL("../../todos.db", import.meta.url));
const port = Number(process.env.PORT ?? 3000);

setupDatabase(dbPath);
const clients = createClients();

let refreshQueue = Promise.resolve();
function refresh(events: TaskEvent[]) {
  refreshQueue = refreshQueue
    .then(async () => {
      if (clients.size === 0) return;
      const html = renderTaskEvents(events);
      if (!html) return;
      await clients.push("task", html, events.at(-1)?.id);
    })
    .catch((error) => {
      console.error("Failed to push task events:", error);
    });
}

const stopWatching = watchTaskEvents(dbPath, refresh);
const server = Bun.serve({ port, fetch: createApp(clients).fetch });

console.log(
  `Todos GUI on http://localhost:${server.port} (db: ${dbPath})`,
);

function shutdown() {
  stopWatching();
  server.stop(true);
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
