import { describe, expect, it } from "bun:test";
import { createElement, jsxToString } from "jsx-async-runtime";
import type { SubtasksRow, TasksRow } from "../schema.ts";
import { buildLanes } from "./board.ts";
import { Board, Layout } from "./components.ts";

const h = createElement;

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
  title: "Render <lane>",
  description: "Show the lane",
  schema: "type Schema = { ok: boolean }",
  result: '{"ok":true}',
  createdAt: 0,
  order: 0,
};

describe("Board rendering", () => {
  it("renders task, status columns and both fold levels", async () => {
    const html = await jsxToString(
      h(Board, { lanes: buildLanes([task], [subtask]) }),
    );

    expect(html).toContain('data-task-id="0001"');
    expect(html).toContain("Build &lt;the&gt; board");
    expect(html).toContain('data-status="in-progress"');
    expect(html).toContain("Render &lt;lane&gt;");
    expect(html).toContain('data-fold="task-info:0001"');
    expect(html).toContain('data-fold="subtask:s1"');
    expect(html).toContain('class="subtask-summary"');
    expect(html).not.toContain('data-fold="task:0001"');
  });

  it("escapes task and subtask content", async () => {
    const unsafe: TasksRow = {
      ...task,
      prompt: '<script>alert("x")</script>',
    };
    const unsafeSubtask: SubtasksRow = {
      ...subtask,
      title: "<img src=x onerror=alert(1)>",
      description: "<b>not bold</b>",
    };

    const html = await jsxToString(
      h(Board, { lanes: buildLanes([unsafe], [unsafeSubtask]) }),
    );

    expect(html).not.toContain('<script>alert("x")</script>');
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;img src=x");
    expect(html).toContain("&lt;b&gt;not bold&lt;/b&gt;");
  });

  it("renders an empty state", async () => {
    expect(await jsxToString(h(Board, { lanes: [] }))).toContain(
      "No tasks yet.",
    );
  });

  it("wires htmx SSE into the page shell", async () => {
    const html = await jsxToString(
      h(Layout, null, h(Board, { lanes: buildLanes([task], [subtask]) })),
    );

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain('hx-ext="sse"');
    expect(html).toContain('sse-connect="/events"');
    expect(html).toContain('sse-swap="board"');
    expect(html).toContain("/static/htmx.min.js");
    expect(html).toContain("/static/sse.js");
    expect(html).toContain("/static/fold.js");
  });
});
