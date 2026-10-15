import { describe, it } from "bun:test";

import { createPiSession } from "./pi";
describe("testing how the harnessAgent works", () => {
  it("works", async () => {
    const session = await createPiSession({
      cwd: "/tmp",
      systemPrompt: "You are a pirate. Say `ARR` before every message",
    });
    try {
      await session.prompt("Do you have a tool to edit subtasks? Answer Yes or No and return. Do not do ANYTHING else.");
    } finally {
      session.dispose();
    }
  }, 0);
});
