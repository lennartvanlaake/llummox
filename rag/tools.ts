import { searchRag } from "./search";
import { Type } from "@earendil-works/pi-ai";
import { defineTool } from "@earendil-works/pi-coding-agent";
import { toPiContent } from "../shared/utils";
import { setupDatabase } from "./db";
import { addDirectoryToRag } from "./add_to_rag";

export type KnowledgeConfig = {
  dir: string;
  subject: string;
};

export async function initRagTool(dbPath: string, configs: KnowledgeConfig[]) {
  setupDatabase(dbPath);

  // for (const c of configs) {
  //   await addDirectoryToRag(c.dir, c.subject);
  // }

  const subjects = [...new Set(configs.map((c) => c.subject))];

  return defineTool({
    label: "search_knowledge",
    name: "Search Rag",
    description:
      "Look up information about a library, topic, or concept from the RAG corpus. Use when the agent needs reference material.",
    parameters: Type.Object({
      // query: what the user asked about, rephrased for retrieval.
      query: Type.String({ description: "The search question/phrase." }),
      // Only documents whose stored subject matches this are searched.
      subject: Type.Enum(subjects, {
        description: "Restrict results to this subject.",
      }),
    }),
    execute: async (_toolCallId, params, _signal, _onUpdate, _ctx) => {
      const { query, subject } = params;
      const results = await searchRag(params.query, 5, subject);
      if (results.length === 0) {
        return toPiContent(`No results found for "${query}".`);
      }
      const preview = results
        .slice(0, 3)
        .map((r) => `${r.source}:\n${r.content}`);
      return toPiContent(
        `Top ${Math.min(results.length, 3)} results matching "${query}":\n\n${preview}`,
      );
    },
  });
}
