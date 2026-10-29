import { sql } from "drizzle-orm";
import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const CURRENT_TIMESTAMP = sql`CURRENT_TIMESTAMP`;

export const tasksTable = sqliteTable("tasks", {
  id: text().notNull().primaryKey(),
  status: text().notNull().default("todo"),
  prompt: text().notNull(),
  data: text({ mode: "json" }).default({}),
  notes: text(),
  createdAt: integer().notNull().default(CURRENT_TIMESTAMP),
});
export type TasksRow = typeof tasksTable.$inferSelect;
export type TasksInsert = typeof tasksTable.$inferInsert;

export const subtasksTable = sqliteTable("subtasks", {
  id: text().primaryKey().notNull(),
  status: text().notNull().default("todo"),
  taskId: text()
    .notNull()
    .references(() => tasksTable.id),
  title: text().notNull(),
  description: text().notNull(),
  // ponytail: JSON text column; the per-subtask report schema written by the
  // manager at creation. Empty string when none was provided.
  schema: text(),
  // ponytail: the worker's structured report, validated against `schema`
  result: text(),
  createdAt: integer().notNull().default(CURRENT_TIMESTAMP),
  // ponytail: base value; the per-task next-sequence (max+1) is assigned in
  // crud.createSubtask where subtasksTable is already in scope. Keeping the
  // default a literal avoids a temporal dead zone (a column-default can't
  // reference subtasksTable.order).
  order: integer().notNull().default(0),
});
export type SubtasksRow = typeof subtasksTable.$inferSelect;
export type SubtasksInsert = typeof subtasksTable.$inferInsert;
