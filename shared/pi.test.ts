import { expect, describe, it } from "bun:test";

import { createPiSession } from "./pi";
import { createSubtaskTool } from "../todos/tools";
describe("Quick check if pi config is worker as expected", () => {
  it("recognizes absence of tool", async () => {
    const session = await createPiSession({
      cwd: "/tmp",
      systemPrompt: "You are a pirate. Say `ARR` before every message",
    });
    try {
      await session.prompt("Do you have a tool to edit subtasks? Answer Yes or No and return. Do not do ANYTHING else.");
      const lastMessage = session.getLastAssistantText()
      expect(lastMessage?.toUpperCase()).toContain("ARR")
      expect(lastMessage?.toUpperCase()).toContain("NO")
    } finally {
      session.dispose();
    }
  }, 0);

  it("recognizes a tool and system prompt", async () => {
    const session = await createPiSession({
      cwd: "/tmp",
      systemPrompt: "You are a pirate. Say `ARR` before every message",
      tools: [createSubtaskTool]
    });
    try {
      await session.prompt("Do you have a tool to edit subtasks? Answer Yes or No and return. Do not do ANYTHING else.");
      const lastMessage = session.getLastAssistantText()
      expect(lastMessage?.toUpperCase()).toContain("YES")
    } finally {
      session.dispose();
    }
  }, 0);
});
