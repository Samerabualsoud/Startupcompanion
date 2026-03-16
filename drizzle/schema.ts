import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, float } from "drizzle-orm/mysql-core";

// ── Users ──────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  // Stripe
  stripeCustomerId: varchar("stripeCustomerId", { length: 64 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 64 }),
  subscriptionStatus: mysqlEnum("subscriptionStatus", ["active", "canceled", "past_due", "trialing", "inactive"]).default("inactive").notNull(),
  subscriptionPlan: varchar("subscriptionPlan", { length: 32 }),
  subscriptionCurrentPeriodEnd: timestamp("subscriptionCurrentPeriodEnd"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ── Startup Profiles ───────────────────────────────────────────────────────
export const startupProfiles = mysqlTable("startup_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),

  // Identity
  name: varchar("name", { length: 256 }).notNull(),
  tagline: varchar("tagline", { length: 512 }),
  description: text("description"),
  logoUrl: varchar("logoUrl", { length: 1024 }),
  websiteUrl: varchar("websiteUrl", { length: 512 }),
  pitchDeckUrl: varchar("pitchDeckUrl", { length: 1024 }),

  // Classification
  sector: varchar("sector", { length: 128 }),
  stage: mysqlEnum("stage", ["pre-seed", "seed", "series-a", "series-b", "growth"]),
  country: varchar("country", { length: 128 }),
  city: varchar("city", { length: 128 }),
  foundedYear: int("foundedYear"),

  // Financials
  currentARR: float("currentARR"),
  monthlyBurnRate: float("monthlyBurnRate"),
  cashOnHand: float("cashOnHand"),
  totalRaised: float("totalRaised"),
  revenueGrowthRate: float("revenueGrowthRate"),
  grossMargin: float("grossMargin"),
  totalAddressableMarket: float("totalAddressableMarket"),

  // Fundraising
  targetRaise: float("targetRaise"),
  useOfFunds: text("useOfFunds"),
  investorType: varchar("investorType", { length: 128 }), // e.g. "Angel, VC, Strategic"

  // Social
  linkedinUrl: varchar("linkedinUrl", { length: 512 }),
  twitterUrl: varchar("twitterUrl", { length: 512 }),

  // Status
  isPublic: boolean("isPublic").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StartupProfile = typeof startupProfiles.$inferSelect;
export type InsertStartupProfile = typeof startupProfiles.$inferInsert;

// ── Team Members ───────────────────────────────────────────────────────────
export const teamMembers = mysqlTable("team_members", {
  id: int("id").autoincrement().primaryKey(),
  startupId: int("startupId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  role: varchar("role", { length: 128 }).notNull(),
  bio: text("bio"),
  avatarUrl: varchar("avatarUrl", { length: 1024 }),
  linkedinUrl: varchar("linkedinUrl", { length: 512 }),
  equityPercent: float("equityPercent"),
  isFounder: boolean("isFounder").default(false).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = typeof teamMembers.$inferInsert;

// ── Saved Valuations ───────────────────────────────────────────────────────
export const savedValuations = mysqlTable("saved_valuations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  startupId: int("startupId"),
  label: varchar("label", { length: 256 }).notNull(),
  inputs: json("inputs").notNull(),        // StartupInputs JSON
  summary: json("summary").notNull(),      // ValuationSummary JSON
  chatAnswers: json("chatAnswers"),         // Raw chat answers
  blendedValue: float("blendedValue"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SavedValuation = typeof savedValuations.$inferSelect;
export type InsertSavedValuation = typeof savedValuations.$inferInsert;

// ── Milestones ─────────────────────────────────────────────────────────────
export const milestones = mysqlTable("milestones", {
  id: int("id").autoincrement().primaryKey(),
  startupId: int("startupId").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  targetDate: timestamp("targetDate"),
  completedAt: timestamp("completedAt"),
  category: mysqlEnum("category", ["product", "revenue", "team", "funding", "legal", "other"]).default("other").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Milestone = typeof milestones.$inferSelect;
export type InsertMilestone = typeof milestones.$inferInsert;
