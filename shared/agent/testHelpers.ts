import type {
  ChatClient,
  ChatCompletionResponse,
  ChatMessage,
  ChatOptions,
  ToolCall,
} from "./types";

export function completion(
  content: string | null,
  toolCalls?: ToolCall[],
): ChatCompletionResponse {
  return {
    choices: [
      {
        index: 0,
        finish_reason: toolCalls?.length ? "tool_calls" : "stop",
        message: {
          role: "assistant",
          content,
          ...(toolCalls?.length ? { tool_calls: toolCalls } : {}),
        },
      },
    ],
  };
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export class FakeChatClient implements ChatClient {
  readonly calls: Array<{
    messages: ChatMessage[];
    options?: ChatOptions;
  }> = [];

  constructor(
    private readonly responses: ChatCompletionResponse[],
  ) {}

  async chat(
    messages: ChatMessage[],
    options?: ChatOptions,
  ): Promise<ChatCompletionResponse> {
    this.calls.push({ messages: structuredClone(messages), options });
    const response = this.responses.shift();
    if (!response) {
      throw new Error("FakeChatClient has no response left");
    }
    return response;
  }
}
