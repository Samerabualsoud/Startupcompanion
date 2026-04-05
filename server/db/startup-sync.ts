/**
 * Unified Startup Data Synchronization Layer
 * 
 * This module provides a single source of truth for all startup data
 * by aggregating data from multiple tables and ensuring consistency
 * across all tools and components.
 */

import { startupProfiles, toolStates } from '../../drizzle/schema';
import { drizzle } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';

let _db: ReturnType<typeof drizzle> | null = null;

async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn('[Database] Failed to connect:', error);
      _db = null;
    }
  }
  return _db;
}

export interface UnifiedStartupData {
  // Company Profile
  id: number;
  userId: number;
  companyName: string;
  tagline?: string;
  description?: string;
  sector?: string;
  stage?: string;
  country?: string;
  city?: string;
  
  // Cap Table / Equity
  cofounders: Array<{
    id: string;
    name: string;
    email?: string;
    type: 'founder' | 'investor' | 'employee' | 'advisor';
    ownership: number; // percentage
    shares?: number;
    color?: string;
  }>;
  
  // Financial Metrics
  currentARR?: number;
  monthlyBurnRate?: number;
  cashOnHand?: number;
  totalRaised?: number;
  runwayMonths?: number;
  
  // Valuation
  latestValuation?: number;
  valuationDate?: Date;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get unified startup data for a user
 * Aggregates data from startupProfiles and toolStates
 */
export async function getUnifiedStartupData(userId: number): Promise<UnifiedStartupData | null> {
  const db = await getDb();
  if (!db) return null;
  
  // Get startup profile
  const profile = await db
    .select()
    .from(startupProfiles)
    .where(eq(startupProfiles.userId, userId))
    .limit(1);

  if (!profile || profile.length === 0) {
    return null;
  }

  const startup = profile[0];

  // Get equity split data from toolStates
  const equityToolState = await (await getDb())!
    .select()
    .from(toolStates)
    .where(
      eq(toolStates.userId, userId)
    )
    .limit(1);

  let cofounders: UnifiedStartupData['cofounders'] = [];
  
  if (equityToolState && equityToolState.length > 0) {
    const state = equityToolState[0].state as any;
    if (state && typeof state === 'object') {
      const cofoundersList = (state as any).cofounders;
      if (Array.isArray(cofoundersList)) {
        cofounders = cofoundersList.map((cf: any) => ({
          id: cf.id || `cofounder-${Math.random()}`,
          name: cf.name,
          email: cf.email,
          type: 'founder' as const,
          ownership: cf.ownership || 0,
          shares: cf.shares,
          color: cf.color,
        }));
      }
    }
  }

  return {
    id: startup.id,
    userId: startup.userId,
    companyName: startup.name || '',
    tagline: startup.tagline || undefined,
    description: startup.description || undefined,
    sector: startup.sector || undefined,
    stage: startup.stage || undefined,
    country: startup.country || undefined,
    city: startup.city || undefined,
    cofounders,
    currentARR: startup.currentARR || undefined,
    monthlyBurnRate: startup.monthlyBurnRate || undefined,
    cashOnHand: startup.cashOnHand || undefined,
    totalRaised: startup.totalRaised || undefined,
    latestValuation: undefined, // TODO: fetch from valuationHistory
    createdAt: startup.createdAt,
    updatedAt: startup.updatedAt,
  };
}

/**
 * Update unified startup data
 * Ensures consistency across all data sources
 */
export async function updateUnifiedStartupData(
  userId: number,
  updates: Partial<UnifiedStartupData>
): Promise<UnifiedStartupData | null> {
  const db = await getDb();
  if (!db) return null;
  
  // Update startup profile
  if (updates.companyName || updates.tagline || updates.description || updates.sector || updates.stage) {
    await db
      .update(startupProfiles)
      .set({
        name: updates.companyName,
        tagline: updates.tagline,
        description: updates.description,
        sector: updates.sector,
        stage: updates.stage as any,
      })
      .where(eq(startupProfiles.userId, userId));
  }

  // Update equity split in toolStates
  if (updates.cofounders && updates.cofounders.length > 0) {
    const existingState = await (await getDb())!
      .select()
      .from(toolStates)
      .where(eq(toolStates.userId, userId))
      .limit(1);

    const newState = {
      cofounders: updates.cofounders.map(cf => ({
        id: cf.id,
        name: cf.name,
        email: cf.email,
        ownership: cf.ownership,
        shares: cf.shares,
        color: cf.color,
      })),
    };

    if (existingState && existingState.length > 0) {
      await (await getDb())!
        .update(toolStates)
        .set({ state: newState })
        .where(eq(toolStates.userId, userId));
    } else {
      await (await getDb())!.insert(toolStates).values({
        userId,
        toolKey: 'equity_split',
        state: newState,
      });
    }
  }

  // Return updated data
  return getUnifiedStartupData(userId);
}

/**
 * Sync cap table with unified startup data
 * Used by CapTableManager to read/write data
 */
export async function syncCapTableWithStartup(userId: number): Promise<{
  companyName: string;
  shareholders: Array<{
    id: string;
    name: string;
    email?: string;
    type: string;
    shares: number;
    ownership: number;
  }>;
}> {
  const unified = await getUnifiedStartupData(userId);
  
  if (!unified) {
    return {
      companyName: '',
      shareholders: [],
    };
  }

  return {
    companyName: unified.companyName,
    shareholders: unified.cofounders.map(cf => ({
      id: cf.id,
      name: cf.name,
      email: cf.email,
      type: cf.type,
      shares: cf.shares || 0,
      ownership: cf.ownership,
    })),
  };
}
