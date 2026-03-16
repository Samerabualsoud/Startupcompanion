CREATE TABLE `investor_contacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(256) NOT NULL,
	`firm` varchar(256) NOT NULL DEFAULT '',
	`stageFocus` varchar(128) NOT NULL DEFAULT '',
	`sectorFocus` varchar(256) NOT NULL DEFAULT '',
	`status` enum('target','contacted','intro-requested','meeting-scheduled','due-diligence','term-sheet','passed','invested') NOT NULL DEFAULT 'target',
	`lastContact` varchar(32) NOT NULL DEFAULT '',
	`notes` varchar(2048) NOT NULL DEFAULT '',
	`email` varchar(320) NOT NULL DEFAULT '',
	`linkedin` varchar(512) NOT NULL DEFAULT '',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `investor_contacts_id` PRIMARY KEY(`id`)
);
