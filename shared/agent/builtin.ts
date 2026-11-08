import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { sandboxCommand } from "../../sandbox/sandbox";
import { defineTool, Type } from "./tools";
import type { AnyTool } from "./types";

function resolveInside(cwd: string, file: string): string {
  const path = resolve(cwd, file);
  const rel = relative(cwd, path);
  if (rel.startsWith("..") || isAbsolute(rel)) {
    throw new Error(`Path escapes cwd: ${file}`);
  }
  return path;
}

export const readTool = defineTool({
  name: "read",
  description: "Read a file and return numbered lines.",
  parameters: Type.Object({
    path: Type.String({ description: "File path relative to cwd." }),
    offset: Type.Optional(
      Type.Integer({ description: "1-based first line. Default 1." }),
    ),
    limit: Type.Optional(
      Type.Integer({ description: "Max lines to return. Default 200." }),
    ),
  }),
  execute: async (params, ctx) => {
    const file = resolveInside(ctx.cwd, params.path);
    const text = await readFile(file, "utf8");
    const offset = Math.max(0, (params.offset ?? 1) - 1);
    const limit = params.limit ?? 200;
    return text
      .split("\n")
      .slice(offset, offset + limit)
      .map((line, index) => `${offset + index + 1}\t${line}`)
      .join("\n");
  },
});

export const writeTool = defineTool({
  name: "write",
  description: "Write content to a file, creating parent directories.",
  parameters: Type.Object({
    path: Type.String({ description: "File path relative to cwd." }),
    content: Type.String({ description: "Full file content." }),
  }),
  execute: async (params, ctx) => {
    const file = resolveInside(ctx.cwd, params.path);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, params.content, "utf8");
    return `Wrote ${file}`;
  },
});

export const editTool = defineTool({
  name: "edit",
  description: "Replace one exact string in a file.",
  parameters: Type.Object({
    path: Type.String({ description: "File path relative to cwd." }),
    oldString: Type.String({ description: "Exact text to replace." }),
    newString: Type.String({ description: "Replacement text." }),
  }),
  execute: async (params, ctx) => {
    const file = resolveInside(ctx.cwd, params.path);
    const text = await readFile(file, "utf8");
    if (!text.includes(params.oldString)) {
      throw new Error(`oldString not found in ${params.path}`);
    }
    await writeFile(
      file,
      text.replace(params.oldString, params.newString),
      "utf8",
    );
    return `Edited ${file}`;
  },
});

export const findTool = defineTool({
  name: "find",
  description: "Find files matching a glob pattern.",
  parameters: Type.Object({
    pattern: Type.String({
      description: "Glob pattern, e.g. src/**/*.ts.",
    }),
  }),
  execute: async (params, ctx) => {
    const glob = new Bun.Glob(params.pattern);
    const matches: string[] = [];
    for await (const file of glob.scan({ cwd: ctx.cwd })) {
      matches.push(file);
    }
    return matches.length
      ? matches.sort().join("\n")
      : "No matches found";
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

export const builtinTools: AnyTool[] = [
  readTool,
  writeTool,
  editTool,
  findTool,
  bashTool,
];
