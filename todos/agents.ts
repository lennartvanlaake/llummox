import {
  createSubtaskTool,
  updateSubtaskWorkerTool,
  updateTaskTool,
} from "./tools.ts";
import {
  createTask,
  getNextSubtask,
  getTask,
  listSubtasks,
  updateSubtask,
} from "./crud.ts";
import { logger } from "../shared/utils.ts";
import { TaskStatus } from "./constants.ts";
import type { SubtasksRow, TasksRow } from "./schema.ts";
import type { AgentSession, ToolDefinition } from "@earendil-works/pi-coding-agent";
import { createPiSession } from "../shared/pi.ts";

type PiAgentOptions = {
  cwd: string;
  systemPromptAppend?: string;
  tools?: ToolDefinition[];
};
export type TaskConfig = {
  cwd: string;
  prompt: string;
  worker: AgentSession;
  manager?: AgentSession;
};

const defaultPiOptions = { cwd: "/tmp" };

const managerSystemPrompt = `You are an expect delegator. Create subtasks with conside descriptions. Be terse, no fluff, politeness or exclamations. Simplify and shorten language use. Use the createSubtask tool for delegation. Your chat responses are irrelevant, answer ".". EXTREMELY IMPORTANT: You are not allowed under any circumstance to complete the subtasks yourself. `;

export const workerSystemPrompt = `You are a worker. You focus on executing the subtask as quickly as possible. You are part of a team that is executing a larger task. Use this only as context, do NOT do work outside of your subtask. If asked or needed, use your "updateSubtask" tool to report about your progress by editing notes. Change status to done if you are done, to "in-progress" if you finish without completing the subtask`;

const summarizerSystemPrompt = `You are an expect summarizer. You consolidate all the notes of the completed subtasks into the notes of a task. Use the updateTask tool to write the notes. Preserve all technical information, remove duplication or anything that is not relevant to the purpose of the task. Be terse and laconoic. Convey maximum information in minimum characters. Your chat responses are irrelevant, answer ".". `;

export function createPiWorkerAgent(
  options: PiAgentOptions = defaultPiOptions,
) {
  return createPiSession({
    cwd: options.cwd,
    tools: [updateSubtaskWorkerTool, ...(options?.tools ?? [])],
    systemPrompt: `${workerSystemPrompt} ${options.systemPromptAppend ?? ""}`,
  });
}

// TODO edit extensions
export function createManagerAgent(options: PiAgentOptions = defaultPiOptions) {
  return createPiSession({
    cwd: options.cwd,
    tools: [createSubtaskTool, ...(options?.tools ?? [])],
    systemPrompt: `${managerSystemPrompt} ${options.systemPromptAppend ?? ""}`,
  });
}

// TODO edit extensions
export function createSummarizerAgent(
  options: PiAgentOptions = defaultPiOptions,
) {
  return createPiSession({
    cwd: options.cwd,
    tools: [updateTaskTool, ...(options?.tools ?? [])],
    systemPrompt: `${summarizerSystemPrompt} ${options.systemPromptAppend ?? ""}`,
  });
}

export async function createTaskWithSubs(
  taskConfig: TaskConfig,
  previousTask?: TasksRow,
) {
  const task = await createTask({ prompt: taskConfig.prompt });

  const agent = taskConfig?.manager ?? (await createManagerAgent());
  const prompt = `${taskConfig.prompt} ${previousTask ? `. The notes from the previous task with prompt ${previousTask!.prompt} are ${previousTask!.notes}. ` : ""}The taskId which you use for creating subtasks is "${task.id}"`;

  await agent.prompt(prompt);

  // double check that subtasks are actually generated
  if (listSubtasks(task.id).length == 0) {
    await agent.prompt(
      prompt +
      "EXTREMELY IMPORTANT: You need to call the createSubtask tool to create subtasks",
    );
  }
  return task;
}

export async function doWork(
  task: TasksRow,
  subtask: SubtasksRow,
  agent: AgentSession,
) {
  if (!subtask) {
    logger.info("No subtask found, returning");
    return;
  }

  if (subtask.status === TaskStatus.todo) {
    updateSubtask(subtask.id, { status: TaskStatus["in-progress"] });
  }

  const notesPrompt =
    subtask.status == TaskStatus.todo
      ? ""
      : `You are not the first worker to tackle this task. Status: ${subtask.status}. Notes: ${subtask.notes}.`;

  const prompt = `The team is working on the larger task (CONTEXT ONLY): "${task.prompt}". Your subtask is "${subtask.title} - ${subtask.description} and has id ${subtask.id}. ${notesPrompt}.`;
  await agent.prompt(prompt);
}

async function summarize(task: TasksRow) {
  const agent = await createSummarizerAgent();
  const subtasks = listSubtasks(task.id);
  const subtasksTemplate = subtasks
    .map((it) => `Title: ${it.title}. Notes: ${it.notes}\n`)
    .join("");

  await agent.prompt(
    `Summarize task with id ${task.id} and prompt ${task.prompt}. Subtasks: ${subtasksTemplate}`,
  );

  return getTask(task.id);
}

export async function workOnPlan(taskConfigs: TaskConfig[]) {
  let previousTask: TasksRow | undefined;
  for (const taskConfig of taskConfigs) {
    const task = await workOnTask(taskConfig, previousTask);
    previousTask = await summarize(task);
  }
}

export async function workOnTask(
  taskConfig: TaskConfig,
  previousTask?: TasksRow,
) {
  let loopCount = 0;
  const task = await createTaskWithSubs(taskConfig, previousTask);

  let subtask = getNextSubtask(task.id);

  while (subtask) {
    logger.info(subtask);
    try {
      await doWork(
        task,
        subtask,
        taskConfig.worker,
      );
    } catch (e) {
      logger.error(e);
    }
    subtask = getNextSubtask(task.id);
    loopCount++;
  }

  return task;
}
