import { boolean, int, bigint, mysqlEnum, mysqlTable, text, timestamp, varchar, json, float } from "drizzle-orm/mysql-core";

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
  stage: mysqlEnum("stage", ["idea", "pre-seed", "seed", "series-a", "series-b", "growth"]),
  country: varchar("country", { length: 128 }),
  city: varchar("city", { length: 128 }),
  foundedYear: int("foundedYear"),
  currentARR: float("currentARR"),
  monthlyBurnRate: float("monthlyBurnRate"),
  cashOnHand: float("cashOnHand"),
  totalRaised: float("totalRaised"),
  // Cap table fields
  totalSharesOutstanding: bigint("totalSharesOutstanding", { mode: 'number' }),
  authorizedShares: bigint("authorizedShares", { mode: 'number' }),
  parValuePerShare: float("parValuePerShare"),
  esopPoolPercent: float("esopPoolPercent"),
  revenueGrowthRate: float("revenueGrowthRate"),
  grossMargin: float("grossMargin"),
  totalAddressableMarket: float("totalAddressableMarket"),
  targetRaise: float("targetRaise"),
  useOfFunds: text("useOfFunds"),
  investorType: varchar("investorType", { length: 128 }),
  linkedinUrl: varchar("linkedinUrl", { length: 512 }),
  twitterUrl: varchar("twitterUrl", { length: 512 }),
  instagramUrl: varchar("instagramUrl", { length: 512 }),
  facebookUrl: varchar("facebookUrl", { length: 512 }),
  tiktokUrl: varchar("tiktokUrl", { length: 512 }),
  appStoreUrl: varchar("appStoreUrl", { length: 512 }),
  playStoreUrl: varchar("playStoreUrl", { length: 512 }),
  // Product & Business
  problem: text("problem"),
  solution: text("solution"),
  targetCustomer: text("targetCustomer"),
  competitiveAdvantage: text("competitiveAdvantage"),
  businessModel: varchar("businessModel", { length: 64 }),
  revenueModel: varchar("revenueModel", { length: 256 }),
  productStatus: mysqlEnum("productStatus", ["idea", "prototype", "mvp", "beta", "launched", "scaling"]),
  techStack: text("techStack"),
  patents: text("patents"),
  keyRisks: text("keyRisks"),
  // Traction Metrics
  mrr: float("mrr"),
  numberOfCustomers: int("numberOfCustomers"),
  monthlyActiveUsers: int("monthlyActiveUsers"),
  churnRate: float("churnRate"),
  ltv: float("ltv"),
  cac: float("cac"),
  npsScore: int("npsScore"),
  // Team & Headcount
  employeeCount: int("employeeCount"),
  fullTimeCount: int("fullTimeCount"),
  partTimeCount: int("partTimeCount"),
  // Legal & Incorporation
  incorporationCountry: varchar("incorporationCountry", { length: 128 }),
  incorporationType: varchar("incorporationType", { length: 128 }),
  taxId: varchar("taxId", { length: 128 }),
  registrationNumber: varchar("registrationNumber", { length: 128 }),
  // Fundraising
  nextFundingDate: timestamp("nextFundingDate"),
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
  esopShares: bigint("esopShares", { mode: 'number' }),
  esopVestingMonths: int("esopVestingMonths"),
  esopCliffMonths: int("esopCliffMonths"),
  esopStartDate: timestamp("esopStartDate"),
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

