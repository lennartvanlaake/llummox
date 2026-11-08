import { Type as TypeBox } from "@sinclair/typebox";
import type { Static, TSchema } from "@sinclair/typebox";
import { compileSchema } from "json-schema-library";
import type {
  AnyTool,
  OpenAiTool,
  Tool,
  ToolContext,
  ToolOutput,
  ToolResult,
} from "./types";

export { Type } from "@sinclair/typebox";
export type { Static, TSchema } from "@sinclair/typebox";

/**
 * TypeBox 0.34's Type.Enum([...]) silently builds the wrong schema for a
 * string array. This emits a plain JSON-schema string enum instead.
 */
export function stringEnum<const Values extends readonly string[]>(
  values: Values,
  options: Record<string, unknown> = {},
) {
  return TypeBox.Unsafe<Values[number]>({
    type: "string",
    enum: [...values],
    ...options,
  });
}

/**
 * Define a tool once; the argument type is inferred from the TypeBox schema.
 * Tools receive plain JSON arguments and a small execution context.
 */
export function defineTool<Params extends TSchema>(definition: {
  name: string;
  description: string;
  parameters: Params;
  execute: (
    args: Static<Params>,
    context: ToolContext,
  ) => ToolOutput | Promise<ToolOutput>;
}): Tool<Params> {
  if (!definition.name.trim()) {
    throw new Error("Tool name is required");
  }
  return definition;
}

/** Strip TypeBox symbols so the schema is safe to send as JSON. */
export function toJsonSchema(schema: TSchema | object): Record<string, unknown> {
  return JSON.parse(JSON.stringify(schema)) as Record<string, unknown>;
}

export function toOpenAiTool(tool: AnyTool): OpenAiTool {
  return {
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: toJsonSchema(tool.parameters),
    },
  };
}

export function toToolResult(output: ToolOutput, isError = false): ToolResult {
  if (output == null) {
    return { content: "", isError };
  }
  if (typeof output === "string") {
    return { content: output, isError };
  }
  if (typeof output === "number" || typeof output === "boolean") {
    return { content: String(output), isError };
  }
  if (isToolResult(output)) {
    return { ...output, isError: output.isError ?? isError };
  }
  return { content: JSON.stringify(output), details: output, isError };
}

function isToolResult(value: object): value is ToolResult {
  return "content" in value && typeof (value as ToolResult).content === "string";
}

export type SchemaValidation =
  | { valid: true }
  | { valid: false; errors: string[] };

/** Validate tool arguments against the same JSON schema sent to the model. */
export function validateSchema(
  schema: TSchema | object,
  value: unknown,
): SchemaValidation {
  try {
    const compiled = compileSchema(toJsonSchema(schema) as any);
    const result = compiled.validate(value);
    if (result.valid) {
      return { valid: true };
    }
    return {
      valid: false,
      errors: result.errors.map(formatSchemaError),
    };
  } catch (error) {
    return {
      valid: false,
      errors: [(error as Error).message],
    };
  }
}

function formatSchemaError(error: unknown): string {
  if (typeof error === "string") {
    return error;
  }
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return JSON.stringify(error);
}
