# shared/agent

Small pi-free agent runtime for a local llama.cpp server using its OpenAI-compatible API.

## Layout

| Path | Purpose |
|---|---|
| `agent/llama.ts` | llama.cpp HTTP client, model detection, timeout, retry |
| `agent/tools.ts` | `defineTool`, `Type`, `stringEnum`, `toToolResult`, schema validation |
| `agent/react.ts` | native `tool_calls` ReAct loop |
| `agent/agent.ts` | stateful session facade with injectable loop |
| `agent/structured.ts` | one-shot JSON-schema output |
| `agent/builtin.ts` | minimal `read`, `write`, `edit`, `find`, `bash` tools |
| `agent/schema.ts` | `parseTsSchema()` for `type Schema = { ... }` strings |
| `agent/logging.ts` | pino logging in the existing `role: text` / `Tool call ...` shape |

## Configure

```ts
import { LlamaClient } from "./agent";

const client = new LlamaClient({
  // defaults: http://127.0.0.1:8080/v1
  // env overrides: LLAMA_BASE_URL, LLAMA_MODEL, LLAMA_API_KEY
  timeoutMs: 10 * 60_000,
  retries: 1,
});
```

## Register a tool

```ts
import { defineTool, stringEnum, Type } from "./agent";

const add = defineTool({
  name: "add",
  description: "Add two integers.",
  parameters: Type.Object({
    a: Type.Integer({ description: "First number" }),
    b: Type.Integer({ description: "Second number" }),
  }),
  execute: (args) => args.a + args.b,
});

const status = defineTool({
  name: "set_status",
  description: "Set a task status.",
  parameters: Type.Object({
    status: stringEnum(["todo", "in-progress", "done"]),
  }),
  execute: ({ status }) => `status: ${status}`,
});
```

Tools can return strings, objects, or `toToolResult(value, isError)`.
Arguments are validated against `parameters` before `execute` runs.
Call `ctx.stop()` to end the loop after a terminal tool.

## ReAct agent

```ts
import { createReActAgent, LlamaClient } from "./agent";

const client = new LlamaClient();

const agent = createReActAgent({
  client,
  systemPrompt: "Be terse. Use tools when needed.",
  tools: [add],
  maxSteps: 12,
});

await agent.prompt("What is 2+3?");
console.log(agent.getLastAssistantText());
```

Replace the loop without changing callers:

```ts
const agent = createReActAgent({
  client,
  systemPrompt: "...",
  tools: [add],
  loop: myLoop, // same AgentLoop signature
});
```

The agent keeps message history and exposes `agent.messages`.

## Structured output

```ts
import { structured, Type } from "./agent";

const person = await structured({
  client,
  schema: Type.Object({
    name: Type.String(),
    age: Type.Integer(),
  }),
  prompt: "Extract the person as JSON.",
});
```

Uses llama.cpp `response_format: json_schema`, validates locally, and retries only when `retries` is set. Use `structuredResult()` if you also need the raw response and attempt count.

## Builtin tools

```ts
import { builtinTools, createReActAgent } from "./agent";

const agent = createReActAgent({
  client,
  systemPrompt: "You can inspect and edit files.",
  tools: builtinTools, // read, write, edit, find, bash
  cwd: "/some/project",
});
```

Paths are resolved inside `cwd`; `bash` runs through the existing sandbox.

## Tests

```bash
bun test                            # unit tests; integration dir is excluded
cd shared/integration && bun test   # live llama.cpp on :8080 (from repo root)
```
