import { getTree } from "../shared/scout/functions";
import type { MainStateType } from ".";
import {
  createPiWorkerAgent,
  createWorkerAgent,
  type TaskConfig,
  workOnPlan,
} from "../todos/agents";
import {
  grepRecursive,
  ls,
  readLines,
  searchHtml,
  simplifyHtml,
} from "../shared/scout/tools";

export async function plan(state: MainStateType) {
  const tree = JSON.stringify(await getTree(state.originDir));

  const tools = {
    ls,
    simplifyHtml,
    searchHtml,
    readLines,
    grepRecursive,
  };

  const scoutConfig: TaskConfig = {
    cwd: state.originDir,
    worker: createWorkerAgent({
      extraTools: tools,
      systemPromptAppend: `The directory tree looks like this: ${tree}. Your work is to report and analyse HTML files. Avoid reading the files fully, prefer simplifyHtml and searchHtml. Report goes into the "notes" of the subtask`,
    }),

    prompt: `You are studying the website at ${state.originDir}. Have your workers research its structure and content. The directory tree looks like this: ${tree}. Distribute the research into small subtasks. Subtasks either cover a set of related smaller files (<5KB) or 1 >5KB file`,
  };

  const coderConfig: TaskConfig = {
    cwd: state.projectDir,
    worker: await createPiWorkerAgent({
      cwd: state.projectDir,
      systemPromptAppend: `You are an expert web developer. Prefer using edit over write when possible. The directory tree looks like this: ${tree}.`,
    }),

    prompt: `Convert the website at ${state.originDir} to an astro website with Sveltia CMS at ${state.targetDir}.  The directory tree looks like this: ${tree}. Distribute the research into small subtasks.`,
  };

  await workOnPlan([scoutConfig, coderConfig]);
}
