import { describe, expect, test } from "bun:test";
import { LlamaClient } from "./llama";
import { jsonResponse } from "./testHelpers";

describe("LlamaClient", () => {
  test("auto-detects the model and sends a chat completion", async () => {
    const requests: Array<{ url: string; body: any }> = [];
    const client = new LlamaClient({
      baseUrl: "http://llama.test:8080/v1",
      retries: 0,
      fetch: async (input, init) => {
        const url = String(input);
        const body = init?.body ? JSON.parse(String(init.body)) : undefined;
        requests.push({ url, body });

        if (url.endsWith("/models")) {
          return jsonResponse({ data: [{ id: "qwen-test" }] });
        }
        return jsonResponse({
          choices: [
            {
              index: 0,
              message: { role: "assistant", content: "hello" },
            },
          ],
        });
      },
    });

    const response = await client.chat([
      { role: "user", content: "hi" },
    ]);

    expect(response.choices[0]?.message.content).toBe("hello");
    expect(requests[0]?.url).toBe("http://llama.test:8080/v1/models");
    expect(requests[1]?.body.model).toBe("qwen-test");
    expect(requests[1]?.body.messages).toEqual([
      { role: "user", content: "hi" },
    ]);
    expect(requests[1]?.body.stream).toBe(false);
  });

  test("retries a 5xx response once", async () => {
    let calls = 0;
    const client = new LlamaClient({
      baseUrl: "http://llama.test:8080/v1",
      model: "test",
      retries: 1,
      fetch: async () => {
        calls++;
        if (calls === 1) {
          return jsonResponse({ error: "boom" }, 500);
        }
        return jsonResponse({
          choices: [
            {
              index: 0,
              message: { role: "assistant", content: "ok" },
            },
          ],
        });
      },
    });

    const response = await client.chat([
      { role: "user", content: "hi" },
    ]);

    expect(calls).toBe(2);
    expect(response.choices[0]?.message.content).toBe("ok");
  });
});
