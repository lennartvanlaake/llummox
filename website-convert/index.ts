import { z } from "zod";
import { init } from "./init.ts";

const MainState = z.object({
  url: z.string(),
  project: z.string(),
  originDir: z.string().default(""),
  projectDir: z.string().default(""),
  targetDir: z.string().default(""),
});

export type MainStateType = z.infer<typeof MainState>;

export async function run(state: MainStateType) {
  await init({
    url: state.url,
    project: state.project,
    projectDir: state.projectDir,
    originDir: state.originDir,
    targetDir: state.targetDir,
  });
}

// await run({
//   url: "https://motherfuckingwebsite.com",
//   project: "mf",
//   originDir: "",
//   targetDir: "",
// });
