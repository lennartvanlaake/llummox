CREATE TABLE `subtasks` (
	`id` text PRIMARY KEY NOT NULL,
	`status` text DEFAULT 'todo' NOT NULL,
	`taskId` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`schema` text DEFAULT '',
	`result` text DEFAULT 'null',
	`createdAt` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`status` text DEFAULT 'todo' NOT NULL,
	`prompt` text NOT NULL,
	`data` text DEFAULT '{}',
	`notes` text,
	`createdAt` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);
