import { init } from "./init.ts";
import { plan } from "./plan.ts";


export type MainStateTypeIn = {
  url: string,
  project: string,
  db: string,
  projectsBase: string,
}

export type MainStateTypeOut = {
  url: string,
  project: string,
  db: string
  projectsBase: string,
  projectDir: string,
  originDir: string,
  targetDir: string
}

export async function run(state: MainStateTypeIn) {
  await init(state);
  await plan(state as MainStateTypeOut);
}


