CREATE TABLE `subtasks` (
	`id` text NOT NULL,
	`status` text DEFAULT 'todo' NOT NULL,
	`taskId` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`notes` text,
	`createdAt` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text NOT NULL,
	`status` text DEFAULT 'todo' NOT NULL,
	`prompt` text NOT NULL,
	`notes` text,
	`createdAt` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);
