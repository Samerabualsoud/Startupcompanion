import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";

// ── Shared sub-schemas ─────────────────────────────────────────────────────
const strArr = z.array(z.string()).default([]);

// ── KYC Router ─────────────────────────────────────────────────────────────
export const kycRouter = router({

  // Submit VC profile
  submitVcKyc: protectedProcedure
    .input(z.object({
      firmName: z.string().min(2),
      yourTitle: z.string().optional(),
      description: z.string().optional(),
      website: z.string().url().optional().or(z.literal("")),
      hqCity: z.string().optional(),
      hqCountry: z.string().optional(),
      regions: strArr,
      stages: strArr,
      sectors: strArr,
      checkSizeMin: z.number().optional(),
      checkSizeMax: z.number().optional(),
      aum: z.number().optional(),
      portfolioCount: z.number().optional(),
      notablePortfolio: strArr,
      linkedinUrl: z.string().optional(),
      twitterUrl: z.string().optional(),
      applyUrl: z.string().optional(),
      isPublic: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.upsertKycVcProfile(ctx.user.id, {
        firmName: input.firmName,
        yourTitle: input.yourTitle ?? null,
        description: input.description ?? null,
        website: input.website || null,
        hqCity: input.hqCity ?? null,
        hqCountry: input.hqCountry ?? null,
        regions: input.regions,
        stages: input.stages,
        sectors: input.sectors,
        checkSizeMin: input.checkSizeMin ?? null,
        checkSizeMax: input.checkSizeMax ?? null,
        aum: input.aum ?? null,
        portfolioCount: input.portfolioCount ?? null,
        notablePortfolio: input.notablePortfolio,
        linkedinUrl: input.linkedinUrl ?? null,
        twitterUrl: input.twitterUrl ?? null,
        applyUrl: input.applyUrl ?? null,
        isPublic: input.isPublic,
      });
      await db.setUserKycCompleted(ctx.user.id, "vc");
      return { success: true };
    }),

  // Submit Angel profile
  submitAngelKyc: protectedProcedure
    .input(z.object({
      displayName: z.string().min(2),
      title: z.string().optional(),
      bio: z.string().optional(),
      location: z.string().optional(),
      regions: strArr,
      stages: strArr,
      sectors: strArr,
      checkSizeMin: z.number().optional(),
      checkSizeMax: z.number().optional(),
      notableInvestments: strArr,
      linkedinUrl: z.string().optional(),
      twitterUrl: z.string().optional(),
      angellistUrl: z.string().optional(),
      isPublic: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.upsertKycAngelProfile(ctx.user.id, {
        displayName: input.displayName,
        title: input.title ?? null,
        bio: input.bio ?? null,
        location: input.location ?? null,
        regions: input.regions,
        stages: input.stages,
        sectors: input.sectors,
        checkSizeMin: input.checkSizeMin ?? null,
        checkSizeMax: input.checkSizeMax ?? null,
        notableInvestments: input.notableInvestments,
        linkedinUrl: input.linkedinUrl ?? null,
        twitterUrl: input.twitterUrl ?? null,
        angellistUrl: input.angellistUrl ?? null,
        isPublic: input.isPublic,
      });
      await db.setUserKycCompleted(ctx.user.id, "angel");
      return { success: true };
    }),

  // Submit Lawyer profile
  submitLawyerKyc: protectedProcedure
    .input(z.object({
      displayName: z.string().min(2),
      firmName: z.string().optional(),
      title: z.string().optional(),
      bio: z.string().optional(),
      location: z.string().optional(),
      regions: strArr,
      specializations: strArr,
      languages: strArr,
      offersFreeConsult: z.boolean().default(false),
      linkedinUrl: z.string().optional(),
      websiteUrl: z.string().optional(),
      contactEmail: z.string().email().optional().or(z.literal("")),
      isPublic: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.upsertKycLawyerProfile(ctx.user.id, {
        displayName: input.displayName,
        firmName: input.firmName ?? null,
        title: input.title ?? null,
        bio: input.bio ?? null,
        location: input.location ?? null,
        regions: input.regions,
        specializations: input.specializations,
        languages: input.languages,
        offersFreeConsult: input.offersFreeConsult,
        linkedinUrl: input.linkedinUrl ?? null,
        websiteUrl: input.websiteUrl ?? null,
        contactEmail: input.contactEmail || null,
        isPublic: input.isPublic,
      });
      await db.setUserKycCompleted(ctx.user.id, "venture_lawyer");
      return { success: true };
    }),

  // Submit Startup profile
  submitStartupKyc: protectedProcedure
    .input(z.object({
      companyName: z.string().min(2),
      tagline: z.string().optional(),
      description: z.string().optional(),
      website: z.string().optional(),
      sector: z.string().optional(),
      stage: z.enum(["idea", "pre-seed", "seed", "series-a", "series-b", "growth"]).default("idea"),
      country: z.string().optional(),
      city: z.string().optional(),
      foundedYear: z.number().optional(),
      teamSize: z.number().optional(),
      targetRaise: z.number().optional(),
      linkedinUrl: z.string().optional(),
      twitterUrl: z.string().optional(),
      isPublic: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.upsertKycStartupProfile(ctx.user.id, {
        companyName: input.companyName,
        tagline: input.tagline ?? null,
        description: input.description ?? null,
        website: input.website ?? null,
        sector: input.sector ?? null,
        stage: input.stage,
        country: input.country ?? null,
        city: input.city ?? null,
        foundedYear: input.foundedYear ?? null,
        teamSize: input.teamSize ?? null,
        targetRaise: input.targetRaise ?? null,
        linkedinUrl: input.linkedinUrl ?? null,
        twitterUrl: input.twitterUrl ?? null,
        isPublic: input.isPublic,
      });
      await db.setUserKycCompleted(ctx.user.id, "startup");
      return { success: true };
    }),

  // Skip KYC (mark as other)
  skipKyc: protectedProcedure.mutation(async ({ ctx }) => {
    await db.setUserKycCompleted(ctx.user.id, "other");
    return { success: true };
  }),

  // Get my KYC profile
  getMyProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = await db.getUserById(ctx.user.id);
    if (!user) throw new TRPCError({ code: "NOT_FOUND" });
    const userType = user.userType;
    let profile = null;
    if (userType === "vc") profile = await db.getKycVcProfile(ctx.user.id);
    else if (userType === "angel") profile = await db.getKycAngelProfile(ctx.user.id);
    else if (userType === "venture_lawyer") profile = await db.getKycLawyerProfile(ctx.user.id);
    else if (userType === "startup") profile = await db.getKycStartupProfile(ctx.user.id);
    return { userType, kycCompleted: user.kycCompleted, profile };
  }),

  // Get all public user-submitted profiles for the resource database
  getPublicProfiles: publicProcedure.query(async () => {
    const [vcs, angels, lawyers] = await Promise.all([
      db.getPublicKycVcProfiles(),
      db.getPublicKycAngelProfiles(),
      db.getPublicKycLawyerProfiles(),
    ]);
    return { vcs, angels, lawyers };
  }),
});
