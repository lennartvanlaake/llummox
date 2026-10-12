import { readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { $ } from "bun";
import type { MainStateType } from ".";

function getBaseProjectDir(project: string) {
  return `${import.meta.dir}/projects/${project}`;
}
function getBaseOriginDir(project: string) {
  return `${getBaseProjectDir(project)}/original`;
}

function getBaseTargetDir(project: string) {
  return `${getBaseProjectDir(project)}/target`;
}

function directoryNotEmpty(dir: string) {
  if (!existsSync(dir)) return false;
  return (async () => (await readdir(dir)).length > 0)();
}

function checkOriginNeedsInit(state: MainStateType): boolean {
  return !directoryNotEmpty(getBaseOriginDir(state.project));
}

function checkTargetNeedsInit(state: MainStateType): boolean {
  // Run target init only when target is empty; a fresh clone means dirs are set.
  const targetDir = getBaseTargetDir(state.project);
  return existsSync(targetDir) ? !directoryNotEmpty(targetDir) : true;
}

export async function init(state: MainStateType): Promise<MainStateType> {
  if (checkOriginNeedsInit(state)) {
    const originDir = getBaseOriginDir(state.project);
    await $`mkdir -p ${originDir}`;
    await $`wget --mirror --convert-links --adjust-extension --page-requisites --no-parent ${state.url} -P ${originDir}`;
  }

  if (checkTargetNeedsInit(state)) {
    const targetDir = getBaseTargetDir(state.project);
    debugger;
    await $`mkdir -p ${targetDir}`;
    // TODO adjust to astro template
    await $`git clone git@github.com:lennartvanlaake/hugolify-template.git ${targetDir}`;
    state.targetDir = `${targetDir}`;
  }

  state.projectDir = getBaseProjectDir(state.project);
  if (state.originDir === "") state.originDir = getBaseOriginDir(state.project);
  if (state.targetDir === "") state.targetDir = getBaseTargetDir(state.project);

  await $`cd ${state.targetDir} && git pull origin master`;
  return state;
}
