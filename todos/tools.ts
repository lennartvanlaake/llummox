import * as crud from "./crud";
import { TASK_STATUSES } from "./constants";

import { Type } from "@earendil-works/pi-ai";
import { defineTool } from "@earendil-works/pi-coding-agent";
import { toPiContent } from "../shared/utils";
// ---- Task (story) tools ---------------------------------------------------
export const updateTaskTool = defineTool({
  label: "update_task",
  name: "Update task",
  description:
    "Update fields of a task (story). Providing a field changes it; omit it to leave it unchanged. Empty string clears a text field.",
  parameters: Type.Object({
    taskId: Type.String({ description: "Task id to update." }),
    status: Type.Optional(
      Type.String({ description: "New status. Omit to leave unchanged." }),
    ),
    notes: Type.Optional(
      Type.String({ description: "New notes. Omit to leave unchanged." }),
    ),
  }),
  execute: async (_toolCallId, params) => {
    try {
      const before = crud.getTask(params.taskId);
      if (!before)
        throw new Error(`Task with id ${params.taskId} does not exist`);
      const changes = {
        status: before.status,
        notes: before.notes,
      };

      if (params.status !== undefined) changes.status = params.status;
      if (params.notes !== undefined) changes.notes = params.notes;

      return toPiContent(crud.updateTask(params.taskId, changes));
    } catch (e) {
      return toPiContent({ error: `error: ${(e as Error).message}` }, true);
    }
  },
});

// ---- Subtask tools --------------------------------------------------------

export const getSubtasksTool = defineTool({
  label: "get_subtasks",
  name: "Get Subtasks",
  description: "Gets all subtasks of a task",
  parameters: Type.Object({
    taskId: Type.String({ description: "Task id to fetch subtasks for." }),
  }),
  outputSchema: Type.Object({
    subtasks: Type.Array(
      Type.Object({
        id: Type.String({}),
        title: Type.String({}),
        description: Type.String({}),
        notes: Type.String({}),
        status: Type.String({}),
        order: Type.Integer({}),
      }),
    ),
  }),
  execute: async (_toolCallId, params) => {
    const subtasks = crud.getSubtasks(params.taskId) ?? [];
    return toPiContent({
      subtasks: subtasks.map((it) => ({
        id: it.id,
        title: it.title,
        description: it.description,
        notes: it.notes,
        status: it.status,
        order: it.order,
      })),
    });
  },
});

export const createSubtaskTool = defineTool({
  label: "create_subtask",
  name: "Create Subtask",
  description: "Create a subtask. Requires a taskId obtained by creating task.",
  parameters: Type.Object({
    title: Type.String({ description: "Subtask title." }),
    description: Type.String({
      description:
        "Details of the step. Make this clear enough to be picked up by an LLM agent.",
    }),
    taskId: Type.String({
      description: "Task id (uuid) this subtask belongs to.",
    }),
    order: Type.Optional(
      Type.Integer({
        description:
          "Explicit ordering. Lower = returned first by getNextSubtask. Omit to auto-assign the next sequential order.",
      }),
    ),
  }),
  execute: async (_toolCallId, params) => {
    // Validate the task exists so we never create an orphaned subtask.
    const task = crud.getTask(params.taskId);
    if (!task) {
      return toPiContent({ error: `task ${params.taskId} does not exist` });
    }
    try {
      const subtask = await crud.createSubtask({
        title: params.title,
        description: params.description,
        taskId: params.taskId,
        order: params.order
      })

      debugger
      return toPiContent({ taskId: params.taskId, subTaskId: subtask.id, order: subtask.order });
    } catch (e: unknown) {
      return toPiContent({ error: (e as Error).message });
    }
  },
});

export const updateSubtaskWorkerTool = defineTool({
  label: "update_subtask_worker",
  name: "Update Subtask (worker)",
  description:
    "Update a subtask's status and notes in one call. Use to reflect daily work: 'todo' | 'in-progress' | 'done'. Empty notes clears the notes.",
  parameters: Type.Object({
    subtaskId: Type.String({ description: "Subtask id to update." }),
    status: Type.Enum(TASK_STATUSES, {
      description: "New status: 'todo' | 'in-progress' | 'done'.",
    }),
    notes: Type.String({
      description: "New notes text. Empty string clears the notes.",
    }),
  }),
  execute: async (_toolCallId, params) => {
    try {
      // empty-string notes = "no notes", so it does not overwrite the existing
      // handoff notes (which would otherwise make the manager's handoff prompt
      // dead and strand the worker on the same subtask forever).
      const changes = { status: params.status };
      if (params.notes && params.notes !== "") changes["notes"] = params.notes;

      await crud.updateSubtask(params.subtaskId, changes);
      return toPiContent({ error: null });
    } catch (e) {
      return toPiContent({ error: (e as Error).message }, true);
    }
  },
});

export const updateSubtaskManagerTool = defineTool({
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
      return toPiContent({ error: null });
    } catch (e) {
      return toPiContent({ error: (e as Error).message }, true);
    }
  },
});
