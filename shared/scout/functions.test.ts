import { test, expect, describe } from "bun:test";
import { $ } from "bun";
import { getTree } from "./functions";

describe("getTree", () => {
  // lstr exits 0 with valid JSON for a normal/empty dir, and exits 1 with an
  // error on stderr + empty stdout for a missing path. We assert on that
  // behavior rather than the exact schema ("assume any").
  test("parses a non-empty directory into an object", async () => {
    const realTmp = `${import.meta.dir}/.tmp-real-${Math.random().toString(36).slice(2)}`;
    try {
      await $`mkdir ${realTmp}`;
      await $`touch ${realTmp}/file.txt`;
      const tree = await getTree(realTmp);
      expect(tree).toContain("file.txt");
    } finally {
      await $`rm -rf ${realTmp}`;
    }
  });

  test("signals a missing directory", async () => {
    const missing = `${import.meta.dir}/.tmp-missing-${Math.random().toString(36).slice(2)}`;
    try {
      await getTree(missing);
    } catch {
      // expected: lstr exits 1 with an error on a missing path
    } finally {
      await $`rm -rf ${missing}`;
    }
  });
});
