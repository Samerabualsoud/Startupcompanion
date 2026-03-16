import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, float } from "drizzle-orm/mysql-core";

// ── Users ──────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  // Custom auth
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 256 }),
  emailVerified: boolean("emailVerified").default(false).notNull(),
  // Legacy OAuth (kept for DB compatibility)
  openId: varchar("openId", { length: 64 }).unique(),
  name: text("name"),
  loginMethod: varchar("loginMethod", { length: 64 }).default("email"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  // KYC
  userType: mysqlEnum("userType", ["startup", "vc", "angel", "venture_lawyer", "other"]).default("startup").notNull(),
  kycCompleted: boolean("kycCompleted").default(false).notNull(),
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

// ── KYC: VC Firm Profile ───────────────────────────────────────────────────
export const kycVcProfiles = mysqlTable("kyc_vc_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  firmName: varchar("firmName", { length: 256 }).notNull(),
  yourTitle: varchar("yourTitle", { length: 128 }),
  description: text("description"),
  website: varchar("website", { length: 512 }),
  hqCity: varchar("hqCity", { length: 128 }),
  hqCountry: varchar("hqCountry", { length: 128 }),
  regions: json("regions"),
  stages: json("stages"),
  sectors: json("sectors"),
  checkSizeMin: float("checkSizeMin"),
  checkSizeMax: float("checkSizeMax"),
  aum: float("aum"),
  portfolioCount: int("portfolioCount"),
  notablePortfolio: json("notablePortfolio"),
  linkedinUrl: varchar("linkedinUrl", { length: 512 }),
  twitterUrl: varchar("twitterUrl", { length: 512 }),
  applyUrl: varchar("applyUrl", { length: 512 }),
  isPublic: boolean("isPublic").default(true).notNull(),
  isVerified: boolean("isVerified").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type KycVcProfile = typeof kycVcProfiles.$inferSelect;

// ── KYC: Angel Investor Profile ────────────────────────────────────────────
export const kycAngelProfiles = mysqlTable("kyc_angel_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  displayName: varchar("displayName", { length: 256 }).notNull(),
  title: varchar("title", { length: 256 }),
  bio: text("bio"),
  location: varchar("location", { length: 256 }),
  regions: json("regions"),
  stages: json("stages"),
  sectors: json("sectors"),
  checkSizeMin: float("checkSizeMin"),
  checkSizeMax: float("checkSizeMax"),
  notableInvestments: json("notableInvestments"),
  linkedinUrl: varchar("linkedinUrl", { length: 512 }),
  twitterUrl: varchar("twitterUrl", { length: 512 }),
  angellistUrl: varchar("angellistUrl", { length: 512 }),
  isPublic: boolean("isPublic").default(true).notNull(),
  isVerified: boolean("isVerified").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type KycAngelProfile = typeof kycAngelProfiles.$inferSelect;

// ── KYC: Venture Lawyer Profile ────────────────────────────────────────────
export const kycLawyerProfiles = mysqlTable("kyc_lawyer_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  displayName: varchar("displayName", { length: 256 }).notNull(),
  firmName: varchar("firmName", { length: 256 }),
  title: varchar("title", { length: 256 }),
  bio: text("bio"),
  location: varchar("location", { length: 256 }),
  regions: json("regions"),
  specializations: json("specializations"),
  languages: json("languages"),
  offersFreeConsult: boolean("offersFreeConsult").default(false).notNull(),
  linkedinUrl: varchar("linkedinUrl", { length: 512 }),
  websiteUrl: varchar("websiteUrl", { length: 512 }),
  contactEmail: varchar("contactEmail", { length: 320 }),
  isPublic: boolean("isPublic").default(true).notNull(),
  isVerified: boolean("isVerified").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type KycLawyerProfile = typeof kycLawyerProfiles.$inferSelect;

// ── KYC: Startup Profile ───────────────────────────────────────────────────
export const kycStartupProfiles = mysqlTable("kyc_startup_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  companyName: varchar("companyName", { length: 256 }).notNull(),
  tagline: varchar("tagline", { length: 512 }),
  description: text("description"),
  website: varchar("website", { length: 512 }),
  sector: varchar("sector", { length: 128 }),
  stage: mysqlEnum("stage", ["idea", "pre-seed", "seed", "series-a", "series-b", "growth"]).default("idea").notNull(),
  country: varchar("country", { length: 128 }),
  city: varchar("city", { length: 128 }),
  foundedYear: int("foundedYear"),
  teamSize: int("teamSize"),
  targetRaise: float("targetRaise"),
  linkedinUrl: varchar("linkedinUrl", { length: 512 }),
  twitterUrl: varchar("twitterUrl", { length: 512 }),
  isPublic: boolean("isPublic").default(true).notNull(),
  isVerified: boolean("isVerified").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type KycStartupProfile = typeof kycStartupProfiles.$inferSelect;

// ── Startup Profiles (full, detailed) ─────────────────────────────────────
export const startupProfiles = mysqlTable("startup_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  tagline: varchar("tagline", { length: 512 }),
  description: text("description"),
  logoUrl: varchar("logoUrl", { length: 1024 }),
  websiteUrl: varchar("websiteUrl", { length: 512 }),
  pitchDeckUrl: varchar("pitchDeckUrl", { length: 1024 }),
  sector: varchar("sector", { length: 128 }),
  stage: mysqlEnum("stage", ["pre-seed", "seed", "series-a", "series-b", "growth"]),
  country: varchar("country", { length: 128 }),
  city: varchar("city", { length: 128 }),
  foundedYear: int("foundedYear"),
  currentARR: float("currentARR"),
  monthlyBurnRate: float("monthlyBurnRate"),
  cashOnHand: float("cashOnHand"),
  totalRaised: float("totalRaised"),
  revenueGrowthRate: float("revenueGrowthRate"),
  grossMargin: float("grossMargin"),
  totalAddressableMarket: float("totalAddressableMarket"),
  targetRaise: float("targetRaise"),
  useOfFunds: text("useOfFunds"),
  investorType: varchar("investorType", { length: 128 }),
  linkedinUrl: varchar("linkedinUrl", { length: 512 }),
  twitterUrl: varchar("twitterUrl", { length: 512 }),
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
  inputs: json("inputs").notNull(),
  summary: json("summary").notNull(),
  chatAnswers: json("chatAnswers"),
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

// ── Resource Database: VC Firms ────────────────────────────────────────────
export const vcFirms = mysqlTable("vc_firms", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  website: varchar("website", { length: 512 }),
  logoUrl: varchar("logoUrl", { length: 1024 }),
  hqCity: varchar("hqCity", { length: 128 }),
  hqCountry: varchar("hqCountry", { length: 128 }),
  regions: json("regions"),
  stages: json("stages"),
  sectors: json("sectors"),
  checkSizeMin: float("checkSizeMin"),
  checkSizeMax: float("checkSizeMax"),
  aum: float("aum"),
  portfolioCount: int("portfolioCount"),
  notablePortfolio: json("notablePortfolio"),
  linkedinUrl: varchar("linkedinUrl", { length: 512 }),
  twitterUrl: varchar("twitterUrl", { length: 512 }),
  applyUrl: varchar("applyUrl", { length: 512 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type VcFirm = typeof vcFirms.$inferSelect;

// ── Resource Database: Angel Investors ────────────────────────────────────
export const angelInvestors = mysqlTable("angel_investors", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  title: varchar("title", { length: 256 }),
  bio: text("bio"),
  photoUrl: varchar("photoUrl", { length: 1024 }),
  location: varchar("location", { length: 256 }),
  regions: json("regions"),
  stages: json("stages"),
  sectors: json("sectors"),
  checkSizeMin: float("checkSizeMin"),
  checkSizeMax: float("checkSizeMax"),
  notableInvestments: json("notableInvestments"),
  linkedinUrl: varchar("linkedinUrl", { length: 512 }),
  twitterUrl: varchar("twitterUrl", { length: 512 }),
  angellistUrl: varchar("angellistUrl", { length: 512 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AngelInvestor = typeof angelInvestors.$inferSelect;

// ── Resource Database: Grants ──────────────────────────────────────────────
export const grants = mysqlTable("grants", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  provider: varchar("provider", { length: 256 }).notNull(),
  description: text("description"),
  logoUrl: varchar("logoUrl", { length: 1024 }),
  type: mysqlEnum("type", ["government", "corporate", "foundation", "eu", "other"]).default("other").notNull(),
  regions: json("regions"),
  sectors: json("sectors"),
  stages: json("stages"),
  amountMin: float("amountMin"),
  amountMax: float("amountMax"),
  currency: varchar("currency", { length: 8 }).default("USD"),
  deadline: varchar("deadline", { length: 128 }),
  isEquityFree: boolean("isEquityFree").default(true).notNull(),
  requirements: text("requirements"),
  applyUrl: varchar("applyUrl", { length: 512 }),
  websiteUrl: varchar("websiteUrl", { length: 512 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Grant = typeof grants.$inferSelect;

// ── Resource Database: Venture Lawyers ────────────────────────────────────
export const ventureLawyers = mysqlTable("venture_lawyers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  firm: varchar("firm", { length: 256 }),
  title: varchar("title", { length: 256 }),
  bio: text("bio"),
  photoUrl: varchar("photoUrl", { length: 1024 }),
  location: varchar("location", { length: 256 }),
  regions: json("regions"),
  specializations: json("specializations"),
  languages: json("languages"),
  startupFriendly: boolean("startupFriendly").default(true).notNull(),
  offersFreeConsult: boolean("offersFreeConsult").default(false).notNull(),
  linkedinUrl: varchar("linkedinUrl", { length: 512 }),
  websiteUrl: varchar("websiteUrl", { length: 512 }),
  email: varchar("email", { length: 320 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type VentureLawyer = typeof ventureLawyers.$inferSelect;

// ── Password Reset Tokens ──────────────────────────────────────────────────
export const passwordResetTokens = mysqlTable("password_reset_tokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  token: varchar("token", { length: 128 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
