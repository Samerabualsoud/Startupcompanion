import { z } from 'zod';
import { protectedProcedure, router } from './_core/trpc';
import { getDb } from './db';
import { financialProjections } from '../drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';
import {
  computeTopDown,
  computeBottomUp,
  type TopDownInputs,
  type BottomUpInputs,
  type BusinessModel,
} from '../shared/projectionEngine';

const businessModelEnum = z.enum(['saas', 'ecommerce', 'marketplace', 'agency', 'hardware', 'procurement']);

const topDownInputSchema = z.object({
  tam: z.number().min(0),
  samPct: z.number().min(0).max(100),
  somPct: z.number().min(0).max(100),
  captureY1: z.number().min(0).max(100),
  captureY2: z.number().min(0).max(100),
  captureY3: z.number().min(0).max(100),
  avgDealSize: z.number().min(0),
  currency: z.string().default('USD'),
});

const bottomUpInputSchema = z.discriminatedUnion('model', [
  z.object({
    model: z.literal('saas'),
    startingCustomers: z.number().min(0),
    newCustomersPerMonth: z.number().min(0),
    monthlyGrowthRate: z.number().min(0),
    avgMRRPerCustomer: z.number().min(0),
    monthlyChurnRate: z.number().min(0).max(100),
    expansionRevenuePct: z.number().min(0),
    currency: z.string().default('USD'),
  }),
  z.object({
    model: z.literal('ecommerce'),
    startingMonthlyOrders: z.number().min(0),
    orderGrowthRateMoM: z.number().min(0),
    avgOrderValue: z.number().min(0),
    returnRate: z.number().min(0).max(100),
    repeatPurchaseRate: z.number().min(0).max(100),
    currency: z.string().default('USD'),
  }),
  z.object({
    model: z.literal('marketplace'),
    startingMonthlyGMV: z.number().min(0),
    gmvGrowthRateMoM: z.number().min(0),
    takeRate: z.number().min(0).max(100),
    currency: z.string().default('USD'),
  }),
  z.object({
    model: z.literal('agency'),
    startingClients: z.number().min(0),
    newClientsPerMonth: z.number().min(0),
    clientGrowthRateMoM: z.number().min(0),
    avgMonthlyRetainer: z.number().min(0),
    clientChurnRateMonthly: z.number().min(0).max(100),
    projectRevenuePct: z.number().min(0),
    currency: z.string().default('USD'),
  }),
  z.object({
    model: z.literal('hardware'),
    startingMonthlyUnits: z.number().min(0),
    unitGrowthRateMoM: z.number().min(0),
    avgSellingPrice: z.number().min(0),
    cogs: z.number().min(0),
    recurringRevenuePerUnit: z.number().min(0),
    currency: z.string().default('USD'),
  }),
  z.object({
    model: z.literal('procurement'),
    startingMonthlyPVF: z.number().min(0),
    pvfGrowthRateMoM: z.number().min(0),
    takeRate: z.number().min(0).max(100),
    avgOrderValue: z.number().min(0),
    buyerRetentionRate: z.number().min(0).max(100),
    currency: z.string().default('USD'),
  }),
]);

export const projectionRouter = router({
  // Compute projection without saving (live preview)
  compute: protectedProcedure
    .input(z.object({
      businessModel: businessModelEnum,
      approach: z.enum(['top-down', 'bottom-up']),
      topDownInputs: topDownInputSchema.optional(),
      bottomUpInputs: bottomUpInputSchema.optional(),
    }))
    .mutation(({ input }) => {
      if (input.approach === 'top-down' && input.topDownInputs) {
        return computeTopDown(input.topDownInputs as TopDownInputs, input.businessModel as BusinessModel);
      }
      if (input.approach === 'bottom-up' && input.bottomUpInputs) {
        return computeBottomUp(input.bottomUpInputs as BottomUpInputs);
      }
      throw new Error('Missing inputs for the selected approach');
    }),

  // Save a projection
  save: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      name: z.string().min(1).max(256),
      businessModel: businessModelEnum,
      approach: z.enum(['top-down', 'bottom-up']),
      topDownInputs: topDownInputSchema.optional(),
      bottomUpInputs: bottomUpInputSchema.optional(),
      currency: z.string().default('USD'),
    }))
    .mutation(async ({ ctx, input }) => {
      let output: any = null;
      if (input.approach === 'top-down' && input.topDownInputs) {
        output = computeTopDown(input.topDownInputs as TopDownInputs, input.businessModel as BusinessModel);
      } else if (input.approach === 'bottom-up' && input.bottomUpInputs) {
        output = computeBottomUp(input.bottomUpInputs as BottomUpInputs);
      }

      const db = await getDb();
      if (!db) throw new Error('Database unavailable');

      if (input.id) {
        await db.update(financialProjections)
          .set({
            name: input.name,
            businessModel: input.businessModel,
            approach: input.approach,
            topDownInputs: input.topDownInputs ?? null,
            bottomUpInputs: input.bottomUpInputs ?? null,
            projectionOutput: output,
            currency: input.currency,
          })
          .where(and(eq(financialProjections.id, input.id), eq(financialProjections.userId, ctx.user.id)));
        return { id: input.id };
      } else {
        const [result] = await db.insert(financialProjections).values({
          userId: ctx.user.id,
          name: input.name,
          businessModel: input.businessModel,
          approach: input.approach,
          topDownInputs: input.topDownInputs ?? null,
          bottomUpInputs: input.bottomUpInputs ?? null,
          projectionOutput: output,
          currency: input.currency,
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
      approach: financialProjections.approach,
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
