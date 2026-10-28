import {
  renderTodoManagerTools,
  renderTodoWorkerTools,
} from "./tools.ts";
import {
  createTask,
  getNextSubtask,
  getTask,
  listSubtasks,
  updateSubtask,
} from "./crud.ts";
import { logger, toToon } from "../shared/utils.ts";
import { TaskStatus } from "./constants.ts";
import type { SubtasksRow, TasksRow } from "./schema.ts";
import type { AgentSession, ToolDefinition } from "@earendil-works/pi-coding-agent";
import { createPiSession } from "../shared/pi.ts";
import { compileSchema } from "json-schema-library";

type PiAgentOptions = {
  cwd: string;
  systemPromptAppend?: string;
  tools?: ToolDefinition[];
  builtinTools?: string[];
};
export type TaskConfig = {
  cwd: string;
  prompt: string;
  worker: PiAgentOptions;
  manager?: PiAgentOptions;
  schema: any;
};

const defaultPiOptions = { cwd: "/tmp" };

const managerSystemPrompt = `You are an expect delegator. Create subtasks with conside descriptions. Be terse, no fluff, politeness or exclamations. Simplify and shorten language use. Use the createSubtask tool for delegation. Your chat responses are irrelevant, answer ".". EXTREMELY IMPORTANT: You are not allowed under any circumstance to complete the subtasks yourself.`;

export const workerSystemPrompt = `You are a worker. You focus on executing the subtask as quickly as possible. You are part of a team that is executing a larger task. Use this only as context, do NOT do work outside of your subtask. If asked or needed, use your "updateSubtask" tool to report about your progress by editing notes. Change status to done if you are done, to "in-progress" if you finish without completing the subtask`;

const summarizerSystemPrompt = `You are an expect summarizer. You consolidate all the notes of the completed subtasks into the notes of a task. Use the updateData and getData tools to take the notes from the subtasks and convert them into a data object described by the requested schema. Your chat respones are irrelevant, answer ".". `;

export function createPiWorkerAgent(
  options: PiAgentOptions = defaultPiOptions,
  subtaskId: string
) {
  // add the data editing
  const { updateSubtaskWorkerTool } = renderTodoWorkerTools(subtaskId)
  return createPiSession({
    cwd: options.cwd,
    tools: [updateSubtaskWorkerTool, ...(options?.tools ?? [])],
    systemPrompt: `${workerSystemPrompt} ${options.systemPromptAppend ?? ""}`,
    builtinTools: options.builtinTools ?? []
  });
}

export function createManagerAgent(options: PiAgentOptions = defaultPiOptions, schema: any, taskId: string) {
  const { createSubtaskTool, updateTaskData, getTaskData } = renderTodoManagerTools(taskId, schema)
  return createPiSession({
    cwd: options.cwd,
    tools: [createSubtaskTool, ...(options?.tools ?? [])],
    systemPrompt: `${managerSystemPrompt} The reports of all the workers together must provide enough information to fill a data object with the following schema ${toToon(schema)}. ${options.systemPromptAppend ?? ""}`,
    builtinTools: options.builtinTools ?? []
  });
}

export function createSummarizerAgent(
  options: PiAgentOptions = defaultPiOptions, taskId: string, schema: any
) {
  const { updateTaskTool, updateTaskData, getTaskData } = renderTodoManagerTools(taskId, schema)
  return createPiSession({
    cwd: options.cwd,
    tools: [updateTaskTool, ...(options?.tools ?? [])],
    systemPrompt: `${summarizerSystemPrompt}.  The data object must comply with the following schema ${toToon(schema)}. ${options.systemPromptAppend ?? ""}`,
    builtinTools: options.builtinTools ?? []
  });
}

export async function createTaskWithSubs(
  taskConfig: TaskConfig,
  schema: any,
  previousTask?: TasksRow,
) {
  const defaultData = compileSchema(schema).getData()
  const task = await createTask({ prompt: taskConfig.prompt, data: defaultData });

  const agent = await createManagerAgent(taskConfig.manager, schema, task.id);
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

async function summarize(task: TasksRow, schema: any) {
  const agent = await createSummarizerAgent(defaultPiOptions, task.id, schema);
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
    previousTask = await summarize(task, taskConfig.schema);
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
        await createPiWorkerAgent(taskConfig.worker, subtask.id),
      );
    } catch (e) {
      logger.error(e);
    }
    subtask = getNextSubtask(task.id);
    loopCount++;
  }

  return task;
}
