import { test, expect, beforeEach } from "bun:test";
import { initRagTool } from "./tools";
import { invokeTool } from "../shared/testing";
import { logger } from "../shared/utils";

// searchTool.execute returns AgentToolResult (content: [{type,text}]);
// no local toPiContent import needed here.
test("search tool returns a tool result", async () => {
  const tool = await initRagTool(":memory:", [
    { dir: `${import.meta.dir}/fixtures`, subject: "test" },
  ]);
  //@ts-expect-error
  const res = await invokeTool(tool, {
    query: "dog pet animal",
    subject: "test",
  });
  logger.info(res);
  expect(res.text).toContain("cats");
});
