import { toToolResult } from "./agent/tools";
import type { AnyTool, ToolResult } from "./agent/types";

export type TestToolResult = {
  result: ToolResult;
  text: string;
};


/**
 * Invoke a single tool directly, outside a live agent session.
 *
 * `onUpdate` is optional; passing it lets callers observe partial results.
 * Tool exceptions are converted to an error result, mirroring the loop.
 */
export async function invokeTool(
  tool: AnyTool,
  params: any,
  opts: {
    cwd?: string;
    onUpdate?: (result: ToolResult) => void;
  } = {},
): Promise<TestToolResult> {
  try {
    const output = await tool.execute(params, {
      cwd: opts.cwd ?? process.cwd(),
      stop: () => { },
      onUpdate: opts.onUpdate,
    });
    const result = toToolResult(output);
    return { result, text: result.content };
  } catch (error) {
    const result = toToolResult((error as Error).message, true);
    return { result, text: result.content };
  }
}
