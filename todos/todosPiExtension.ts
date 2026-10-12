import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "@earendil-works/pi-ai";
import { updateSubtask } from "./crud.ts";
import { TASK_STATUSES } from "./constants.ts";
import type { SubtasksInsert } from "./schema.ts";

//TARGET
export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "updateSubtask",
    label: "updateSubtask",
    description:
      "Update a subtask's status and notes in one call. Use to reflect daily work: 'todo' | 'in-progress' | 'done'. Empty notes clears the notes.",
    parameters: Type.Object({
      subtaskId: Type.String({ description: "Subtask id to update" }),
      status: Type.Enum(TASK_STATUSES, {
        description: "New status: 'todo' | 'in-progress' | 'done'",
      }),
      notes: Type.String({
        description: "New notes text. Empty string clears the notes.",
      }),
    }),

    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      // empty-string notes = "no notes", so it does not overwrite the existing
      // handoff notes (which would otherwise make the manager's handoff prompt
      // dead and strand the worker on the same subtask forever).
      const changes: Partial<SubtasksInsert> = {
        status: params.status,
      };
      if (params.notes && params.notes !== "") changes["notes"] = params.notes;

      try {
        await updateSubtask(params.subtaskId, changes);
        return {
          content: [{ type: "text", text: "Subtask updated." }],
          details: { subtaskId: params.subtaskId, status: params.status },
        };
      } catch (e) {
        return {
          content: [{ type: "text", text: (e as Error).message }],
          details: { subtaskId: params.subtaskId, error: true },
        };
      }
    },
  });
}
