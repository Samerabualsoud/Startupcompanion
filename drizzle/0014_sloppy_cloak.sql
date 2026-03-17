CREATE TABLE `esop_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`startupId` int,
	`label` varchar(256) NOT NULL DEFAULT 'ESOP Plan',
	`totalShares` bigint NOT NULL DEFAULT 10000000,
	`currentOptionPool` bigint NOT NULL DEFAULT 1000000,
	`pricePerShare` float NOT NULL DEFAULT 1,
	`vestingMonths` int NOT NULL DEFAULT 48,
	`cliffMonths` int NOT NULL DEFAULT 12,
	`grants` json,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `esop_plans_id` PRIMARY KEY(`id`)
);
