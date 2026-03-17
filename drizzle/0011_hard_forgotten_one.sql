CREATE TABLE `data_room_files` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dataRoomId` int NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(256) NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`fileUrl` varchar(1024) NOT NULL,
	`mimeType` varchar(128) NOT NULL DEFAULT 'application/octet-stream',
	`sizeBytes` int NOT NULL DEFAULT 0,
	`folder` varchar(128) NOT NULL DEFAULT 'General',
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `data_room_files_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `data_room_views` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dataRoomId` int NOT NULL,
	`fileId` int,
	`viewerEmail` varchar(320),
	`viewerName` varchar(256),
	`ipAddress` varchar(64),
	`userAgent` varchar(512),
	`action` enum('room_opened','file_viewed','file_downloaded') NOT NULL DEFAULT 'room_opened',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `data_room_views_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `data_rooms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(256) NOT NULL,
	`description` text,
	`shareToken` varchar(128),
	`isShared` boolean NOT NULL DEFAULT false,
	`requireEmail` boolean NOT NULL DEFAULT false,
	`expiresAt` timestamp,
	`viewCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `data_rooms_id` PRIMARY KEY(`id`),
	CONSTRAINT `data_rooms_shareToken_unique` UNIQUE(`shareToken`)
);
--> statement-breakpoint
CREATE TABLE `sales_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`date` timestamp NOT NULL,
	`amount` float NOT NULL,
	`currency` varchar(8) NOT NULL DEFAULT 'USD',
	`channel` enum('direct','online','referral','partner','inbound','outbound','other') NOT NULL DEFAULT 'direct',
	`product` varchar(256) NOT NULL DEFAULT '',
	`customer` varchar(256) NOT NULL DEFAULT '',
	`dealStage` enum('lead','qualified','proposal','negotiation','closed_won','closed_lost') NOT NULL DEFAULT 'closed_won',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sales_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sales_targets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`month` varchar(7) NOT NULL,
	`targetAmount` float NOT NULL,
	`currency` varchar(8) NOT NULL DEFAULT 'USD',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sales_targets_id` PRIMARY KEY(`id`)
);
