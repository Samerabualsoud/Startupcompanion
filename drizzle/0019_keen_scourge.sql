ALTER TABLE `data_rooms` ADD `shareTitle` varchar(256);--> statement-breakpoint
ALTER TABLE `data_rooms` ADD `shareMessage` text;--> statement-breakpoint
ALTER TABLE `data_rooms` ADD `visibleSections` json;