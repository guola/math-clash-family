CREATE TABLE `leaderboard` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nickname` text NOT NULL,
	`score` integer NOT NULL,
	`best_combo` integer DEFAULT 0 NOT NULL,
	`mode` text NOT NULL,
	`lang` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_leaderboard_score_created` ON `leaderboard` (`score`,`created_at`);--> statement-breakpoint
CREATE TABLE `players` (
	`id` text PRIMARY KEY NOT NULL,
	`room_code` text NOT NULL,
	`nickname` text NOT NULL,
	`slot` integer NOT NULL,
	`score` integer DEFAULT 0 NOT NULL,
	`combo` integer DEFAULT 0 NOT NULL,
	`finished` integer DEFAULT false NOT NULL,
	`submitted` integer DEFAULT false NOT NULL,
	`lang` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_players_room_slot` ON `players` (`room_code`,`slot`);--> statement-breakpoint
CREATE INDEX `idx_players_room` ON `players` (`room_code`);--> statement-breakpoint
CREATE TABLE `rooms` (
	`code` text PRIMARY KEY NOT NULL,
	`seed` integer NOT NULL,
	`status` text DEFAULT 'lobby' NOT NULL,
	`start_at` integer,
	`created_at` integer NOT NULL
);
