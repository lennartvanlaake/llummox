import { readFile, stat } from "node:fs/promises";
import { rgPath } from "@vscode/ripgrep";
import { tryParseScript, type Definition } from "./editing/definitions";
import {
  DEFINITION_KINDS,
  getScriptLanguage,
  type DefinitionKind,
} from "./editing/languages";
import { resolveInside } from "./editing/paths";
import { defineTool, stringEnum, Type } from "./tools";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;
const MAX_SYMBOL_FILES = 2000;

type SearchMode = "files" | "content" | "symbols";

export const searchTool = defineTool({
  name: "search",
  description:
    'Find things in the workspace. mode="files" fuzzy-matches file paths (empty query lists files). mode="content" searches file contents. mode="symbols" outlines AST definitions, optionally filtered by query or kind.',
  parameters: Type.Object({
    mode: stringEnum(["files", "content", "symbols"], {
      description:
        "files: find paths. content: search text. symbols: find AST definitions.",
    }),
    query: Type.Optional(
      Type.String({
        description:
          'Search text. For files, a fuzzy path query or glob such as "src/**/*.ts". For content, text to find. For symbols, an optional name filter.',
      }),
    ),
    path: Type.Optional(
      Type.String({
        description:
          'File or directory to search. Default ".". Must be inside cwd.',
      }),
    ),
    glob: Type.Optional(
      Type.String({
        description:
          'Optional file filter such as "*.ts", "src/**/*.tsx", or "!*.test.ts".',
      }),
    ),
    kind: Type.Optional(
      stringEnum(DEFINITION_KINDS, {
        description: "Optional definition kind filter for symbols.",
      }),
    ),
    regex: Type.Optional(
      Type.Boolean({
        description:
          "For content mode: treat query as a regular expression. Default false (literal text).",
      }),
    ),
    caseSensitive: Type.Optional(
      Type.Boolean({
        description:
          "For content mode: true forces case-sensitive, false forces ignore-case. Default smart-case.",
      }),
    ),
    limit: Type.Optional(
      Type.Integer({
        description: `Maximum results. Default ${DEFAULT_LIMIT}, max ${MAX_LIMIT}.`,
      }),
    ),
  }),
  execute: async (params, ctx) => {
    const mode = params.mode as SearchMode;
    const path = params.path?.trim() || ".";
    resolveInside(ctx.cwd, path);

    if (mode === "files") {
      return searchFiles(params, path, ctx.cwd);
    }
    if (mode === "content") {
      return searchContent(params, path, ctx.cwd);
    }
    if (mode === "symbols") {
      return searchSymbols(params, path, ctx.cwd);
    }
    throw new Error(`Unknown search mode: ${String(params.mode)}`);
  },
});

type SearchArgs = {
  mode: SearchMode;
  query?: string;
  path?: string;
  glob?: string;
  kind?: DefinitionKind;
  regex?: boolean;
  caseSensitive?: boolean;
  limit?: number;
};

async function searchFiles(
  params: SearchArgs,
  path: string,
  cwd: string,
): Promise<string> {
  const query = (params.query ?? "").trim();
  const limit = resultLimit(params.limit);
  const looksLikeGlob = /[*?[\]]/.test(query);
  const files = await listFiles(
    cwd,
    path,
    params.glob,
    looksLikeGlob ? query : undefined,
  );

  let ordered: string[];
  if (query && !looksLikeGlob) {
    ordered = files
      .map((file) => ({ file, score: fuzzyScore(query, file) }))
      .filter((entry) => entry.score >= 0)
      .sort(
        (left, right) =>
          right.score - left.score ||
          left.file.length - right.file.length ||
          left.file.localeCompare(right.file),
      )
      .map((entry) => entry.file);
  } else {
    ordered = [...files].sort((left, right) => left.localeCompare(right));
  }

  if (ordered.length === 0) {
    return `No files found${query ? ` matching "${query}"` : ""} under ${path}.`;
  }

  const shown = ordered.slice(0, limit);
  const lines = shown.map(displayPath);
  if (ordered.length > shown.length) {
    lines.push(`... ${ordered.length - shown.length} more files; raise limit.`);
  }
  return lines.join("\n");
}

