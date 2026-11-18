import { getTree } from "../shared/scout/functions";
import type { MainStateTypeOut } from ".";
import {
  createWorkerAgent,
  type TaskConfig,
  workOnPlan,
} from "../todos/agents";
import { initRagTool } from "../rag/tools";
import { builtinTools, readTool, searchTool } from "../shared/agent/builtin";
import { setupDatabase as setupRagDb } from "../rag/db";
import { setupDatabase as setupTodosDb } from "../todos/db";
import { scoutSchema } from "./schemas";

export async function plan(state: MainStateTypeOut) {
  setupTodosDb(state.db)
  setupRagDb(state.db)

  const tree = JSON.stringify(await getTree(state.originDir));

  const ragTool = await initRagTool(state.db, [{ dir: `${import.meta.dir}/knowledge/astro`, subject: "astro" }, { dir: `${import.meta.dir}/knowledge/sveltia`, subject: "sveltia" }])

  const scoutConfig: TaskConfig = {
    cwd: state.originDir,
    worker: {
      cwd: state.originDir,
      tools: [ragTool, readTool, searchTool],
      systemPromptAppend: `The directory tree looks like this: ${tree}. Your work is to report and analyse HTML files for navigation and content. Avoid reading raw files fully: use read with mode="filtered_html" for structure and text, and add selector (for example "nav, main, article") to focus on specific elements.`,
    },
    prompt: `We are creating a website with Astro and Sveltia (docs in knowledge tool) that mirrors the content and layout of an existing website. Your job is to get the infromation needed to plan this project.
    The website is downloaded to this folder ${state.originDir}. The directory tree looks like this: ${tree}. EXCLUSIVELY look at the files in this tree, assume it is complete. Ignore css, links, js - focus on site structure for now. Distribute the research into small subtasks (20KB per subtask).`,
    schema: scoutSchema,
    type: "read"
  };

  const coderConfig: TaskConfig = {
    cwd: state.projectDir,
    worker:
    {
      tools: [ragTool, ...builtinTools],
      cwd: state.projectDir,
      systemPromptAppend: `You are an expert web developer. Prefer apply with replace_definition or replace over overwrite. Use read mode="filtered_html" to inspect large HTML files. The directory tree looks like this: ${tree}.`,
    },

    prompt: `Add the content and of the website at ${state.originDir} to an astro website with Sveltia CMS at ${state.targetDir}. The directory tree looks like this: ${tree}. This is an example template, content should be replaced. Use the pages.json file for pages. Use custom collections for repeating elements such as people, links, etc. Ignore lay-out, styling and js interactions for now. Expected output: a working website using astro and Sveltia CMS at ${state.targetDir} displaying the content of the original website.`,
    type: "write"
  };

  await workOnPlan([scoutConfig
    , coderConfig
  ]);
}
