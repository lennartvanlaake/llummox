import * as crud from "./crud";
import { TASK_STATUSES, TaskStatus } from "./constants";

import { Type } from "@earendil-works/pi-ai";
import { defineTool } from "@earendil-works/pi-coding-agent";
import { logger, toPiContent, toToon } from "../shared/utils";
import { run as runJq } from "@gabrielbryk/jq-ts";
import { compileSchema, type JsonSchema } from "json-schema-library";

export function renderTodoManagerTools(taskId: string, schema: any) {
  const compiledSchema = compileSchema(schema);
  const defaultData = compiledSchema.getData();

  // ---- Task (story) tools ---------------------------------------------------
  const updateTaskTool = defineTool({
    label: "update_task",
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
    execute: async (_toolCallId, params) => {
      try {
        const before = crud.getTask(taskId)!;
        const changes = {
          status: before.status,
          notes: before.notes,
        };

        if (params.status !== undefined) changes.status = params.status;
        if (params.notes !== undefined) changes.notes = params.notes;
        crud.updateTask(taskId, changes);
        return toPiContent("ok");
      } catch (e) {
        return toPiContent({ error: `error: ${(e as Error).message}` }, true);
      }
    },
  });

  const updateTaskData = defineTool({
    label: "update_task_data",
    name: "Update task data",
    description: `Update the data of the give task. Data will be checked against json-schema: """ 
        ${JSON.stringify(schema)}
   """}`,
    parameters: Type.Object({
      jsCommand: Type.String({
        description: `JavaScript code used with "eval" to edit the data. Assume that the object is a JS object stored in variable called data. Ex: jsCommand: 'data.hello = "world"' -> data = { "hello": "world" }`,
      }),
    }),

    execute: async (_toolCallId, params) => {
      try {
        const before = crud.getTask(taskId)!;
        const data = before.data;
        eval(params.jsCommand);
        const { valid, errors } = compiledSchema.validate(data);
        logger.info("Data updated:")
        logger.info(data)
        if (!valid) {
          throw new Error(
            `Data invalid: ${JSON.stringify(errors)}. Expected data to comply to schema ${JSON.stringify(schema)}. Example of compliant data: ${defaultData}`,
          );
        }
        return toPiContent(crud.updateTask(taskId, { data }));
      } catch (e) {
        return toPiContent(`error: ${(e as Error).message}`, true);
      }
    },
  });

  const getTaskData = defineTool({
    label: "get_task_data",
    name: "Get task data",
    description: "Search the data of the task",
    parameters: Type.Object({
      filter: Type.Optional(
        Type.String({
          description: `jq-style filter for the data. To get the full data, leave empty. Ex: IF data = { "a": {"b" : "c"} } | AND filter = ".a" | THEN output { "b": "c" }`,
        }),
      ),
    }),
    execute: async (_toolCallId, params) => {
      const task = crud.getTask(taskId)!;
      if (params.filter) {
        return toPiContent(runJq(params.filter, task.data as any));
      } else {
        return toPiContent(task.data);
      }
    },
  });

  const getSubtasksTool = defineTool({
    label: "get_subtasks",
    name: "Get Subtasks",
    description: "Gets all subtasks of a task",
    parameters: Type.Null,
    outputSchema: Type.Object({
      subtasks: Type.Array(
        Type.Object({
          id: Type.String({}),
          title: Type.String({}),
          description: Type.String({}),
          result: Type.Object({}),
          status: Type.String({}),
          order: Type.Integer({}),
        }),
      ),
    }),
    execute: async () => {
      const subtasks = crud.listSubtasks(taskId) ?? [];
      return toPiContent({
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
    label: "create_subtask",
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
            "JSON Schema describing the structured result this subtask reports. Omit for free-form text. Workers fill and validate their report against this schema.",
        }),
      ),
    }),
    execute: async (_toolCallId, params) => {
      try {
        await crud.createSubtask({
          title: params.title,
          description: params.description,
          taskId: taskId,
          order: params.order,
          schema: params.reportSchema ?? "",
        });
        return toPiContent("ok");
      } catch (e: unknown) {
        return toPiContent({ error: (e as Error).message });
      }
    },
  });

  const updateSubtaskManagerTool = defineTool({
    label: "update_subtask_manager",
    name: "Update Subtask (manager)",
    description:
      "Update a subtask's status and notes in one call. Use to reflect daily work: 'todo' | 'in-progress' | 'done'. Empty notes clears the notes.",
    parameters: Type.Object({
      subtaskId: Type.String({ description: "Subtask id to update." }),
      status: Type.Enum(TASK_STATUSES, {
        description: "New status: 'todo' | 'in-progress' | 'done'.",
      }),
      title: Type.String({ description: "New title text." }),
      description: Type.String({ description: "New description text." }),
    }),
    execute: async (_toolCallId, params) => {
      try {
        const changes = {
          status: params.status,
          title: params.title,
          description: params.description,
        };

        await crud.updateSubtask(params.subtaskId, changes);
        return toPiContent("ok");
      } catch (e) {
        return toPiContent({ error: (e as Error).message }, true);
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
export function renderTodoWorkerTools(subtaskId: string, schema: object) {
  const workerResultTool = defineTool({
    label: "worker_result",
    name: "Result reporting by the worker",
    description:
      "Report this subtask's result. The result is validated against the JSON schema stored on the subtask; an invalid report fails the call.",
    parameters: Type.Object({
      resultJSON: Type.String({
        description: `The structured result of the work. Has to match schema ${schema}`,
      }),
    }),

    execute: async (_toolCallId, params, _signal, _onUpdate, ctx) => {
      try {
        const subtask = crud.getSubtask(subtaskId);
        if (!subtask) {
          throw new Error(`No subtask with id ${subtaskId}`);
        }
        const data = params.resultJSON;
        const compiled = compileSchema(subtask.schema as any);
        const { valid, errors, annotations } = compiled.validate(JSON.parse(data));
        logger.info(annotations)
        if (!valid) {
          throw Error(
            `Result invalid: ${JSON.stringify(errors)} .Expected data to comply to schema ${JSON.stringify(subtask.schema)}.Example of compliant data: ${compiled.getData()}`,
          );
        }
        await crud.updateSubtask(subtaskId, {
          status: "done",
          result: data,
        });
        ctx.abort();
        return toPiContent("ok");
      } catch (e) {
        return toPiContent({ error: (e as Error).message }, true);
      }
    },
  });

  return { workerResultTool };
}
