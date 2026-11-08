import type { Static, TSchema } from "@sinclair/typebox";

export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type ChatMessage =
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: ToolCall[] }
  | { role: "tool"; content: string; tool_call_id: string };

export type OpenAiTool = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

export type ResponseFormat =
  | { type: "json_object" }
  | {
      type: "json_schema";
      json_schema: {
        name: string;
        strict?: boolean;
        schema: Record<string, unknown>;
      };
    };

export type ToolChoice =
  | "auto"
  | "none"
  | "required"
  | { type: "function"; function: { name: string } };

export type ChatOptions = {
  tools?: OpenAiTool[];
  toolChoice?: ToolChoice;
  responseFormat?: ResponseFormat;
  temperature?: number;
  maxTokens?: number;
  extra?: Record<string, unknown>;
};

export type ChatChoice = {
  index: number;
  finish_reason?: string;
  message: {
    role: "assistant";
    content?: string | null;
    tool_calls?: ToolCall[];
    reasoning_content?: string;
  };
};

export type ChatCompletionResponse = {
  id?: string;
  model?: string;
  choices: ChatChoice[];
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
};

export interface ChatClient {
  chat(
    messages: ChatMessage[],
    options?: ChatOptions,
  ): Promise<ChatCompletionResponse>;
}

export type ToolResult = {
  content: string;
  details?: unknown;
  isError?: boolean;
};

export type ToolOutput =
  | string
  | number
  | boolean
  | object
  | null
  | void
  | ToolResult;

export type ToolContext = {
  cwd: string;
  /** Ask the loop to stop after this tool call, without an abort signal. */
  stop: () => void;
  onUpdate?: (result: ToolResult) => void;
};

export type Tool<Params extends TSchema = TSchema> = {
  name: string;
  description: string;
  parameters: Params;
  execute: (
    args: Static<Params>,
    context: ToolContext,
  ) => ToolOutput | Promise<ToolOutput>;
};

export type AnyTool = Tool<any>;

export type StepInfo = {
  step: number;
  messages: ChatMessage[];
  response: ChatCompletionResponse;
  toolCalls: ToolCall[];
};

export type OnStep = (info: StepInfo) => void | Promise<void>;

export type AgentRunResult = {
  text: string;
  messages: ChatMessage[];
  steps: number;
  finishReason?: string;
};

export type PromptOptions = {
  maxSteps?: number;
  onStep?: OnStep;
};

export interface Agent {
  readonly messages: readonly ChatMessage[];
  prompt(input: string, options?: PromptOptions): Promise<AgentRunResult>;
  getLastAssistantText(): string | undefined;
  dispose(): void;
}

export type LoopContext = {
  client: ChatClient;
  messages: ChatMessage[];
  tools: AnyTool[];
  maxSteps: number;
  cwd: string;
  temperature?: number;
  maxTokens?: number;
  onStep?: OnStep;
};

export type AgentLoop = (context: LoopContext) => Promise<AgentRunResult>;
