CREATE TABLE `cap_tables` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`startupId` int,
	`companyName` varchar(256),
	`totalSharesOutstanding` bigint NOT NULL DEFAULT 10000000,
	`shareholders` json NOT NULL DEFAULT ('[]'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cap_tables_id` PRIMARY KEY(`id`)
);
