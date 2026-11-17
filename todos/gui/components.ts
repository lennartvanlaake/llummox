import { createElement, Fragment, html } from "jsx-async-runtime";
import type { SubtasksRow, TasksRow } from "../schema.ts";
import type { TaskLane } from "./board.ts";
import { statusLabel } from "./board.ts";

const h = createElement;

type BadgeVariant = "success" | "warning" | "danger" | "secondary";

function statusVariant(status: string): BadgeVariant {
  switch (status) {
    case "done":
      return "success";
    case "in-progress":
      return "warning";
    case "blocked":
      return "danger";
    default:
      return "secondary";
  }
}

function StatusBadge({ status }: { status: string }) {
  return h(
    "span",
    { class: "badge", "data-variant": statusVariant(status) },
    statusLabel(status),
  );
}

export function Layout({ children }: { children?: JSX.Children }) {
  return h(
    Fragment,
    null,
    html("<!DOCTYPE html>"),
    h(
      "html",
      { lang: "en" },
      h(
        "head",
        null,
        h("meta", { charset: "utf-8" }),
        h("meta", {
          name: "viewport",
          content: "width=device-width, initial-scale=1",
        }),
        h("title", null, "Todos"),
        h("link", { rel: "stylesheet", href: "/static/oat.min.css" }),
        h("link", { rel: "stylesheet", href: "/static/app.css" }),
      ),
      h(
        "body",
        null,
        h(
          "header",
          { class: "page-head" },
          h("h1", null, "Todos"),
          h("small", { class: "muted" }, "Live task board"),
        ),
        h(
          "div",
          { "hx-ext": "sse", "sse-connect": "/events" },
          h(
            "main",
            { id: "board", "sse-swap": "board", "hx-swap": "innerHTML" },
            children,
          ),
        ),
        h("script", { src: "/static/htmx.min.js" }),
        h("script", { src: "/static/sse.js" }),
        h("script", { src: "/static/fold.js" }),
      ),
    ),
  );
}

export function Board({ lanes }: { lanes: TaskLane[] }) {
  if (lanes.length === 0) {
    return h("p", { class: "empty" }, "No tasks yet.");
  }
  return h(
    "div",
    { class: "board" },
    lanes.map((lane) => h(TaskLane, { lane })),
  );
}

export function TaskLane({ lane }: { lane: TaskLane }) {
  return h(
    "article",
    { class: "lane card", "data-task-id": lane.task.id },
    h(
      "header",
      { class: "lane-head" },
      h(StatusBadge, { status: lane.task.status }),
      h("h2", { class: "lane-title" }, lane.task.prompt),
      h("span", { class: "lane-count" }, `${lane.done}/${lane.total} done`),
    ),
    h(TaskInfo, { task: lane.task }),
    h(
      "div",
      { class: "lane-grid" },
      lane.columns.map((column) =>
        h(
          "section",
          { class: "column", "data-status": column.status },
          h(
            "h3",
            { class: "column-title" },
            h("span", null, column.label),
            h("span", { class: "muted" }, column.subtasks.length),
          ),
          column.subtasks.length === 0
            ? h("p", { class: "empty small" }, "None")
            : column.subtasks.map((subtask) =>
              h(SubtaskCard, { subtask }),
            ),
        ),
      ),
    ),
  );
}

function TaskInfo({ task }: { task: TasksRow }) {
  const data =
    task.data == null ? "" : (JSON.stringify(task.data, null, 2) ?? "");

  return h(
    "details",
    { class: "info", "data-fold": `task-info:${task.id}` },
    h("summary", null, "Task info"),
    h(
      "div",
      { class: "info-body" },
      h(
        "dl",
        { class: "meta" },
        h("dt", null, "ID"),
        h("dd", null, h("code", null, task.id)),
        h("dt", null, "Status"),
        h("dd", null, statusLabel(task.status)),
        h("dt", null, "Created"),
        h("dd", null, String(task.createdAt)),
      ),
      task.notes
        ? h(
          Fragment,
          null,
          h("h4", null, "Notes"),
          h("p", { class: "pre-wrap" }, task.notes),
        )
        : null,
      data
        ? h(
          Fragment,
          null,
          h("h4", null, "Data"),
          h("pre", null, h("code", null, data)),
        )
        : null,
    ),
  );
}

function SubtaskCard({ subtask }: { subtask: SubtasksRow }) {
  return h(
    "details",
    { class: "subtask", "data-fold": `subtask:${subtask.id}` },
    h(
      "summary",
      null,
      h(
        "span",
        { class: "subtask-summary" },
        h("span", { class: "order" }, `#${subtask.order}`),
        h("span", { class: "subtask-title" }, subtask.title),
        h(StatusBadge, { status: subtask.status }),
      ),
    ),
    h(
      "div",
      { class: "subtask-body" },
      h("h4", null, "Description"),
      h("p", { class: "pre-wrap" }, subtask.description),
      subtask.schema
        ? h(
          Fragment,
          null,
          h("h4", null, "Schema"),
          h("pre", null, h("code", null, subtask.schema)),
        )
        : null,
      h("h4", null, "Result"),
      subtask.result
        ? h("pre", null, h("code", null, subtask.result))
        : h("p", { class: "muted" }, "No result yet."),
      h(
        "small",
        { class: "muted" },
        "ID: ",
        h("code", null, subtask.id),
      ),
    ),
  );
}
