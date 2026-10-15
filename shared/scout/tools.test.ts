import { test, expect, describe } from "bun:test";
import {
  wc,
  ls,
  grepRecursive,
  simplifyHtml,
  searchHtml,
  readLines,
} from "./tools";
import { invokeTool } from "../testing";

const FIX = `${import.meta.dir}/fixtures`;

// Tests run with cwd = project root so the $-based grep tool resolves
// relative paths (testdir) as the source tree, matching real usage.
const PROJECT_ROOT = `${import.meta.dir}/../..`;
process.chdir(PROJECT_ROOT);

describe("Test scout tools", () => {

  test("Test wc", async () => {
    const wordcount = await invokeTool(wc, {
      file: `${FIX}/bla.txt`,
      type: "w",
    });
    expect(wordcount.text.trim().split(/\s+/)[0]).toBe("1");
  });

  test("Reads specified lines from a file", async () => {
    const firstLine = await invokeTool(readLines, {
      file: `${FIX}/bla.txt`,
      startLine: 1,
      numberOfLines: 1,
    });
    expect(firstLine.text.trim()).toBe("bla");
  });

  describe("Test grep", () => {
    test("grep", async () => {
      const grep = await invokeTool(
        grepRecursive,
        {
          path: `${FIX}/testdir`,
          pattern: "match",
        },
      );
      expect(grep.text).toContain("match.txt");
    });

    test("no matches", async () => {
      const grep = await invokeTool(
        grepRecursive,
        {
          path: `${FIX}/testdir`,
          pattern: "nonexistent-pattern",
        },
      );
      const text = grep.text;
      expect(text.trim()).toContain("No matches");
    });
  });

  describe("Test simplifyHtml", () => {
    test("simplifyHtml removes script tags", async () => {
      const simplified = await invokeTool(simplifyHtml, {
        path: `${FIX}/bla.txt`,
      });
      const text = simplified.text;
      expect(text).not.toContain("<script");
    });
  });

  describe("Test searchHtml", () => {
    test("searchHtml extracts a query", async () => {
      const searchResult = await invokeTool(searchHtml, {
        path: `${FIX}/bla.txt`,
        query: "body",
      });
      const text = searchResult.text;
      expect(text.length).toBeGreaterThan(0);
    });
  });
});
