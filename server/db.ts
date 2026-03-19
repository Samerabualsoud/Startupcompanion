import { eq, and, or, like, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import crypto from "crypto";
import {
  users, InsertUser,
  startupProfiles, InsertStartupProfile,
  teamMembers, InsertTeamMember,
  savedValuations, InsertSavedValuation,
  milestones, InsertMilestone,
  vcFirms, angelInvestors, grants, ventureLawyers,
  kycVcProfiles, kycAngelProfiles, kycLawyerProfiles, kycStartupProfiles,
  passwordResetTokens,
  investorContacts,
  type KycVcProfile, type KycAngelProfile, type KycLawyerProfile, type KycStartupProfile,
  type InvestorContact, type InsertInvestorContact,
  valuationHistory, type InsertValuationHistory,
  cogsCalculations, type InsertCogsCalculation,
  resourceSubmissions, type InsertResourceSubmission,
  auditLog,
  platformSettings, type PlatformSettings,
} from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ── Custom Auth ────────────────────────────────────────────────────────────

export async function createUser(data: { email: string; passwordHash: string; name?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(users).values({
    email: data.email.toLowerCase().trim(),
    passwordHash: data.passwordHash,
    name: data.name ?? null,
    loginMethod: "email",
    lastSignedIn: new Date(),
  });
  const result = await db.select().from(users).where(eq(users.email, data.email.toLowerCase().trim())).limit(1);
  return result[0] ?? null;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim())).limit(1);
  return result[0] ?? null;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0] ?? null;
}

export async function updateUserLastSignedIn(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, id));
}

export async function updateUserName(id: number, name: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ name }).where(eq(users.id, id));
}

// Legacy OAuth upsert (kept for backward compat)
export async function upsertUser(user: { openId?: string | null; email?: string | null; name?: string | null; loginMethod?: string | null; lastSignedIn?: Date; role?: "user" | "admin" }): Promise<void> {
  if (!user.email && !user.openId) {
    throw new Error("User email or openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  const email = user.email?.toLowerCase().trim() ?? `${user.openId}@oauth.local`;
  const existing = await getUserByEmail(email);
  if (existing) {
    await db.update(users).set({
      openId: user.openId ?? existing.openId,
      name: user.name ?? existing.name,
      lastSignedIn: user.lastSignedIn ?? new Date(),
    }).where(eq(users.id, existing.id));
  } else {
    await db.insert(users).values({
      email,
      openId: user.openId ?? null,
      name: user.name ?? null,
      loginMethod: user.loginMethod ?? "oauth",
      lastSignedIn: user.lastSignedIn ?? new Date(),
      role: user.role ?? "user",
    });
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ── Startup Profiles ───────────────────────────────────────────────────────
export async function getProfileByUserId(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(startupProfiles).where(eq(startupProfiles.userId, userId)).limit(1);
  return result[0] ?? null;
}

export async function upsertProfile(userId: number, data: Omit<InsertStartupProfile, 'userId' | 'id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const existing = await getProfileByUserId(userId);
  if (existing) {
    await db.update(startupProfiles).set({ ...data, updatedAt: new Date() }).where(eq(startupProfiles.userId, userId));
  } else {
    await db.insert(startupProfiles).values({ ...data, userId });
  }
  const result = await db.select().from(startupProfiles).where(eq(startupProfiles.userId, userId)).limit(1);
  return result[0] ?? null;
}

// ── Team Members ───────────────────────────────────────────────────────────
export async function getTeamByStartupId(startupId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(teamMembers).where(eq(teamMembers.startupId, startupId));
}

export async function addTeamMember(data: InsertTeamMember) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.insert(teamMembers).values(data);
}

export async function updateTeamMember(id: number, data: Partial<InsertTeamMember>) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.update(teamMembers).set(data).where(eq(teamMembers.id, id));
}

export async function deleteTeamMember(id: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.delete(teamMembers).where(eq(teamMembers.id, id));
}

// ── Saved Valuations ───────────────────────────────────────────────────────
export async function getSavedValuations(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(savedValuations).where(eq(savedValuations.userId, userId));
}

export async function saveValuation(data: InsertSavedValuation) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.insert(savedValuations).values(data);
}

export async function deleteSavedValuation(id: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.delete(savedValuations).where(eq(savedValuations.id, id));
}

// ── Milestones ─────────────────────────────────────────────────────────────
export async function getMilestonesByStartupId(startupId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(milestones).where(eq(milestones.startupId, startupId));
}

export async function addMilestone(data: InsertMilestone) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.insert(milestones).values(data);
}

