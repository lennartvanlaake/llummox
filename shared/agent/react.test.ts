import { describe, expect, test } from "bun:test";
import { reactLoop } from "./react";
import { completion, FakeChatClient } from "./testHelpers";
import { defineTool, Type } from "./tools";
import type { ChatMessage, ToolCall } from "./types";

const addTool = defineTool({
  name: "add",
  description: "Add two integers.",
  parameters: Type.Object({
    a: Type.Integer(),
    b: Type.Integer(),
  }),
  execute: (args) => args.a + args.b,
});

describe("reactLoop", () => {
  test("executes tool calls and returns the final text", async () => {
    const toolCall: ToolCall = {
      id: "call-1",
      type: "function",
      function: {
        name: "add",
        arguments: '{"a":2,"b":3}',
      },
    };
    const client = new FakeChatClient([
      completion(null, [toolCall]),
      completion("The answer is 5."),
    ]);
    const messages: ChatMessage[] = [
      { role: "user", content: "What is 2+3?" },
    ];

    const result = await reactLoop({
      client,
      messages,
      tools: [addTool],
      maxSteps: 3,
      cwd: "/tmp",
    });

    expect(result.text).toBe("The answer is 5.");
    expect(result.steps).toBe(2);
    expect(
      messages.some((m) => m.role === "tool" && m.content === "5"),
    ).toBe(true);
    expect(
      messages.some(
        (m) => m.role === "assistant" && m.tool_calls?.length === 1,
      ),
    ).toBe(true);
  });

  test("sends an error tool result for an unknown tool", async () => {
    const toolCall: ToolCall = {
      id: "call-2",
      type: "function",
      function: { name: "missing", arguments: "{}" },
    };
    const client = new FakeChatClient([
      completion(null, [toolCall]),
      completion("sorry"),
    ]);
    const messages: ChatMessage[] = [{ role: "user", content: "x" }];

    const result = await reactLoop({
      client,
      messages,
      tools: [],
      maxSteps: 2,
      cwd: "/tmp",
    });

    expect(
      messages.some(
        (m) => m.role === "tool" && m.content.includes("unknown tool"),
      ),
    ).toBe(true);
    expect(result.text).toBe("sorry");
  });

  test("throws after maxSteps", async () => {
    const toolCall: ToolCall = {
      id: "call-3",
      type: "function",
      function: { name: "add", arguments: '{"a":1,"b":2}' },
    };
    const client = new FakeChatClient([completion(null, [toolCall])]);

    await expect(
      reactLoop({
        client,
        messages: [{ role: "user", content: "x" }],
        tools: [addTool],
        maxSteps: 1,
        cwd: "/tmp",
      }),
    ).rejects.toThrow("maxSteps");
  });

  test("stops the loop when a tool calls stop", async () => {
    const tool = defineTool({
      name: "finish",
      description: "Finish the run.",
      parameters: Type.Object({}),
      execute: (_args, ctx) => {
        ctx.stop();
        return "done";
      },
    });
    const toolCall: ToolCall = {
      id: "call-stop",
      type: "function",
      function: { name: "finish", arguments: "{}" },
    };
    const client = new FakeChatClient([
      completion(null, [toolCall]),
    ]);
    const messages: ChatMessage[] = [{ role: "user", content: "x" }];

    const result = await reactLoop({
      client,
      messages,
      tools: [tool],
      maxSteps: 5,
      cwd: "/tmp",
    });

    expect(client.calls.length).toBe(1);
    expect(result.finishReason).toBe("stop");
    expect(
      messages.some(
        (m) => m.role === "tool" && m.content === "done",
      ),
    ).toBe(true);
  });

  test("rejects invalid tool arguments before executing", async () => {
    let calls = 0;
    const tool = defineTool({
      name: "add",
      description: "Add two integers.",
      parameters: Type.Object({
        a: Type.Integer(),
        b: Type.Integer(),
      }),
      execute: () => {
        calls++;
        return 0;
      },
    });
    const toolCall: ToolCall = {
      id: "call-4",
      type: "function",
      function: { name: "add", arguments: '{"a":"two","b":3}' },
    };
    const client = new FakeChatClient([
      completion(null, [toolCall]),
      completion("done"),
    ]);
    const messages: ChatMessage[] = [{ role: "user", content: "x" }];

    const result = await reactLoop({
      client,
      messages,
      tools: [tool],
      maxSteps: 2,
      cwd: "/tmp",
    });

    expect(calls).toBe(0);
    expect(
      messages.some(
        (m) =>
          m.role === "tool" &&
          m.content.includes("invalid arguments"),
      ),
    ).toBe(true);
    expect(result.text).toBe("done");
  });
});
