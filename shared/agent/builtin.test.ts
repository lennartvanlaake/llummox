import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  applyTool,
  bashTool,
  builtinTools,
  readTool,
  searchTool,
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

  test("creates, reads, replaces, and searches a text file", async () => {
    const created = await invokeTool(
      applyTool,
      { operation: "create", path: "notes/a.txt", content: "hello\nworld" },
      { cwd: dir },
    );
    expect(created.text).toContain("Created");

    const read = await invokeTool(readTool, { path: "notes/a.txt" }, {
      cwd: dir,
    });
    expect(read.text).toContain("1\thello");
    expect(read.text).toContain("2\tworld");

    const replaced = await invokeTool(
      applyTool,
      {
        operation: "replace",
        path: "notes/a.txt",
        oldText: "world",
        newText: "agent",
      },
      { cwd: dir },
    );
    expect(replaced.text).toContain("replaced 1 occurrence");

    const found = await invokeTool(
      searchTool,
      { mode: "files", path: "notes", query: "a.txt" },
      { cwd: dir },
    );
    expect(found.text).toContain("notes/a.txt");
  });

  test("create refuses an existing file and overwrite replaces it", async () => {
    await invokeTool(
      applyTool,
      { operation: "create", path: "notes/a.txt", content: "first" },
      { cwd: dir },
    );

    const duplicate = await invokeTool(
      applyTool,
      { operation: "create", path: "notes/a.txt", content: "second" },
      { cwd: dir },
    );
    expect(duplicate.result.isError).toBe(true);
    expect(duplicate.text).toContain("already exists");

    const overwritten = await invokeTool(
      applyTool,
      { operation: "overwrite", path: "notes/a.txt", content: "second" },
      { cwd: dir },
    );
    expect(overwritten.text).toContain("Overwrote");
    expect(await readFile(join(dir, "notes/a.txt"), "utf8")).toBe("second");
  });

  test("exact replace requires one unique match", async () => {
    await invokeTool(
      applyTool,
      { operation: "create", path: "notes/a.txt", content: "same\nsame\n" },
      { cwd: dir },
    );

    const result = await invokeTool(
      applyTool,
      {
        operation: "replace",
        path: "notes/a.txt",
        oldText: "same",
        newText: "different",
      },
      { cwd: dir },
    );
    expect(result.result.isError).toBe(true);
    expect(result.text).toContain("appears 2 times");
    expect(await readFile(join(dir, "notes/a.txt"), "utf8")).toBe(
      "same\nsame\n",
    );
  });

  test("replace_definition preserves docs and export", async () => {
    const source = [
      "/** docs */",
      "export function helloWorld(name: string): string {",
      '  return "hi " + name;',
      "}",
      "",
    ].join("\n");
    await invokeTool(
      applyTool,
      { operation: "create", path: "src/greet.ts", content: source },
      { cwd: dir },
    );

    const replacement = [
      "function helloWorld(name: string) {",
      "  return `hello ${name}`;",
      "}",
    ].join("\n");
    const result = await invokeTool(
      applyTool,
      {
        operation: "replace_definition",
        path: "src/greet.ts",
        symbol: "helloWorld",
        kind: "function",
        replacement,
      },
      { cwd: dir },
    );
    expect(result.result.isError).toBeFalsy();
    expect(result.text).toContain("replaced function helloWorld");

    const text = await readFile(join(dir, "src/greet.ts"), "utf8");
    expect(text).toContain("/** docs */");
    expect(text).toContain("export function helloWorld");
    expect(text).toContain("return `hello ${name}`;");
  });

  test("replace_definition preserves decorators and class wrappers", async () => {
    const source = [
      "@sealed",
      "export default class A {",
      "  @log",
      "  method(x: number) { return x; }",
      "}",
      "",
    ].join("\n");
    await invokeTool(
      applyTool,
      { operation: "create", path: "src/a.ts", content: source },
      { cwd: dir },
    );

    const methodResult = await invokeTool(
      applyTool,
      {
        operation: "replace_definition",
        path: "src/a.ts",
        symbol: "A.method",
        kind: "method",
        replacement: [
          "method(x: number) {",
          "  return x * 2;",
          "}",
        ].join("\n"),
      },
      { cwd: dir },
    );
    expect(methodResult.result.isError).toBeFalsy();
    expect(await readFile(join(dir, "src/a.ts"), "utf8")).toContain("@log");

    const classResult = await invokeTool(
      applyTool,
      {
        operation: "replace_definition",
        path: "src/a.ts",
        symbol: "A",
        kind: "class",
        replacement: [
          "class A {",
          "  method(x: number) { return x * 3; }",
          "}",
        ].join("\n"),
      },
      { cwd: dir },
    );
    expect(classResult.result.isError).toBeFalsy();

    const text = await readFile(join(dir, "src/a.ts"), "utf8");
    expect(text).toContain("@sealed");
    expect(text).toContain("export default class A");
    expect(text).toContain("return x * 3;");
  });

  test("read symbol and search symbols use the AST", async () => {
    const source = [
      "/** docs */",
      "export function helloWorld(name: string): string {",
      "  return name;",
      "}",
      "",
      "export class Greeter {",
      "  greet(name: string) {",
      "    return name;",
      "  }",
      "}",
      "",
    ].join("\n");
    await invokeTool(
      applyTool,
      { operation: "create", path: "src/greet.ts", content: source },
      { cwd: dir },
    );

    const outline = await invokeTool(
      searchTool,
      { mode: "symbols", path: "src/greet.ts" },
      { cwd: dir },
    );
    expect(outline.text).toContain("src/greet.ts:");
    expect(outline.text).toContain("function helloWorld");
    expect(outline.text).toContain("class Greeter");
    expect(outline.text).toContain("method Greeter.greet");

    const symbol = await invokeTool(
      readTool,
      { path: "src/greet.ts", mode: "symbol", symbol: "Greeter.greet" },
      { cwd: dir },
    );
    expect(symbol.text).toContain("method Greeter.greet");
    expect(symbol.text).toContain("7\t  greet(name: string) {");
    expect(symbol.text).toContain("8\t    return name;");
    expect(symbol.text).toContain("9\t  }");
  });

  test("read filtered_html filters large HTML and supports selectors", async () => {
    const source = [
      "<!doctype html>",
      '<html lang="en"><body class="page">',
      "  <main id=\"content\">",
      "    <h1>Title</h1>",
      "    <p>Visible text.</p>",
      "    <script>alert('bad')</script>",
      "    <svg><text>icon</text></svg>",
      '    <img src="x.png" alt="Hero" aria-label="Hero image" data-x="1">',
      "  </main>",
      "</body></html>",
      "",
    ].join("\n");
    await invokeTool(
      applyTool,
      { operation: "create", path: "page.html", content: source },
      { cwd: dir },
    );

    const full = await invokeTool(
      readTool,
      { path: "page.html", mode: "filtered_html" },
      { cwd: dir },
    );
    expect(full.text).toContain("<!-- filtered HTML:");
    expect(full.text).toContain("<h1>Title</h1>");
    expect(full.text).toContain("Visible text.");
    expect(full.text).toContain('alt="Hero"');
    expect(full.text).toContain('aria-label="Hero image"');
    expect(full.text).not.toContain("<script");
    expect(full.text).not.toContain("<svg");
    expect(full.text).not.toContain("data-x");

    const selected = await invokeTool(
      readTool,
      { path: "page.html", mode: "filtered_html", selector: "h1" },
      { cwd: dir },
    );
    expect(selected.text).toContain("<h1>Title</h1>");
    expect(selected.text).not.toContain("Visible text.");

    const capped = await invokeTool(
      readTool,
      { path: "page.html", mode: "filtered_html", maxChars: 100 },
      { cwd: dir },
    );
    expect(capped.text.length).toBeLessThanOrEqual(100);
    expect(capped.text).toContain("truncated");
  });

  test("replace_definition works in TSX", async () => {
    const source = [
      'import { useState } from "react";',
      "",
      "export function App() {",
      "  return <div>hello</div>;",
      "}",
      "",
    ].join("\n");
    await invokeTool(
      applyTool,
      { operation: "create", path: "src/App.tsx", content: source },
      { cwd: dir },
    );

    const result = await invokeTool(
      applyTool,
      {
        operation: "replace_definition",
        path: "src/App.tsx",
        symbol: "App",
        replacement: [
          "function App() {",
          "  return <main>hi</main>;",
          "}",
        ].join("\n"),
      },
      { cwd: dir },
    );
    expect(result.result.isError).toBeFalsy();

    const text = await readFile(join(dir, "src/App.tsx"), "utf8");
    expect(text).toContain('import { useState } from "react";');
    expect(text).toContain("export function App");
    expect(text).toContain("<main>hi</main>");
  });

  test("ambiguous symbols return candidates and qualified names work", async () => {
    const source = [
      "class A {",
      "  method() {}",
      "}",
      "class B {",
      "  method() {}",
      "}",
      "",
    ].join("\n");
    await invokeTool(
      applyTool,
      { operation: "create", path: "src/defs.ts", content: source },
      { cwd: dir },
    );

    const ambiguous = await invokeTool(
      applyTool,
      {
        operation: "replace_definition",
        path: "src/defs.ts",
        symbol: "method",
        replacement: "method() { return 1; }",
      },
      { cwd: dir },
    );
    expect(ambiguous.result.isError).toBe(true);
    expect(ambiguous.text).toContain("Ambiguous symbol");
    expect(ambiguous.text).toContain("A.method");
    expect(ambiguous.text).toContain("B.method");

    const qualified = await invokeTool(
      applyTool,
      {
        operation: "replace_definition",
        path: "src/defs.ts",
        symbol: "A.method",
        replacement: "method() { return 1; }",
      },
      { cwd: dir },
    );
    expect(qualified.result.isError).toBeFalsy();
  });

  test("a syntax-breaking replacement leaves the file unchanged", async () => {
    const source = [
      "export function helloWorld() {",
      "  return 1;",
      "}",
      "",
    ].join("\n");
    await invokeTool(
      applyTool,
      { operation: "create", path: "src/greet.ts", content: source },
      { cwd: dir },
    );

    const result = await invokeTool(
      applyTool,
      {
        operation: "replace_definition",
        path: "src/greet.ts",
        symbol: "helloWorld",
        replacement: "function helloWorld( {",
      },
      { cwd: dir },
    );
    expect(result.result.isError).toBe(true);
    expect(result.text).toContain("syntax error");
    expect(await readFile(join(dir, "src/greet.ts"), "utf8")).toBe(source);
  });

  test("unsupported files fall back to exact replace", async () => {
    await invokeTool(
      applyTool,
      { operation: "create", path: "src/page.md", content: "# hello\n" },
      { cwd: dir },
    );

    const result = await invokeTool(
      applyTool,
      {
        operation: "replace_definition",
        path: "src/page.md",
        symbol: "page",
        replacement: "page",
      },
      { cwd: dir },
    );
    expect(result.result.isError).toBe(true);
    expect(result.text).toContain('Use apply operation "replace"');
  });

  test("preserves CRLF and Unicode in AST replacements", async () => {
    const source =
      [
        "/** 日本語 */",
        "export function hello(name: string) {",
        '  return "こんにちは " + name;',
        "}",
      ].join("\r\n") + "\r\n";
    await invokeTool(
      applyTool,
      { operation: "create", path: "src/unicode.ts", content: source },
      { cwd: dir },
    );

    const replacement = [
      "function hello(name: string) {",
      '  return "やあ " + name;',
      "}",
    ].join("\r\n");
    const result = await invokeTool(
      applyTool,
      {
        operation: "replace_definition",
        path: "src/unicode.ts",
        symbol: "hello",
        replacement,
      },
      { cwd: dir },
    );
    expect(result.result.isError).toBeFalsy();

    const text = await readFile(join(dir, "src/unicode.ts"), "utf8");
    expect(text).toContain("/** 日本語 */");
    expect(text).toContain("export function hello");
    expect(text).toContain('return "やあ " + name;');
    expect(text.includes("\r\n")).toBe(true);
  });

  test("search finds files, content, and symbols", async () => {
    const source = [
      "/** docs */",
      "export function helloWorld(name: string): string {",
      "  return name;",
      "}",
      "",
      "export class Greeter {",
      "  greet(name: string) {",
      "    return name;",
      "  }",
      "}",
      "",
    ].join("\n");
    await invokeTool(
      applyTool,
      { operation: "create", path: "src/greet.ts", content: source },
      { cwd: dir },
    );
    await invokeTool(
      applyTool,
      {
        operation: "create",
        path: "src/App.tsx",
        content: "export function App() { return <div>hi</div>; }\n",
      },
      { cwd: dir },
    );

    const fuzzy = await invokeTool(
      searchTool,
      { mode: "files", query: "greet" },
      { cwd: dir },
    );
    expect(fuzzy.text).toContain("src/greet.ts");

    const glob = await invokeTool(
      searchTool,
      { mode: "files", query: "*.tsx" },
      { cwd: dir },
    );
    expect(glob.text).toContain("src/App.tsx");

    const content = await invokeTool(
      searchTool,
      { mode: "content", query: "helloWorld", path: "src" },
      { cwd: dir },
    );
    expect(content.text).toContain("src/greet.ts:2:");

    const symbols = await invokeTool(
      searchTool,
      {
        mode: "symbols",
        path: "src",
        query: "Greeter",
        kind: "method",
      },
      { cwd: dir },
    );
    expect(symbols.text).toContain("src/greet.ts:7");
    expect(symbols.text).toContain("method Greeter.greet");

    const noMatch = await invokeTool(
      searchTool,
      { mode: "content", query: "doesNotExistAnywhere" },
      { cwd: dir },
    );
    expect(noMatch.text).toContain("No matches found");
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

    const create = await invokeTool(
      applyTool,
      { operation: "create", path: "../escape.ts", content: "export {}" },
      { cwd: dir },
    );
    expect(create.result.isError).toBe(true);
    expect(create.text).toContain("escapes cwd");

    const search = await invokeTool(
      searchTool,
      { mode: "files", query: "x", path: "../" },
      { cwd: dir },
    );
    expect(search.result.isError).toBe(true);
    expect(search.text).toContain("escapes cwd");
  });

  test("exports the four builtin tools", () => {
    expect(builtinTools.map((tool) => tool.name)).toEqual([
      "read",
      "apply",
      "search",
      "bash",
    ]);
  });
});
