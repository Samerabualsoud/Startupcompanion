ALTER TABLE `users` ADD `stripeCustomerId` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `stripeSubscriptionId` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionStatus` enum('active','canceled','past_due','trialing','inactive') DEFAULT 'inactive' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionPlan` varchar(32);--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionCurrentPeriodEnd` timestamp;