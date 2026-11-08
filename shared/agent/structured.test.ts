import { describe, expect, test } from "bun:test";
import {
  structured,
  structuredResult,
  StructuredOutputError,
} from "./structured";
import { completion, FakeChatClient } from "./testHelpers";
import { Type } from "./tools";

const personSchema = Type.Object({
  name: Type.String(),
  age: Type.Integer(),
});

describe("structured", () => {
  test("returns parsed JSON matching the schema", async () => {
    const client = new FakeChatClient([
      completion('{"name":"Ada","age":36}'),
    ]);

    const result = await structured({
      client,
      schema: personSchema,
      prompt: "Return a person.",
    });

    expect(result).toEqual({ name: "Ada", age: 36 });
    expect(client.calls[0]?.options?.responseFormat?.type).toBe(
      "json_schema",
    );
  });

  test("strips a JSON code fence", async () => {
    const client = new FakeChatClient([
      completion('```json\n{"name":"Ada","age":36}\n```'),
    ]);

    const result = await structured({
      client,
      schema: personSchema,
      prompt: "Return a person.",
    });

    expect(result).toEqual({ name: "Ada", age: 36 });
  });

  test("throws when the output does not match the schema", async () => {
    const client = new FakeChatClient([
      completion('{"name":"Ada","age":"old"}'),
    ]);

    await expect(
      structured({
        client,
        schema: personSchema,
        prompt: "Return a person.",
      }),
    ).rejects.toBeInstanceOf(StructuredOutputError);
  });

  test("repairs when retries are enabled", async () => {
    const client = new FakeChatClient([
      completion('{"name":"Ada"}'),
      completion('{"name":"Ada","age":36}'),
    ]);

    const result = await structuredResult({
      client,
      schema: personSchema,
      prompt: "Return a person.",
      retries: 1,
    });

    expect(result.data).toEqual({ name: "Ada", age: 36 });
    expect(result.attempts).toBe(2);
    expect(client.calls[1]?.messages.at(-1)).toMatchObject({
      role: "user",
    });
  });
});
