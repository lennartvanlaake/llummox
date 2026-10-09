import {
  createAgentSession,
  ModelRuntime,
  createExtensionRuntime,
  type ResourceLoader,
} from "@earendil-works/pi-coding-agent";
import { logger } from "../shared/utils";

export type PiSessionConfig = {
  model?: string;

  systemPrompt?: string;
};

export async function getPiSession(config: PiSessionConfig = {}) {
  const modelRuntime = await ModelRuntime.create();

  const resourceLoader: ResourceLoader = {
    getExtensions: () => ({
      extensions: [],
      errors: [],
      runtime: createExtensionRuntime(),
    }),
    getSkills: () => ({ skills: [], diagnostics: [] }),
    getPrompts: () => ({ prompts: [], diagnostics: [] }),
    getThemes: () => ({ themes: [], diagnostics: [] }),
    getAgentsFiles: () => ({ agentsFiles: [] }),
    getSystemPrompt: () => config.systemPrompt ?? "",
    getSystemPromptSource: () => undefined,
    getAppendSystemPrompt: () => [],
    getAppendSystemPromptSources: () => [],
    extendResources: () => {},
    reload: async () => {},
  };

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
    resourceLoader,
  });
  session.subscribe((e) => {
    if (e.type == "message_end" && e.message.role != "system") {
      const message = e.message as any;
      logger.info(`${message.role}: ${message.content[0]?.text}`);
    }
  });
  return session;
}
