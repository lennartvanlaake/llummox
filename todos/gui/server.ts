import { dev } from "astro";

export async function runGui(db: string) {
	// This must be set on the current process: a shell export in a subshell
	// would not be visible to Astro's server runtime.
	process.env.TODO_GUI_DB = db;
	await dev({ root: import.meta.dirname })
}
