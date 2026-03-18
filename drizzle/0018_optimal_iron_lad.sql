ALTER TABLE `esop_plans` MODIFY COLUMN `pricePerShare` float NOT NULL DEFAULT 0.1;--> statement-breakpoint
ALTER TABLE `esop_plans` ADD `fmvPerShare` float;--> statement-breakpoint
ALTER TABLE `esop_plans` ADD `jurisdiction` varchar(64) DEFAULT 'delaware';--> statement-breakpoint
ALTER TABLE `esop_plans` ADD `planType` enum('iso','nso','rsu','sar') DEFAULT 'iso';