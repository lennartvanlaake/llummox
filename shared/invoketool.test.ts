import { describe, expect, it } from "bun:test";
import { defineTool, toToolResult, Type } from "./agent/tools";
import { invokeTool } from "./testing";

// ponytail: smallest runnable check — fails if return/onUpdate break.
const echoTool = defineTool({
  name: "echo_tool",
  description: "Returns the echoed string.",
  parameters: Type.Object({ foo: Type.String() }),
  execute: (args, ctx) => {
    ctx.onUpdate?.(toToolResult("hi"));
    return args.foo;
  },
});

describe("invokeTool", () => {
  it("returns the tool's result", async () => {
    const result = await invokeTool(echoTool, { foo: "bar" });
    expect(result.text).toBe("bar");
  });
});
