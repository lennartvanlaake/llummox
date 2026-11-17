import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { renderToStaticMarkup } from "react-dom/server";
import { Board } from "./board/board.tsx";
import { Layout } from "./board/layout.tsx";
import { loadTasks } from "./board/model.ts";
import type { Clients } from "./utilities/events.ts";

const PUBLIC_DIR = new URL("./public/", import.meta.url);
const ASSETS = new Set([
  "app.css",
  "fold.js",
  "htmx.min.js",
  "oat.min.css",
  "sse.js",
]);

export function createApp(clients: Clients) {
  const app = new Hono();

  app.get("/static/:name", async (c) => {
    const name = c.req.param("name");
    if (!ASSETS.has(name)) return c.notFound();
    const file = Bun.file(new URL(name, PUBLIC_DIR));
    if (!(await file.exists())) return c.notFound();
    return new Response(file, {
      headers: {
        "Content-Type": file.type,
        "Cache-Control": "no-cache",
      },
    });
  });

  app.get("/", (c) =>
    c.html(
      "<!DOCTYPE html>" +
        renderToStaticMarkup(
          <Layout>
            <Board tasks={loadTasks()} />
          </Layout>,
        ),
    ),
  );

  app.get("/board", (c) =>
    c.html(renderToStaticMarkup(<Board tasks={loadTasks()} />)),
  );

  app.get("/events", (c) =>
    streamSSE(c, async (stream) => {
      clients.add(stream);
      await stream.writeSSE({
        event: "board",
        data: renderToStaticMarkup(<Board tasks={loadTasks()} />),
      });
      await new Promise<void>((resolve) => {
        stream.onAbort(resolve);
        if (stream.aborted) resolve();
      });
    }),
  );

  return app;
}
