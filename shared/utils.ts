import pino from "pino";

import type { AgentToolResult } from "@earendil-works/pi-coding-agent";
import { encode } from "@toon-format/toon";

export const logger = pino();

export function toPiContent(content: any, isError = false): AgentToolResult {
	if (!content) {
		return renderContentTemplate("", isError);
	}
	if (typeof content === "string" || typeof content == "number") {
		return renderContentTemplate(content.toString())
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

export function toToon(
	content: any
) {
	const toonEncoded = encode(content, { delimiter: '\t' })
	return `
	Data is in TOON format (tab indent, arrays show length and fields)
	\`\`\`toon
	${toonEncoded}
	\`\`\`
	`.trim()
}