async function searchContent(
  params: SearchArgs,
  path: string,
  cwd: string,
): Promise<string> {
  const query = params.query?.trim();
  if (!query) {
    throw new Error('search mode="content" requires a non-empty "query".');
  }
  const limit = resultLimit(params.limit);

  const args = [
    "--json",
    "--color=never",
    "--max-count",
    String(Math.min(MAX_LIMIT, Math.max(limit, 50))),
    "--max-columns",
    "500",
    "--glob",
    "!node_modules/**",
    "--glob",
    "!.git/**",
  ];
  if (params.caseSensitive === true) {
    args.push("--case-sensitive");
  } else if (params.caseSensitive === false) {
    args.push("--ignore-case");
  } else {
    args.push("--smart-case");
  }
  if (!params.regex) {
    args.push("--fixed-strings");
  }
  if (params.glob) {
    args.push("--glob", params.glob);
  }
  args.push("--", query, path);

  const result = await runRg(args, cwd);
  if (result.code > 1) {
    throw new Error(
      `ripgrep failed: ${result.stderr.trim() || `exit code ${result.code}`}`,
    );
  }

  const matches: string[] = [];
  let truncated = false;
  for (const line of result.stdout.split(/\r?\n/)) {
    if (!line) {
      continue;
    }
    let event: any;
    try {
      event = JSON.parse(line);
    } catch {
      continue;
    }
    if (event.type !== "match") {
      continue;
    }
    if (matches.length >= limit) {
      truncated = true;
      break;
    }
    const file = displayPath(String(event.data?.path?.text ?? ""));
    const lineNumber = Number(event.data?.line_number ?? 0);
    const text = String(event.data?.lines?.text ?? "")
      .replace(/\r?\n$/, "")
      .trimEnd();
    const clipped = text.length > 240 ? `${text.slice(0, 240)}...` : text;
    matches.push(`${file}:${lineNumber}: ${clipped}`);
  }

  if (matches.length === 0) {
    return `No matches found for "${query}" under ${path}.`;
  }
  if (truncated) {
    matches.push(`... showing first ${limit} matches; raise limit or narrow the search.`);
  }
  return matches.join("\n");
}

async function searchSymbols(
  params: SearchArgs,
  path: string,
  cwd: string,
): Promise<string> {
  const query = (params.query ?? "").trim();
  const limit = resultLimit(params.limit);
  const resolved = resolveInside(cwd, path);
  const info = await stat(resolved);

  let files: string[];
  if (info.isFile()) {
    files = [path];
  } else if (info.isDirectory()) {
    files = (await listFiles(cwd, path, params.glob)).filter((file) =>
      Boolean(getScriptLanguage(file)),
    );
  } else {
    throw new Error(`Not a file or directory: ${path}`);
  }

  const results: Array<{
    score: number;
    file: string;
    definition: Definition;
  }> = [];
  let scanned = 0;
  for (const file of files) {
    if (scanned >= MAX_SYMBOL_FILES) {
      break;
    }
    scanned += 1;
    const text = await readFile(resolveInside(cwd, file), "utf8").catch(
      () => undefined,
    );
    if (text === undefined) {
      continue;
    }
    const outcome = tryParseScript(file, text);
    if (outcome.status !== "ok") {
      continue;
    }
    for (const definition of outcome.parsed.definitions) {
      if (params.kind && definition.kind !== params.kind) {
        continue;
      }
      const score = symbolScore(query, definition);
      if (score < 0) {
        continue;
      }
      results.push({ score, file: displayPath(file), definition });
    }
  }

  results.sort(
    (left, right) =>
      right.score - left.score ||
      left.file.localeCompare(right.file) ||
      left.definition.startLine - right.definition.startLine,
  );

  if (results.length === 0) {
    return `No symbols found${query ? ` matching "${query}"` : ""} under ${path}.`;
  }

  const shown = results.slice(0, limit);
  const lines = shown.map(
    ({ file, definition }) =>
      `${file}:${definition.startLine}\t${definition.kind} ${definition.qualifiedName}`,
  );
  if (results.length > shown.length) {
    lines.push(`... ${results.length - shown.length} more symbols; raise limit.`);
  }
  if (files.length > MAX_SYMBOL_FILES) {
    lines.push(
      `... stopped after ${MAX_SYMBOL_FILES} files; narrow path or use glob.`,
    );
  }
  return lines.join("\n");
}

