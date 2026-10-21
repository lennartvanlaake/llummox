import { getTree } from "../shared/scout/functions";
import type { MainStateType } from ".";
import {
  createPiWorkerAgent,
  type TaskConfig,
  workOnPlan,
} from "../todos/agents";
import {
  grepRecursive,
  readLines,
  searchHtml,
  simplifyHtml,
} from "../shared/scout/tools";
import { initRagTool } from "../rag/tools";

export async function plan(state: MainStateType) {
  const tree = JSON.stringify(await getTree(state.originDir));


  const ragTool = await initRagTool(`${import.meta.dir}/rag.db`, [{ dir: `${import.meta.dir}/knowledge/astro`, subject: "astro" }, { dir: `${import.meta.dir}/knowledge/sveltia`, subject: "sveltia" }])

  const tools = [
    ragTool,
    simplifyHtml,
    searchHtml,
    readLines,
    grepRecursive,
  ]

  const scoutConfig: TaskConfig = {
    cwd: state.originDir,
    worker: await createPiWorkerAgent({
      cwd: state.originDir,
      tools,
      systemPromptAppend: `The directory tree looks like this: ${tree}. Your work is to report and analyse HTML files for navigation and content. Avoid reading the files fully, prefer simplifyHtml and searchHtml. Report goes into the "notes" of the subtask`,
    }),

    prompt: `You are studying the website at ${state.originDir}. Have your workers research its structure and content. Primary interest is distribution of content over pages and any repeating structures. The directory tree looks like this: ${tree}. Distribute the research into small subtasks. Subtasks either cover a set of related smaller files (<5KB) or 1 >5KB file`,
  };

  const coderConfig: TaskConfig = {
    cwd: state.projectDir,
    worker: await createPiWorkerAgent({
      cwd: state.projectDir,
      systemPromptAppend: `You are an expert web developer. Prefer using edit over write when possible. The directory tree looks like this: ${tree}.`,
    }),

    prompt: `Add the content and of the website at ${state.originDir} to an astro website with Sveltia CMS at ${state.targetDir}. The directory tree looks like this: ${tree}. This is an example template, content should be replaced. Use the pages.json file for pages. Use custom collections for repeating elements such as people, links, etc. Ignore lay-out, styling and js interactions for now. Distribute the work into small subtasks.`,
  };

  await workOnPlan([scoutConfig, coderConfig]);
}
