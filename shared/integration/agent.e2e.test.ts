import { describe, expect, test } from "bun:test";
import { createReActAgent } from "../agent/agent";
import { LlamaClient } from "../agent/llama";
import { structured } from "../agent/structured";
import { defineTool, Type } from "../agent/tools";

const client = new LlamaClient({
  timeoutMs: 5 * 60_000,
  retries: 1,
});

describe("live llama.cpp on :8080", () => {
  test("structured output", async () => {
    const result = await structured<{ answer: number }>({
      client,
      schema: Type.Object({ answer: Type.Integer() }),
      prompt:
        "What is 1+1? Return only JSON with an integer field named answer.",
      maxTokens: 48,
      temperature: 0,
    });

    expect(result.answer).toBe(2);
  }, 180_000);

  test("ReAct loop calls a tool", async () => {
    const echo = defineTool({
      name: "echo_tool",
      description: "Returns the echoed string.",
      parameters: Type.Object({
        foo: Type.String(),
      }),
      execute: (args) => args.foo,
    });

    const agent = createReActAgent({
      client,
      systemPrompt: "You are a tool-using assistant.",
      tools: [echo],
      maxSteps: 3,
      temperature: 0,
    });

    await agent.prompt(
      "Call the echo tool with foo set to bar. Do not explain.",
    );

    const toolMessage = agent.messages.find((m) => m.role === "tool");
    expect(toolMessage?.content).toBe("bar");
  }, 300_000);
});
