CREATE TABLE `templates` (
	`template_id` text PRIMARY KEY NOT NULL,
	`guild_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL DEFAULT '',
	`definition_source` text NOT NULL,
	`definition_json` text NOT NULL,
	`args_schema` text NOT NULL DEFAULT '[]',
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `templates_guild_idx` ON `templates` (`guild_id`);