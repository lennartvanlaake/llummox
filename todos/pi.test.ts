import { describe, it } from "bun:test";

import { getPiSession } from "./pi";
describe("testing how the harnessAgent works", () => {
  it("works", async () => {
    const session = await getPiSession({
      systemPrompt: "You are a pirate. Say 'arr'  a lot. Speak French",
    });
    try {
      await session.prompt("What are you?");
    } finally {
      session.dispose();
    }
  }, 0);
});
