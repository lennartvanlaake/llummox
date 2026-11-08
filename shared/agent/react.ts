import { logMessage, logToolCall, logger } from "./logging";
import { toOpenAiTool, toToolResult, validateSchema } from "./tools";
import type {
  AgentLoop,
  AgentRunResult,
  AnyTool,
  ChatMessage,
  LoopContext,
  ToolCall,
} from "./types";

export class MaxStepsError extends Error {
  constructor(
    readonly steps: number,
    readonly messages: ChatMessage[],
  ) {
    super(`Agent exceeded maxSteps (${steps})`);
    this.name = "MaxStepsError";
  }
}

/**
 * Native OpenAI tool-calling loop. The loop is a plain function so callers can
 * provide another implementation without changing the agent/session API.
 */
export const reactLoop: AgentLoop = async (
  context: LoopContext,
): Promise<AgentRunResult> => {
  const byName = new Map<string, AnyTool>();
  for (const tool of context.tools) {
    if (byName.has(tool.name)) {
      throw new Error(`Duplicate tool: ${tool.name}`);
    }
    byName.set(tool.name, tool);
  }

  let stopped = false;
  const stop = () => {
    stopped = true;
  };

  for (let step = 0; step < context.maxSteps; step++) {
    const response = await context.client.chat(context.messages, {
      tools: context.tools.map(toOpenAiTool),
      toolChoice: "auto",
      temperature: context.temperature,
      maxTokens: context.maxTokens,
    });

    const choice = response.choices[0];
    if (!choice) {
      throw new Error("llama.cpp returned no choices");
    }

    const message = choice.message;
    const toolCalls = message.tool_calls ?? [];
    const assistant: ChatMessage = {
      role: "assistant",
      content: message.content ?? "",
      ...(toolCalls.length ? { tool_calls: toolCalls } : {}),
    };

    context.messages.push(assistant);
    logMessage(assistant);
    await context.onStep?.({
      step,
      messages: context.messages,
      response,
      toolCalls,
    });

    if (toolCalls.length === 0) {
      return {
        text: message.content ?? "",
        messages: context.messages,
        steps: step + 1,
        finishReason: choice.finish_reason,
      };
    }

    for (const call of toolCalls) {
      await executeToolCall(context, byName, call, stop);
      if (stopped) {
        return {
          text: message.content ?? "",
          messages: context.messages,
          steps: step + 1,
          finishReason: "stop",
        };
      }
    }
  }

  throw new MaxStepsError(context.maxSteps, context.messages);
};

async function executeToolCall(
  context: LoopContext,
  byName: Map<string, AnyTool>,
  call: ToolCall,
  stop: () => void,
): Promise<void> {
  const tool = byName.get(call.function.name);
  const parsed = parseArguments(call);
  logToolCall(
    call.function.name,
    parsed.ok ? parsed.value : call.function.arguments,
  );

  if (!tool) {
    context.messages.push({
      role: "tool",
      tool_call_id: call.id,
      content: `ERROR: unknown tool "${call.function.name}"`,
    });
    return;
  }

  if (!parsed.ok) {
    context.messages.push({
      role: "tool",
      tool_call_id: call.id,
      content: `ERROR: invalid arguments: ${parsed.error}`,
    });
    return;
  }

  const validation = validateSchema(tool.parameters, parsed.value);
  if (!validation.valid) {
    context.messages.push({
      role: "tool",
      tool_call_id: call.id,
      content: `ERROR: invalid arguments for "${tool.name}": ${validation.errors.join("; ")}`,
    });
    return;
  }

  try {
    const output = await tool.execute(parsed.value, {
      cwd: context.cwd,
      stop,
      onUpdate: (result) =>
        logger.debug(
          `Tool ${call.function.name} update: ${result.content}`,
        ),
    });
    const result = toToolResult(output);
    context.messages.push({
      role: "tool",
      tool_call_id: call.id,
      content: result.content,
    });
  } catch (error) {
    logger.error(
      `Tool ${call.function.name} failed: ${(error as Error).message}`,
    );
    context.messages.push({
      role: "tool",
      tool_call_id: call.id,
      content: `ERROR: ${(error as Error).message}`,
    });
  }
}

type ParsedArguments =
  | { ok: true; value: unknown }
  | { ok: false; error: string };

function parseArguments(call: ToolCall): ParsedArguments {
  const raw = call.function.arguments;
  if (!raw) {
    return { ok: true, value: {} };
  }
  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}
