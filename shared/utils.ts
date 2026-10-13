import pino from "pino";

import type { AgentToolResult } from "@earendil-works/pi-coding-agent";

export const logger = pino();

export function toPiContent(content: any, isError = false): AgentToolResult {
	if (!content) {
		return renderContentTemplate("", isError);
	}
	return renderContentTemplate(JSON.stringify(content), isError);
}

function renderContentTemplate(
	content: string,
	isError = false,
): AgentToolResult {
	return {
		content: [{ type: "text", text: content }],
		details: content,
		isError,
	};
}
