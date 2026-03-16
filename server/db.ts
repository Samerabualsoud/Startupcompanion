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
