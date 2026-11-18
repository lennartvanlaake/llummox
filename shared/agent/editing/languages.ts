import { Lang, kind as kindId } from "@ast-grep/napi";

export const DEFINITION_KINDS = [
  "function",
  "method",
  "class",
  "interface",
  "type",
  "enum",
] as const;

export type DefinitionKind = (typeof DEFINITION_KINDS)[number];

export type DefinitionRule = {
  nodeKind: string;
  kind: DefinitionKind;
  /** Field containing the definition name. Defaults to "name". */
  nameField?: string;
  /** Fallback child kinds used when the grammar has no name field. */
  nameChildKinds?: readonly string[];
  /** Only collect variable declarations whose value has one of these kinds. */
  valueKinds?: readonly string[];
  /** Resolve the name from a single variable_declarator child. */
  variable?: boolean;
};

export type ScriptLanguage = {
  id: string;
  lang: Lang;
  rules: DefinitionRule[];
  activeRules?: DefinitionRule[];
};

const TS_RULES: DefinitionRule[] = [
  { nodeKind: "function_declaration", kind: "function" },
  { nodeKind: "generator_function_declaration", kind: "function" },
  { nodeKind: "function_signature", kind: "function" },
  { nodeKind: "method_definition", kind: "method" },
  { nodeKind: "method_signature", kind: "method" },
  { nodeKind: "abstract_method_signature", kind: "method" },
  { nodeKind: "class_declaration", kind: "class" },
  { nodeKind: "abstract_class_declaration", kind: "class" },
  { nodeKind: "interface_declaration", kind: "interface" },
  { nodeKind: "type_alias_declaration", kind: "type" },
  { nodeKind: "enum_declaration", kind: "enum" },
  {
    nodeKind: "public_field_definition",
    kind: "method",
    valueKinds: ["arrow_function", "function_expression"],
  },
  {
    nodeKind: "lexical_declaration",
    kind: "function",
    variable: true,
    valueKinds: ["arrow_function", "function_expression"],
  },
  {
    nodeKind: "variable_declaration",
    kind: "function",
    variable: true,
    valueKinds: ["arrow_function", "function_expression"],
  },
  {
    nodeKind: "pair",
    kind: "method",
    nameField: "key",
    valueKinds: ["arrow_function", "function_expression"],
  },
];

const JS_RULES: DefinitionRule[] = [
  { nodeKind: "function_declaration", kind: "function" },
  { nodeKind: "generator_function_declaration", kind: "function" },
  { nodeKind: "method_definition", kind: "method" },
  { nodeKind: "class_declaration", kind: "class" },
  {
    nodeKind: "field_definition",
    kind: "method",
    nameChildKinds: ["property_identifier", "identifier"],
    valueKinds: ["arrow_function", "function_expression"],
  },
  {
    nodeKind: "lexical_declaration",
    kind: "function",
    variable: true,
    valueKinds: ["arrow_function", "function_expression"],
  },
  {
    nodeKind: "variable_declaration",
    kind: "function",
    variable: true,
    valueKinds: ["arrow_function", "function_expression"],
  },
  {
    nodeKind: "pair",
    kind: "method",
    nameField: "key",
    valueKinds: ["arrow_function", "function_expression"],
  },
];

const LANGUAGES: Record<string, ScriptLanguage> = {
  ts: { id: "typescript", lang: Lang.TypeScript, rules: TS_RULES },
  mts: { id: "typescript", lang: Lang.TypeScript, rules: TS_RULES },
  cts: { id: "typescript", lang: Lang.TypeScript, rules: TS_RULES },
  tsx: { id: "tsx", lang: Lang.Tsx, rules: TS_RULES },
  js: { id: "javascript", lang: Lang.JavaScript, rules: JS_RULES },
  jsx: { id: "javascript", lang: Lang.JavaScript, rules: JS_RULES },
  mjs: { id: "javascript", lang: Lang.JavaScript, rules: JS_RULES },
  cjs: { id: "javascript", lang: Lang.JavaScript, rules: JS_RULES },
};

export function extensionOf(path: string): string {
  const index = path.lastIndexOf(".");
  return index === -1 ? "" : path.slice(index + 1).toLowerCase();
}

export function getScriptLanguage(path: string): ScriptLanguage | undefined {
  return LANGUAGES[extensionOf(path)];
}

export function getActiveRules(language: ScriptLanguage): DefinitionRule[] {
  if (language.activeRules) {
    return language.activeRules;
  }
  const active = language.rules.filter((rule) => {
    try {
      kindId(language.lang, rule.nodeKind as never);
      return true;
    } catch {
      return false;
    }
  });
  language.activeRules = active;
  return active;
}
