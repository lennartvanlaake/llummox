import { searchRag } from "./search";
import { Type } from "@earendil-works/pi-ai";
import { defineTool } from "@earendil-works/pi-coding-agent";
import { toPiContent } from "../shared/utils";

export const searchTool = defineTool({
  label: "search_rag",
  name: "Search Rag",
  description:
    "Look up information about a library, topic, or concept from the RAG corpus. Use when the agent needs reference material.",
  parameters: Type.Object({
    // query: what the user asked about, rephrased for retrieval.
    query: Type.String({ description: "The search question/phrase." }),
    // type: which source kind to pull from.
    type: Type.Enum(["examples", "docs", "summaries"], {
      description: "Kind of content to retrieve.",
    }),
    // topic: the subject to search for (e.g. "langchain", "html").
    topic: Type.String({ description: "The subject/topic to search for." }),
  }),
  execute: async (_toolCallId, params, _signal, _onUpdate, _ctx) => {
    const { query, type, topic } = params;
    const results = await searchRag(params.query, 5);
    if (results.length === 0) {
      return toPiContent(
        `No results found for "${params.topic}" matching "${query}".`,
      );
    }
    const preview = results
      .slice(0, 3)
      .map((r) => `${r.source}:\n${r.content}`);
    return toPiContent(
      `Top ${Math.min(results.length, 3)} results for "${type} ${topic}" matching "${query}":\n\n${preview}\n... (+${results.length - preview.length} more).`,
    );
  },
});
