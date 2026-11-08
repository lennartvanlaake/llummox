import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  bashTool,
  builtinTools,
  editTool,
  findTool,
  readTool,
  writeTool,
} from "./builtin";
import { invokeTool } from "../testing";

describe("builtin tools", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "agent-builtin-"));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  test("write, read, edit, and find a file", async () => {
    const written = await invokeTool(
      writeTool,
      { path: "notes/a.txt", content: "hello\nworld" },
      { cwd: dir },
    );
    expect(written.text).toContain("Wrote");

    const read = await invokeTool(readTool, { path: "notes/a.txt" }, {
      cwd: dir,
    });
    expect(read.text).toContain("1\thello");
    expect(read.text).toContain("2\tworld");

    const edited = await invokeTool(
      editTool,
      { path: "notes/a.txt", oldString: "world", newString: "agent" },
      { cwd: dir },
    );
    expect(edited.text).toContain("Edited");

    const found = await invokeTool(findTool, { pattern: "**/*.txt" }, {
      cwd: dir,
    });
    expect(found.text).toContain("notes/a.txt");
  });

  test("bash runs in the sandboxed cwd", async () => {
    const result = await invokeTool(bashTool, { command: "echo hi" }, {
      cwd: dir,
    });
    expect(result.text).toContain("hi");
  });

  test("rejects paths outside cwd", async () => {
    const result = await invokeTool(readTool, { path: "../escape.txt" }, {
      cwd: dir,
    });
    expect(result.result.isError).toBe(true);
    expect(result.text).toContain("escapes cwd");
  });

  test("exports all five tools", () => {
    expect(builtinTools.map((tool) => tool.name)).toEqual([
      "read",
      "write",
      "edit",
      "find",
      "bash",
    ]);
  });
});
