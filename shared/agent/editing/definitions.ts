import { parse } from "@ast-grep/napi";
import type { SgNode, SgRoot } from "@ast-grep/napi";
import {
  getActiveRules,
  getScriptLanguage,
  type DefinitionKind,
  type DefinitionRule,
  type ScriptLanguage,
} from "./languages";

export type Definition = {
  name: string;
  qualifiedName: string;
  kind: DefinitionKind;
  node: SgNode;
  /** 1-based first line of the declaration node. */
  startLine: number;
  /** 1-based last line of the declaration node. */
  endLine: number;
  /** Declaration text without export/declare wrappers, decorators, or comments. */
  text: string;
};

export type ParsedScript = {
  language: ScriptLanguage;
  root: SgRoot;
  text: string;
  definitions: Definition[];
  errors: string[];
};

export type ParseOutcome =
  | { status: "ok"; parsed: ParsedScript }
  | { status: "unsupported"; message: string }
  | { status: "error"; message: string };

export type DefinitionMatch =
  | { status: "ok"; definition: Definition }
  | { status: "not_found"; symbol: string; candidates: Definition[] }
  | { status: "ambiguous"; symbol: string; candidates: Definition[] };

export function tryParseScript(path: string, text: string): ParseOutcome {
  const language = getScriptLanguage(path);
  if (!language) {
    return {
      status: "unsupported",
      message: `No AST support for ${path}. Use apply operation "replace" for exact text edits.`,
    };
  }

  try {
    const root = parse(language.lang, text);
    return {
      status: "ok",
      parsed: {
        language,
        root,
        text,
        definitions: collectDefinitions(root, language),
        errors: errorTexts(root),
      },
    };
  } catch (error) {
    return {
      status: "error",
      message: `Failed to parse ${path}: ${(error as Error).message}`,
    };
  }
}

export function requireParsedScript(path: string, text: string): ParsedScript {
  const outcome = tryParseScript(path, text);
  if (outcome.status === "ok") {
    return outcome.parsed;
  }
  throw new Error(outcome.message);
}

export function collectDefinitions(
  root: SgRoot,
  language: ScriptLanguage,
): Definition[] {
  const rootNode = root.root();
  const definitions: Definition[] = [];
  const seen = new Set<number>();

  for (const rule of getActiveRules(language)) {
    for (const node of findAllKind(rootNode, rule.nodeKind)) {
      if (seen.has(node.id())) {
        continue;
      }
      const nameNode = findNameNode(node, rule);
      if (!nameNode) {
        continue;
      }
      seen.add(node.id());

      const start = node.range().start;
      const end = node.range().end;
      let endLine = end.line + 1;
      if (end.column === 0 && endLine > start.line + 1) {
        endLine -= 1;
      }

      definitions.push({
        name: cleanName(nameNode.text()),
        qualifiedName: "",
        kind: rule.kind,
        node,
        startLine: start.line + 1,
        endLine,
        text: node.text(),
      });
    }
  }

  const byNodeId = new Map<number, Definition>();
  for (const definition of definitions) {
    byNodeId.set(definition.node.id(), definition);
  }
  for (const definition of definitions) {
    const parts = [definition.name];
    for (const ancestor of definition.node.ancestors()) {
      const parent = byNodeId.get(ancestor.id());
      if (parent) {
        parts.unshift(parent.name);
      }
    }
    definition.qualifiedName = parts.join(".");
  }

  return definitions.sort(
    (left, right) =>
      left.startLine - right.startLine ||
      left.qualifiedName.localeCompare(right.qualifiedName),
  );
}

