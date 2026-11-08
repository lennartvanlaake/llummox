import { logger } from "../utils";
import type { ChatMessage } from "./types";

export { logger };

/**
 * Keep the current pi-era log shape: `<role>: <text>` for user/assistant.
 * System and tool messages are intentionally quiet; tool calls log separately.
 */
export function logMessage(message: ChatMessage): void {
  if (message.role === "system" || message.role === "tool") {
    return;
  }
  const text = typeof message.content === "string" ? message.content : "";
  logger.info(`${message.role}: ${text}`);
}

export function logToolCall(name: string, args: unknown): void {
  logger.info(`Tool call ${name} with args ${JSON.stringify(args)}`);
}
