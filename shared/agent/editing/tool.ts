import { defineTool, stringEnum, Type } from "../tools";
import { applyOperation } from "./apply";
import { DEFINITION_KINDS } from "./languages";

export const applyTool = defineTool({
  name: "apply",
  description:
    "Create, overwrite, or edit a file. Use replace_definition for one whole named definition in .ts, .tsx, .js, or .jsx. The replacement is the declaration only: existing export/declare wrappers, decorators, and attached comments are preserved. Use replace for an exact unique text change in any file.",
  parameters: Type.Object({
    operation: stringEnum(
      ["create", "overwrite", "replace", "replace_definition"],
      {
        description:
          "create: new file only. overwrite: replace an existing file. replace: exact unique string replacement. replace_definition: AST-aware whole-definition replacement.",
      },
    ),
    path: Type.String({ description: "File path relative to cwd." }),
    content: Type.Optional(
      Type.String({
        description: "Full file content. Required for create and overwrite.",
      }),
    ),
    oldText: Type.Optional(
      Type.String({
        description:
          "Exact text to replace. It must occur exactly once. Required for replace.",
      }),
    ),
    newText: Type.Optional(
      Type.String({
        description: "Replacement text. Required for replace.",
      }),
    ),
    symbol: Type.Optional(
      Type.String({
        description:
          'Qualified or unique simple definition name, for example "Greeter.greet". Required for replace_definition.',
      }),
    ),
    kind: Type.Optional(
      stringEnum(DEFINITION_KINDS, {
        description:
          "Optional definition kind used to disambiguate replace_definition.",
      }),
    ),
    replacement: Type.Optional(
      Type.String({
        description:
          "New declaration text. Required for replace_definition. Do not include export/declare, decorators, or attached comments; they are preserved.",
      }),
    ),
  }),
  execute: async (params, ctx) => {
    const result = await applyOperation(params, ctx.cwd);
    return { content: result.content, details: result.details };
  },
});
