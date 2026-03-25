CREATE TABLE `attachments` (
	`id` varchar(36) NOT NULL,
	`userId` int NOT NULL,
	`dataRoomId` varchar(256) NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileType` varchar(100) NOT NULL,
	`fileSize` int NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`downloadUrl` text NOT NULL,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `attachments_id` PRIMARY KEY(`id`)
);
