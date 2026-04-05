ALTER TABLE `cap_tables` MODIFY COLUMN `companyName` varchar(256) NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE `cap_tables` MODIFY COLUMN `shareholders` json NOT NULL;--> statement-breakpoint
CREATE INDEX `cap_tables_userId_idx` ON `cap_tables` (`userId`);--> statement-breakpoint
CREATE INDEX `cap_tables_startupId_idx` ON `cap_tables` (`startupId`);