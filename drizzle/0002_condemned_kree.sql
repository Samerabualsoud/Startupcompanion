CREATE TABLE `milestones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`startupId` int NOT NULL,
	`title` varchar(256) NOT NULL,
	`description` text,
	`targetDate` timestamp,
	`completedAt` timestamp,
	`category` enum('product','revenue','team','funding','legal','other') NOT NULL DEFAULT 'other',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `milestones_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `saved_valuations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`startupId` int,
	`label` varchar(256) NOT NULL,
	`inputs` json NOT NULL,
	`summary` json NOT NULL,
	`chatAnswers` json,
	`blendedValue` float,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `saved_valuations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `startup_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(256) NOT NULL,
	`tagline` varchar(512),
	`description` text,
	`logoUrl` varchar(1024),
	`websiteUrl` varchar(512),
	`pitchDeckUrl` varchar(1024),
	`sector` varchar(128),
	`stage` enum('pre-seed','seed','series-a','series-b','growth'),
	`country` varchar(128),
	`city` varchar(128),
	`foundedYear` int,
	`currentARR` float,
	`monthlyBurnRate` float,
	`cashOnHand` float,
	`totalRaised` float,
	`revenueGrowthRate` float,
	`grossMargin` float,
	`totalAddressableMarket` float,
	`targetRaise` float,
	`useOfFunds` text,
	`investorType` varchar(128),
	`linkedinUrl` varchar(512),
	`twitterUrl` varchar(512),
	`isPublic` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `startup_profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `team_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`startupId` int NOT NULL,
	`name` varchar(256) NOT NULL,
	`role` varchar(128) NOT NULL,
	`bio` text,
	`avatarUrl` varchar(1024),
	`linkedinUrl` varchar(512),
	`equityPercent` float,
	`isFounder` boolean NOT NULL DEFAULT false,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `team_members_id` PRIMARY KEY(`id`)
);
