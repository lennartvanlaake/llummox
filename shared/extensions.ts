
import type { ExtensionAPI, InlineExtension } from "@earendil-works/pi-coding-agent";

export type HurryUpConfig = {
	warnLimit: number,
	cutoffLimit: number,
	warnMessage: string,
	cutoffMessage: string
}

export function renderHurryUpExtension(config: HurryUpConfig): InlineExtension {
	const { warnLimit, cutoffLimit, warnMessage, cutoffMessage } = config;
	return (pi: ExtensionAPI) => {

		pi.on("turn_end", (evt, ctx: any) => {
			if (evt.turnIndex === warnLimit) {
				ctx.appendSystemPrompt(`${warnMessage}. Turn ${warnLimit}/${cutoffLimit}`)
			}

			if (evt.turnIndex === cutoffLimit) {
				ctx.appendSystemPrompt(cutoffMessage)
			}
		})
	}
}
