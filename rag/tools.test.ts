import { expect, test } from "bun:test";
import { addDirectoryToRag } from "./add_to_rag";
import { initRagTool } from "./tools";
import { invokeTool } from "../shared/testing";

test("search tool returns a tool result", async () => {
  const configs = [
    { dir: `${import.meta.dir}/fixtures`, subject: "test" },
  ];
  const tool = await initRagTool(":memory:", configs);
  await addDirectoryToRag(configs[0]!.dir, configs[0]!.subject);

  const res = await invokeTool(tool, {
    query: "dog pet animal",
    subject: "test",
  });
  expect(res.text).toContain("cats");
}, 30_000);
