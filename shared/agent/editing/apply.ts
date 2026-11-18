import { readFile } from "node:fs/promises";
import type { SgNode } from "@ast-grep/napi";
import {
  formatMatchFailure,
  matchDefinition,
  requireParsedScript,
  tryParseScript,
} from "./definitions";
import type { DefinitionKind } from "./languages";
import { fileExists, resolveInside, writeTextAtomic } from "./paths";

export type ApplyOperation =
  | "create"
  | "overwrite"
  | "replace"
  | "replace_definition";

export type ApplyArgs = {
  operation: ApplyOperation;
  path: string;
  content?: string;
  oldText?: string;
  newText?: string;
  symbol?: string;
  kind?: DefinitionKind;
  replacement?: string;
};

export type ApplyResult = {
  content: string;
  details: Record<string, unknown>;
};

export async function applyOperation(
  args: ApplyArgs,
  cwd: string,
): Promise<ApplyResult> {
  const path = requiredString(args.path, "path", args.operation);
  const file = resolveInside(cwd, path);

  switch (args.operation) {
    case "create":
      return createFile(path, file, args);
    case "overwrite":
      return overwriteFile(path, file, args);
    case "replace":
      return replaceText(path, file, args);
    case "replace_definition":
      return replaceDefinition(path, file, args);
    default:
      throw new Error(`Unknown apply operation: ${String(args.operation)}`);
  }
}

async function createFile(
  path: string,
  file: string,
  args: ApplyArgs,
): Promise<ApplyResult> {
  if (await fileExists(file)) {
    throw new Error(
      `File already exists: ${path}. Use operation "overwrite" to replace it or "replace" to edit it.`,
    );
  }
  const content = requiredString(args.content, "content", "create", true);
  validateNewContent(path, content);
  await writeTextAtomic(file, content);
  return {
    content: `Created ${path}`,
    details: { path, operation: "create", bytes: Buffer.byteLength(content) },
  };
}

async function overwriteFile(
  path: string,
  file: string,
  args: ApplyArgs,
): Promise<ApplyResult> {
  if (!(await fileExists(file))) {
    throw new Error(`File does not exist: ${path}. Use operation "create".`);
  }
  const content = requiredString(args.content, "content", "overwrite", true);
  validateNewContent(path, content);
  await writeTextAtomic(file, content);
  return {
    content: `Overwrote ${path}`,
    details: { path, operation: "overwrite", bytes: Buffer.byteLength(content) },
  };
}

async function replaceText(
  path: string,
  file: string,
  args: ApplyArgs,
): Promise<ApplyResult> {
  const oldText = requiredString(args.oldText, "oldText", "replace");
  const newText = requiredString(args.newText, "newText", "replace", true);

  const text = await readFile(file, "utf8");
  const eol = detectEol(text);
  let needle = oldText;
  if (!text.includes(needle)) {
    const normalized = normalizeEol(oldText, eol);
    if (text.includes(normalized)) {
      needle = normalized;
    }
  }

  const count = countOccurrences(text, needle);
  if (count === 0) {
    throw new Error(`oldText not found in ${path}.`);
  }
  if (count > 1) {
    throw new Error(
      `oldText appears ${count} times in ${path}. Include more surrounding text to make it unique.`,
    );
  }

  const replacement = normalizeEol(newText, eol);
  const index = text.indexOf(needle);
  const next = text.slice(0, index) + replacement + text.slice(index + needle.length);
  if (next === text) {
    return {
      content: `No changes in ${path}: replacement is identical.`,
      details: { path, operation: "replace", changed: false },
    };
  }

  validateReplacement(path, text, next, `replace in ${path}`);
  await writeTextAtomic(file, next);
  return {
    content: `Edited ${path}: replaced 1 occurrence.`,
    details: {
      path,
      operation: "replace",
      changed: true,
      oldBytes: Buffer.byteLength(needle),
      newBytes: Buffer.byteLength(replacement),
    },
  };
}

async function replaceDefinition(
  path: string,
  file: string,
  args: ApplyArgs,
): Promise<ApplyResult> {
  const symbol = requiredString(args.symbol, "symbol", "replace_definition").trim();
  const rawReplacement = requiredString(
    args.replacement,
    "replacement",
    "replace_definition",
    true,
  );

  const text = await readFile(file, "utf8");
  const parsed = requireParsedScript(path, text);
  const match = matchDefinition(parsed.definitions, symbol, args.kind);
  if (match.status !== "ok") {
    throw new Error(formatMatchFailure(match, path));
  }

  const definition = match.definition;
  const replacement = normalizeDefinitionReplacement(
    rawReplacement,
    text,
    definition.node,
    definition.startLine,
  );

  if (replacement === definition.text) {
    return {
      content: `No changes in ${path}: replacement is identical.`,
      details: {
        path,
        operation: "replace_definition",
        symbol: definition.qualifiedName,
        changed: false,
      },
    };
  }

  let next: string;
  try {
    next = parsed.root
      .root()
      .commitEdits([definition.node.replace(replacement)]);
  } catch (error) {
    throw new Error(
      `Failed to apply AST edit to ${definition.qualifiedName} in ${path}: ${(error as Error).message}`,
    );
  }

  if (next === text) {
    return {
      content: `No changes in ${path}: replacement is identical.`,
      details: {
        path,
        operation: "replace_definition",
        symbol: definition.qualifiedName,
        changed: false,
      },
    };
  }

  validateReplacement(
    path,
    text,
    next,
    `replace_definition ${definition.qualifiedName} in ${path}`,
  );
  await writeTextAtomic(file, next);

  return {
    content: `Edited ${path}: replaced ${definition.kind} ${definition.qualifiedName} (lines ${definition.startLine}-${definition.endLine}).`,
    details: {
      path,
      operation: "replace_definition",
      symbol: definition.qualifiedName,
      kind: definition.kind,
      startLine: definition.startLine,
      endLine: definition.endLine,
      changed: true,
    },
  };
}

