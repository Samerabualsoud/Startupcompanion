import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
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

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// TODO: add feature queries here as your schema grows.

import { startupProfiles, teamMembers, savedValuations, milestones,
  InsertStartupProfile, InsertTeamMember, InsertSavedValuation, InsertMilestone } from "../drizzle/schema";

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
