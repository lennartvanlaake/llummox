import { $ } from "bun";
import { sandboxCommand } from "../../sandbox/sandbox";
import { defineTool } from "@earendil-works/pi-coding-agent";
import { Type } from "@earendil-works/pi-ai";
import { toPiContent } from "../utils";


export const wc = defineTool({
  description: "Wraps the `wc` command line tool. Gives a word/line/char count",
  name: "wc",
  label: "wc",
  parameters: Type.Object({
    file: Type.String({ description: "File to get wc for" }),
    type: Type.Enum(["c", "m", "l", "w"], {
      description:
        "Modifier for wc command. c for bytes, m for chars, l for lines, w for words",
    }),
  }),
  execute: async (_, params) => {
    return toPiContent((await $`wc -${params.type} ${params.file}`).text());
  },
});

export const grepRecursive = defineTool({
  description: "Recursively searches for a pattern in a directory",
  name: "grep_recursive",
  label: "grepRecursive",
  parameters: Type.Object({
    path: Type.String({ description: "Directory or file to search" }),
    pattern: Type.String({ description: "Pattern to search for" }),
  }),
  execute: async (_, params) => {
    try {
      const out = (await $`grep -R -n ${params.pattern} ${params.path}`).text();
      return toPiContent(out.trim() ? out : "No matches found", false);
    } catch (e) {
      return toPiContent("No matches found", false);
    }
  },
});

export const simplifyHtml = defineTool({
  description:
    "Returns a vastly simplified version of the html in the body of the file. Keeps headers and text, strips everything else",
  name: "simplify_html",
  label: "simplifyHtml",
  parameters: Type.Object({
    path: Type.String({ description: "HTML file" }),
  }),
  execute: async (_, params) => {
    return toPiContent(await $`cat ${params.path} | trafilatura --html`.text());
  },
});

export const searchHtml = defineTool({
  description:
    "Returns the content of an element or set of elements in the html body selected by a CSS query",
  name: "search_html",
  label: "searchHtml",
  parameters: Type.Object({
    path: Type.String({ description: "HTML file" }),
    query: Type.String({
      description:
        "CSS query for the element ('nav' to get the contents of nav element, '.someclass' for elements with class='someclass' )",
    }),
  }),
  execute: async (_, params) => {
    return toPiContent(await $`cat ${params.path} | pup '${params.query}'`.text());
  },
});

export function renderLsTool(dir: string) {
  return defineTool({
    description:
      "ls",
    name: "ls_tool",
    label: "ls_tool",
    parameters: Type.Object({
      path: Type.String(),
    }),
    execute: async (_, params) => {
      return toPiContent(await sandboxCommand(`ls ${params.path}`, params.path));
    },
  });
}



export const readLines = defineTool({
  description: "Reads specified lines from a file",
  name: "read_lines",
  label: "readLines",
  parameters: Type.Object({
    file: Type.String(),
    startLine: Type.Number(),
    numberOfLines: Type.Number({
      description: "Number of lines to read. Max 100",
    }),
  }),
  execute: async (_, params) => {
    if (params.numberOfLines > 100) {
      return toPiContent(
        "ERROR: numberOfLines cannot be higher than 100",
        true,
      );
    }
    return toPiContent(
      await $`sed -n ${params.startLine},${params.startLine + params.numberOfLines}p ${params.file}`.text(),
    );
  },
});
