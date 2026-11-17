import { describe, expect, it } from "bun:test";
import { createChangeDetector, createEventHub } from "./events.ts";

describe("event hub", () => {
  it("broadcasts to current subscribers only", async () => {
    const hub = createEventHub();
    const seen: string[] = [];
    const off = hub.add(async (html) => {
      seen.push(html);
    });

    expect(hub.size).toBe(1);
    await hub.broadcast("<p>one</p>");
    expect(seen).toEqual(["<p>one</p>"]);

    off();
    expect(hub.size).toBe(0);
    await hub.broadcast("<p>two</p>");
    expect(seen).toEqual(["<p>one</p>"]);
  });

  it("drops subscribers whose send fails", async () => {
    const hub = createEventHub();
    let calls = 0;
    hub.add(async () => {
      calls++;
      throw new Error("disconnected");
    });

    await hub.broadcast("<p>one</p>");
    expect(hub.size).toBe(0);
    await hub.broadcast("<p>two</p>");
    expect(calls).toBe(1);
  });

  it("does nothing when there are no subscribers", async () => {
    const hub = createEventHub();
    await expect(hub.broadcast("<p>nobody</p>")).resolves.toBeUndefined();
  });
});

describe("change detector", () => {
  it("only fires when the version changes", () => {
    let version = 1;
    const seen: number[] = [];
    const detector = createChangeDetector(
      () => version,
      (next) => seen.push(next),
    );

    detector.check();
    expect(seen).toEqual([]);

    version = 2;
    detector.check();
    expect(seen).toEqual([2]);
    expect(detector.version).toBe(2);

    detector.check();
    expect(seen).toEqual([2]);
  });
});
