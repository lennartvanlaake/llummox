import { z } from "zod/v4";
import * as crud from "./crud";
import { TASK_STATUSES } from "./constants";

// ponytail: `ai`'s `tool()` helper is removed (no local AI SDK dependency).

// ---- Task (story) tools ---------------------------------------------------

export const updateTaskTool = {
  description:
    "Update fields of a task (story). Providing a field changes it; omit it to leave it unchanged. Empty string clears a text field.",
  inputSchema: z.object({
    taskId: z.string().describe("Task id to update."),
    status: z
      .string()
      .describe("New status. One of: " + TASK_STATUSES.join(", ")),
    notes: z.string().optional().describe("New notes. Omit to leave unchanged."),
    prompt: z.string().optional().describe("New prompt/title. Omit to leave unchanged."),
  }),
  outputSchema: z.object({
    error: z
      .string()
      .optional()
      .describe("Error message if the update failed, otherwise undefined."),
  }),
  execute: async ({ taskId, status, notes, prompt }: {
    taskId: string;
    status: string;
    notes?: string;
    prompt?: string;
  }) => {
    try {
      await crud.updateTask(taskId, { status, notes, prompt });
    } catch (e) {
      return { error: String(e) };
    }
    return {};
  },
};

export const createSubtaskTool = {
  description:
    "Creates a subtask (story) under a parent task and returns the new subtask id.",
  inputSchema: z.object({
    taskId: z.string().describe("The parent task id."),
    title: z
      .string()
      .describe("The title of the subtask. Should be imperative, e.g. 'Add a search bar'."),
    description: z
      .string()
      .describe("Details of the step. Make this clear enough to be picked up by an LLM agent."),
  }),
  outputSchema: z.object({
    subTaskId: z.string().describe("The id of the created subtask."),
  }),
  execute: async ({ taskId, title, description }: {
    taskId: string;
    title: string;
    description: string;
  }) => {
    try {
      const subtask = await crud.createSubtask(taskId, { title, description });
      return { subTaskId: subtask.id };
    } catch (e) {
      return { error: String(e) };
    }
  },
};

export const updateSubtaskWorkerTool = {
  description:
    "Update the status and notes of a subtask in one call. Provide status and/or notes; omit to leave unchanged.",
  inputSchema: z.object({
    subtaskId: z.string().describe("Subtask id to update."),
    status: z.string().optional().describe("New status. One of: " + TASK_STATUSES.join(", ")),
    notes: z.string().optional().describe("New notes. Omit to leave unchanged."),
  }),
  outputSchema: z.object({
    error: z
      .string()
      .optional()
      .describe("Error message if the update failed, otherwise undefined."),
  }),
  execute: async ({ subtaskId, status, notes }: {
    subtaskId: string;
    status?: string;
    notes?: string;
  }) => {
    try {
      await crud.updateSubtask(subtaskId, { status, notes });
    } catch (e) {
      return { error: String(e) };
    }
    return {};
  },
};

// ---- File tools -----------------------------------------------------------

export const readFileTool = {
  description:
    "Reads a file and returns its content. Use for files up to a few KB. For large files, use readLines or readFileRange.",
  inputSchema: z.object({
    file: z.string().describe("Full path to the file."),
  }),
  outputSchema: z.object({
    error: z.string().optional().describe("Error message if the file could not be read."),
    content: z.string().describe("The content of the file."),
  }),
  execute: async ({ file }: { file: string }) => {
    try {
      const content = await Bun.file(file).text();
      return { content };
    } catch (e) {
      return { error: String(e) };
    }
  },
};

export const writeFileTool = {
  description:
    "Creates a new file or overwrites an existing file with the provided content.",
  inputSchema: z.object({
    file: z.string().describe("Full path to the file to create or overwrite."),
    content: z.string().describe("The full content to write to the file."),
  }),
  outputSchema: z.object({
    error: z.string().optional().describe("Error message if the file could not be written."),
  }),
  execute: async ({ file, content }: { file: string; content: string }) => {
    try {
      await Bun.file(file).write(content);
    } catch (e) {
      return { error: String(e) };
    }
    return {};
  },
};

export const editFileTool = {
  description:
    "Edits a file by providing the old text to replace and the new text to substitute it with.",
  inputSchema: z.object({
    file: z.string().describe("Full path to the file to edit."),
    oldText: z.string().describe("The exact text in the file to replace."),
    newText: z.string().describe("The replacement text."),
  }),
  outputSchema: z.object({
    error: z.string().optional().describe("Error message if the edit could not be applied."),
  }),
  execute: async ({ file, oldText, newText }: {
    file: string;
    oldText: string;
    newText: string;
  }) => {
    try {
      const current = await Bun.file(file).text();
      if (!current.includes(oldText)) {
        return { error: `oldText not found in ${file}` };
      }
      await Bun.file(file).text();
      await Bun.file(file).write(current.split(oldText).join(newText));
    } catch (e) {
      return { error: String(e) };
    }
    return {};
  },
};

export const searchFilesTool = {
  description:
    "Searches a directory for files by name or content. Useful to find files matching a pattern or containing a keyword.",
  inputSchema: z.object({
    directory: z.string().describe("Directory to search."),
    pattern: z.string().optional().describe("Glob or substring to match against file names."),
  }),
  outputSchema: z.object({
    matches: z.array(z.string()).describe("List of file paths that match."),
  }),
  execute: async ({ directory, pattern }: {
    directory: string;
    pattern?: string;
  }) => {
    const matches: string[] = [];
    try {
      for await (const entry of Bun.cwd(directory).recursive()) {
        if (!entry.isDirectory) {
          const name = entry.path.split("/").pop() ?? "";
          if (pattern === undefined || name.includes(pattern)) {
            matches.push(entry.path);
          }
        }
      }
    } catch (e) {
      return { matches: [], error: String(e) };
    }
    return { matches };
  },
};

export const runCommandTool = {
  description:
    "Runs a shell command in a directory and returns its stdout. Use for running scripts, tests, or build steps.",
  inputSchema: z.object({
    command: z.string().describe("The command to run, e.g. 'npm test'."),
    workingDir: z.string().optional().describe("Directory to run the command in."),
  }),
  outputSchema: z.object({
    stdout: z.string().describe("Standard output of the command."),
    stderr: z.string().describe("Standard error of the command."),
    code: z.number().describe("Exit code of the command."),
  }),
  execute: async ({ command, workingDir }: {
    command: string;
    workingDir?: string;
  }) => {
    const result = await Bun.spawn(command, { cwd: workingDir });
    const stdout = await result.stdout.text();
    const stderr = await result.stderr.text();
    return { stdout, stderr, code: result.exitCode };
  },
};