type RgResult = {
  stdout: string;
  stderr: string;
  code: number;
};

async function runRg(args: string[], cwd: string): Promise<RgResult> {
  let process: Bun.Subprocess<"pipe", "pipe">;
  try {
    process = Bun.spawn([rgPath, ...args], {
      cwd,
      stdout: "pipe",
      stderr: "pipe",
    });
  } catch (error) {
    throw new Error(`ripgrep is unavailable: ${(error as Error).message}`);
  }

  const [stdout, stderr, code] = await Promise.all([
    new Response(process.stdout as ReadableStream<Uint8Array>).text(),
    new Response(process.stderr as ReadableStream<Uint8Array>).text(),
    process.exited,
  ]);
  return { stdout, stderr, code };
}

async function listFiles(
  cwd: string,
  path: string,
  glob?: string,
  queryGlob?: string,
): Promise<string[]> {
  const args = [
    "--files",
    "--color=never",
    "--glob",
    "!node_modules/**",
    "--glob",
    "!.git/**",
  ];
  if (glob) {
    args.push("--glob", glob);
  }
  if (queryGlob) {
    args.push("--glob", queryGlob);
  }
  args.push("--", path);

  const result = await runRg(args, cwd);
  if (result.code > 1) {
    throw new Error(
      `ripgrep failed: ${result.stderr.trim() || `exit code ${result.code}`}`,
    );
  }
  return result.stdout
    .split(/\r?\n/)
    .filter(Boolean)
    .map(displayPath);
}

function resultLimit(value: number | undefined): number {
  return Math.max(1, Math.min(value ?? DEFAULT_LIMIT, MAX_LIMIT));
}

function displayPath(path: string): string {
  return path.startsWith("./") ? path.slice(2) : path;
}

export function fuzzyScore(query: string, candidate: string): number {
  const q = query.toLowerCase();
  const c = candidate.toLowerCase();
  if (!q) {
    return 1;
  }
  if (c === q) {
    return 10_000;
  }

  const base = c.slice(c.lastIndexOf("/") + 1);
  if (base === q) {
    return 9_000 - c.length / 100;
  }
  if (base.startsWith(q)) {
    return 8_000 - c.length / 100;
  }

  const direct = c.indexOf(q);
  if (direct !== -1) {
    return 5_000 - direct - c.length / 100;
  }

  let queryIndex = 0;
  let score = 0;
  let last = -2;
  let run = 0;
  for (let index = 0; index < c.length && queryIndex < q.length; index++) {
    if (c[index] !== q[queryIndex]) {
      continue;
    }
    const previous = index > 0 ? c[index - 1] ?? "" : "";
    const boundary = index === 0 || "/._- ".includes(previous);
    score += boundary ? 20 : 8;
    if (index === last + 1) {
      run += 1;
      score += run * 6;
    } else {
      run = 0;
    }
    last = index;
    queryIndex += 1;
  }

  return queryIndex === q.length ? score - c.length / 100 : -1;
}

function symbolScore(query: string, definition: Definition): number {
  const q = query.toLowerCase();
  if (!q) {
    return 0;
  }
  const name = definition.name.toLowerCase();
  const qualifiedName = definition.qualifiedName.toLowerCase();
  if (qualifiedName === q) {
    return 10_000;
  }
  if (name === q) {
    return 9_000;
  }
  if (qualifiedName.endsWith(`.${q}`)) {
    return 8_000;
  }
  const qualifiedIndex = qualifiedName.indexOf(q);
  if (qualifiedIndex !== -1) {
    return 6_000 - qualifiedIndex;
  }
  const nameIndex = name.indexOf(q);
  if (nameIndex !== -1) {
    return 5_000 - nameIndex;
  }
  return fuzzyScore(q, qualifiedName);
}
