# Todos GUI

Read-only task board for the `todos` tables: one card per task, four
subtask-status lanes, and native `<details>` folds for task info and each
subtask's details.

## Run

From the repo root:

```sh
bun run todos/gui/server.tsx
```

Defaults: port `3000`, repo-root `todos.db`. Override with `PORT` and
`TODO_DB` (the legacy `TODO_GUI_DB` is also accepted).

```sh
PORT=4321 TODO_DB=/tmp/todos.db bun run todos/gui/server.tsx
```

## Fixture demo

Seed a fresh throwaway DB with varied tasks/subtasks and start the server
against it:

```sh
bun run todos:gui:fixtures
```

It writes `todos/gui/fixtures/fixtures.todos.db` (reset on every run), starts
on port `3210`, and prints the URL. Override with `FIXTURE_DB` and `PORT`:

```sh
FIXTURE_DB=/tmp/demo.db PORT=4321 bun run todos:gui:fixtures
```

Ctrl+C stops the fixture server.

## How live updates work

- CRUD mutations append a row to `task_events` (`task.created`,
  `task.updated`, `task.deleted`, and the subtask equivalents).
- `board/events.ts` polls that table every 500 ms and coalesces events by task.
- `board/live.tsx` renders only the changed task card as an htmx OOB fragment.
- The server sends those fragments as SSE event `task`; a hidden
  `sse-swap="task"` target applies them without replacing `#board`.
- New tasks use `afterbegin:#board`; updates use `outerHTML`; deletes use
  `delete`.
- The full board is still sent as event `board` when a client connects, so a
  reconnect catches up.

Folding is native `<details>`/`<summary>`. `public/fold.js` only persists
open/closed state in `sessionStorage` and restores it after an htmx swap.

## Structure

- `board/` — board model, view components, event polling and OOB rendering.
- `utilities/events.ts` — SSE client set only.
- `app.tsx` — Hono routes, server rendering and static assets.
- `server.tsx` — startup, event queue and shutdown.

## Rendering conventions

- Components are standard React TSX in `board/`.
- `app.tsx` owns the response boundary:
  `c.html(renderToStaticMarkup(...))`.
- `GET /` adds `<!DOCTYPE html>`; `/board` and SSE payloads are fragments.
- Use JSX directly. There is no `h()`/`createElement` wrapper.
- Components receive props; data loading stays in `board/model.ts` or routes.

## Routes

| Route | Purpose |
| --- | --- |
| `GET /` | Full page |
| `GET /board` | Board fragment |
| `GET /events` | SSE stream (`board` initial, `task` incremental) |
| `GET /static/:name` | Whitelisted local assets |

## Vendored assets

- `htmx.min.js` — htmx 2.0.11
- `sse.js` — htmx SSE extension 2.2.4
- `oat.min.css` — Oat UI CSS
- `app.css` — task and lane layout, plus small overrides
- `fold.js` — fold-state persistence only

React TSX is rendered on the server with `renderToStaticMarkup`; `c.html`
returns the HTML. There is no client React bundle, hydration, or build step.
The `/` route adds `<!DOCTYPE html>`; fragments and SSE payloads do not. The
GUI runtime packages are `hono`, `react`, and `react-dom`; the browser assets
are served locally.

## Tests

```sh
bun test
bun test --path-ignore-patterns='' ./todos/gui/integration/watcher.test.ts
bun x tsc --noEmit
```
