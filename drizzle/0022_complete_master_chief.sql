CREATE TABLE `tool_states` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`toolKey` varchar(64) NOT NULL,
	`state` json NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tool_states_id` PRIMARY KEY(`id`)
);
