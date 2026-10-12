import { test, expect, describe, beforeEach } from "bun:test";
import { plan } from "../plan";
import { DevToolsTelemetry } from "@ai-sdk/devtools";
import { registerTelemetry } from "ai";
import { setupDatabase } from "../../todos/db";

describe("Testing the planning function", () => {
  beforeEach(() => {
    setupDatabase(":memory:");
    registerTelemetry(DevToolsTelemetry() as any);
  });

  test("test planning on very small project", async () => {
    await plan({
      url: "",
      project: "portfolio",
      originDir: `${import.meta.dir}/fixtures/portfolio/original`,
      targetDir: `${import.meta.dir}/fixtures/portfolio/target`,
      projectDir: `${import.meta.dir}/fixtures/portfolio`,
    });
  }, 0);

  // test("test planning on larger project", async () => {
  //   await plan({
  //     url: "",
  //     project: "mf",
  //     originDir: `${import.meta.dir}/fixtures/portfolio/original`,
  //     targetDir: "",
  //   });
  // }, 0);
});
