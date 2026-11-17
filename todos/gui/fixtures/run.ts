import { mkdirSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import type { TaskStatusType } from "../../constants.ts";
import {
  createSubtask,
  createTask,
  updateSubtask,
  updateTask,
} from "../../crud.ts";
import { setupDatabase } from "../../db.ts";

type SubtaskSeed = {
  title: string;
  description: string;
  status: TaskStatusType;
  schema?: string;
  result?: string;
};

type TaskSeed = {
  prompt: string;
  notes?: string;
  data?: unknown;
  status: TaskStatusType;
  subtasks: SubtaskSeed[];
};

const json = (value: unknown) => JSON.stringify(value, null, 2);

const seeds: TaskSeed[] = [
  {
    prompt: "Ship the todos GUI",
    notes:
      "First iteration is read-only. SSE should update when an agent writes to the DB.",
    data: { release: "v0.1", owner: "llummox" },
    status: "in-progress",
    subtasks: [
      {
        title: "Build the lane model",
        description:
          "Group tasks and subtasks by status, keep subtask order stable, and sort lanes newest first.",
        status: "done",
        schema: "type Schema = { lanes: number; columns: number }",
        result: json({ lanes: 7, columns: 4 }),
      },
      {
        title: "Add Hono routes",
        description:
          "Serve the full page, the board fragment, the SSE stream and the local assets.",
        status: "done",
      },
      {
        title: "Wire SSE reconnect",
        description:
          "Resend the board on connect so a dropped EventSource catches up after a restart.",
        status: "in-progress",
      },
      {
        title: "Polish empty states",
        description:
          "Show a useful message for tasks with no subtasks and for an empty board.",
        status: "todo",
      },
      {
        title: "Add auth",
        description: "Gate the board behind a local token.",
        status: "blocked",
        result:
          "Blocked: auth is out of scope for the read-only first iteration.",
      },
    ],
  },
  {
    prompt: "Migrate the fixture database",
    notes:
      "Fresh DB on every fixture run; migrations come from todos/drizzle.",
    data: { migrated: true, tables: ["tasks", "subtasks"] },
    status: "done",
    subtasks: [
      {
        title: "Run drizzle migrations",
        description: "Apply the checked-in migrations to the fresh DB.",
        status: "done",
        result: json({ ok: true }),
      },
      {
        title: "Verify foreign keys",
        description: "Confirm PRAGMA foreign_keys is enabled after migration.",
        status: "done",
        result: json({ foreignKeys: 1 }),
      },
      {
        title: "Seed sample rows",
        description: "Insert the fixture tasks and subtasks.",
        status: "done",
      },
    ],
  },
  {
    prompt: "Investigate flaky worker retries",
    notes:
      "Worker sometimes returns a partial report after the model server restarts.",
    data: { attempts: 3, environment: "local" },
    status: "blocked",
    subtasks: [
      {
        title: "Reproduce the timeout",
        description:
          "Run the worker against a stopped model server and capture the failure.",
        status: "blocked",
        result:
          "Blocked: the local model server is not available in this fixture.",
      },
      {
        title: "Add retry backoff",
        description:
          "Add bounded exponential backoff around the model request.",
        status: "todo",
      },
    ],
  },
  {
    prompt: "Document the task schema",
    notes:
      "No subtasks yet; this lane demonstrates the empty state.",
    data: { doc: "todos/schema.ts" },
    status: "todo",
    subtasks: [],
  },
  {
    prompt: "Improve manager prompts",
    notes: "Keep prompts terse and force the manager to delegate.",
    data: { promptVersion: 2 },
    status: "in-progress",
    subtasks: [
      {
        title: "Audit current prompt",
        description:
          "Review the manager prompt for ambiguity and duplicated instructions.",
        status: "done",
        result: json({
          findings: [
            "The prompt repeats the delegation rule twice.",
            "Subtasks often omit acceptance criteria.",
          ],
          confidence: 0.82,
        }),
      },
      {
        title: "Tighten delegation wording",
        description:
          "Make the manager produce one clear subtask per step.",
        status: "in-progress",
      },
      {
        title: "Add a regression example",
        description:
          "Capture a prompt and its expected subtask shape in a test.",
        status: "todo",
      },
      {
        title: "Measure subtask count",
        description:
          "Compare the number of subtasks before and after the prompt change.",
        status: "todo",
      },
    ],
  },
  {
    prompt: "Clean up the old Astro GUI",
    notes:
      "Astro was only a scaffold; the Bun/Hono version replaces it.",
    data: {
      removed: ["astro.config.mjs", "src/pages/index.astro"],
    },
    status: "done",
    subtasks: [
      {
        title: "Remove Astro dependency",
        description: "Drop the package and refresh the lockfile.",
        status: "done",
      },
      {
        title: "Delete starter pages",
        description: "Remove the generated Astro layout and welcome page.",
        status: "done",
      },
      {
        title: "Keep the favicon",
        description: "Decide whether to keep the old favicon asset.",
        status: "done",
        result: json({ kept: false }),
      },
    ],
  },
  {
    prompt: "Backlog: richer subtask reports",
    notes:
      "Long result payloads exercise the folded Result panel.",
    data: { idea: "render structured reports with a schema-aware viewer" },
    status: "todo",
    subtasks: [
      {
        title: "Design report schema",
        description:
          "Define a report shape with a summary and supporting evidence.",
        status: "todo",
        schema:
          "type Schema = { summary: string; evidence: string[] }",
      },
      {
        title: "Add copy button",
        description:
          "Copy the raw result JSON from a subtask without leaving the board.",
        status: "todo",
      },
      {
        title: "Render Markdown safely",
        description:
          "Render short Markdown descriptions after sanitizing them.",
        status: "todo",
      },
    ],
  },
];

export async function seedFixtures() {
  let subtaskCount = 0;

  for (const spec of seeds) {
    const task = await createTask({
      prompt: spec.prompt,
      notes: spec.notes,
      data: spec.data,
    });

    for (const subtaskSpec of spec.subtasks) {
      const subtask = await createSubtask({
        taskId: task.id,
        title: subtaskSpec.title,
        description: subtaskSpec.description,
        schema: subtaskSpec.schema ?? "",
      });
      subtaskCount++;

      if (
        subtaskSpec.status !== "todo" ||
        subtaskSpec.result !== undefined
      ) {
        await updateSubtask(subtask.id, {
          status: subtaskSpec.status,
          result: subtaskSpec.result,
        });
      }
    }

    // updateSubtask recomputes the parent from its subtasks; apply the
    // fixture's intended task status after all subtasks exist.
    await updateTask(task.id, { status: spec.status });
  }

  return { tasks: seeds.length, subtasks: subtaskCount };
}

async function main() {
  const fixturesDir = import.meta.dir;
  const repoRoot = join(fixturesDir, "..", "..");
  const dbPath = resolve(
    process.env.FIXTURE_DB ??
      join(fixturesDir, "fixtures.todos.db"),
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
  console.log(`Starting todos GUI on http://localhost:${port} (Ctrl+C to stop)`);

  const child = Bun.spawn(
    [process.execPath, "run", join(fixturesDir, "..", "server.ts")],
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
