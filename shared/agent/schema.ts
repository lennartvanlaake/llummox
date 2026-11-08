import { Type } from "typebox";

/** Parse the project's `type Schema = { ... }` convention into JSON schema. */
export function parseTsSchema(source: string): Record<string, unknown> {
  const result = Type.Script(source) as { Schema?: unknown };
  if (!result.Schema || typeof result.Schema !== "object") {
    throw new Error(
      "Schema must be defined as `type Schema = ...`. Found " + source,
    );
  }
  return result.Schema as Record<string, unknown>;
}
