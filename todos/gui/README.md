# Todos GUI

Read-only swimlane board for the `todos` tables: one lane per task, four
subtask-status columns, and native `<details>` folds for task info and each
subtask's details.

## Run

From the repo root:

```sh
bun run todos/gui/server.ts
```

Defaults: port `3000`, repo-root `todos.db`. Override with `PORT` and
`TODO_DB` (the legacy `TODO_GUI_DB` is also accepted).

```sh
PORT=4321 TODO_DB=/tmp/todos.db bun run todos/gui/server.ts
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

- `todos/gui/server.ts` opens a second SQLite connection and polls
  `PRAGMA data_version` every 500 ms.
- A commit from any other connection (an agent, another process, or the GUI's
  own Drizzle connection) changes that value.
- The server re-renders the board and pushes it as SSE event `board`.
- htmx's SSE extension swaps the event payload into `#board`; there is no
  browser polling and no extra refetch.
- The current board is also sent immediately when a client connects, so a
  reconnect catches up.

Folding is native `<details>`/`<summary>`. `public/fold.js` only persists
open/closed state in `sessionStorage` and restores it after an htmx swap.

## Routes

| Route | Purpose |
| --- | --- |
| `GET /` | Full page |
| `GET /board` | Board fragment |
| `GET /events` | SSE stream (`event: board`) |
| `GET /static/:name` | Whitelisted local assets |

## Vendored assets

- `htmx.min.js` — htmx 2.0.11
- `sse.js` — htmx SSE extension 2.2.4
- `oat.min.css` — Oat UI CSS
- `app.css` — lane layout and small overrides
- `fold.js` — fold-state persistence only

No React, build step, or CSS toolchain. Templates call `createElement` from
`jsx-async-runtime` directly, so there are no JSX compiler settings in
`tsconfig.json` and no implicit React runtime. The only runtime packages are
`hono` and `jsx-async-runtime`; the browser assets are served locally.

## Tests

```sh
bun test
bun test --path-ignore-patterns='' ./todos/gui/integration/watcher.test.ts
bun x tsc --noEmit
```
