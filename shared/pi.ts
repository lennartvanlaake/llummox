import {
  createAgentSession,
  DefaultResourceLoader,
  ModelRuntime,
  type ToolDefinition,
} from "@earendil-works/pi-coding-agent";
import { logger } from "../shared/utils";

export type PiSessionConfig = {
  cwd: string;
  model?: string;
  systemPrompt: string;
  tools?: ToolDefinition[];
  builtinTools?: string[];
};

export async function createPiSession(config: PiSessionConfig) {
  const modelRuntime = await ModelRuntime.create();

  const fileBasedResourceLoader = new DefaultResourceLoader({
    cwd: config.cwd,
    agentDir: `${import.meta.dir}/piConfig`,
    systemPromptOverride: () => config.systemPrompt ?? "",
    extensionFactories: [
      (pi) => {
        for (const tool of config.tools ?? []) {
          pi.registerTool(tool)
        }
      },
    ],
  });

  await fileBasedResourceLoader.reload();

  modelRuntime.registerProvider("local", {
    api: "openai-completions",
    baseUrl: "http://127.0.0.1:8080/v1",
    models: [
      {
        id: config.model ?? "Ornith",
        name: config.model ?? "Ornith",
        reasoning: false,
        input: ["text"],
        cost: {
          input: 0,
          output: 0,
          cacheRead: 0,
          cacheWrite: 0,
        },
        contextWindow: 50688,
        maxTokens: 50688,
        compat: {
          supportsStore: false,
          supportsDeveloperRole: false,
          supportsReasoningEffort: false,
          supportsUsageInStreaming: true,
          supportsStrictMode: false,
          maxTokensField: "max_tokens",
        },
      },
    ],
  });

  await modelRuntime.setRuntimeApiKey("local", "_");

  const { session } = await createAgentSession({
    modelRuntime,
    resourceLoader: fileBasedResourceLoader,
    tools: (config.builtinTools ?? []).concat(config?.tools?.map(t => t.name) ?? []),
  });
  session.subscribe((e) => {
    if (e.type == "tool_execution_start") {
      logger.info(`Tool call ${e.toolName} with args ${JSON.stringify(e.args)}`)
    }

    if (e.type == "message_end" && e.message.role != "system") {
      const message = e.message as any;
      logger.info(`${message.role}: ${message.content[0]?.text}`);
    }


  });
  return session;
}
