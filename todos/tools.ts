import * as crud from "./crud";
import { TASK_STATUSES, TaskStatus } from "./constants";

import { Type } from "@earendil-works/pi-ai";
import { defineTool } from "@earendil-works/pi-coding-agent";
import { logger, toPiContent } from "../shared/utils";
import { run as runJq } from "@gabrielbryk/jq-ts";
import { compileSchema } from "json-schema-library";

export function renderTodoManagerTools(taskId: string, schema?: string) {

  const compiledSchema = schema ? compileSchema((Type.Script(schema) as any).Schema) : null;

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
        ${schema}
   """}`,
    parameters: Type.Object({
      jsCommand: Type.String({
        description: `JavaScript code used with "eval" to edit the data. Assume that the object is a JS object stored in variable called data. Ex: jsCommand: 'data.hello = "world"' -> data = { "hello": "world" }`,
      }),
    }),

    execute: async (_toolCallId, params) => {
      try {
        const before = crud.getTask(taskId)!;
        let data = before.data;
        eval(params.jsCommand);
        if (compiledSchema) {
          const { valid, errors } = compiledSchema.validate(data);
          // const errors = [...compiledSchema.Errors(data)];
          logger.info("Data updated:")
          logger.info(data)
          if (errors.length > 0) {
            throw new Error(
              `Data invalid: ${JSON.stringify(errors)}. Expected data to comply to schema ${schema}.`,
            );
          }
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
            "TS-Schema for validating data. Use `type Schema = { prop: type }` syntax. Workers fill and validate their report against this schema.",
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
        const subtasks = crud.listSubtasks(taskId).map(it => `id: ${it.id} title: ${it.title}`).join(",")
        return toPiContent(`Success. Current subtasks: ${subtasks}`);
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
export function renderTodoWorkerTools(subtaskId: string, schema?: string) {

  const compiledSchema = schema ? compileSchema((Type.Script(schema) as any).Schema) : null;
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
        if (compiledSchema) {
          // is this working?
          const { valid, errors, annotations } = compiledSchema.validate(JSON.parse(data));
          logger.info(annotations)
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
        ctx.abort();
        return toPiContent("ok");
      } catch (e) {
        return toPiContent({ error: (e as Error).message }, true);
      }
    },
  });

  const reportBlock = defineTool({
    label: "report_blocker",
    name: "Worker reporting a blocking issue",
    description:
      "Use this when the result asked for cannot be provided. This may be because your tools are insufficient or the task given does not match reality",
    parameters: Type.Object({
      blockedReason: Type.String({
        description: `What is blocking the completion of your task`,
      }),
    }),

    execute: async (_toolCallId, params, _signal, _onUpdate, ctx) => {
      try {
        await crud.updateSubtask(subtaskId, {
          status: TaskStatus.blocked,
          result: params.blockedReason
        });
        logger.error(params.blockedReason)
        ctx.abort();
        return toPiContent("ok");
      } catch (e) {
        return toPiContent({ error: (e as Error).message }, true);
      }
    }
  })

  return { workerResultTool, reportBlock };
}



