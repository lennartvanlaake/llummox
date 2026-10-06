import { z } from "zod/v4";
import * as crud from "./crud";
import { tool } from "ai";
import { TASK_STATUSES } from "./constants";

// ---- Task (story) tools ---------------------------------------------------

export const updateTaskTool = tool({
  description:
    "Update fields of a task (story). Providing a field changes it; omit it to leave it unchanged. Empty string clears a text field.",
  inputSchema: z.object({
    taskId: z.string().describe("Task id to update."),
    status: z
      .string()
      .optional()
      .describe("New status. Omit to leave unchanged."),
    notes: z
      .string()
      .optional()
      .describe("New notes. Omit to leave unchanged."),
  }),
  // ponytail: tasks are managed statically (no AI), so this tool only flips
  // status/notes — prompt is set once and edited out of band.
  outputSchema: z.object({
    error: z.string().optional(),
  }),
  execute: async (input) => {
    try {
      const before = crud.getTask(input.taskId);
      if (!before)
        throw new Error(`Task with id ${input.taskId} does not exist`);
      const changes = {
        status: before.status,
        notes: before.notes,
      };

      if (input.status !== undefined) changes.status = input.status;
      if (input.notes !== undefined) changes.notes = input.notes;

      await crud.updateTask(input.taskId, changes);
      return {};
    } catch (e) {
      return { error: `error: ${(e as Error).message}` };
    }
  },
});

// ---- Subtask tools --------------------------------------------------------
//

export const getSubtasksTool = tool({
  description: "Gets all subtasks of a task",
  inputSchema: z.object({ taskId: z.string() }),
  outputSchema: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      notes: z.string(),
      status: z.string(),
    }),
  ),
  execute: async (input) => {
    const subtasks = crud.getSubtasks(input.taskId);
    return subtasks.map((it) => {
      const { id, title, description, notes, status } = it;
      return { id, title, description, notes, status };
    });
  },
});

export const createSubtaskTool = tool({
  description: "Create a subtask. Requires a taskId obtained by creating task.",
  inputSchema: z.object({
    title: z.string().min(1).describe("Subtask title."),
    description: z
      .string()
      .min(1)
      .describe(
        "Details of the step. Make this clear enough to be picked up by an LLM agent.",
      ),
    taskId: z.string().describe("Task id (uuid) this subtask belongs to."),
  }),
  outputSchema: z.object({
    taskId: z.string().optional(),
    subTaskId: z.string().optional(),
    error: z.string().optional(),
  }),
  execute: async ({ title, description, taskId }) => {
    // Validate the task exists so we never create an orphaned subtask.
    const task = crud.getTask(taskId);
    if (!task) {
      return {
        error: `task ${taskId} does not exist`,
      };
    }
    try {
      const subtask = await crud.createSubtask({
        title,
        description,
        taskId,
      });

      return { taskId, subTaskId: subtask.id };
    } catch (e: any) {
      return {
        error: `${e.message}`,
      };
    }
  },
});

export const updateSubtaskWorkerTool = tool({
  description:
    "Update a subtask's status and notes in one call. Use to reflect daily work: 'todo' | 'in-progress' | 'done'. Empty notes clears the notes.",
  inputSchema: z.object({
    subtaskId: z.string().describe("Subtask id to update."),
    status: z
      .enum(TASK_STATUSES)
      .describe("New status: 'todo' | 'in-progress' | 'done'."),
    notes: z
      .string()
      .describe("New notes text. Empty string clears the notes."),
  }),
  outputSchema: z.object({
    error: z.string().nullable,
  }),
  execute: async ({ subtaskId, status, notes }) => {
    try {
      // empty-string notes = "no notes", so it does not overwrite the existing
      // handoff notes (which would otherwise make the manager's handoff prompt
      // dead and strand the worker on the same subtask forever).
      const changes = { status };
      if (notes && notes !== "") changes["notes"] = notes;

      await crud.updateSubtask(subtaskId, changes);
      return { error: null };
    } catch (e) {
      return { error: (e as Error).message };
    }
  },
});

export const updateSubtaskManagerTool = tool({
  description:
    "Update a subtask's status and notes in one call. Use to reflect daily work: 'todo' | 'in-progress' | 'done'. Empty notes clears the notes.",
  inputSchema: z.object({
    subtaskId: z.string().describe("Subtask id to update."),
    status: z
      .enum(TASK_STATUSES)
      .describe("New status: 'todo' | 'in-progress' | 'done'."),
    title: z.string(),
    description: z.string(),
  }),
  outputSchema: z.object({
    error: z.string().nullable,
  }),
  execute: async ({ subtaskId, status, title, description }) => {
    try {
      const changes = {
        status: status,
        title: title,
        description: description,
      };

      await crud.updateSubtask(subtaskId, changes);
      return { error: null };
    } catch (e) {
      return { error: (e as Error).message };
    }
  },
});
