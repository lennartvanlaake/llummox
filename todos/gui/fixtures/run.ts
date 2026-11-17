import { mkdirSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { setupDatabase } from "../../db.ts";
import { seedFixtures } from "./seeds.ts";

async function main() {
  const fixturesDir = import.meta.dir;
  const repoRoot = join(fixturesDir, "..", "..");
  const dbPath = resolve(
    process.env.FIXTURE_DB ?? join(fixturesDir, "fixtures.todos.db"),
  );
  const port = process.env.PORT ?? "3210";

  for (const suffix of ["", "-wal", "-shm"]) {
    rmSync(`${dbPath}${suffix}`, { force: true });
  }
  mkdirSync(dirname(dbPath), { recursive: true });

  setupDatabase(dbPath);
  const counts = await seedFixtures();
  console.log(
    `Seeded ${counts.tasks} tasks and ${counts.subtasks} subtasks into ${dbPath}`,
  );
  console.log(
    `Starting todos GUI on http://localhost:${port} (Ctrl+C to stop)`,
  );

  const child = Bun.spawn(
    [process.execPath, "run", join(fixturesDir, "..", "server.tsx")],
    {
      cwd: repoRoot,
      env: { ...process.env, TODO_DB: dbPath, PORT: port },
      stdio: ["inherit", "inherit", "inherit"],
    },
  );

  let stopping = false;
  const stop = (signal: "SIGINT" | "SIGTERM") => {
    if (stopping) return;
    stopping = true;
    child.kill(signal);
    // ponytail: force cleanup if the child ignores the first signal; a
    // half-stopped fixture server otherwise keeps the port and DB open.
    setTimeout(() => {
      child.kill("SIGKILL");
      process.exit(1);
    }, 2000);
  };
  process.on("SIGINT", () => stop("SIGINT"));
  process.on("SIGTERM", () => stop("SIGTERM"));

  process.exit(await child.exited);
}

if (import.meta.main) {
  await main();
}
