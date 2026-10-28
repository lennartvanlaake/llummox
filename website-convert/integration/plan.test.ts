import { test, expect, describe, beforeEach } from "bun:test";
import { setupDatabase } from "../../todos/db";
import { run } from "..";
import { init } from "../init";

describe("Testing the planning function", () => {
  beforeEach(() => {
    setupDatabase(":memory:");
  });

  test("test on mvk website", async () => {
    // await run({
    //   project: `${import.meta.dir}/fixtures`,
    //   url: "https://www.mvk.edu.in",
    //   project: "mvk",
    // });
  }, 0);

  test("test planning on very small project", async () => {
    await init({
      project: "catena",
      url: "https://www.vslcatena.nl/",
      db: ":memory:"
    });
  }, 0);
});
