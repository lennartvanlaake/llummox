import { logMessage } from "./logging";
import { reactLoop } from "./react";
import type {
  Agent,
  AgentLoop,
  AgentRunResult,
  AnyTool,
  ChatClient,
  ChatMessage,
  OnStep,
  PromptOptions,
} from "./types";

export type ReActAgentConfig = {
  client: ChatClient;
  systemPrompt: string;
  tools?: AnyTool[];
  cwd?: string;
  maxSteps?: number;
  /** Replace the ReAct loop without replacing the session/agent API. */
  loop?: AgentLoop;
  temperature?: number;
  maxTokens?: number;
  onStep?: OnStep;
};

export class ReActAgent implements Agent {
  readonly loop: AgentLoop;
  private readonly history: ChatMessage[] = [];
  private readonly tools: AnyTool[];
  private readonly cwd: string;
  private lastAssistantText?: string;

  constructor(private readonly config: ReActAgentConfig) {
    this.loop = config.loop ?? reactLoop;
    this.tools = config.tools ?? [];
    this.cwd = config.cwd ?? process.cwd();
    if (config.systemPrompt.trim()) {
      this.history.push({
        role: "system",
        content: config.systemPrompt,
      });
    }
  }

  get messages(): readonly ChatMessage[] {
    return this.history;
  }

  async prompt(
    input: string,
    options: PromptOptions = {},
  ): Promise<AgentRunResult> {
    const user: ChatMessage = { role: "user", content: input };
    this.history.push(user);
    logMessage(user);

    const result = await this.loop({
      client: this.config.client,
      messages: this.history,
      tools: this.tools,
      maxSteps: options.maxSteps ?? this.config.maxSteps ?? 16,
      cwd: this.cwd,
      temperature: this.config.temperature,
      maxTokens: this.config.maxTokens,
      onStep: options.onStep ?? this.config.onStep,
    });

    this.lastAssistantText = result.text;
    return result;
  }

  getLastAssistantText(): string | undefined {
    return this.lastAssistantText;
  }

  dispose(): void {
    // ponytail: no resources to release; kept so session-style callers work.
  }
}

export function createReActAgent(config: ReActAgentConfig): Agent {
  return new ReActAgent(config);
}
