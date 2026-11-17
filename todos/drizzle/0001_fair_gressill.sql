CREATE TABLE `task_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`taskId` text NOT NULL,
	`type` text NOT NULL,
	`createdAt` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_subtasks` (
	`id` text PRIMARY KEY NOT NULL,
	`status` text DEFAULT 'todo' NOT NULL,
	`taskId` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`schema` text,
	`result` text,
	`createdAt` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_subtasks`("id", "status", "taskId", "title", "description", "schema", "result", "createdAt", "order") SELECT "id", "status", "taskId", "title", "description", "schema", "result", "createdAt", "order" FROM `subtasks`;--> statement-breakpoint
DROP TABLE `subtasks`;--> statement-breakpoint
ALTER TABLE `__new_subtasks` RENAME TO `subtasks`;--> statement-breakpoint
PRAGMA foreign_keys=ON;