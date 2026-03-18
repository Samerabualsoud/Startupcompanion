ALTER TABLE `sales_entries` ADD `contactName` varchar(256);--> statement-breakpoint
ALTER TABLE `sales_entries` ADD `contactEmail` varchar(320);--> statement-breakpoint
ALTER TABLE `sales_entries` ADD `contactPhone` varchar(64);--> statement-breakpoint
ALTER TABLE `sales_entries` ADD `dealValue` float;--> statement-breakpoint
ALTER TABLE `sales_entries` ADD `probability` int DEFAULT 50;--> statement-breakpoint
ALTER TABLE `sales_entries` ADD `expectedCloseDate` timestamp;--> statement-breakpoint
ALTER TABLE `sales_entries` ADD `lostReason` varchar(512);--> statement-breakpoint
ALTER TABLE `sales_entries` ADD `nextAction` varchar(512);