import Database from "bun:sqlite";

export type SendBoard = (html: string) => Promise<void>;

export function createEventHub() {
  const clients = new Set<SendBoard>();

  return {
    add(send: SendBoard) {
      clients.add(send);
      return () => {
        clients.delete(send);
      };
    },
    get size() {
      return clients.size;
    },
    async broadcast(html: string) {
      if (clients.size === 0) return;
      await Promise.all(
        [...clients].map(async (send) => {
          try {
            await send(html);
          } catch {
            clients.delete(send);
          }
        }),
      );
    },
  };
}

export type EventHub = ReturnType<typeof createEventHub>;

export function readDataVersion(watcher: Database): number {
  const row = watcher.query("PRAGMA data_version").get() as {
    data_version?: number;
  } | null;
  return row?.data_version ?? 0;
}

export function createChangeDetector(
  readVersion: () => number,
  onChange: (version: number) => void,
) {
  let last = readVersion();

  return {
    check() {
      const version = readVersion();
      if (version !== last) {
        last = version;
        onChange(version);
      }
    },
    get version() {
      return last;
    },
  };
}

export function createDbWatcher(
  dbPath: string,
  onChange: (version: number) => void,
  intervalMs = 500,
) {
  // ponytail: a second SQLite connection is the cross-process change
  // detector. SQLite has no pub/sub; if the GUI ever shares a process with
  // every writer, replace this with an emitter in crud.ts.
  const watcher = new Database(dbPath);
  const detector = createChangeDetector(
    () => readDataVersion(watcher),
    onChange,
  );
  const timer = setInterval(() => {
    try {
      detector.check();
    } catch (error) {
      console.error("Failed to poll SQLite data_version:", error);
    }
  }, intervalMs);

  return {
    check: detector.check,
    close() {
      clearInterval(timer);
      watcher.close();
    },
  };
}
