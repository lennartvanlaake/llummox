import { describe, expect, it } from "bun:test";
import { createSubtask, createTask, updateSubtask } from "../crud.ts";
import { setupDatabase } from "../db.ts";
import { createApp } from "./app.ts";
import { createEventHub } from "./events.ts";

async function setup() {
  setupDatabase(":memory:");
  const task = await createTask({ prompt: "Build <board>" });
  const subtask = await createSubtask({
    taskId: task.id,
    title: "Render <lane>",
    description: "Show the subtask details",
  });
  await updateSubtask(subtask.id, { status: "in-progress" });
  return createApp(createEventHub());
}

describe("todos GUI routes", () => {
  it("serves the full board page", async () => {
    const app = await setup();
    const response = await app.request("/");
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(body).toContain("<!DOCTYPE html>");
    expect(body).toContain("Build &lt;board&gt;");
    expect(body).toContain("Render &lt;lane&gt;");
    expect(body).toContain('sse-connect="/events"');
  });

  it("serves the board fragment", async () => {
    const app = await setup();
    const response = await app.request("/board");
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain("data-task-id");
    expect(body).toContain("data-status=\"in-progress\"");
    expect(body).not.toContain("<!DOCTYPE html>");
  });

  it("serves whitelisted assets and rejects unknown ones", async () => {
    const app = await setup();
    const css = await app.request("/static/oat.min.css");
    expect(css.status).toBe(200);
    expect(css.headers.get("content-type")).toContain("text/css");

    const missing = await app.request("/static/../todos/gui/server.ts");
    expect(missing.status).toBe(404);
  });

  it("exposes the SSE endpoint", async () => {
    const app = await setup();
    const response = await app.request("/events");

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain(
      "text/event-stream",
    );
    await response.body?.cancel();
  });
});