export function matchDefinition(
  definitions: Definition[],
  symbol: string,
  kind?: DefinitionKind,
): DefinitionMatch {
  const requested = normalizeSymbol(symbol);
  if (!requested) {
    return { status: "not_found", symbol, candidates: definitions };
  }

  const kindMatches = kind
    ? definitions.filter((definition) => definition.kind === kind)
    : definitions;

  let candidates = kindMatches.filter(
    (definition) => definition.qualifiedName === requested,
  );
  if (candidates.length === 0) {
    candidates = kindMatches.filter(
      (definition) => definition.name === requested,
    );
  }
  if (candidates.length === 0) {
    candidates = kindMatches.filter((definition) =>
      definition.qualifiedName.endsWith(`.${requested}`),
    );
  }

  if (candidates.length === 1) {
    return { status: "ok", definition: candidates[0]! };
  }
  if (candidates.length > 1) {
    return { status: "ambiguous", symbol, candidates };
  }
  return { status: "not_found", symbol, candidates: definitions };
}

export function formatOutline(
  definitions: Definition[],
  path?: string,
): string {
  if (definitions.length === 0) {
    return path ? `No definitions found in ${path}.` : "No definitions found.";
  }

  const shown = definitions.slice(0, 200);
  const lines = shown.map((definition) => {
    const depth = Math.max(0, definition.qualifiedName.split(".").length - 1);
    return `${definition.startLine}\t${"  ".repeat(depth)}${definition.kind} ${definition.qualifiedName}`;
  });
  if (definitions.length > shown.length) {
    lines.push(`... ${definitions.length - shown.length} more definitions`);
  }
  return lines.join("\n");
}

export function formatMatchFailure(
  match: Exclude<DefinitionMatch, { status: "ok" }>,
  path: string,
): string {
  if (match.status === "not_found") {
    const available = formatOutline(match.candidates, path);
    return `Symbol not found: ${match.symbol} in ${path}.\n${available}`;
  }
  const candidates = match.candidates
    .slice(0, 30)
    .map(
      (definition) =>
        `- ${definition.qualifiedName} (${definition.kind}, line ${definition.startLine})`,
    )
    .join("\n");
  return `Ambiguous symbol: ${match.symbol} in ${path}. Use a qualified name such as "Class.method" or add kind.\n${candidates}`;
}

function findAllKind(root: SgNode, kind: string): SgNode[] {
  try {
    return root.findAll({ rule: { kind: kind as never } }) as SgNode[];
  } catch {
    return [];
  }
}

function findNameNode(node: SgNode, rule: DefinitionRule): SgNode | undefined {
  if (rule.variable) {
    const declarators = node
      .namedChildren()
      .filter((child) => child.kind() === "variable_declarator");
    if (declarators.length !== 1) {
      return undefined;
    }
    const declarator = declarators[0];
    if (!declarator) {
      return undefined;
    }
    if (!hasAllowedValue(declarator, rule)) {
      return undefined;
    }
    return usableName(declarator.field("name"));
  }

  if (!hasAllowedValue(node, rule)) {
    return undefined;
  }

  const fieldName = rule.nameField ?? "name";
  const fieldNode = node.field(fieldName);
  if (fieldNode && isUsableNameKind(String(fieldNode.kind()))) {
    return fieldNode;
  }

  for (const child of node.namedChildren()) {
    if (rule.nameChildKinds?.includes(String(child.kind()))) {
      return child;
    }
  }
  return undefined;
}

function hasAllowedValue(node: SgNode, rule: DefinitionRule): boolean {
  if (!rule.valueKinds) {
    return true;
  }
  const value = node.field("value");
  return Boolean(value && rule.valueKinds.includes(String(value.kind())));
}

function usableName(node: SgNode | null | undefined): SgNode | undefined {
  if (!node) {
    return undefined;
  }
  return isUsableNameKind(String(node.kind())) ? node : undefined;
}

function isUsableNameKind(kind: string): boolean {
  return (
    kind.includes("identifier") ||
    kind === "string" ||
    kind === "template_string"
  );
}

function cleanName(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith("`") && trimmed.endsWith("`"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function normalizeSymbol(symbol: string): string {
  return symbol.trim().replace(/::/g, ".");
}

function errorTexts(root: SgRoot): string[] {
  return findAllKind(root.root(), "ERROR").map((node) =>
    node.text().replace(/\s+/g, " ").trim().slice(0, 240),
  );
}