export async function updateMilestone(id: number, data: Partial<InsertMilestone>) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.update(milestones).set(data).where(eq(milestones.id, id));
}

export async function deleteMilestone(id: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.delete(milestones).where(eq(milestones.id, id));
}

// ── Resource Database Queries ──────────────────────────────────────────────

export async function getVcFirms(filters?: { stage?: string; sector?: string; region?: string; search?: string }) {
  const db = await getDb();
  if (!db) return [];
  let query = db.select().from(vcFirms).where(eq(vcFirms.isActive, true));
  return query;
}

export async function getAngelInvestors(filters?: { stage?: string; sector?: string; region?: string; search?: string }) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(angelInvestors).where(eq(angelInvestors.isActive, true));
}

export async function getGrants(filters?: { type?: string; sector?: string; region?: string; search?: string }) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(grants).where(eq(grants.isActive, true));
}

export async function getVentureLawyers(filters?: { region?: string; specialization?: string; search?: string }) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(ventureLawyers).where(eq(ventureLawyers.isActive, true));
}

// ── KYC Helpers ────────────────────────────────────────────────────────────

export async function setUserKycCompleted(userId: number, userType: "startup" | "vc" | "angel" | "venture_lawyer" | "other") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ kycCompleted: true, userType }).where(eq(users.id, userId));
}

// VC KYC
export async function upsertKycVcProfile(userId: number, data: Omit<KycVcProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isVerified'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(kycVcProfiles).where(eq(kycVcProfiles.userId, userId)).limit(1);
  if (existing.length > 0) {
    await db.update(kycVcProfiles).set({ ...data, updatedAt: new Date() }).where(eq(kycVcProfiles.userId, userId));
  } else {
    await db.insert(kycVcProfiles).values({ ...data, userId });
  }
  const result = await db.select().from(kycVcProfiles).where(eq(kycVcProfiles.userId, userId)).limit(1);
  return result[0] ?? null;
}

export async function getKycVcProfile(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(kycVcProfiles).where(eq(kycVcProfiles.userId, userId)).limit(1);
  return result[0] ?? null;
}

export async function getPublicKycVcProfiles() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(kycVcProfiles).where(eq(kycVcProfiles.isPublic, true));
}

// Angel KYC
export async function upsertKycAngelProfile(userId: number, data: Omit<KycAngelProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isVerified'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(kycAngelProfiles).where(eq(kycAngelProfiles.userId, userId)).limit(1);
  if (existing.length > 0) {
    await db.update(kycAngelProfiles).set({ ...data, updatedAt: new Date() }).where(eq(kycAngelProfiles.userId, userId));
  } else {
    await db.insert(kycAngelProfiles).values({ ...data, userId });
  }
  const result = await db.select().from(kycAngelProfiles).where(eq(kycAngelProfiles.userId, userId)).limit(1);
  return result[0] ?? null;
}

export async function getKycAngelProfile(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(kycAngelProfiles).where(eq(kycAngelProfiles.userId, userId)).limit(1);
  return result[0] ?? null;
}

export async function getPublicKycAngelProfiles() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(kycAngelProfiles).where(eq(kycAngelProfiles.isPublic, true));
}

