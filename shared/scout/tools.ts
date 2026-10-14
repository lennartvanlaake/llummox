import z from "zod/v4";
import { $ } from "bun";
import { sandboxCommand } from "../../sandbox/sandbox";
// ponytail: `tool()` from `ai` removed (no local AI SDK dependency). The tools
// are plain objects with an `execute` fn, consumed via shared/toolTester.

export const wc = {
  description: "Wraps the `wc` command line tool. Gives a word/line/char count",
  inputSchema: z.object({
    file: z.string().describe("File to get wc for"),
    type: z
      .literal(["c", "m", "l", "w"])
      .describe(
        "Modifier for wc command. c for bytes, m for chars, l for lines, w for words",
      ),
  }),
  execute: async ({ file, type }) => {
    return (await $`wc -${type} ${file}`).text();
  },
};

export const ls = {
  description: "Lists the contents of a directory",
  inputSchema: z.object({
    path: z.string().describe("Directory to list"),
  }),
  execute: async ({ path }) => {
    return (await $`ls -la ${path}`).text();
  },
};

export const grepRecursive = {
  description: "Recursively searches for a pattern in a directory",
  inputSchema: z.object({
    path: z.string().describe("Directory or file to search"),
    pattern: z.string().describe("Pattern to search for"),
  }),
  execute: async ({ path, pattern }: { path: string; pattern: string }) => {
    const out = (await $`grep -R -n ${pattern} ${path}`).text();
    return out.trim() ? out : "No matches found";
  },
};

export const simplifyHtml = {
  description:
    "Returns a vastly simplified version of the html in the body of the file. Keeps headers and text, strips everything else",
  inputSchema: z.object({
    path: z.string().describe("HTML file"),
  }),
  execute: async ({ path }: { path: string }) => {
    return (await $`cat ${path} | trafilura --html`).text();
  },
};

export const searchHtml = {
  description:
    "Returns the content of an element or set of elements in the html body selected by a CSS query",
  inputSchema: z.object({
    path: z.string().describe("HTML file"),
    query: z
      .string()
      .describe(
        "CSS query for the element ('nav' to get the contents of nav element, '.someclass' for elements with class='someclass' )",
      ),
  }),
  execute: async ({ path, query }: { path: string; query: string }) => {
    return (await $`cat ${path} | pup '${query}'`).text();
  },
};

export const readLines = {
  description: "Reads specified lines from a file",
  inputSchema: z.object({
    file: z.string(),
    startLine: z.number(),
    numberOfLines: z.number().describe("Number of lines to read. Max 100"),
  }),
  execute: async ({ file, startLine, numberOfLines }: {
    file: string;
    startLine: number;
    numberOfLines: number;
  }) => {
    if (numberOfLines > 100) {
      return "ERROR: numberOfLines cannot be higher than 100";
    }
    return (
      await $`sed -n ${startLine},${startLine + numberOfLines}p ${file}`
    ).text();
  },
};
