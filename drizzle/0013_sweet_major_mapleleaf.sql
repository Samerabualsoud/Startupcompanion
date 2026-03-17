ALTER TABLE `startup_profiles` ADD `totalSharesOutstanding` bigint;--> statement-breakpoint
ALTER TABLE `startup_profiles` ADD `authorizedShares` bigint;--> statement-breakpoint
ALTER TABLE `startup_profiles` ADD `parValuePerShare` float;--> statement-breakpoint
ALTER TABLE `startup_profiles` ADD `esopPoolPercent` float;--> statement-breakpoint
ALTER TABLE `team_members` ADD `esopShares` bigint;--> statement-breakpoint
ALTER TABLE `team_members` ADD `esopVestingMonths` int;--> statement-breakpoint
ALTER TABLE `team_members` ADD `esopCliffMonths` int;--> statement-breakpoint
ALTER TABLE `team_members` ADD `esopStartDate` timestamp;