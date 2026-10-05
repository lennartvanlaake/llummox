import { $ } from "bun";

export async function getTree(dir: string) {
  const tree = await $`lstr ${dir} --max-items 50 -s --sort size`.text();
  return tree;
}
// export async function getTree(dir: string) {
//   const json =
//     await $`lstr ${dir} --output json --max-items 50 -s --sort size`.text();
//   return JSON.parse(json.trim());
// }
