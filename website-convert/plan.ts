import { getTree } from "../shared/scout/functions";
import type { MainStateTypeOut } from ".";
import {
  createPiWorkerAgent,
  type TaskConfig,
  workOnPlan,
} from "../todos/agents";
import {
  grepRecursive,
  readLines,
  renderLsTool,
  searchHtml,
  simplifyHtml,
} from "../shared/scout/tools";
import { initRagTool } from "../rag/tools";
import { setupDatabase as setupRagDb } from "../rag/db";
import { setupDatabase as setupTodosDb } from "../todos/db";
import scoutSchema from "./scout-schema.schema.json"
import resultOnlySchema from "./result-only.json"

export async function plan(state: MainStateTypeOut) {
  setupTodosDb(state.db)
  setupRagDb(state.db)

  const tree = JSON.stringify(await getTree(state.originDir));

  // const ragTool = await initRagTool(state.db, [{ dir: `${import.meta.dir}/knowledge/astro`, subject: "astro" }, { dir: `${import.meta.dir}/knowledge/sveltia`, subject: "sveltia" }])
  const ragTool = await initRagTool(state.db, [])
  //
  //
  const tools = [
    ragTool,
    simplifyHtml,
    searchHtml,
    readLines,
    grepRecursive,
  ]

  const scoutConfig: TaskConfig = {
    cwd: state.originDir,
    worker: {
      cwd: state.originDir,
      tools,
      systemPromptAppend: `The directory tree looks like this: ${tree}. Your work is to report and analyse HTML files for navigation and content. Avoid reading the files fully, prefer simplifyHtml and searchHtml`,
    },
    prompt: `You are studying the website at ${state.originDir}. We are creating a website with Astro and Sveltia (docs in knowledge tool). We need to know: 1. which pages of the website we can easily expres in markdown vs "special" pages. 2. which recurring structures exist that are not best displayed in markdown content  (ex.: card with people, file lists, video widgets, blog posts). 3. what the navigation looks like. 4. what the footer looks like. 5. if there are any pages who deviate from the standard footer/nav. The directory tree looks like this: ${tree}. Ignore css, links, js - focus on site structure for now. Distribute the research into small subtasks. Subtasks either cover a set of related smaller files (<5KB) or 1 >5KB file`,
    schema: scoutSchema,
    type: "read"
  };


  const coderConfig: TaskConfig = {
    cwd: state.projectDir,
    worker:
    {
      tools: tools.concat(renderLsTool(state.projectDir)),
      builtinTools: ["edit", "write", "read", "bash", "find"],
      cwd: state.projectDir,
      systemPromptAppend: `You are an expert web developer. Prefer using edit over write when possible. The directory tree looks like this: ${tree}.`,
    },

    prompt: `Add the content and of the website at ${state.originDir} to an astro website with Sveltia CMS at ${state.targetDir}. The directory tree looks like this: ${tree}. This is an example template, content should be replaced. Use the pages.json file for pages. Use custom collections for repeating elements such as people, links, etc. Ignore lay-out, styling and js interactions for now. Distribute the work into small subtasks.`,
    type: "write"
  };

  console.error("[PLAN] scoutConfig.schema type:", typeof scoutConfig.schema, "keys:", scoutConfig.schema ? Object.keys(scoutConfig.schema) : "none");
  await workOnPlan([scoutConfig
    , coderConfig
  ]);
}
