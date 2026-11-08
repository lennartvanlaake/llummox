import { renderTodoManagerTools, renderTodoWorkerTools } from "./tools.ts";
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
import { createReActAgent } from "../shared/agent/agent";
import { LlamaClient } from "../shared/agent/llama";
import type {
  Agent,
  AnyTool,
  ChatClient,
  OnStep,
} from "../shared/agent/types";

type AgentOptions = {
  cwd: string;
  systemPromptAppend?: string;
  tools?: AnyTool[];
  client?: ChatClient;
  maxSteps?: number;
  temperature?: number;
  maxTokens?: number;
  onStep?: OnStep;
};

export type TaskConfig = {
  cwd: string;
  prompt: string;
  worker: AgentOptions;
  manager?: AgentOptions;
  schema?: string;
  type: "read" | "write";
};

const defaultClient = new LlamaClient();
const defaultAgentOptions = { cwd: "/tmp" };

const managerSystemPrompt = `You are an expect delegator. Create subtasks with conside descriptions. Be terse, no fluff, politeness or exclamations. Simplify and shorten language use. Use the createSubtask tool for delegation. Your chat responses are irrelevant, answer ".". EXTREMELY IMPORTANT: You are not allowed under any circumstance to complete the subtasks yourself.`;

export const workerSystemPrompt = `You are a worker. You focus on executing the subtask as quickly as possible. You are part of a team that is executing a larger task. Use this only as context, do NOT do work outside of your subtask.`;

const summarizerSystemPrompt = `You are an expect summarizer. Use the updateData and getData tools to take the notes from the subtasks and convert them into a data object described by the requested schema. Your chat respones are irrelevant, answer ".". `;

const workerHurryUp: OnStep = ({ step, messages }) => {
  const turn = step + 1;
  if (turn !== 10 && turn !== 14) return;
  const system = messages.find((message) => message.role === "system");
  if (!system || system.role !== "system") return;
  system.content +=
    turn === 10
      ? " You are taking too long. Either report findings or raise a blocker soon. Turn 10/14."
      : " Report findings or raise blocker NOW.";
};

export function createWorkerAgent(
  options: AgentOptions = defaultAgentOptions,
  subtaskId: string,
  subtaskSchema?: string,
): Agent {
  const { workerResultTool } = renderTodoWorkerTools(
    subtaskId,
    subtaskSchema,
  );
  return createReActAgent({
    client: options.client ?? defaultClient,
    cwd: options.cwd,
    tools: [workerResultTool, ...(options.tools ?? [])],
    systemPrompt: `${workerSystemPrompt} ${options.systemPromptAppend ?? ""}`,
    maxSteps: options.maxSteps,
    temperature: options.temperature,
    maxTokens: options.maxTokens,
    onStep: options.onStep ?? workerHurryUp,
  });
}

export function createManagerAgent(
  options: AgentOptions = defaultAgentOptions,
  schema: string | undefined,
  taskId: string,
): Agent {
  const { createSubtaskTool } = renderTodoManagerTools(taskId, schema);
  return createReActAgent({
    client: options.client ?? defaultClient,
    cwd: options.cwd,
    tools: [createSubtaskTool, ...(options.tools ?? [])],
    systemPrompt: `${managerSystemPrompt}. ${options.systemPromptAppend ?? ""}`,
    maxSteps: options.maxSteps,
    temperature: options.temperature,
    maxTokens: options.maxTokens,
    onStep: options.onStep,
  });
}

export function createSummarizerAgent(
  options: AgentOptions = defaultAgentOptions,
  taskId: string,
  schema: string | undefined,
): Agent {
  const { updateTaskData, getTaskData } = renderTodoManagerTools(
    taskId,
    schema,
  );
  return createReActAgent({
    client: options.client ?? defaultClient,
    cwd: options.cwd,
    tools: [updateTaskData, getTaskData, ...(options.tools ?? [])],
    systemPrompt: `${summarizerSystemPrompt}.  The data object must comply with the following schema ${schema}. ${options.systemPromptAppend ?? ""}`,
    maxSteps: options.maxSteps,
    temperature: options.temperature,
    maxTokens: options.maxTokens,
    onStep: options.onStep,
  });
}

export async function createTaskWithSubs(
  taskConfig: TaskConfig,
  schema: string | undefined,
  previousTask?: TasksRow,
) {
  const task = await createTask({
    prompt: taskConfig.prompt,
  });

  const agent = createManagerAgent(taskConfig.manager, schema, task.id);

  let prompt = taskConfig.prompt;

  if (previousTask) {
    prompt += `The data from the previous task is """${JSON.stringify(previousTask.data)}""". `;
  }

  if (taskConfig.type == "read") {
    prompt += `When combined, the result of all subtasks MUST be sufficient complete the schema: ${schema}. Add TypeScript schemas to your subtasks so your workers know how to format their results. Format: """type Schema = { prop: type }"""`;
  }

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
  agent: Agent,
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
      : `You are not the first worker to tackle this task. Status: ${subtask.status}. Prior result: ${subtask.result ?? "none"}.`;
  const prompt = `The team is working on the larger task (CONTEXT ONLY): "${task.prompt}". Your subtask is "${subtask.title} - ${subtask.description}. ${notesPrompt}.`;
  await agent.prompt(prompt);
}

async function summarize(task: TasksRow, schema: string | undefined) {
  const agent = createSummarizerAgent(defaultAgentOptions, task.id, schema);
  const subtasks = listSubtasks(task.id);
  const subtasksTemplate = subtasks
    .map((it) => `Title: ${it.title}. Result: ${it.result}\n`)
    .join("");

  await agent.prompt(
    `Use updateTaskData to fill the data with the output of the following subtasks. Subtasks: ${subtasksTemplate}. The data should conform to schema ${schema}`,
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
  const task = await createTaskWithSubs(
    taskConfig,
    taskConfig.schema,
    previousTask,
  );
  let subtask = getNextSubtask(task.id);
  while (subtask) {
    logger.info(subtask);
    await doWork(
      task,
      subtask,
      createWorkerAgent(
        taskConfig.worker,
        subtask.id,
        subtask.schema ?? undefined,
      ),
    );
    subtask = getNextSubtask(task.id);
    loopCount++;
    if (loopCount > 50) {
      return task;
    }
  }

  return task;
}
