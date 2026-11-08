import { describe, expect, test } from "bun:test";
import { createReActAgent } from "./agent";
import { completion, FakeChatClient } from "./testHelpers";
import type { AgentLoop } from "./types";

describe("ReActAgent", () => {
  test("keeps history and exposes the last assistant text", async () => {
    const client = new FakeChatClient([
      completion("first"),
      completion("second"),
    ]);
    const agent = createReActAgent({
      client,
      systemPrompt: "be terse",
      maxSteps: 1,
    });

    expect(await agent.prompt("one")).toMatchObject({ text: "first" });
    expect(agent.getLastAssistantText()).toBe("first");
    expect(await agent.prompt("two")).toMatchObject({ text: "second" });
    expect(agent.getLastAssistantText()).toBe("second");

    expect(agent.messages[0]).toEqual({
      role: "system",
      content: "be terse",
    });
    expect(
      agent.messages.filter((m) => m.role === "user").length,
    ).toBe(2);
  });

  test("accepts a replacement loop", async () => {
    const calls: string[] = [];
    const loop: AgentLoop = async (context) => {
      calls.push(context.messages.at(-1)?.content ?? "");
      context.messages.push({ role: "assistant", content: "replaced" });
      return {
        text: "replaced",
        messages: context.messages,
        steps: 1,
      };
    };

    const agent = createReActAgent({
      client: new FakeChatClient([]),
      systemPrompt: "",
      loop,
    });

    const result = await agent.prompt("hello");

    expect(result.text).toBe("replaced");
    expect(calls).toEqual(["hello"]);
    expect(agent.getLastAssistantText()).toBe("replaced");
  });
});
