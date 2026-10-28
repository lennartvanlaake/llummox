import { test, expect, describe, beforeEach } from "bun:test";
import { $ } from "bun"
import { run } from ".."
// test("test on mvk website", async () => {
//   // await run({
//   //   project: `${import.meta.dir}/fixtures`,
//   //   url: "https://www.mvk.edu.in",
//   //   project: "mvk",
//   // });
// }, 0);

test("test planning on very small project", async () => {
  $.cwd(import.meta.dir);
  const db = "tuesday.db"
  await $`cp rag-seed.db ${db}`;
  await run({
    project: "tuesday",
    projectsBase: `${import.meta.dir}/fixtures`,
    url: "https://isittuesday.org/",
    db: `${import.meta.dir}/${db}.db`
  });
  await $`rm ${db}`;
}, 0);
