import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { defineTool } from "@earendil-works/pi-coding-agent";
import type { AgentToolResult } from "@earendil-works/pi-agent-core";
import { invokeTool } from "./testing";

// ponytail: smallest runnable check — fails if signal/return/onUpdate break.
const echoTool = defineTool({
  label: "echo",
  name: "echo_tool",
  description: "Returns the echoed string.",
  parameters: { foo: { type: "string" } },
  execute: async (_toolCallId, params, _signal, _onUpdate, _ctx) => {
    _onUpdate?.({ content: [{ type: "text", text: "hi" }], details: "hi" });
    const { foo } = params as { foo: string };
    return { content: [{ type: "text", text: foo }], details: foo };
  },
});


describe("invokeTool", () => {
  let controller: AbortController;

  beforeEach(() => {
    controller = new AbortController();
  });

  afterEach(() => controller.abort());

  it("returns the tool's AgentToolResult", async () => {
    const result = await invokeTool(echoTool, { foo: "bar" }, { signal: controller });
    expect(result.text).toBe("bar");
  });

  it("aborts the caller's signal when the tool aborts", async () => {
    let callerSawAbort = false;
    const tool = defineTool({
      label: "s",
      name: "s_tool",
      description: "s",
      parameters: {},
      // Simulate a slow tool that aborts itself.
      execute: async (_id, _p, signal) => {
        signal?.addEventListener("abort", () => { callerSawAbort = true; });
        await new Promise((r) => setTimeout(r, 50));
        controller.abort();
        return { content: [{ type: "text", text: "x" }], details: {} };
      },
    });
    const result = await invokeTool(tool, {}, { signal: controller });
    expect(result.text).toBe("Aborted.");
    expect(callerSawAbort).toBe(true);
  });

});
