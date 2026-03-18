/**
 * ESOP Router — full CRUD for ESOP plans and individual grants
 *
 * Data model:
 *   esop_plans.grants  JSON array of EsopGrant objects (see grantSchema below)
 *
 * Grant lifecycle:  active → exercised | cancelled
 *
 * Vesting math (per grant):
 *   - No shares vest before cliff (cliffMonths from startDate)
 *   - After cliff: (cliffMonths / vestingMonths) * shares vest at once
 *   - Remaining shares vest monthly (1/vestingMonths per month) until fully vested
 */
import { z } from 'zod';
import { router, protectedProcedure } from './_core/trpc';
import { getDb } from './db';
import { esopPlans } from '../drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';

// ── Grant schema ─────────────────────────────────────────────────────────────
export const grantSchema = z.object({
  id: z.string(),
  // Employee info
  employeeName: z.string(),
  employeeEmail: z.string().optional().default(''),
  role: z.string(),
  department: z.string().optional().default('Engineering'),
  // Grant terms
  grantDate: z.string(),          // ISO date string
  startDate: z.string(),          // Vesting start date (ISO)
  shares: z.number().int().positive(),
  strikePrice: z.number().nonnegative(),
  vestingMonths: z.number().int().positive().default(48),
  cliffMonths: z.number().int().nonnegative().default(12),
  // Status
  status: z.enum(['active', 'exercised', 'cancelled']).default('active'),
  exercisedShares: z.number().int().nonnegative().default(0),
  // Optional notes
  notes: z.string().optional().default(''),
});
export type EsopGrant = z.infer<typeof grantSchema>;

// ── Plan input schema ────────────────────────────────────────────────────────
const esopPlanInput = z.object({
  id: z.number().optional(),
  label: z.string().default('ESOP Plan'),
  // Pool
  totalShares: z.number().int().positive(),
  currentOptionPool: z.number().int().nonnegative(),
  // Pricing
  pricePerShare: z.number().nonnegative(),   // strike price default
  fmvPerShare: z.number().nonnegative().optional(),  // 409A FMV
  // Default vesting terms
  vestingMonths: z.number().int().positive().default(48),
  cliffMonths: z.number().int().nonnegative().default(12),
  // Grants
  grants: z.array(grantSchema).default([]),
  // Metadata
  jurisdiction: z.string().default('delaware'),
  planType: z.enum(['iso', 'nso', 'rsu', 'sar']).default('iso'),
});

