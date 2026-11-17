import { describe, expect, it } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { SubtasksRow, TasksRow } from "../schema.ts";
import { Board } from "./board/board.tsx";
import { Layout } from "./board/layout.tsx";
import { buildTaskViews } from "./board/model.ts";
import { TaskCard } from "./board/task-card.tsx";

const task: TasksRow = {
  id: "0001",
  status: "in-progress",
  prompt: "Build <the> board",
  data: { branch: "main" },
  notes: "Some notes",
  createdAt: 0,
};

const subtask: SubtasksRow = {
  id: "s1",
  status: "in-progress",
  taskId: "0001",
  title: "Render <subtask>",
  description: "Show the subtask",
  schema: "type Schema = { ok: boolean }",
  result: '{"ok":true}',
  createdAt: 0,
  order: 0,
};

describe("Board rendering", () => {
  it("renders task, status lanes and both fold levels", () => {
    const html = renderToStaticMarkup(
      <Board tasks={buildTaskViews([task], [subtask])} />,
    );

    expect(html).toContain('data-task-id="0001"');
    expect(html).toContain('class="task card"');
    expect(html).toContain('class="task-lanes"');
    expect(html).toContain('class="lane"');
    expect(html).toContain("Build &lt;the&gt; board");
    expect(html).toContain('data-status="in-progress"');
    expect(html).toContain("Render &lt;subtask&gt;");
    expect(html).toContain('data-fold="task-info:0001"');
    expect(html).toContain('data-fold="subtask:s1"');
    expect(html).toContain('class="subtask-summary"');
    expect(html).not.toContain('data-fold="task:0001"');
  });

  it("escapes task and subtask content", () => {
    const unsafe: TasksRow = {
      ...task,
      prompt: '<script>alert("x")</script>',
    };
    const unsafeSubtask: SubtasksRow = {
      ...subtask,
      title: "<img src=x onerror=alert(1)>",
      description: "<b>not bold</b>",
    };

    const html = renderToStaticMarkup(
      <Board tasks={buildTaskViews([unsafe], [unsafeSubtask])} />,
    );

    expect(html).not.toContain('<script>alert("x")</script>');
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;img src=x");
    expect(html).toContain("&lt;b&gt;not bold&lt;/b&gt;");
  });

  it("renders an empty state", () => {
    const html = renderToStaticMarkup(<Board tasks={[]} />);
    expect(html).toContain("No tasks yet.");
    expect(html).toContain('id="board-empty"');
  });

  it("renders a task as an OOB fragment", () => {
    const taskView = buildTaskViews([task], [subtask])[0]!;
    const html = renderToStaticMarkup(
      <TaskCard task={taskView} oob="outerHTML" />,
    );

    expect(html).toContain('id="task-0001"');
    expect(html).toContain('hx-swap-oob="outerHTML"');
  });

  it("wires htmx SSE into the page shell", () => {
    const html = renderToStaticMarkup(
      <Layout>
        <Board tasks={buildTaskViews([task], [subtask])} />
      </Layout>,
    );

    expect(html).toContain('<html lang="en">');
    expect(html).not.toContain("<!DOCTYPE html>");
    expect(html).toContain('hx-ext="sse"');
    expect(html).toContain('sse-connect="/events"');
    expect(html).toContain('sse-swap="board"');
    expect(html).toContain('sse-swap="task"');
    expect(html).toContain('hx-swap="none"');
    expect(html).toContain("/static/htmx.min.js");
    expect(html).toContain("/static/sse.js");
    expect(html).toContain("/static/fold.js");
  });
});
