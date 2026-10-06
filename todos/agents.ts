import {
  createSubtaskTool,
  updateSubtaskWorkerTool,
  updateTaskTool,
} from "./tools.ts";
import { mainModel } from "../shared/models";
import { ToolLoopAgent } from "ai";
import {
  createTask,
  getNextSubtask,
  getSubtasks,
  getTask,
  updateSubtask,
} from "./crud.ts";
import { logger } from "../shared/utils.ts";
import { TaskStatus } from "./constants.ts";
import type { SubtasksRow, TasksRow } from "./schema.ts";

const managerSystemPrompt = `You are an expect delegator. Create subtasks with conside descriptions. Be terse, no fluff, politeness or exclamations. Simplify and shorten language use. Use the createSubtask tool for delegation. EXTREMELY IMPORTANT: You are not allowed under any circumstance to complete the subtasks yourself. `;

const workerSystemPrompt = `You are a worker. You focus on executing the subtask as quickly as possible. You are part of a team that is executing a larger task. Use this only as context, do NOT do work outside of your subtask. If asked or needed, use your "updateSubtask" tool to report about your progress by editing notes. Change status to done if you are done, to "in-progress" if you finish without completing the subtask`;

const summarizerSystemPrompt = `You are an expect summarizer. You consolidate all the notes of the completed subtasks into the notes of a task. Use the updateTask tool to write the notes. Preserve all technical information, remove duplication or anything that is not relevant to the purpose of the task. Be terse and laconoic. Convey maximum information in minimum characters.`;

export type WorkerConfig = {
  tools?: Record<string, any>;
  prompt?: string;
  workingDir?: string;
};

export async function createTaskWithSubs(
  prompt: string,
  previousNotes: string = "",
) {
  const task = await createTask({ prompt });
  const agent = new ToolLoopAgent({
    model: mainModel,
    tools: { createSubtask: createSubtaskTool },
    instructions: managerSystemPrompt,
  });

  await agent.generate({
    prompt: `${prompt} ${previousNotes ?? `. The notes from the previous task are ${previousNotes}. `}The taskId which you use for creating subtasks is "${task.id}"`,
  });

  return task;
}

export async function doWork(
  task: TasksRow,
  subtask: SubtasksRow,
  workerConfig: WorkerConfig,
) {
  if (!subtask) {
    logger.info("No subtask found, returning");
    return;
  }

  if (subtask.status === TaskStatus.todo) {
    updateSubtask(subtask.id, { status: TaskStatus["in-progress"] });
  }

  // add SCRUM-middleware and RAG-middleware
  const agent = new ToolLoopAgent({
    model: mainModel,
    tools: {
      updateSubtask: updateSubtaskWorkerTool,
      ...(workerConfig.tools ?? {}),
    },
    //@ts-ignore
    toolsContext: workerConfig.workingDir
      ? { ls: { workingDir: workerConfig.workingDir } }
      : {},
    instructions: workerSystemPrompt + (workerConfig.prompt ?? ""),
    prepareStep: async ({ messages, stepNumber }) => {
      if (stepNumber > 10) {
        return {
          messages: [
            ...messages,
            {
              role: "user",
              content:
                "You are taking too long. Either finish your task now or adjust status and write notes for the next worker",
            },
          ],
        };
      }
    },
  });

  const notesPrompt =
    subtask.status == TaskStatus.todo
      ? ""
      : `You are not the first worker to tackle this task. Status: ${subtask.status}. Notes: ${subtask.notes}.`;

  return await agent.generate({
    prompt: `The team is working on the larger task (CONTEXT ONLY): "${task.prompt}". Your subtask is "${subtask.title} - ${subtask.description} and has id ${subtask.id}. ${notesPrompt}.`,
  });
}

async function summarize(task: TasksRow) {
  const agent = new ToolLoopAgent({
    model: mainModel,
    tools: { updateTask: updateTaskTool },
    instructions: summarizerSystemPrompt,
  });

  const subtasks = getSubtasks(task.id);
  const subtasksTemplate = subtasks
    .map((it) => `Title: ${it.title}. Notes: ${it.notes}\n`)
    .join("");

  await agent.generate({
    prompt: `Summarize task with id ${task.id} and prompt ${task.prompt}. Subtasks: ${subtasksTemplate}`,
  });

  return getTask(task.id);
}

export async function workOnPlan(
  prompts: string[],
  workerConfig: WorkerConfig,
) {
  let previousTaskSummary = "";
  for (const prompt of prompts) {
    const task = await workOnTask(prompt, workerConfig, previousTaskSummary);
    const summarized = await summarize(task);
    previousTaskSummary = summarized?.notes ?? "";
  }
}

export async function workOnTask(
  taskPrompt: string,
  workerConfig: WorkerConfig,
  previousTaskSummary: string,
) {
  let loopCount = 0;

  //
  let task = await createTaskWithSubs(taskPrompt, previousTaskSummary);

  let subtask = getNextSubtask(task.id);

  while (subtask) {
    logger.info(subtask);
    try {
      await doWork(task, subtask, workerConfig);
    } catch (e) {
      logger.error(e);
    }
    subtask = getNextSubtask(task.id);
    loopCount++;
  }

  return task;
}
