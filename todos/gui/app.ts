import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import type { EventHub } from "./events.ts";
import { renderBoard, renderPage } from "./render.ts";

const PUBLIC_DIR = new URL("./public/", import.meta.url);
const ASSETS = new Set([
  "app.css",
  "fold.js",
  "htmx.min.js",
  "oat.min.css",
  "sse.js",
]);

export function createApp(hub: EventHub) {
  const app = new Hono();

  // ponytail: a whitelist beats a static-file middleware here; there are five
  // assets and no path traversal or adapter deprecation to worry about.
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

  app.get("/", async (c) => c.html(await renderPage()));
  app.get("/board", async (c) => c.html(await renderBoard()));

  app.get("/events", (c) =>
    streamSSE(c, async (stream) => {
      let closed = false;

      const send = async (boardHtml: string) => {
        if (closed) return;
        await stream.writeSSE({ event: "board", data: boardHtml });
      };

      const unsubscribe = hub.add(send);
      stream.onAbort(() => {
        closed = true;
        unsubscribe();
      });

      try {
        // ponytail: resend on connect so a reconnect catches up on changes
        // that happened while the browser was away.
        await send(await renderBoard());
      } catch (error) {
        closed = true;
        unsubscribe();
        console.error("Failed to send initial todos board:", error);
        return;
      }

      await new Promise<void>((resolve) => {
        stream.onAbort(resolve);
        if (stream.aborted) resolve();
      });
    }),
  );

  return app;
}
