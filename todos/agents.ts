import {
  createTaskTool,
  createSubtaskTool,
  updateSubtaskWorkerTool,
} from "./tools.ts";
import z from "zod/v4";
import { mainModel } from "../shared/models";
import { Output, ToolLoopAgent } from "ai";
import { getNextSubtask, getNextTask, getTask, updateSubtask } from "./crud.ts";
import { logger } from "../shared/utils.ts";
import { TaskStatus } from "./constants.ts";
import type { TasksRow } from "./schema.ts";

const managerSystemPrompt = `You are an expect delegator.
    You do not do work, you  manage tasks tasks subtasks with conside descriptions. Be terse, no fluff, politeness or exclamations. Simplify and shorten language use. Use the createTask and createSubtask tools for delegation. Create 1 task and as many subtasks as needed. Return the id of the task.`;

const workerSystemPrompt = `You are a worker. You focus on executing the subtask as quicly as possible. You are part of a team that is executing a larger task. Use this only as context, do NOT do work outside of your subtask. If asked or needed, use your "updateSubtask" tool to report about your progress by editing notes. Change status to done if you are done, to "in-progress" if you finish without completing the subtask`;

export type WorkerConfig = {
  tools?: Record<string, any>;
  prompt?: string;
  workingDir?: string;
};

export async function createTaskWithSubs(task: string) {
  const agent = new ToolLoopAgent({
    model: mainModel,
    tools: { createTask: createTaskTool, createSubtask: createSubtaskTool },
    instructions: managerSystemPrompt,
  });

  const result = await agent.generate({ prompt: task });

  // TODO: Return the task ID. Get it from the text resoponse of the model. The task ID is always a uuid.


  const taskId = /// TODO
  return getTask(taskId);
}

// TODO add replanning-function
// export async function reviewTasks() {
//   const agent = new ToolLoopAgent({
//     model: mainModel,
//     tools: {
//       createTask: createTaskTool,
//       createSubtask: createSubtaskTool,
//     },
//     instructions: managerSystemPrompt,
//   });
//   return await agent.generate();
// }

export async function doWork(task: TasksRow, workerConfig: WorkerConfig) {
  const subtask = getNextSubtask(task.id);

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
    prompt: `The team is working on the larger task (CONTEXT ONLY): "${task.title} - ${task.description} ${task.notes ?? ""}". Your subtask is "${subtask.title} - ${subtask.description} and has id ${subtask.id}. ${notesPrompt}.`,
  });
}

export async function managerWorkerLoop(
  taskPrompt: string,
  workerConfig: WorkerConfig,
) {
  let loopCount = 0;

  //
  let task = await createTaskWithSubs(taskPrompt);

  const subtask = getNextSubtask(task.id);

  while (subtask) {
    try {
      await doWork(task, workerConfig);
    } catch (e) {
      logger.error(e);
    }
    task = getNextTask();
    loopCount++;
  }

  return task;
}
