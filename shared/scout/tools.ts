import { $ } from "bun";
import { sandboxCommand } from "../../sandbox/sandbox";
import {
  defineTool,
  stringEnum,
  toToolResult,
  Type,
} from "../agent/tools";

export function renderScoutTools(dir: string) {
  const wc = defineTool({
    description:
      "Wraps the `wc` command line tool. Gives a word/line/char count",
    name: "wc",
    parameters: Type.Object({
      file: Type.String({ description: "File to get wc for" }),
      type: stringEnum(["c", "m", "l", "w"], {
        description:
          "Modifier for wc command. c for bytes, m for chars, l for lines, w for words",
      }),
    }),
    execute: async (params) => {
      return (await $`wc -${params.type} ${params.file}`).text();
    },
  });

  const grepRecursive = defineTool({
    description: "Recursively searches for a pattern in a directory",
    name: "grep_recursive",
    parameters: Type.Object({
      path: Type.String({ description: "Directory or file to search" }),
      pattern: Type.String({ description: "Pattern to search for" }),
    }),
    execute: async (params) => {
      try {
        const out = await sandboxCommand(
          dir,
          `grep -R -n ${params.pattern} ${params.path}`,
        );
        if (out.startsWith("exit code") || !out.trim()) {
          return "No matches found";
        }
        return out;
      } catch {
        return "No matches found";
      }
    },
  });

  const simplifyHtml = defineTool({
    description:
      "Returns a vastly simplified version of the html in the body of the file. Keeps headers and text, strips everything else",
    name: "simplify_html",
    parameters: Type.Object({
      path: Type.String({ description: "HTML file" }),
    }),
    execute: async (params) => {
      return await $`cat ${params.path} | trafilatura --html`.text();
    },
  });

  const searchHtml = defineTool({
    description:
      "Returns the content of an element or set of elements in the html body selected by a CSS query",
    name: "search_html",
    parameters: Type.Object({
      path: Type.String({ description: "HTML file" }),
      query: Type.String({
        description:
          "CSS query for the element ('nav' to get the contents of nav element, '.someclass' for elements with class='someclass' )",
      }),
    }),
    execute: async (params) => {
      return await $`cat ${params.path} | pup '${params.query}'`.text();
    },
  });

  const ls = defineTool({
    description: "ls",
    name: "ls_tool",
    parameters: Type.Object({
      path: Type.String(),
    }),
    execute: async (params) => {
      return await sandboxCommand(dir, `ls ${params.path}`);
    },
  });

  const readLines = defineTool({
    description: "Reads specified lines from a file",
    name: "read_lines",
    parameters: Type.Object({
      file: Type.String(),
      startLine: Type.Number(),
      numberOfLines: Type.Number({
        description: "Number of lines to read. Max 100",
      }),
    }),
    execute: async (params) => {
      if (params.numberOfLines > 100) {
        return toToolResult(
          "ERROR: numberOfLines cannot be higher than 100",
          true,
        );
      }
      return await $`sed -n ${params.startLine},${params.startLine + params.numberOfLines}p ${params.file}`.text();
    },
  });

  return { wc, grepRecursive, simplifyHtml, searchHtml, ls, readLines };
}
