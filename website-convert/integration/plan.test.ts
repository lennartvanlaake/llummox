import { test, expect, describe, beforeEach } from "bun:test";
import { setupDatabase } from "../../todos/db";
import { run } from "..";

describe("Testing the planning function", () => {
  beforeEach(() => {
    setupDatabase(":memory:");
  });

  test("test on mvk website", async () => {
    await run({
      projectsBase: `${import.meta.dir}/fixtures`,
      url: "https://www.mvk.edu.in",
      project: "mvk",
    });
  }, 0);

  // test("test planning on very small project", async () => {
  //   await plan({
  //     url: "",
  //     project: "mf",
  //     originDir: `${import.meta.dir}/fixtures/mf/original`,
  //     targetDir: `${import.meta.dir}/fixtures/mf/target`,
  //     projectDir: `${import.meta.dir}/fixtures/mf`,
  //   });
  // }, 0);
});
