import { describe, expect, it } from "bun:test";
import type { BoardClient } from "./utilities/events.ts";
import { createClients } from "./utilities/events.ts";

function fakeClient() {
  let abortHandler: (() => void) | undefined;
  const messages: { event: string; data: string; id?: string }[] = [];
  const client: BoardClient = {
    async writeSSE(message) {
      messages.push(message);
    },
    onAbort(listener) {
      abortHandler = listener;
    },
  };
  return {
    client,
    messages,
    abort: () => abortHandler?.(),
  };
}

describe("clients", () => {
  it("pushes to connected clients and removes aborted ones", async () => {
    const clients = createClients();
    const first = fakeClient();
    const second = fakeClient();
    clients.add(first.client);
    clients.add(second.client);
    expect(clients.size).toBe(2);

    await clients.push("board", "<p>one</p>");
    expect(first.messages).toEqual([{ event: "board", data: "<p>one</p>" }]);
    expect(second.messages).toEqual([{ event: "board", data: "<p>one</p>" }]);

    second.abort();
    expect(clients.size).toBe(1);
    await clients.push("task", "<p>two</p>", 2);
    expect(first.messages).toEqual([
      { event: "board", data: "<p>one</p>" },
      { event: "task", data: "<p>two</p>", id: "2" },
    ]);
    expect(second.messages).toEqual([{ event: "board", data: "<p>one</p>" }]);
  });

  it("drops a client whose write fails", async () => {
    const clients = createClients();
    let calls = 0;
    clients.add({
      async writeSSE() {
        calls++;
        throw new Error("closed");
      },
      onAbort() {},
    });

    await clients.push("task", "<p>one</p>");
    expect(clients.size).toBe(0);
    await clients.push("task", "<p>two</p>");
    expect(calls).toBe(1);
  });
});