// ── Investor CRM Contacts ──────────────────────────────────────────────────
export const investorContacts = mysqlTable("investor_contacts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  firm: varchar("firm", { length: 256 }).notNull().default(""),
  stageFocus: varchar("stageFocus", { length: 128 }).notNull().default(""),
  sectorFocus: varchar("sectorFocus", { length: 256 }).notNull().default(""),
  status: mysqlEnum("status", [
    "target",
    "contacted",
    "intro-requested",
    "meeting-scheduled",
    "due-diligence",
    "term-sheet",
    "passed",
    "invested",
  ]).default("target").notNull(),
  lastContact: varchar("lastContact", { length: 32 }).notNull().default(""),
  notes: varchar("notes", { length: 2048 }).notNull().default(""),
  email: varchar("email", { length: 320 }).notNull().default(""),
  linkedin: varchar("linkedin", { length: 512 }).notNull().default(""),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type InvestorContact = typeof investorContacts.$inferSelect;
export type InsertInvestorContact = typeof investorContacts.$inferInsert;

// ── 409A / Valuation History ───────────────────────────────────────────────
export const valuationHistory = mysqlTable("valuation_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  companyName: varchar("companyName", { length: 256 }).notNull(),
  valuationDate: timestamp("valuationDate").notNull(),
  valuationType: mysqlEnum("valuationType", ["409a", "priced-round", "safe", "convertible-note", "internal", "other"]).default("409a").notNull(),
  preMoneyValuation: float("preMoneyValuation"),
  postMoneyValuation: float("postMoneyValuation"),
  sharePrice: float("sharePrice"),
  totalShares: bigint("totalShares", { mode: 'number' }),
  stage: varchar("stage", { length: 64 }),
  roundName: varchar("roundName", { length: 128 }),
  amountRaised: float("amountRaised"),
  leadInvestor: varchar("leadInvestor", { length: 256 }),
  notes: text("notes"),
  methodology: varchar("methodology", { length: 256 }),
  provider: varchar("provider", { length: 256 }),
  isPublic: boolean("isPublic").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ValuationHistory = typeof valuationHistory.$inferSelect;
export type InsertValuationHistory = typeof valuationHistory.$inferInsert;

// ── COGS & Cost Calculations ───────────────────────────────────────────────
export const cogsCalculations = mysqlTable("cogs_calculations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  businessModel: mysqlEnum("businessModel", ["saas", "ecommerce", "marketplace", "hardware", "services", "manufacturing", "other"]).default("saas").notNull(),
  currency: varchar("currency", { length: 8 }).notNull().default("USD"),
  // Revenue
  revenuePerUnit: float("revenuePerUnit").notNull().default(0),
  unitsPerMonth: float("unitsPerMonth").notNull().default(0),
  // Direct Costs (COGS) - stored as JSON array
  directCostsJson: json("directCostsJson").notNull(),
  // Indirect / Operating Costs (OpEx) - stored as JSON array
  indirectCostsJson: json("indirectCostsJson").notNull(),
  // Computed results (stored for history/trending)
  totalCOGS: float("totalCOGS"),
  grossProfit: float("grossProfit"),
  grossMarginPct: float("grossMarginPct"),
  totalOpEx: float("totalOpEx"),
  ebitda: float("ebitda"),
  breakEvenUnits: float("breakEvenUnits"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CogsCalculation = typeof cogsCalculations.$inferSelect;
export type InsertCogsCalculation = typeof cogsCalculations.$inferInsert;

// ── Data Rooms ────────────────────────────────────────────────────────────
export const dataRooms = mysqlTable('data_rooms', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('userId').notNull(),
  name: varchar('name', { length: 256 }).notNull(),
  description: text('description'),
  shareToken: varchar('shareToken', { length: 128 }).unique(),
  isShared: boolean('isShared').default(false).notNull(),
  requireEmail: boolean('requireEmail').default(false).notNull(),
  expiresAt: timestamp('expiresAt'),
  viewCount: int('viewCount').default(0).notNull(),
  shareTitle: varchar('shareTitle', { length: 256 }),
  shareMessage: text('shareMessage'),
  visibleSections: json('visibleSections').$type<{
    files: boolean;
    companyOverview: boolean;
    financials: boolean;
    team: boolean;
    metrics: boolean;
    contactInfo: boolean;
  }>(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().onUpdateNow().notNull(),
});
export type DataRoom = typeof dataRooms.$inferSelect;
export type InsertDataRoom = typeof dataRooms.$inferInsert;

export const dataRoomFiles = mysqlTable('data_room_files', {
  id: int('id').autoincrement().primaryKey(),
  dataRoomId: int('dataRoomId').notNull(),
  userId: int('userId').notNull(),
  name: varchar('name', { length: 256 }).notNull(),
  fileKey: varchar('fileKey', { length: 512 }).notNull(),
  fileUrl: varchar('fileUrl', { length: 1024 }).notNull(),
  mimeType: varchar('mimeType', { length: 128 }).notNull().default('application/octet-stream'),
  sizeBytes: int('sizeBytes').notNull().default(0),
  folder: varchar('folder', { length: 128 }).notNull().default('General'),
  sortOrder: int('sortOrder').default(0).notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});
export type DataRoomFile = typeof dataRoomFiles.$inferSelect;
export type InsertDataRoomFile = typeof dataRoomFiles.$inferInsert;

export const dataRoomViews = mysqlTable('data_room_views', {
  id: int('id').autoincrement().primaryKey(),
  dataRoomId: int('dataRoomId').notNull(),
  fileId: int('fileId'),
  viewerEmail: varchar('viewerEmail', { length: 320 }),
  viewerName: varchar('viewerName', { length: 256 }),
  ipAddress: varchar('ipAddress', { length: 64 }),
  userAgent: varchar('userAgent', { length: 512 }),
  action: mysqlEnum('action', ['room_opened', 'file_viewed', 'file_downloaded']).default('room_opened').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});
export type DataRoomView = typeof dataRoomViews.$inferSelect;
export type InsertDataRoomView = typeof dataRoomViews.$inferInsert;

// ── Sales Tracking ────────────────────────────────────────────────────────
export const salesEntries = mysqlTable('sales_entries', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('userId').notNull(),
  date: timestamp('date').notNull(),
  amount: float('amount').notNull(),
  currency: varchar('currency', { length: 8 }).notNull().default('USD'),
  channel: mysqlEnum('channel', ['direct', 'online', 'referral', 'partner', 'inbound', 'outbound', 'other']).default('direct').notNull(),
  product: varchar('product', { length: 256 }).notNull().default(''),
  customer: varchar('customer', { length: 256 }).notNull().default(''),
  dealStage: mysqlEnum('dealStage', ['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost']).default('closed_won').notNull(),
  // Pipeline detail fields
  contactName: varchar('contactName', { length: 256 }),
  contactEmail: varchar('contactEmail', { length: 320 }),
  contactPhone: varchar('contactPhone', { length: 64 }),
  dealValue: float('dealValue'),
  probability: int('probability').default(50),
  expectedCloseDate: timestamp('expectedCloseDate'),
  lostReason: varchar('lostReason', { length: 512 }),
  nextAction: varchar('nextAction', { length: 512 }),
  notes: text('notes'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().onUpdateNow().notNull(),
});
export type SalesEntry = typeof salesEntries.$inferSelect;
export type InsertSalesEntry = typeof salesEntries.$inferInsert;

export const salesTargets = mysqlTable('sales_targets', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('userId').notNull(),
  month: varchar('month', { length: 7 }).notNull(), // YYYY-MM
  targetAmount: float('targetAmount').notNull(),
  currency: varchar('currency', { length: 8 }).notNull().default('USD'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().onUpdateNow().notNull(),
});
export type SalesTarget = typeof salesTargets.$inferSelect;
export type InsertSalesTarget = typeof salesTargets.$inferInsert;

// ── ESOP Plans ────────────────────────────────────────────────────────────
// grants JSON shape per element:
// { id, employeeName, employeeEmail, role, department, grantDate, shares,
//   strikePrice, vestingMonths, cliffMonths, startDate,
//   status: 'active'|'cancelled'|'exercised', exercisedShares, notes }
export const esopPlans = mysqlTable('esop_plans', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('userId').notNull(),
  startupId: int('startupId'),
  label: varchar('label', { length: 256 }).notNull().default('ESOP Plan'),
  // Pool configuration
  totalShares: bigint('totalShares', { mode: 'number' }).notNull().default(10000000),
  currentOptionPool: bigint('currentOptionPool', { mode: 'number' }).notNull().default(1000000),
  pricePerShare: float('pricePerShare').notNull().default(0.10),  // strike price default
  fmvPerShare: float('fmvPerShare'),                              // 409A Fair Market Value
  // Default vesting terms (overridable per grant)
  vestingMonths: int('vestingMonths').notNull().default(48),
  cliffMonths: int('cliffMonths').notNull().default(12),
  // Structured grants array
  grants: json('grants'),
  // Plan metadata
  jurisdiction: varchar('jurisdiction', { length: 64 }).default('delaware'),
  planType: mysqlEnum('planType', ['iso', 'nso', 'rsu', 'sar']).default('iso'),
  isActive: boolean('isActive').default(true).notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().onUpdateNow().notNull(),
});
export type EsopPlan = typeof esopPlans.$inferSelect;
export type InsertEsopPlan = typeof esopPlans.$inferInsert;

// ── Resource Submissions (self-registration for VCs, angels, lawyers, grants) ──
export const resourceSubmissions = mysqlTable('resource_submissions', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('userId'),
  type: mysqlEnum('type', ['vc', 'angel', 'lawyer', 'grant']).notNull(),
  status: mysqlEnum('status', ['pending', 'approved', 'rejected']).default('pending').notNull(),
  data: json('data').notNull(),
  submitterEmail: varchar('submitterEmail', { length: 320 }),
  submitterName: varchar('submitterName', { length: 256 }),
  adminNote: text('adminNote'),
  reviewedBy: int('reviewedBy'),
  reviewedAt: timestamp('reviewedAt'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().onUpdateNow().notNull(),
});
export type ResourceSubmission = typeof resourceSubmissions.$inferSelect;
export type InsertResourceSubmission = typeof resourceSubmissions.$inferInsert;

// ── Admin Audit Log ────────────────────────────────────────────────────────
export const auditLog = mysqlTable('audit_log', {
  id: int('id').autoincrement().primaryKey(),
  adminId: int('adminId').notNull(),
  adminEmail: varchar('adminEmail', { length: 320 }).notNull(),
  action: varchar('action', { length: 128 }).notNull(),
  targetType: varchar('targetType', { length: 64 }),
  targetId: int('targetId'),
  details: json('details'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});
export type AuditLog = typeof auditLog.$inferSelect;
export type InsertAuditLog = typeof auditLog.$inferInsert;
