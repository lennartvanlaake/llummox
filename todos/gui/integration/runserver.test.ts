
import { test } from 'bun:test'
import { randomUUIDv7 } from 'crypto';
import { setupDatabase, db } from '../../db';
import { subtasksTable, tasksTable } from '../../schema';
import { runGui } from '../server';
import { $ } from 'bun';

const delay = ms => new Promise(res => setTimeout(res, ms));
test('run server', async () => {
	const DB_PATH = `${import.meta.dir}/temp.db`
	await $`rm ${DB_PATH}`
	setupDatabase(DB_PATH)
	const taskId = randomUUIDv7();
	const subTaskId = randomUUIDv7();

	await db.insert(tasksTable)
		.values({ id: taskId, prompt: "Task A" });
	await db.insert(subtasksTable).values({
		id: subTaskId,
		title: "Sub A",
		description: "d",
		taskId,
	});
	await runGui(DB_PATH)
	await delay(1000000000)
}, 0)

