import { test, expect, beforeEach } from "bun:test";
import { searchTool } from "./tools";
import {
  setupDatabase,
  insertDoc,
  insertDocChunk,
  insertDocVector,
  db,
} from "./db";
import { embed } from "./embed";
import { invokeTool } from "../shared/testing";

// searchTool.execute returns AgentToolResult (content: [{type,text}]);
// no local toPiContent import needed here.

beforeEach(() => setupDatabase(":memory:"));

test("search tool returns a tool result", async () => {
  seedCorpus();

  const res = (await invokeTool(searchTool,
    { query: "dog pet animal" }
  ));
  expect(res.text).toContain("cats");
});

// seed a corpus so the tool's vec0 search has rows to rank (mirrors search.test.ts).
async function seedCorpus() {
  const corpus = [
    { source: "cats", content: "A cat is a small domestic feline pet animal." },
    {
      source: "bread",
      content: "Bread is a baked grain food made from flour.",
    },
    {
      source: "car",
      content: "A car is a motorized road vehicle with four wheels.",
    },
    {
      source: "coffee",
      content: "Coffee is a brewed hot beverage from roasted beans.",
    },
  ];
  db.query("DELETE FROM vec_doc_chunks").run();
  db.query("DELETE FROM doc_chunks").run();
  db.query("DELETE FROM docs").run();
  for (const c of corpus) {
    const docId = insertDoc(c.source, "h" + c.source, "md", "prose");
    const id = insertDocChunk(docId, c.content);
    const emb = await embed(c.content);
    insertDocVector(id, emb);
  }
}
