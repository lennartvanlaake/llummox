import * as crud from "./crud";
import { TASK_STATUSES, TaskStatus } from "./constants";

import {
  defineTool,
  stringEnum,
  toToolResult,
  Type,
} from "../shared/agent/tools";
import { parseTsSchema } from "../shared/agent/schema";
import { logger } from "../shared/utils";
import { run as runJq } from "@gabrielbryk/jq-ts";
import { compileSchema } from "json-schema-library";

function compileReportSchema(schema?: string) {
  return schema ? compileSchema(parseTsSchema(schema) as any) : null;
}

export function renderTodoManagerTools(taskId: string, schema?: string) {
  const compiledSchema = compileReportSchema(schema);

  // ---- Task (story) tools ---------------------------------------------------
  const updateTaskTool = defineTool({
    name: "Update task",
    description:
      "Update fields of a task (story). Providing a field changes it; omit it to leave it unchanged. Empty string clears a text field.",
    parameters: Type.Object({
      status: Type.Optional(
        Type.String({ description: "New status. Omit to leave unchanged." }),
      ),
      notes: Type.Optional(
        Type.String({ description: "New notes. Omit to leave unchanged." }),
      ),
    }),
    execute: async (params) => {
      try {
        const before = crud.getTask(taskId)!;
        const changes = {
          status: before.status,
          notes: before.notes,
        };

        if (params.status !== undefined) changes.status = params.status;
        if (params.notes !== undefined) changes.notes = params.notes;
        crud.updateTask(taskId, changes);
        return toToolResult("ok");
      } catch (e) {
        return toToolResult(
          { error: `error: ${(e as Error).message}` },
          true,
        );
      }
    },
  });

  const updateTaskData = defineTool({
    name: "Update task data",
    description: `Update the data of the give task. Data will be checked against json-schema: """ 
        ${schema}
   """}`,
    parameters: Type.Object({
      jsCommand: Type.String({
        description: `JavaScript code used with "eval" to edit the data. Assume that the object is a JS object stored in variable called data. Ex: jsCommand: 'data.hello = "world"' -> data = { "hello": "world" }`,
      }),
    }),

    execute: async (params) => {
      try {
        const before = crud.getTask(taskId)!;
        let data = before.data;
        eval(params.jsCommand);
        if (compiledSchema) {
          const { errors } = compiledSchema.validate(data);
          logger.info("Data updated:");
          logger.info(data);
          if (errors.length > 0) {
            throw new Error(
              `Data invalid: ${JSON.stringify(errors)}. Expected data to comply to schema ${schema}.`,
            );
          }
        }
        return toToolResult(crud.updateTask(taskId, { data }));
      } catch (e) {
        return toToolResult(
          `error: ${(e as Error).message}`,
          true,
        );
      }
    },
  });

  const getTaskData = defineTool({
    name: "Get task data",
    description: "Search the data of the task",
    parameters: Type.Object({
      filter: Type.Optional(
        Type.String({
          description: `jq-style filter for the data. To get the full data, leave empty. Ex: IF data = { "a": {"b" : "c"} } | AND filter = ".a" | THEN output { "b": "c" }`,
        }),
      ),
    }),
    execute: async (params) => {
      const task = crud.getTask(taskId)!;
      if (params.filter) {
        return toToolResult(runJq(params.filter, task.data as any));
      } else {
        return toToolResult(task.data as any);
      }
    },
  });

  const getSubtasksTool = defineTool({
    name: "Get Subtasks",
    description: "Gets all subtasks of a task",
    parameters: Type.Null(),
    execute: async () => {
      const subtasks = crud.listSubtasks(taskId) ?? [];
      return toToolResult({
        subtasks: subtasks.map((it) => ({
          id: it.id,
          title: it.title,
          description: it.description,
          result: it.result,
          status: it.status,
          order: it.order,
        })),
      });
    },
  });

  const createSubtaskTool = defineTool({
    name: "Create Subtask",
    description:
      "Create a subtask. Requires a taskId obtained by creating task.",
    parameters: Type.Object({
      title: Type.String({ description: "Subtask title." }),
      description: Type.String({
        description:
          "Details of the step. Make this clear enough to be picked up by an LLM agent.",
      }),
      order: Type.Optional(
        Type.Integer({
          description:
            "Explicit ordering. Lower = returned first by getNextSubtask. Omit to auto-assign the next sequential order.",
        }),
      ),
      reportSchema: Type.Optional(
        Type.String({
          description:
            "TS-Schema for validating data. Use `type Schema = { prop: type }` syntax. Workers fill and validate their report against this schema.",
        }),
      ),
    }),
    execute: async (params) => {
      try {
        await crud.createSubtask({
          title: params.title,
          description: params.description,
          taskId: taskId,
          order: params.order,
          schema: params.reportSchema ?? "",
        });
        const subtasks = crud
          .listSubtasks(taskId)
          .map((it) => `id: ${it.id} title: ${it.title}`)
          .join(",");
        return toToolResult(`Success. Current subtasks: ${subtasks}`);
      } catch (e: unknown) {
        return toToolResult({ error: (e as Error).message }, true);
      }
    },
  });

  const updateSubtaskManagerTool = defineTool({
    name: "Update Subtask (manager)",
    description:
      "Update a subtask's status and notes in one call. Use to reflect daily work: 'todo' | 'in-progress' | 'done'. Empty notes clears the notes.",
    parameters: Type.Object({
      subtaskId: Type.String({ description: "Subtask id to update." }),
      status: stringEnum(TASK_STATUSES, {
        description: "New status: 'todo' | 'in-progress' | 'done'.",
      }),
      title: Type.String({ description: "New title text." }),
      description: Type.String({ description: "New description text." }),
    }),
    execute: async (params) => {
      try {
        const changes = {
          status: params.status,
          title: params.title,
          description: params.description,
        };

        await crud.updateSubtask(params.subtaskId, changes);
        return toToolResult("ok");
      } catch (e) {
        return toToolResult({ error: (e as Error).message }, true);
      }
    },
  });

  return {
    updateTaskTool,
    updateTaskData,
    getTaskData,
    getSubtasksTool,
    createSubtaskTool,
    updateSubtaskManagerTool,
  };
}