// ── Vesting computation helper ───────────────────────────────────────────────
function computeVestedShares(grant: EsopGrant, asOf: Date = new Date()): number {
  if (grant.status === 'cancelled') return 0;
  const start = new Date(grant.startDate);
  const monthsElapsed = Math.floor(
    (asOf.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
  );
  if (monthsElapsed < grant.cliffMonths) return 0;
  const vestedFraction = Math.min(monthsElapsed / grant.vestingMonths, 1);
  return Math.floor(grant.shares * vestedFraction);
}

// ── Pool summary helper ──────────────────────────────────────────────────────
function computePoolSummary(plan: { currentOptionPool: number; grants: EsopGrant[] | null }) {
  const grants = (plan.grants ?? []) as EsopGrant[];
  const activeGrants = grants.filter(g => g.status !== 'cancelled');
  const allocatedShares = activeGrants.reduce((s, g) => s + g.shares, 0);
  const vestedShares = activeGrants.reduce((s, g) => s + computeVestedShares(g), 0);
  const exercisedShares = activeGrants.reduce((s, g) => s + (g.exercisedShares ?? 0), 0);
  const availablePool = Math.max(0, plan.currentOptionPool - allocatedShares);
  const poolUtilizationPct = plan.currentOptionPool > 0
    ? (allocatedShares / plan.currentOptionPool) * 100
    : 0;
  return {
    totalPool: plan.currentOptionPool,
    allocatedShares,
    availablePool,
    vestedShares,
    unvestedShares: allocatedShares - vestedShares,
    exercisedShares,
    grantCount: activeGrants.length,
    poolUtilizationPct: Math.round(poolUtilizationPct * 10) / 10,
  };
}

export const esopRouter = router({
  // ── Save / upsert plan ───────────────────────────────────────────────────
  save: protectedProcedure
    .input(esopPlanInput)
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const { id, grants, ...rest } = input;

      if (id) {
        await db.update(esopPlans)
          .set({ ...rest, grants: grants as any, updatedAt: new Date() })
          .where(and(eq(esopPlans.id, id), eq(esopPlans.userId, ctx.user.id)));
        const [updated] = await db.select().from(esopPlans)
          .where(eq(esopPlans.id, id)).limit(1);
        return updated;
      } else {
        const [result] = await db.insert(esopPlans).values({
          userId: ctx.user.id,
          ...rest,
          grants: grants as any,
        });
        const [inserted] = await db.select().from(esopPlans)
          .where(eq(esopPlans.id, (result as any).insertId)).limit(1);
        return inserted;
      }
    }),

  // ── Add a single grant to the active plan ───────────────────────────────
  addGrant: protectedProcedure
    .input(z.object({ planId: z.number(), grant: grantSchema }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const [plan] = await db.select().from(esopPlans)
        .where(and(eq(esopPlans.id, input.planId), eq(esopPlans.userId, ctx.user.id)))
        .limit(1);
      if (!plan) throw new Error('Plan not found');

      const existing = (plan.grants as EsopGrant[] | null) ?? [];
      const updated = [...existing, input.grant];

      await db.update(esopPlans)
        .set({ grants: updated as any, updatedAt: new Date() })
        .where(eq(esopPlans.id, input.planId));

      return computePoolSummary({ currentOptionPool: plan.currentOptionPool, grants: updated });
    }),

  // ── Update a single grant ────────────────────────────────────────────────
  updateGrant: protectedProcedure
    .input(z.object({ planId: z.number(), grant: grantSchema }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const [plan] = await db.select().from(esopPlans)
        .where(and(eq(esopPlans.id, input.planId), eq(esopPlans.userId, ctx.user.id)))
        .limit(1);
      if (!plan) throw new Error('Plan not found');

      const existing = (plan.grants as EsopGrant[] | null) ?? [];
      const updated = existing.map(g => g.id === input.grant.id ? input.grant : g);

      await db.update(esopPlans)
        .set({ grants: updated as any, updatedAt: new Date() })
        .where(eq(esopPlans.id, input.planId));

      return computePoolSummary({ currentOptionPool: plan.currentOptionPool, grants: updated });
    }),

  // ── Cancel a grant ───────────────────────────────────────────────────────
  cancelGrant: protectedProcedure
    .input(z.object({ planId: z.number(), grantId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const [plan] = await db.select().from(esopPlans)
        .where(and(eq(esopPlans.id, input.planId), eq(esopPlans.userId, ctx.user.id)))
        .limit(1);
      if (!plan) throw new Error('Plan not found');

      const existing = (plan.grants as EsopGrant[] | null) ?? [];
      const updated = existing.map(g =>
        g.id === input.grantId ? { ...g, status: 'cancelled' as const } : g
      );

      await db.update(esopPlans)
        .set({ grants: updated as any, updatedAt: new Date() })
        .where(eq(esopPlans.id, input.planId));

      return computePoolSummary({ currentOptionPool: plan.currentOptionPool, grants: updated });
    }),

  // ── Get active plan with pool summary ───────────────────────────────────
  getActive: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    const [plan] = await db.select().from(esopPlans)
      .where(and(eq(esopPlans.userId, ctx.user.id), eq(esopPlans.isActive, true)))
      .orderBy(desc(esopPlans.updatedAt))
      .limit(1);
    if (!plan) return null;
    const summary = computePoolSummary({
      currentOptionPool: plan.currentOptionPool,
      grants: plan.grants as EsopGrant[] | null,
    });
    return { ...plan, summary };
  }),

  // ── Get pool summary for a plan ──────────────────────────────────────────
  getSummary: protectedProcedure
    .input(z.object({ planId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;
      const [plan] = await db.select().from(esopPlans)
        .where(and(eq(esopPlans.id, input.planId), eq(esopPlans.userId, ctx.user.id)))
        .limit(1);
      if (!plan) return null;
      return computePoolSummary({
        currentOptionPool: plan.currentOptionPool,
        grants: plan.grants as EsopGrant[] | null,
      });
    }),

  // ── Get vesting schedule for a specific grant ────────────────────────────
  getVestingSchedule: protectedProcedure
    .input(z.object({ planId: z.number(), grantId: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;
      const [plan] = await db.select().from(esopPlans)
        .where(and(eq(esopPlans.id, input.planId), eq(esopPlans.userId, ctx.user.id)))
        .limit(1);
      if (!plan) return null;

      const grants = (plan.grants as EsopGrant[] | null) ?? [];
      const grant = grants.find(g => g.id === input.grantId);
      if (!grant) return null;

      // Build monthly vesting schedule
      const schedule: { month: number; date: string; cumulativeVested: number; newlyVested: number; pct: number }[] = [];
      let prevVested = 0;
      for (let m = 0; m <= grant.vestingMonths; m++) {
        const asOf = new Date(grant.startDate);
        asOf.setMonth(asOf.getMonth() + m);
        const vested = computeVestedShares(grant, asOf);
        schedule.push({
          month: m,
          date: asOf.toISOString().split('T')[0],
          cumulativeVested: vested,
          newlyVested: vested - prevVested,
          pct: grant.shares > 0 ? Math.round((vested / grant.shares) * 1000) / 10 : 0,
        });
        prevVested = vested;
      }
      return { grant, schedule };
    }),

  // ── List all plans ───────────────────────────────────────────────────────
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const plans = await db.select().from(esopPlans)
      .where(eq(esopPlans.userId, ctx.user.id))
      .orderBy(desc(esopPlans.updatedAt));
    return plans.map(p => ({
      ...p,
      summary: computePoolSummary({
        currentOptionPool: p.currentOptionPool,
        grants: p.grants as EsopGrant[] | null,
      }),
    }));
  }),

  // ── Delete plan ──────────────────────────────────────────────────────────
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      await db.delete(esopPlans)
        .where(and(eq(esopPlans.id, input.id), eq(esopPlans.userId, ctx.user.id)));
      return { success: true };
    }),
});
