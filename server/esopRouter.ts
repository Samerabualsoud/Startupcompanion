/**
 * ESOP Router — save/load ESOP plans to/from the database
 */
import { z } from 'zod';
import { router, protectedProcedure } from './_core/trpc';
import { getDb } from './db';
import { esopPlans } from '../drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';

const grantSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  shares: z.number(),
  vestingMonths: z.number(),
  cliffMonths: z.number(),
  startDate: z.string(),
  grantDate: z.string().optional(),
  strikePrice: z.number().optional(),
});

const esopPlanInput = z.object({
  id: z.number().optional(),
  label: z.string().default('ESOP Plan'),
  totalShares: z.number(),
  currentOptionPool: z.number(),
  pricePerShare: z.number(),
  vestingMonths: z.number(),
  cliffMonths: z.number(),
  grants: z.array(grantSchema).default([]),
});

export const esopRouter = router({
  // ── Save / upsert ────────────────────────────────────────────────────────
  save: protectedProcedure
    .input(esopPlanInput)
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const { id, ...data } = input;

      if (id) {
        // Update existing
        await db.update(esopPlans)
          .set({ ...data, grants: data.grants as any, updatedAt: new Date() })
          .where(and(eq(esopPlans.id, id), eq(esopPlans.userId, ctx.user.id)));
        const [updated] = await db.select().from(esopPlans)
          .where(eq(esopPlans.id, id)).limit(1);
        return updated;
      } else {
        // Insert new
        const [result] = await db.insert(esopPlans).values({
          userId: ctx.user.id,
          ...data,
          grants: data.grants as any,
        });
        const [inserted] = await db.select().from(esopPlans)
          .where(eq(esopPlans.id, (result as any).insertId)).limit(1);
        return inserted;
      }
    }),

  // ── Get active plan ──────────────────────────────────────────────────────
  getActive: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    const [plan] = await db.select().from(esopPlans)
      .where(and(eq(esopPlans.userId, ctx.user.id), eq(esopPlans.isActive, true)))
      .orderBy(desc(esopPlans.updatedAt))
      .limit(1);
    return plan ?? null;
  }),

  // ── List all plans ───────────────────────────────────────────────────────
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(esopPlans)
      .where(eq(esopPlans.userId, ctx.user.id))
      .orderBy(desc(esopPlans.updatedAt));
  }),

  // ── Delete ───────────────────────────────────────────────────────────────
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
