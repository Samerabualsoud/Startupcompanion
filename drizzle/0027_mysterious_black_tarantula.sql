ALTER TABLE `startup_profiles` ADD `isPublicProfilePublished` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `startup_profiles` ADD `publicProfileSlug` varchar(256);--> statement-breakpoint
ALTER TABLE `startup_profiles` ADD `publicProfileLogoKey` varchar(512);--> statement-breakpoint
ALTER TABLE `startup_profiles` ADD `publicProfileLogoUrl` varchar(1024);--> statement-breakpoint
ALTER TABLE `startup_profiles` ADD `publicProfileBio` text;--> statement-breakpoint
ALTER TABLE `startup_profiles` ADD `publicProfileHighlights` json;--> statement-breakpoint
ALTER TABLE `startup_profiles` ADD `publicProfileContactEmail` varchar(320);--> statement-breakpoint
ALTER TABLE `startup_profiles` ADD `publicProfileInvestorNote` text;--> statement-breakpoint
ALTER TABLE `startup_profiles` ADD `publicProfileAiScore` int;--> statement-breakpoint
ALTER TABLE `startup_profiles` ADD `publicProfileVerified` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `startup_profiles` ADD `publicProfileViewCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `startup_profiles` ADD CONSTRAINT `startup_profiles_publicProfileSlug_unique` UNIQUE(`publicProfileSlug`);