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
      project: "mf",
      originDir: `${import.meta.dir}/fixtures/mf/original`,
      targetDir: "",
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
