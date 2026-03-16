CREATE TABLE `angel_investors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(256) NOT NULL,
	`title` varchar(256),
	`bio` text,
	`photoUrl` varchar(1024),
	`location` varchar(256),
	`regions` json,
	`stages` json,
	`sectors` json,
	`checkSizeMin` float,
	`checkSizeMax` float,
	`notableInvestments` json,
	`linkedinUrl` varchar(512),
	`twitterUrl` varchar(512),
	`angellistUrl` varchar(512),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `angel_investors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `grants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(256) NOT NULL,
	`provider` varchar(256) NOT NULL,
	`description` text,
	`logoUrl` varchar(1024),
	`type` enum('government','corporate','foundation','eu','other') NOT NULL DEFAULT 'other',
	`regions` json,
	`sectors` json,
	`stages` json,
	`amountMin` float,
	`amountMax` float,
	`currency` varchar(8) DEFAULT 'USD',
	`deadline` varchar(128),
	`isEquityFree` boolean NOT NULL DEFAULT true,
	`requirements` text,
	`applyUrl` varchar(512),
	`websiteUrl` varchar(512),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `grants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vc_firms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(256) NOT NULL,
	`description` text,
	`website` varchar(512),
	`logoUrl` varchar(1024),
	`hqCity` varchar(128),
	`hqCountry` varchar(128),
	`regions` json,
	`stages` json,
	`sectors` json,
	`checkSizeMin` float,
	`checkSizeMax` float,
	`aum` float,
	`portfolioCount` int,
	`notablePortfolio` json,
	`linkedinUrl` varchar(512),
	`twitterUrl` varchar(512),
	`applyUrl` varchar(512),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `vc_firms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `venture_lawyers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(256) NOT NULL,
	`firm` varchar(256),
	`title` varchar(256),
	`bio` text,
	`photoUrl` varchar(1024),
	`location` varchar(256),
	`regions` json,
	`specializations` json,
	`languages` json,
	`startupFriendly` boolean NOT NULL DEFAULT true,
	`offersFreeConsult` boolean NOT NULL DEFAULT false,
	`linkedinUrl` varchar(512),
	`websiteUrl` varchar(512),
	`email` varchar(320),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `venture_lawyers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `openId` varchar(64);--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `email` varchar(320) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `loginMethod` varchar(64) DEFAULT 'email';--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(256);--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerified` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_email_unique` UNIQUE(`email`);