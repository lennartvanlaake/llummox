import type { defineTool, ExtensionToolContext } from "@earendil-works/pi-coding-agent";
import type { AgentToolResult } from "@earendil-works/pi-agent-core";
import { toPiContent } from "./utils";


function toTestToolResult(r: AgentToolResult): TestToolResult {
  const last = r.content[r.content.length - 1];
  return { text: (last as { text?: string }).text ?? "", result: r };
};

type TestToolResult = {
  result: AgentToolResult,
  text: string
}


/**
 * Invoke a single pi tool definition directly, outside a live session.
 *
 * - Mocks the session context: `ExtensionToolContext` with a no-op `ui` and an
 *   empty tool registry. Enough for tools that only read params.
 * - Mocks the signal: the returned controller's abort cancels the tool, and the
 *   tool's abort cancels the returned controller.
 * - `onUpdate` is optional; passing it lets callers observe partial results.
 */
export async function invokeTool(
  tool: ReturnType<typeof defineTool>,
  params: any,
  opts: { signal?: AbortController; onUpdate?: (result: AgentToolResult) => void } = {},
): Promise<TestToolResult> {
  const controller = new AbortController();
  const caller = opts.signal;
  const callerController = caller ?? new AbortController();

  if (caller) {
    // Bidirectional wiring: either controller aborts the other.
    callerController.signal.addEventListener("abort", () => controller.abort()!);
    controller.signal.addEventListener("abort", () => callerController.abort());
  }

  const result = (await tool.execute(
    "test-call",
    params,
    controller.signal,
    opts.onUpdate,
    mockContext(),
  ) as unknown as AgentToolResult); // SAFETY: execute returns the tool's own result shape; the cast only surfaces the generic TDetails the caller opted into.

  if (controller.signal.aborted) {
    return toTestToolResult(toPiContent("Aborted.", true))
  }

  return toTestToolResult(result);
}

function mockContext(): ExtensionToolContext {
  return {
    ui: {
    } as any,
    mode: "tui" as const,
    hasUI: false,
    cwd: process.cwd(),
    sessionManager: {} as never,
    modelRegistry: {} as never,
    model: undefined,
    scopedModels: [],
    thinkingLevel: undefined,
    isIdle: () => true,
    tools: [],
    executeTool: {} as any,
    isProjectTrusted: () => true,
    signal: undefined,
    abort: () => { },
    hasPendingMessages: () => false,
    shutdown: () => { },
    getContextUsage: () => undefined,
    compact: () => { },
    getSystemPrompt: () => "",
  };
}