export function renderTodoWorkerTools(subtaskId: string, schema?: string) {
  const compiledSchema = compileReportSchema(schema);

  const workerResultTool = defineTool({
    name: "Result reporting by the worker",
    description:
      "Report this subtask's result. The result is validated against the JSON schema stored on the subtask; an invalid report fails the call.",
    parameters: Type.Object({
      resultJSON: Type.String({
        description: `The structured result of the work. Has to match schema ${schema}`,
      }),
    }),

    execute: async (params, ctx) => {
      try {
        const subtask = crud.getSubtask(subtaskId);
        if (!subtask) {
          throw new Error(`No subtask with id ${subtaskId}`);
        }
        const data = params.resultJSON;
        if (compiledSchema) {
          const { valid, errors, annotations } = compiledSchema.validate(
            JSON.parse(data),
          );
          logger.info(annotations);
          if (!valid) {
            throw Error(
              `Result invalid: ${JSON.stringify(errors)} .Expected data to comply to schema ${JSON.stringify(subtask.schema)}.Example of compliant data: ${compiledSchema.getData()}`,
            );
          }
        }
        await crud.updateSubtask(subtaskId, {
          status: "done",
          result: data,
        });
        ctx.stop();
        return toToolResult("ok");
      } catch (e) {
        return toToolResult({ error: (e as Error).message }, true);
      }
    },
  });

  const reportBlock = defineTool({
    name: "Worker reporting a blocking issue",
    description:
      "Use this when the result asked for cannot be provided. This may be because your tools are insufficient or the task given does not match reality",
    parameters: Type.Object({
      blockedReason: Type.String({
        description: `What is blocking the completion of your task`,
      }),
    }),

    execute: async (params, ctx) => {
      try {
        await crud.updateSubtask(subtaskId, {
          status: TaskStatus.blocked,
          result: params.blockedReason,
        });
        logger.error(params.blockedReason);
        ctx.stop();
        return toToolResult("ok");
      } catch (e) {
        return toToolResult({ error: (e as Error).message }, true);
      }
    },
  });

  return { workerResultTool, reportBlock };
}
