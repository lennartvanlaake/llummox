import { sql } from "drizzle-orm";
import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const CURRENT_TIMESTAMP = sql`CURRENT_TIMESTAMP`;

export const tasksTable = sqliteTable("tasks", {
  id: text().notNull(),
  status: text().notNull().default("todo"),
  prompt: text().notNull(),
  notes: text(),
  createdAt: integer().notNull().default(CURRENT_TIMESTAMP),
});
export type TasksRow = typeof tasksTable.$inferSelect;
export type TasksInsert = typeof tasksTable.$inferInsert;

export const subtasksTable = sqliteTable("subtasks", {
  id: text().notNull(),
  status: text().notNull().default("todo"),
  taskId: text().references(() => tasksTable.id),
  title: text().notNull(),
  description: text().notNull(),
  notes: text(),
  createdAt: integer().notNull().default(CURRENT_TIMESTAMP),
});
export type SubtasksRow = typeof subtasksTable.$inferSelect;
export type SubtasksInsert = typeof subtasksTable.$inferInsert;
