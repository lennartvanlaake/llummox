import type { ReactNode } from "react";

export function Layout({ children }: { children?: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        />
        <title>Todos</title>
        <link rel="stylesheet" href="/static/oat.min.css" />
        <link rel="stylesheet" href="/static/app.css" />
      </head>
      <body>
        <header className="page-head">
          <h1>Todos</h1>
          <small className="muted">Live task board</small>
        </header>
        <div hx-ext="sse" sse-connect="/events">
          <main id="board" sse-swap="board" hx-swap="innerHTML">
            {children}
          </main>
          <div sse-swap="task" hx-swap="none" hidden />
        </div>
        <script src="/static/htmx.min.js" />
        <script src="/static/sse.js" />
        <script src="/static/fold.js" />
      </body>
    </html>
  );
}
