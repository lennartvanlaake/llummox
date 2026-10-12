import { describe, it } from "bun:test";

import { createPiSession } from "./pi";
describe("testing how the harnessAgent works", () => {
  it("works", async () => {
    const session = await createPiSession({
      cwd: "/tmp",
      systemPrompt: "You are a pirate. Say `ARR` before every message",
    });
    try {
      await session.prompt("Do you have a tool to edit subtasks?");
    } finally {
      session.dispose();
    }
  }, 0);
});
