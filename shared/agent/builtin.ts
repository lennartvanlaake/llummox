import { readFile } from "node:fs/promises";
import { sandboxCommand } from "../../sandbox/sandbox";
import { splitLines } from "./editing/apply";
import {
  formatMatchFailure,
  matchDefinition,
  requireParsedScript,
} from "./editing/definitions";
import { resolveInside } from "./editing/paths";
import { applyTool } from "./editing/tool";
import { readFilteredHtmlFile } from "./html";
import { searchTool } from "./search";
import { defineTool, stringEnum, Type } from "./tools";
import type { AnyTool } from "./types";

export { applyTool, searchTool };

export const readTool = defineTool({
  name: "read",
  description:
    'Read a file as numbered lines, one AST definition, or a filtered HTML view (not raw source). Use mode="filtered_html" for large HTML files.',
  parameters: Type.Object({
    path: Type.String({ description: "File path relative to cwd." }),
    mode: Type.Optional(
      stringEnum(["file", "symbol", "filtered_html"], {
        description:
          'file: numbered lines. symbol: one AST definition. filtered_html: filtered HTML output, not raw source. Default file.',
      }),
    ),
    symbol: Type.Optional(
      Type.String({
        description:
          'Definition to read in mode=symbol, for example "Greeter.greet".',
      }),
    ),
    selector: Type.Optional(
      Type.String({
        description:
          'Optional CSS selector for mode=filtered_html, for example "main, article" or "#content .card".',
      }),
    ),
    maxChars: Type.Optional(
      Type.Integer({
        description:
          "Maximum characters for mode=filtered_html. Default and maximum 10000.",
      }),
    ),
    offset: Type.Optional(
      Type.Integer({ description: "1-based first line. Default 1." }),
    ),
    limit: Type.Optional(
      Type.Integer({ description: "Max lines to return. Default 200." }),
    ),
  }),
  execute: async (params, ctx) => {
    const file = resolveInside(ctx.cwd, params.path);
    const mode = params.mode ?? "file";

    if (mode === "filtered_html") {
      return readFilteredHtmlFile(file, params.path, {
        selector: params.selector,
        maxChars: params.maxChars,
      });
    }

    const text = await readFile(file, "utf8");

    if (mode === "symbol") {
      const symbol = params.symbol?.trim();
      if (!symbol) {
        throw new Error('read mode="symbol" requires a non-empty "symbol".');
      }
      const parsed = requireParsedScript(params.path, text);
      const match = matchDefinition(parsed.definitions, symbol);
      if (match.status !== "ok") {
        throw new Error(formatMatchFailure(match, params.path));
      }
      const lines = splitLines(text);
      const start = Math.max(1, match.definition.startLine);
      const end = Math.min(lines.length, match.definition.endLine);
      const body = formatNumberedLines(lines, start, end);
      return `${params.path}:${start}-${end} ${match.definition.kind} ${match.definition.qualifiedName}\n${body}`;
    }

    if (mode !== "file") {
      throw new Error(`Unknown read mode: ${String(mode)}`);
    }

    if (text.length === 0) {
      return "File is empty.";
    }

    const lines = splitLines(text);
    const offset = Math.max(0, (params.offset ?? 1) - 1);
    const limit = Math.max(1, Math.min(params.limit ?? 200, 1000));
    if (offset >= lines.length) {
      return `Offset ${offset + 1} is beyond the end of ${params.path} (${lines.length} lines).`;
    }

    const end = Math.min(lines.length, offset + limit);
    const body = formatNumberedLines(lines, offset + 1, end);
    if (end < lines.length) {
      return `${body}\n... ${lines.length - end} more lines; use offset=${end + 1}.`;
    }
    return body;
  },
});

export const bashTool = defineTool({
  name: "bash",
  description: "Run a shell command in the sandboxed cwd.",
  parameters: Type.Object({
    command: Type.String({ description: "Command to run." }),
  }),
  execute: async (params, ctx) => {
    return sandboxCommand(ctx.cwd, params.command);
  },
});

function formatNumberedLines(lines: string[], start: number, end: number): string {
  return lines
    .slice(start - 1, end)
    .map((line, index) => `${start + index}\t${line}`)
    .join("\n");
}

export const builtinTools: AnyTool[] = [
  readTool,
  applyTool,
  searchTool,
  bashTool,
];

