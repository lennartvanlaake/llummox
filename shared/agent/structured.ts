import { logMessage } from "./logging";
import { toJsonSchema, validateSchema } from "./tools";
import type {
  ChatClient,
  ChatCompletionResponse,
  ChatMessage,
  ResponseFormat,
} from "./types";

export type StructuredConfig = {
  client: ChatClient;
  schema: object;
  prompt: string;
  system?: string;
  name?: string;
  temperature?: number;
  maxTokens?: number;
  /** Number of repair retries after an invalid response. Defaults to 0. */
  retries?: number;
};

export type StructuredResult<T> = {
  data: T;
  raw: string;
  response: ChatCompletionResponse;
  attempts: number;
};

export class StructuredOutputError extends Error {
  constructor(
    message: string,
    readonly raw?: string,
    readonly errors?: unknown,
  ) {
    super(message);
    this.name = "StructuredOutputError";
  }
}

/** Single-call JSON-schema output. Retries only when explicitly requested. */
export async function structured<T = unknown>(
  config: StructuredConfig,
): Promise<T> {
  return (await structuredResult<T>(config)).data;
}

export async function structuredResult<T = unknown>(
  config: StructuredConfig,
): Promise<StructuredResult<T>> {
  const schema = toJsonSchema(config.schema);
  const messages: ChatMessage[] = [];

  if (config.system) {
    messages.push({ role: "system", content: config.system });
  }
  messages.push({ role: "user", content: config.prompt });
  logMessage({ role: "user", content: config.prompt });

  const responseFormat: ResponseFormat = {
    type: "json_schema",
    json_schema: {
      name: config.name ?? "output",
      strict: true,
      schema,
    },
  };

  let lastError: StructuredOutputError | undefined;
  const retries = config.retries ?? 0;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const response = await config.client.chat(messages, {
      responseFormat,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
    });

    const choice = response.choices[0];
    if (!choice) {
      throw new StructuredOutputError("llama.cpp returned no choices");
    }

    const raw = choice.message.content ?? "";
    logMessage({ role: "assistant", content: raw });

    const parsed = parseJson(raw);
    if (parsed.ok) {
      const validation = validateSchema(schema, parsed.value);
      if (validation.valid) {
        return {
          data: parsed.value as T,
          raw,
          response,
          attempts: attempt + 1,
        };
      }
      lastError = new StructuredOutputError(
        `Structured output does not match the schema: ${validation.errors.join("; ")}`,
        raw,
        validation.errors,
      );
    } else {
      lastError = new StructuredOutputError(
        `Model did not return valid JSON: ${parsed.error}`,
        raw,
      );
    }

    if (attempt < retries) {
      messages.push({ role: "assistant", content: raw });
      messages.push({
        role: "user",
        content: `Your previous answer was invalid. Return only JSON matching the schema. ${lastError.message}`,
      });
    }
  }

  throw lastError ?? new StructuredOutputError("Structured output failed");
}

type ParseResult =
  | { ok: true; value: unknown }
  | { ok: false; error: string };

function parseJson(text: string): ParseResult {
  const trimmed = text.trim();
  if (!trimmed) {
    return { ok: false, error: "empty response" };
  }

  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const candidate = fenced?.[1] ?? trimmed;

  try {
    return { ok: true, value: JSON.parse(candidate) };
  } catch {
    const start = candidate.search(/[{\[]/);
    const end = Math.max(
      candidate.lastIndexOf("}"),
      candidate.lastIndexOf("]"),
    );
    if (start >= 0 && end > start) {
      try {
        return {
          ok: true,
          value: JSON.parse(candidate.slice(start, end + 1)),
        };
      } catch {
        // fall through to the parse error below
      }
    }
    return { ok: false, error: "invalid JSON" };
  }
}