// Lawyer KYC
export async function upsertKycLawyerProfile(userId: number, data: Omit<KycLawyerProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isVerified'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(kycLawyerProfiles).where(eq(kycLawyerProfiles.userId, userId)).limit(1);
  if (existing.length > 0) {
    await db.update(kycLawyerProfiles).set({ ...data, updatedAt: new Date() }).where(eq(kycLawyerProfiles.userId, userId));
  } else {
    await db.insert(kycLawyerProfiles).values({ ...data, userId });
  }
  const result = await db.select().from(kycLawyerProfiles).where(eq(kycLawyerProfiles.userId, userId)).limit(1);
  return result[0] ?? null;
}

export async function getKycLawyerProfile(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(kycLawyerProfiles).where(eq(kycLawyerProfiles.userId, userId)).limit(1);
  return result[0] ?? null;
}

export async function getPublicKycLawyerProfiles() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(kycLawyerProfiles).where(eq(kycLawyerProfiles.isPublic, true));
}

// Startup KYC
export async function upsertKycStartupProfile(userId: number, data: Omit<KycStartupProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isVerified'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(kycStartupProfiles).where(eq(kycStartupProfiles.userId, userId)).limit(1);
  if (existing.length > 0) {
    await db.update(kycStartupProfiles).set({ ...data, updatedAt: new Date() }).where(eq(kycStartupProfiles.userId, userId));
  } else {
    await db.insert(kycStartupProfiles).values({ ...data, userId });
  }
  const result = await db.select().from(kycStartupProfiles).where(eq(kycStartupProfiles.userId, userId)).limit(1);
  return result[0] ?? null;
}

export async function getKycStartupProfile(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(kycStartupProfiles).where(eq(kycStartupProfiles.userId, userId)).limit(1);
  return result[0] ?? null;
}

export async function getPublicKycStartupProfiles() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(kycStartupProfiles).where(eq(kycStartupProfiles.isPublic, true));
}

// Query the full startup_profiles table for public profiles (set via the Startup Profile page)
export async function getPublicStartupProfiles() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(startupProfiles).where(eq(startupProfiles.isPublic, true));
}

// ── Password Reset Tokens ──────────────────────────────────────────────────

export async function createPasswordResetToken(userId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Invalidate any existing tokens for this user
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));
  const token = crypto.randomBytes(48).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
  await db.insert(passwordResetTokens).values({ userId, token, expiresAt });
  return token;
}

export async function getPasswordResetToken(token: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.token, token)).limit(1);
  return result[0] ?? null;
}

export async function markPasswordResetTokenUsed(token: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.token, token));
}

export async function updateUserPassword(userId: number, passwordHash: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
}

// ── Admin: KYC Review ──────────────────────────────────────────────────────
export async function getAllKycSubmissions() {
  const db = await getDb();
  if (!db) return { vcs: [], angels: [], lawyers: [], startups: [] };
  const [vcs, angels, lawyers, startups] = await Promise.all([
    db.select().from(kycVcProfiles),
    db.select().from(kycAngelProfiles),
    db.select().from(kycLawyerProfiles),
    db.select().from(kycStartupProfiles),
  ]);
  return { vcs, angels, lawyers, startups };
}

export async function verifyKycSubmission(type: "vc" | "angel" | "lawyer" | "startup", id: number, verified: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (type === "vc") await db.update(kycVcProfiles).set({ isVerified: verified }).where(eq(kycVcProfiles.id, id));
  else if (type === "angel") await db.update(kycAngelProfiles).set({ isVerified: verified }).where(eq(kycAngelProfiles.id, id));
  else if (type === "lawyer") await db.update(kycLawyerProfiles).set({ isVerified: verified }).where(eq(kycLawyerProfiles.id, id));
  else if (type === "startup") await db.update(kycStartupProfiles).set({ isVerified: verified }).where(eq(kycStartupProfiles.id, id));
}

