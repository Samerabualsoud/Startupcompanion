import { z } from 'zod';
import { protectedProcedure, router } from './_core/trpc';
import { getDb } from './db';
import { financialProjections } from '../drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';
import {
  computeFinancialModel,
  type FinancialModelInputs,
} from '../shared/projectionEngine';

const businessModelEnum = z.enum(['saas', 'ecommerce', 'marketplace', 'agency', 'hardware', 'procurement']);
const scenarioEnum = z.enum(['bear', 'base', 'bull']);
const yearHorizonEnum = z.union([z.literal(3), z.literal(5), z.literal(10)]);

export const projectionRouter = router({
  // Save a projection (create or update)
  save: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      name: z.string().min(1).max(256),
      businessModel: businessModelEnum,
      scenario: scenarioEnum.default('base'),
      yearHorizon: yearHorizonEnum.default(3),
      modelInputs: z.any(),          // FinancialModelInputs — validated by engine
      projectionOutput: z.any(),     // FinancialModelOutput — pre-computed on client
      currency: z.string().default('USD'),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database unavailable');

      if (input.id) {
        await db.update(financialProjections)
          .set({
            name: input.name,
            businessModel: input.businessModel,
            scenario: input.scenario,
            yearHorizon: input.yearHorizon,
            modelInputs: input.modelInputs,
            projectionOutput: input.projectionOutput,
            currency: input.currency,
          })
          .where(and(eq(financialProjections.id, input.id), eq(financialProjections.userId, ctx.user.id)));
        return { id: input.id };
      } else {
        const [result] = await db.insert(financialProjections).values({
          userId: ctx.user.id,
          name: input.name,
          businessModel: input.businessModel,
          scenario: input.scenario,
          yearHorizon: input.yearHorizon,
          modelInputs: input.modelInputs,
          projectionOutput: input.projectionOutput,
          currency: input.currency,
          approach: 'bottom-up', // legacy field default
        });
        return { id: (result as any).insertId };
      }
    }),

  // List all projections for the user
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error('Database unavailable');
    return db.select({
      id: financialProjections.id,
      name: financialProjections.name,
      businessModel: financialProjections.businessModel,
      scenario: financialProjections.scenario,
      yearHorizon: financialProjections.yearHorizon,
      currency: financialProjections.currency,
      createdAt: financialProjections.createdAt,
      updatedAt: financialProjections.updatedAt,
    })
    .from(financialProjections)
    .where(eq(financialProjections.userId, ctx.user.id))
    .orderBy(desc(financialProjections.updatedAt));
  }),

  // Get a single projection with full data
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database unavailable');
      const [row] = await db.select()
        .from(financialProjections)
        .where(and(eq(financialProjections.id, input.id), eq(financialProjections.userId, ctx.user.id)));
      return row ?? null;
    }),

  // Delete a projection
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database unavailable');
      await db.delete(financialProjections)
        .where(and(eq(financialProjections.id, input.id), eq(financialProjections.userId, ctx.user.id)));
      return { success: true };
    }),
});
