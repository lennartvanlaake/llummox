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
| `agent/builtin.ts` | minimal `read`, `apply`, `search`, `bash` tools |
| `agent/editing/` | ast-grep definition lookup and create/replace/apply engine |
| `agent/search.ts` | ripgrep-backed file/content search and AST symbol outline |
| `agent/html.ts` | filtered HTML views with optional CSS selector extraction |
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
  tools: builtinTools, // read, apply, search, bash
  cwd: "/some/project",
});
```

Paths are resolved inside `cwd`; `bash` runs through the existing sandbox.

`apply` replaces the old `write`/`edit` tools:

```ts
apply({ operation: "create", path: "src/new.ts", content: "..." })
apply({ operation: "overwrite", path: "src/new.ts", content: "..." })
apply({ operation: "replace", path: "README.md", oldText: "...", newText: "..." })
apply({
  operation: "replace_definition",
  path: "src/greet.ts",
  symbol: "Greeter.greet",
  kind: "method", // optional disambiguator
  replacement: "greet(name: string) { return name; }",
});
```

`replace_definition` supports `.ts`, `.tsx`, `.js`, and `.jsx`. It replaces the declaration only; `export`/`declare` wrappers, decorators, and attached comments are preserved. The edit is rejected if it introduces new syntax errors.

`read` has a symbol mode and a filtered HTML mode:

```ts
read({ path: "src/greet.ts", mode: "symbol", symbol: "Greeter.greet" })
read({ path: "page.html", mode: "filtered_html" })
read({ path: "page.html", mode: "filtered_html", selector: "main, article" })
```

`filtered_html` is not raw source. It streams the file through Bun's `HTMLRewriter` and returns a filtered HTML view with:

- `svg`, `script`, `style`, `noscript`, and `template` content removed
- comments and hidden nodes removed
- only `id`, `class`, `href`, `alt`, and `aria-label` attributes kept
- block-level formatting with indentation
- an optional CSS `selector` to return only matching elements
- a `maxChars` cap, default and maximum `10000`

`search` is the directory-level discovery tool:

```ts
search({ mode: "files", query: "greet" })        // fuzzy paths
search({ mode: "files", query: "*.tsx" })        // path glob
search({ mode: "content", query: "helloWorld" }) // grep-style text search
search({ mode: "symbols", path: "src", query: "Greeter", kind: "method" })
search({ mode: "symbols", path: "src" })         // full AST outline
```

It uses a local ripgrep binary from `@vscode/ripgrep`, respects `.gitignore` for file enumeration, and skips `node_modules` and `.git` by default.

## Tests

```bash
bun test                            # unit tests; integration dir is excluded
cd shared/integration && bun test   # live llama.cpp on :8080 (from repo root)
```