export async function setKycPublicStatus(type: "vc" | "angel" | "lawyer" | "startup", id: number, isPublic: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (type === "vc") await db.update(kycVcProfiles).set({ isPublic }).where(eq(kycVcProfiles.id, id));
  else if (type === "angel") await db.update(kycAngelProfiles).set({ isPublic }).where(eq(kycAngelProfiles.id, id));
  else if (type === "lawyer") await db.update(kycLawyerProfiles).set({ isPublic }).where(eq(kycLawyerProfiles.id, id));
  else if (type === "startup") await db.update(kycStartupProfiles).set({ isPublic }).where(eq(kycStartupProfiles.id, id));
}

export async function getAllUsers(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).limit(limit).offset(offset);
}

export async function setUserRole(userId: number, role: "user" | "admin") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

// ── Investor CRM Helpers ───────────────────────────────────────────────────
export async function getCrmContacts(userId: number): Promise<InvestorContact[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(investorContacts).where(eq(investorContacts.userId, userId));
}

export async function addCrmContact(userId: number, data: Omit<InsertInvestorContact, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<InvestorContact> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(investorContacts).values({ ...data, userId });
  const [inserted] = await db
    .select()
    .from(investorContacts)
    .where(and(eq(investorContacts.userId, userId), eq(investorContacts.id, (result as any).insertId)));
  return inserted;
}

export async function updateCrmContact(id: number, userId: number, data: Partial<Omit<InsertInvestorContact, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>): Promise<InvestorContact | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [existing] = await db.select().from(investorContacts).where(and(eq(investorContacts.id, id), eq(investorContacts.userId, userId)));
  if (!existing) return null;
  await db.update(investorContacts).set(data).where(and(eq(investorContacts.id, id), eq(investorContacts.userId, userId)));
  const [updated] = await db.select().from(investorContacts).where(eq(investorContacts.id, id));
  return updated ?? null;
}

export async function deleteCrmContact(id: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [existing] = await db.select().from(investorContacts).where(and(eq(investorContacts.id, id), eq(investorContacts.userId, userId)));
  if (!existing) return false;
  await db.delete(investorContacts).where(and(eq(investorContacts.id, id), eq(investorContacts.userId, userId)));
  return true;
}

// ── 409A / Valuation History ───────────────────────────────────────────────
export async function getValuationHistory(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(valuationHistory)
    .where(eq(valuationHistory.userId, userId))
    .orderBy(valuationHistory.valuationDate);
}

export async function addValuationHistoryEntry(userId: number, data: Omit<InsertValuationHistory, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(valuationHistory).values({ ...data, userId });
  return db.select().from(valuationHistory)
    .where(eq(valuationHistory.userId, userId))
    .orderBy(valuationHistory.valuationDate);
}

export async function deleteValuationHistoryEntry(userId: number, entryId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(valuationHistory)
    .where(and(eq(valuationHistory.id, entryId), eq(valuationHistory.userId, userId)));
}

// ── COGS & Cost Calculations ───────────────────────────────────────────────
export async function getCogsCalculations(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(cogsCalculations)
    .where(eq(cogsCalculations.userId, userId))
    .orderBy(cogsCalculations.updatedAt);
}

export async function saveCogsCalculation(userId: number, data: Omit<InsertCogsCalculation, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(cogsCalculations).values({ ...data, userId });
  const inserted = await db.select().from(cogsCalculations)
    .where(eq(cogsCalculations.userId, userId))
    .orderBy(cogsCalculations.createdAt)
    .limit(1);
  // Return the last inserted row
  const all = await db.select().from(cogsCalculations).where(eq(cogsCalculations.userId, userId));
  return all[all.length - 1] ?? null;
}

export async function updateCogsCalculation(userId: number, id: number, data: Partial<Omit<InsertCogsCalculation, 'id' | 'userId' | 'createdAt'>>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(cogsCalculations)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(cogsCalculations.id, id), eq(cogsCalculations.userId, userId)));
  const result = await db.select().from(cogsCalculations)
    .where(and(eq(cogsCalculations.id, id), eq(cogsCalculations.userId, userId)))
    .limit(1);
  return result[0] ?? null;
}

