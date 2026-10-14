// ponytail: minimal test harness standing in for the removed `ai` `tool()` SDK.
// A tool object is just `{ description, inputSchema, outputSchema, execute }`,
// so invoking it is a trivial pass-through to `execute`. No AI SDK dependency.
import type { z } from "zod/v4";

export async function testInvokeTool(
  toolObj: {
    description?: string;
    inputSchema?: z.ZodObject<any>;
    outputSchema?: z.ZodObject<any>;
    execute: (input: any, options?: { workingDir?: string }) => Promise<string>;
  },
  input: any,
  options?: { workingDir?: string },
) {
  return toolObj.execute(input, options);
}
