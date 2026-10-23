import { readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { $ } from "bun";
import type { MainStateTypeIn, MainStateTypeOut } from ".";

function getBaseProjectDir(project: string, base?: string) {

  const projectsDir = base ?? `${import.meta.dir}/projects`
  return `${projectsDir}/${project}`;
}
function getBaseOriginDir(project: string, base?: string) {
  return `${getBaseProjectDir(project, base)}/original`;
}

function getBaseTargetDir(project: string, base?: string) {
  return `${getBaseProjectDir(project, base)}/target`;
}

function directoryNotEmpty(dir: string) {
  if (!existsSync(dir)) return false;
  return (async () => (await readdir(dir)).length > 0)();
}

function checkOriginNeedsInit(state: MainStateTypeOut): boolean {
  return !directoryNotEmpty(getBaseOriginDir(state.project, state.projectsBase));
}

function checkTargetNeedsInit(state: MainStateTypeOut): boolean {
  if (directoryNotEmpty(state.targetDir!)) {
    return false
  }
  return true;
}

export async function init(inState: MainStateTypeIn): Promise<MainStateTypeOut> {
  const state = inState as MainStateTypeOut
  state.originDir = getBaseOriginDir(state.project, state.projectsBase);
  state.targetDir = getBaseTargetDir(state.project, state.projectsBase);
  state.projectDir = getBaseProjectDir(state.project, state.projectsBase);

  if (checkOriginNeedsInit(state)) {
    const originDir = getBaseOriginDir(state.project, state.projectsBase);
    await $`mkdir -p ${originDir}`;
    await $`wget --mirror --convert-links --adjust-extension --page-requisites --no-parent ${state.url} -P ${originDir}`;
  }

  if (checkTargetNeedsInit(state)) {
    const targetDir = getBaseTargetDir(state.project, state.projectsBase);
    await $`mkdir -p ${targetDir}`;
    await $`git clone git@github.com:lennartvanlaake/astro-sveltia-template.git ${targetDir}`;
    state.targetDir = `${targetDir}`;
  }
  await $`cd ${state.targetDir} && git pull origin master`;
  return state;
}
