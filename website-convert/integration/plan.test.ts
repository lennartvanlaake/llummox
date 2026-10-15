import { test, expect, describe, beforeEach } from "bun:test";
import { plan } from "../plan";
// ponytail: `ai`/`@ai-sdk` removed — telemetry registration dropped from tests.
import { setupDatabase } from "../../todos/db";

describe("Testing the planning function", () => {
  beforeEach(() => {
    setupDatabase(":memory:");
  });

  // test("test planning on very small project", async () => {
  //   await plan({
  //     url: "",
  //     project: "portfolio",
  //     originDir: `${import.meta.dir}/fixtures/portfolio/original`,
  //     targetDir: `${import.meta.dir}/fixtures/portfolio/target`,
  //     projectDir: `${import.meta.dir}/fixtures/portfolio`,
  //   });
  // }, 0);

  test("test planning on very small project", async () => {
    await plan({
      url: "",
      project: "mf",
      originDir: `${import.meta.dir}/fixtures/mf/original`,
      targetDir: `${import.meta.dir}/fixtures/mf/target`,
      projectDir: `${import.meta.dir}/fixtures/mf`,
    });
  }, 0);
});
