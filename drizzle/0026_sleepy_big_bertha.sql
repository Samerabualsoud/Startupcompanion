ALTER TABLE `financial_projections` ADD `scenario` varchar(16) DEFAULT 'base' NOT NULL;--> statement-breakpoint
ALTER TABLE `financial_projections` ADD `yearHorizon` int DEFAULT 3 NOT NULL;--> statement-breakpoint
ALTER TABLE `financial_projections` ADD `modelInputs` json;--> statement-breakpoint
ALTER TABLE `financial_projections` ADD `aiReview` text;