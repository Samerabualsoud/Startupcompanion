import { eq, and, or, like, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  users, InsertUser,
  startupProfiles, InsertStartupProfile,
  teamMembers, InsertTeamMember,
  savedValuations, InsertSavedValuation,
  milestones, InsertMilestone,
  vcFirms, angelInvestors, grants, ventureLawyers,
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
