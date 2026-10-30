import { getTree } from "../shared/scout/functions";
import type { MainStateTypeOut } from ".";
import {
  createPiWorkerAgent,
  type TaskConfig,
  workOnPlan,
} from "../todos/agents";
import {
  renderScoutTools
} from "../shared/scout/tools";
import { initRagTool } from "../rag/tools";
import { setupDatabase as setupRagDb } from "../rag/db";
import { setupDatabase as setupTodosDb } from "../todos/db";
import { scoutSchema } from "./schemas";

export async function plan(state: MainStateTypeOut) {
  setupTodosDb(state.db)
  setupRagDb(state.db)

  const tree = JSON.stringify(await getTree(state.originDir));

  const ragTool = await initRagTool(state.db, [{ dir: `${import.meta.dir}/knowledge/astro`, subject: "astro" }, { dir: `${import.meta.dir}/knowledge/sveltia`, subject: "sveltia" }])

  const scoutTools = {
    ragTool,
    ...renderScoutTools(state.originDir)
  } as Record<string, any>



  const scoutConfig: TaskConfig = {
    cwd: state.originDir,
    worker: {
      cwd: state.originDir,
      tools: Object.values(scoutTools),
      systemPromptAppend: `The directory tree looks like this: ${tree}. Your work is to report and analyse HTML files for navigation and content. Avoid reading the files fully, prefer simplifyHtml and searchHtml`,
    },
    prompt: `We are creating a website with Astro and Sveltia (docs in knowledge tool) that mirrors the content and layout of an existing website. Your job is to get the infromation needed to plan this project.
    The website is downloaded to this folder ${state.originDir}. The directory tree looks like this: ${tree}. EXCLUSIVELY look at the files in this tree, assume it is complete. Ignore css, links, js - focus on site structure for now. Distribute the research into small subtasks (20KB per subtask).`,
    schema: scoutSchema,
    type: "read"
  };



  const coderTools = {
    ragTool,
    ...renderScoutTools(state.projectDir)
  } as Record<string, any>

  const coderConfig: TaskConfig = {
    cwd: state.projectDir,
    worker:
    {
      tools: Object.values(coderTools),
      builtinTools: ["edit", "write", "read", "bash", "find"],
      cwd: state.projectDir,
      systemPromptAppend: `You are an expert web developer. Prefer using edit over write when possible. The directory tree looks like this: ${tree}.`,
    },

    prompt: `Add the content and of the website at ${state.originDir} to an astro website with Sveltia CMS at ${state.targetDir}. The directory tree looks like this: ${tree}. This is an example template, content should be replaced. Use the pages.json file for pages. Use custom collections for repeating elements such as people, links, etc. Ignore lay-out, styling and js interactions for now. Expected output: a working website using astro and Sveltia CMS at ${state.targetDir} displaying the content of the original website.`,
    type: "write"
  };

  await workOnPlan([scoutConfig
    , coderConfig
  ]);
}