function validateNewContent(path: string, content: string): void {
  const outcome = tryParseScript(path, content);
  if (outcome.status === "error") {
    throw new Error(outcome.message);
  }
  if (outcome.status === "ok" && outcome.parsed.errors.length > 0) {
    throw new Error(
      `Cannot write ${path}: content has ${outcome.parsed.errors.length} syntax error(s). First error: ${outcome.parsed.errors[0]}`,
    );
  }
}

function validateReplacement(
  path: string,
  beforeText: string,
  afterText: string,
  action: string,
): void {
  const before = tryParseScript(path, beforeText);
  const after = tryParseScript(path, afterText);
  if (after.status === "error") {
    throw new Error(`${action} failed validation: ${after.message}`);
  }
  if (after.status === "unsupported") {
    return;
  }
  const beforeErrors =
    before.status === "ok" ? before.parsed.errors.length : 0;
  if (after.parsed.errors.length > beforeErrors) {
    throw new Error(
      `${action} introduces ${after.parsed.errors.length - beforeErrors} syntax error(s); file unchanged. First error: ${after.parsed.errors[0] ?? "unknown"}`,
    );
  }
}

function normalizeDefinitionReplacement(
  raw: string,
  fileText: string,
  node: SgNode,
  startLine: number,
): string {
  const eol = detectEol(fileText);
  let replacement = normalizeEol(raw, eol);
  replacement = stripPreservedPrefixes(replacement, node);
  replacement = indentReplacement(replacement, lineIndentAt(fileText, startLine - 1));
  return replacement.replace(/\r?\n$/, "");
}

function stripPreservedPrefixes(replacement: string, node: SgNode): string {
  const ancestors = node.ancestors();
  const kinds = new Set(ancestors.map((ancestor) => ancestor.kind()));
  let result = replacement;

  if (kinds.has("export_statement")) {
    const wrapper = ancestors.find(
      (ancestor) => ancestor.kind() === "export_statement",
    );
    const wrapperText = wrapper?.text().trimStart() ?? "";
    if (wrapperText.startsWith("export default")) {
      result = stripPrefix(result, "export default ");
    } else if (wrapperText.startsWith("export ")) {
      result = stripPrefix(result, "export ");
    }
  }

  if (kinds.has("ambient_declaration")) {
    result = stripPrefix(result, "declare ");
  }

  const decorators = decoratorsFor(node, ancestors);
  let changed = true;
  while (changed) {
    changed = false;
    for (const decorator of decorators) {
      const next = stripDecoratorLine(result, decorator);
      if (next !== result) {
        result = next;
        changed = true;
      }
    }
  }
  return result;
}

function stripPrefix(text: string, prefix: string): string {
  const leading = text.match(/^[ \t]*/)?.[0] ?? "";
  const rest = text.slice(leading.length);
  return rest.startsWith(prefix) ? leading + rest.slice(prefix.length) : text;
}

function decoratorsFor(node: SgNode, ancestors: SgNode[]): string[] {
  const decorators = new Set<string>();
  const exportAncestor = ancestors.find(
    (ancestor) => ancestor.kind() === "export_statement",
  );
  if (exportAncestor) {
    for (const child of exportAncestor.namedChildren()) {
      if (child.kind() === "decorator") {
        decorators.add(child.text().trim());
      }
    }
  }

  let previous = node.prev();
  while (previous) {
    if (previous.kind() === "decorator") {
      decorators.add(previous.text().trim());
      previous = previous.prev();
      continue;
    }
    if (String(previous.kind()).includes("comment")) {
      previous = previous.prev();
      continue;
    }
    break;
  }
  return [...decorators];
}

function stripDecoratorLine(text: string, decorator: string): string {
  const lines = text.split("\n");
  if (lines[0]?.trim() === decorator) {
    lines.shift();
    return lines.join("\n");
  }
  return text;
}

function indentReplacement(text: string, indent: string): string {
  if (!indent) {
    return text;
  }
  const lines = text.split("\n");
  const first = lines.find((line) => line.trim().length > 0);
  if (!first || first.startsWith(indent)) {
    return text;
  }
  return lines
    .map((line) => (line.trim().length === 0 ? line : indent + line))
    .join("\n");
}

function lineIndentAt(text: string, lineIndex: number): string {
  const line = splitLines(text)[lineIndex] ?? "";
  return line.match(/^[ \t]*/)?.[0] ?? "";
}

function detectEol(text: string): "\n" | "\r\n" {
  return text.includes("\r\n") ? "\r\n" : "\n";
}

function normalizeEol(text: string, eol: "\n" | "\r\n"): string {
  return text.replace(/\r\n/g, "\n").replace(/\n/g, eol);
}

export function splitLines(text: string): string[] {
  return text.split(/\r?\n/);
}

function countOccurrences(text: string, needle: string): number {
  if (!needle) {
    return 0;
  }
  return text.split(needle).length - 1;
}

function requiredString(
  value: unknown,
  field: string,
  operation: string,
  allowEmpty = false,
): string {
  if (typeof value !== "string") {
    throw new Error(`apply ${operation} requires a string "${field}".`);
  }
  if (!allowEmpty && value.length === 0) {
    throw new Error(`apply ${operation} requires a non-empty "${field}".`);
  }
  return value;
}
