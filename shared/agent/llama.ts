import { logger } from "../utils";
import type {
  ChatClient,
  ChatCompletionResponse,
  ChatMessage,
  ChatOptions,
} from "./types";

export type FetchLike = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

export type LlamaClientConfig = {
  baseUrl?: string;
  model?: string;
  timeoutMs?: number;
  retries?: number;
  apiKey?: string;
  fetch?: FetchLike;
};

export class LlamaError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = "LlamaError";
  }
}

const DEFAULT_TIMEOUT_MS = 10 * 60_000;
const DEFAULT_RETRIES = 1;

export class LlamaClient implements ChatClient {
  private readonly baseUrl: string;
  private readonly model?: string;
  private readonly timeoutMs: number;
  private readonly retries: number;
  private readonly apiKey?: string;
  private readonly fetchImpl: FetchLike;
  private modelPromise?: Promise<string>;
  private contextPromise?: Promise<number | undefined>;

  constructor(config: LlamaClientConfig = {}) {
    this.baseUrl = (
      config.baseUrl ??
      process.env.LLAMA_BASE_URL ??
      "http://127.0.0.1:8080/v1"
    ).replace(/\/+$/, "");
    this.model = config.model ?? process.env.LLAMA_MODEL;
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.retries = config.retries ?? DEFAULT_RETRIES;
    this.apiKey = config.apiKey ?? process.env.LLAMA_API_KEY;
    this.fetchImpl = config.fetch ?? fetch;
  }

  get modelId(): string | undefined {
    return this.model;
  }

  private get apiBase(): string {
    return this.baseUrl.endsWith("/v1") ? this.baseUrl : `${this.baseUrl}/v1`;
  }

  private get rootBase(): string {
    return this.apiBase.slice(0, -3);
  }

  /** Read the loaded model id from /v1/models; fall back to "local". */
  async getModel(): Promise<string> {
    if (this.model) {
      return this.model;
    }
    if (!this.modelPromise) {
      this.modelPromise = this.request<{
        data?: Array<{ id?: string }>;
        models?: Array<{ model?: string }>;
      }>(`${this.apiBase}/models`)
        .then(
          (data) =>
            data.data?.[0]?.id ?? data.models?.[0]?.model ?? "local",
        )
        .catch((error) => {
          logger.warn(
            `Could not detect llama.cpp model: ${(error as Error).message}`,
          );
          return "local";
        });
    }
    return this.modelPromise;
  }

  /** Read n_ctx from /props when available. */
  async getContextSize(): Promise<number | undefined> {
    if (!this.contextPromise) {
      this.contextPromise = this.request<{
        n_ctx?: number;
        default_generation_settings?: { n_ctx?: number };
      }>(`${this.rootBase}/props`)
        .then(
          (data) =>
            data.default_generation_settings?.n_ctx ?? data.n_ctx,
        )
        .catch(() => undefined);
    }
    return this.contextPromise;
  }

  async chat(
    messages: ChatMessage[],
    options: ChatOptions = {},
  ): Promise<ChatCompletionResponse> {
    const body: Record<string, unknown> = {
      model: await this.getModel(),
      messages,
      stream: false,
      ...(options.temperature !== undefined
        ? { temperature: options.temperature }
        : {}),
      ...(options.maxTokens !== undefined
        ? { max_tokens: options.maxTokens }
        : {}),
      ...(options.tools?.length
        ? {
            tools: options.tools,
            tool_choice: options.toolChoice ?? "auto",
          }
        : {}),
      ...(options.responseFormat
        ? { response_format: options.responseFormat }
        : {}),
      ...(options.extra ?? {}),
    };

    const response = await this.request<ChatCompletionResponse>(
      `${this.apiBase}/chat/completions`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(this.apiKey
            ? { authorization: `Bearer ${this.apiKey}` }
            : {}),
        },
        body: JSON.stringify(body),
      },
    );

    if (!response.choices?.length) {
      throw new LlamaError("llama.cpp returned no choices", 200, response);
    }
    return response;
  }

  private async request<T>(
    url: string,
    init: RequestInit = {},
  ): Promise<T> {
    let attempt = 0;

    while (true) {
      const controller = new AbortController();
      const timer = setTimeout(
        () =>
          controller.abort(
            new Error(
              `llama.cpp request timed out after ${this.timeoutMs}ms`,
            ),
          ),
        this.timeoutMs,
      );

      try {
        const response = await this.fetchImpl(url, {
          ...init,
          signal: controller.signal,
        });
        const text = await response.text();

        if (!response.ok) {
          if (shouldRetry(response.status) && attempt < this.retries) {
            attempt++;
            logger.warn(
              `llama.cpp ${response.status}; retrying (${attempt}/${this.retries})`,
            );
            await sleep(backoffMs(attempt));
            continue;
          }
          throw new LlamaError(
            `llama.cpp request failed: ${response.status} ${response.statusText}`,
            response.status,
            text,
          );
        }

        try {
          return JSON.parse(text) as T;
        } catch {
          throw new LlamaError(
            "llama.cpp returned invalid JSON",
            response.status,
            text,
          );
        }
      } catch (error) {
        if (error instanceof LlamaError || controller.signal.aborted) {
          throw error;
        }
        if (attempt < this.retries) {
          attempt++;
          logger.warn(
            `llama.cpp request failed; retrying (${attempt}/${this.retries}): ${(error as Error).message}`,
          );
          await sleep(backoffMs(attempt));
          continue;
        }
        throw error;
      } finally {
        clearTimeout(timer);
      }
    }
  }
}

function shouldRetry(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

function backoffMs(attempt: number): number {
  return 250 * 2 ** (attempt - 1);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}


