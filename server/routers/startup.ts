/**
 * Unified Startup Data Router
 * 
 * All tools should use these procedures to read/write startup data
 * This ensures all data is synchronized across the platform
 */

import { protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { getUnifiedStartupData, updateUnifiedStartupData, syncCapTableWithStartup } from '../db/startup-sync';

export const startupRouter = {
  /**
   * Get unified startup data (used by all tools)
   */
  getUnified: protectedProcedure.query(async ({ ctx }) => {
    const data = await getUnifiedStartupData(ctx.user.id);
    return data || {
      id: 0,
      userId: ctx.user.id,
      companyName: '',
      cofounders: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }),

  /**
   * Update company profile (syncs across all tools)
   */
  updateProfile: protectedProcedure
    .input(
      z.object({
        companyName: z.string().optional(),
        tagline: z.string().optional(),
        description: z.string().optional(),
        sector: z.string().optional(),
        stage: z.string().optional(),
        country: z.string().optional(),
        city: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await updateUnifiedStartupData(ctx.user.id, input);
      return updated;
    }),

  /**
   * Update cofounders/equity (syncs to cap table)
   */
  updateCofounders: protectedProcedure
    .input(
      z.object({
        cofounders: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            email: z.string().optional(),
            ownership: z.number(),
            shares: z.number().optional(),
            color: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await updateUnifiedStartupData(ctx.user.id, {
        cofounders: input.cofounders.map(cf => ({
          ...cf,
          type: 'founder' as const,
        })),
      });
      return updated;
    }),

  /**
   * Get cap table data (used by CapTableManager)
   */
  getCapTable: protectedProcedure.query(async ({ ctx }) => {
    return syncCapTableWithStartup(ctx.user.id);
  }),

  /**
   * Update financial metrics (syncs across dashboard)
   */
  updateFinancials: protectedProcedure
    .input(
      z.object({
        currentARR: z.number().optional(),
        monthlyBurnRate: z.number().optional(),
        cashOnHand: z.number().optional(),
        totalRaised: z.number().optional(),
        runwayMonths: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await updateUnifiedStartupData(ctx.user.id, input);
      return updated;
    }),
};
