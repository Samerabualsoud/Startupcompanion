/**
 * COGS & Cost Calculator Router
 * Handles saving, loading, and deleting COGS calculations
 */
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  getCogsCalculations,
  saveCogsCalculation,
  updateCogsCalculation,
  deleteCogsCalculation,
} from "./db";

const DirectCostSchema = z.object({
  id: z.string(),
  name: z.string(),
  amount: z.number().min(0),
  type: z.enum(["fixed", "variable"]),
  perUnit: z.boolean().optional(), // if variable, is this per-unit cost?
  category: z.enum(["materials", "labor", "hosting", "payment_processing", "support", "packaging", "shipping", "licensing", "other"]).optional(),
});

const IndirectCostSchema = z.object({
  id: z.string(),
  name: z.string(),
  amount: z.number().min(0),
  category: z.enum(["sales", "marketing", "admin", "rd", "hr", "facilities", "other"]),
});

const CogsInputSchema = z.object({
  name: z.string().min(1),
  businessModel: z.enum(["saas", "ecommerce", "marketplace", "hardware", "services", "manufacturing", "other"]),
  currency: z.string().default("USD"),
  revenuePerUnit: z.number().min(0),
  unitsPerMonth: z.number().min(0),
  directCostsJson: z.array(DirectCostSchema),
  indirectCostsJson: z.array(IndirectCostSchema),
  totalCOGS: z.number().optional(),
  grossProfit: z.number().optional(),
  grossMarginPct: z.number().optional(),
  totalOpEx: z.number().optional(),
  ebitda: z.number().optional(),
  breakEvenUnits: z.number().optional(),
  notes: z.string().optional(),
});

export const cogsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return getCogsCalculations(ctx.user.id);
  }),

  save: protectedProcedure
    .input(CogsInputSchema)
    .mutation(async ({ ctx, input }) => {
      return saveCogsCalculation(ctx.user.id, {
        name: input.name,
        businessModel: input.businessModel,
        currency: input.currency,
        revenuePerUnit: input.revenuePerUnit,
        unitsPerMonth: input.unitsPerMonth,
        directCostsJson: input.directCostsJson,
        indirectCostsJson: input.indirectCostsJson,
        totalCOGS: input.totalCOGS ?? null,
        grossProfit: input.grossProfit ?? null,
        grossMarginPct: input.grossMarginPct ?? null,
        totalOpEx: input.totalOpEx ?? null,
        ebitda: input.ebitda ?? null,
        breakEvenUnits: input.breakEvenUnits ?? null,
        notes: input.notes ?? null,
      });
    }),

  update: protectedProcedure
    .input(CogsInputSchema.extend({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return updateCogsCalculation(ctx.user.id, id, {
        name: data.name,
        businessModel: data.businessModel,
        currency: data.currency,
        revenuePerUnit: data.revenuePerUnit,
        unitsPerMonth: data.unitsPerMonth,
        directCostsJson: data.directCostsJson,
        indirectCostsJson: data.indirectCostsJson,
        totalCOGS: data.totalCOGS ?? null,
        grossProfit: data.grossProfit ?? null,
        grossMarginPct: data.grossMarginPct ?? null,
        totalOpEx: data.totalOpEx ?? null,
        ebitda: data.ebitda ?? null,
        breakEvenUnits: data.breakEvenUnits ?? null,
        notes: data.notes ?? null,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await deleteCogsCalculation(ctx.user.id, input.id);
      return { success: true };
    }),
});
