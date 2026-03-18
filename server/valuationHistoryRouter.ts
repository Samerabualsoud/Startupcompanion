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
      // 1. Insert the valuation history entry
      const entries = await db.addValuationHistoryEntry(ctx.user.id, input);

      // 2. Auto-update profile cap table for priced rounds
      //    Condition: priced-round AND amountRaised AND preMoneyValuation are provided
      if (
        input.valuationType === "priced-round" &&
        input.amountRaised &&
        input.preMoneyValuation
      ) {
        const profile = await db.getProfileByUserId(ctx.user.id);
        const existingShares = profile?.totalSharesOutstanding ?? 0;

        if (existingShares > 0) {
          // newShares = amountRaised / (preMoneyValuation / existingShares)
          const pricePerShare = input.preMoneyValuation / existingShares;
          const newShares = Math.round(input.amountRaised / pricePerShare);
          const postRoundShares = existingShares + newShares;
          const postMoneyVal = input.preMoneyValuation + input.amountRaised;
          const computedSharePrice = postMoneyVal / postRoundShares;

          await db.upsertProfile(ctx.user.id, {
            ...profile,
            name: profile?.name ?? input.companyName,
            totalSharesOutstanding: postRoundShares,
            parValuePerShare: profile?.parValuePerShare ?? computedSharePrice,
          });
        } else if (input.totalShares) {
          // No existing shares in profile — seed the cap table from the form value
          const profile2 = await db.getProfileByUserId(ctx.user.id);
          await db.upsertProfile(ctx.user.id, {
            ...profile2,
            name: profile2?.name ?? input.companyName,
            totalSharesOutstanding: input.totalShares!,
          });
        }
      }

      return entries;
    }),

  // Delete a valuation history entry
  delete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await db.deleteValuationHistoryEntry(ctx.user.id, input.id);
      return { success: true };
    }),
});
