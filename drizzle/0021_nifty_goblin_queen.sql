CREATE TABLE `platform_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`announcementText` text,
	`announcementActive` boolean NOT NULL DEFAULT false,
	`announcementType` enum('info','warning','success','error') NOT NULL DEFAULT 'info',
	`maintenanceMode` boolean NOT NULL DEFAULT false,
	`maintenanceMessage` text,
	`featuredStartupIds` json,
	`allowNewRegistrations` boolean NOT NULL DEFAULT true,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`updatedBy` int,
	CONSTRAINT `platform_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `isBanned` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `bannedReason` text;