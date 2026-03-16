import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";

export const valuationHistoryRouter = router({
  // Get all valuation history entries for the current user
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return db.getValuationHistory(ctx.user.id);
  }),

  // Add a new valuation history entry
  add: protectedProcedure
    .input(
      z.object({
        companyName: z.string().min(1).max(256),
        valuationDate: z.date(),
        valuationType: z.enum(["409a", "priced-round", "safe", "convertible-note", "internal", "other"]).default("409a"),
        preMoneyValuation: z.number().positive().optional().nullable(),
        postMoneyValuation: z.number().positive().optional().nullable(),
        sharePrice: z.number().positive().optional().nullable(),
        totalShares: z.number().int().positive().optional().nullable(),
        stage: z.string().max(64).optional().nullable(),
        roundName: z.string().max(128).optional().nullable(),
        amountRaised: z.number().positive().optional().nullable(),
        leadInvestor: z.string().max(256).optional().nullable(),
        notes: z.string().optional().nullable(),
        methodology: z.string().max(256).optional().nullable(),
        provider: z.string().max(256).optional().nullable(),
        isPublic: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return db.addValuationHistoryEntry(ctx.user.id, input);
    }),

  // Delete a valuation history entry
  delete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await db.deleteValuationHistoryEntry(ctx.user.id, input.id);
      return { success: true };
    }),
});