export async function deleteCogsCalculation(userId: number, id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(cogsCalculations)
    .where(and(eq(cogsCalculations.id, id), eq(cogsCalculations.userId, userId)));
}

// ── Resource Submissions ───────────────────────────────────────────────────

export async function createResourceSubmission(data: InsertResourceSubmission) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(resourceSubmissions).values(data);
  const all = await db.select().from(resourceSubmissions)
    .where(data.userId ? eq(resourceSubmissions.userId, data.userId!) : eq(resourceSubmissions.submitterEmail, data.submitterEmail ?? ''))
    .orderBy(resourceSubmissions.createdAt);
  return all[all.length - 1] ?? null;
}

export async function getAllResourceSubmissions(status?: 'pending' | 'approved' | 'rejected') {
  const db = await getDb();
  if (!db) return [];
  if (status) {
    return db.select().from(resourceSubmissions).where(eq(resourceSubmissions.status, status));
  }
  return db.select().from(resourceSubmissions);
}

export async function reviewResourceSubmission(
  id: number,
  status: 'approved' | 'rejected',
  adminId: number,
  adminNote?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(resourceSubmissions)
    .set({ status, adminNote: adminNote ?? null, reviewedBy: adminId, reviewedAt: new Date(), updatedAt: new Date() })
    .where(eq(resourceSubmissions.id, id));
  const result = await db.select().from(resourceSubmissions).where(eq(resourceSubmissions.id, id)).limit(1);
  return result[0] ?? null;
}

// ── Admin Audit Log ────────────────────────────────────────────────────────

export async function addAuditLog(data: {
  adminId: number;
  adminEmail: string;
  action: string;
  targetType?: string;
  targetId?: number;
  details?: unknown;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditLog).values({
    adminId: data.adminId,
    adminEmail: data.adminEmail,
    action: data.action,
    targetType: data.targetType ?? null,
    targetId: data.targetId ?? null,
    details: data.details ?? null,
  });
}

export async function getAuditLog(limit = 100, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(auditLog)
    .orderBy(auditLog.createdAt)
    .limit(limit)
    .offset(offset);
}

// ── Platform Analytics (admin) ─────────────────────────────────────────────

export async function getPlatformStats() {
  const db = await getDb();
  if (!db) return null;
  const [totalUsers] = await db.select({ count: sql<number>`count(*)` }).from(users);
  const [vcCount] = await db.select({ count: sql<number>`count(*)` }).from(kycVcProfiles);
  const [angelCount] = await db.select({ count: sql<number>`count(*)` }).from(kycAngelProfiles);
  const [lawyerCount] = await db.select({ count: sql<number>`count(*)` }).from(kycLawyerProfiles);
  const [startupCount] = await db.select({ count: sql<number>`count(*)` }).from(kycStartupProfiles);
  const [pendingSubmissions] = await db.select({ count: sql<number>`count(*)` }).from(resourceSubmissions).where(eq(resourceSubmissions.status, 'pending'));
  const [savedValuationCount] = await db.select({ count: sql<number>`count(*)` }).from(savedValuations);
  const recentUsers = await db.select().from(users).orderBy(users.createdAt).limit(5);
  return {
    totalUsers: Number(totalUsers?.count ?? 0),
    vcCount: Number(vcCount?.count ?? 0),
    angelCount: Number(angelCount?.count ?? 0),
    lawyerCount: Number(lawyerCount?.count ?? 0),
    startupCount: Number(startupCount?.count ?? 0),
    pendingSubmissions: Number(pendingSubmissions?.count ?? 0),
    savedValuationCount: Number(savedValuationCount?.count ?? 0),
    recentUsers,
  };
}

export async function banUser(userId: number, banned: boolean, reason?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({
    isBanned: banned,
    bannedReason: banned ? (reason ?? null) : null,
  }).where(eq(users.id, userId));
}

