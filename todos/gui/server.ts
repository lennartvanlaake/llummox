import { fileURLToPath } from "node:url";
import { setupDatabase } from "../db.ts";
import { createApp } from "./app.ts";
import { createDbWatcher, createEventHub } from "./events.ts";
import { renderBoard } from "./render.ts";

const defaultDbPath = fileURLToPath(
  new URL("../../todos.db", import.meta.url),
);
const dbPath =
  process.env.TODO_DB ?? process.env.TODO_GUI_DB ?? defaultDbPath;
const port = Number(process.env.PORT ?? 3000);

setupDatabase(dbPath);

const hub = createEventHub();
let running = false;
let dirty = false;

// ponytail: one render in flight; rerun if a write lands during the broadcast
// so a change made mid-render is never dropped.
async function refresh() {
  if (running) {
    dirty = true;
    return;
  }
  running = true;
  try {
    do {
      dirty = false;
      if (hub.size === 0) continue;
      const board = await renderBoard();
      await hub.broadcast(board);
    } while (dirty);
  } catch (error) {
    console.error("Failed to refresh todos board:", error);
  } finally {
    running = false;
  }
}

const watcher = createDbWatcher(dbPath, () => {
  void refresh();
});

const server = Bun.serve({
  port,
  fetch: createApp(hub).fetch,
});

console.log(
  `Todos GUI on http://localhost:${server.port} (db: ${dbPath})`,
);

function shutdown() {
  watcher.close();
  server.stop(true);
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
