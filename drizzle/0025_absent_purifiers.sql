CREATE TABLE `financial_projections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(256) NOT NULL DEFAULT 'My Projection',
	`businessModel` varchar(64) NOT NULL DEFAULT 'saas',
	`approach` enum('top-down','bottom-up') NOT NULL DEFAULT 'bottom-up',
	`topDownInputs` json,
	`bottomUpInputs` json,
	`projectionOutput` json,
	`currency` varchar(8) NOT NULL DEFAULT 'USD',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `financial_projections_id` PRIMARY KEY(`id`)
);
