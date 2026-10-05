import { getTree } from "../shared/scout/functions";
import type { MainStateType } from ".";
import { managerWorkerLoop, type WorkerConfig } from "../todos/agents";
import {
  grepRecursive,
  ls,
  readLines,
  searchHtml,
  simplifyHtml,
} from "../shared/scout/tools";

export async function plan(state: MainStateType) {
  const tree = JSON.stringify(await getTree(state.originDir));

  const workerConfig: WorkerConfig = {
    workingDir: state.originDir,
    tools: {
      ls,
      simplifyHtml,
      searchHtml,
      readLines,
      grepRecursive,
    },
    prompt: `Tree of your working directory is: ${tree}. Your work is to report and analyse HTML files. Avoid reading the files fully, prefer simplifyHtml and searchHtml. Report goes into the "notes" of the subtask`,
  };

  await managerWorkerLoop(
    `You are studying the website at ${state.originDir}. Have your workers research its structure and content. The directory tree looks like this: ${tree}. Your workers have a very limited memory. Keep their subtasks small.`,
    workerConfig,
  );

  // TODO take scout reports and turn them into a full on plan
}