export async function getAllSavedValuations(limit = 100, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      id: savedValuations.id,
      userId: savedValuations.userId,
      label: savedValuations.label,
      blendedValue: savedValuations.blendedValue,
      createdAt: savedValuations.createdAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(savedValuations)
    .leftJoin(users, eq(savedValuations.userId, users.id))
    .orderBy(savedValuations.createdAt)
    .limit(limit)
    .offset(offset);
  return rows;
}

export async function getPlatformSettings(): Promise<PlatformSettings | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(platformSettings).where(eq(platformSettings.id, 1)).limit(1);
  if (rows.length > 0) return rows[0];
  // Create default row
  await db.insert(platformSettings).values({ id: 1 });
  const created = await db.select().from(platformSettings).where(eq(platformSettings.id, 1)).limit(1);
  return created[0] ?? null;
}

export async function setPlatformSettings(data: Partial<Omit<PlatformSettings, 'id' | 'updatedAt'>>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Ensure row exists
  const existing = await db.select({ id: platformSettings.id }).from(platformSettings).where(eq(platformSettings.id, 1)).limit(1);
  if (existing.length === 0) {
    await db.insert(platformSettings).values({ id: 1, ...data });
  } else {
    await db.update(platformSettings).set(data).where(eq(platformSettings.id, 1));
  }
}

export async function deleteUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(users).where(eq(users.id, userId));
}

export async function getUsersWithStats(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).limit(limit).offset(offset);
}

// ── Admin Resource Database CRUD ──────────────────────────────────────────

export async function adminGetAllVcFirms() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(vcFirms).orderBy(vcFirms.createdAt);
}

export async function adminDeleteVcFirm(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(vcFirms).where(eq(vcFirms.id, id));
}

export async function adminUpdateVcFirm(id: number, data: Partial<Omit<typeof vcFirms.$inferInsert, 'id' | 'createdAt'>>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(vcFirms).set(data).where(eq(vcFirms.id, id));
}

export async function adminCreateVcFirm(data: Omit<typeof vcFirms.$inferInsert, 'id' | 'createdAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(vcFirms).values(data);
}

export async function adminGetAllAngelInvestors() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(angelInvestors).orderBy(angelInvestors.createdAt);
}

export async function adminDeleteAngelInvestor(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(angelInvestors).where(eq(angelInvestors.id, id));
}

export async function adminUpdateAngelInvestor(id: number, data: Partial<Omit<typeof angelInvestors.$inferInsert, 'id' | 'createdAt'>>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(angelInvestors).set(data).where(eq(angelInvestors.id, id));
}

export async function adminCreateAngelInvestor(data: Omit<typeof angelInvestors.$inferInsert, 'id' | 'createdAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(angelInvestors).values(data);
}

export async function adminGetAllGrants() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(grants).orderBy(grants.createdAt);
}

export async function adminDeleteGrant(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(grants).where(eq(grants.id, id));
}

export async function adminUpdateGrant(id: number, data: Partial<Omit<typeof grants.$inferInsert, 'id' | 'createdAt'>>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(grants).set(data).where(eq(grants.id, id));
}

export async function adminCreateGrant(data: Omit<typeof grants.$inferInsert, 'id' | 'createdAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(grants).values(data);
}

export async function adminGetAllVentureLawyers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(ventureLawyers).orderBy(ventureLawyers.createdAt);
}

export async function adminDeleteVentureLawyer(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(ventureLawyers).where(eq(ventureLawyers.id, id));
}

export async function adminUpdateVentureLawyer(id: number, data: Partial<Omit<typeof ventureLawyers.$inferInsert, 'id' | 'createdAt'>>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(ventureLawyers).set(data).where(eq(ventureLawyers.id, id));
}

export async function adminCreateVentureLawyer(data: Omit<typeof ventureLawyers.$inferInsert, 'id' | 'createdAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(ventureLawyers).values(data);
}
