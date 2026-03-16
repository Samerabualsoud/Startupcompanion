/**
 * Startup Profile Router
 * Handles CRUD for startup profiles, team members, milestones, and saved valuations
 */
import { z } from 'zod';
import { protectedProcedure, router } from './_core/trpc';
import {
  getProfileByUserId, upsertProfile, getTeamByStartupId,
  addTeamMember, updateTeamMember, deleteTeamMember,
  getSavedValuations, saveValuation, deleteSavedValuation,
  getMilestonesByStartupId, addMilestone, updateMilestone, deleteMilestone,
} from './db';

const profileInput = z.object({
  name: z.string().min(1),
  tagline: z.string().optional(),
  description: z.string().optional(),
  logoUrl: z.string().optional(),
  websiteUrl: z.string().optional(),
  pitchDeckUrl: z.string().optional(),
  sector: z.string().optional(),
  stage: z.enum(['pre-seed', 'seed', 'series-a', 'series-b', 'growth']).optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  foundedYear: z.number().optional(),
  currentARR: z.number().optional(),
  monthlyBurnRate: z.number().optional(),
  cashOnHand: z.number().optional(),
  totalRaised: z.number().optional(),
  revenueGrowthRate: z.number().optional(),
  grossMargin: z.number().optional(),
  totalAddressableMarket: z.number().optional(),
  targetRaise: z.number().optional(),
  useOfFunds: z.string().optional(),
  investorType: z.string().optional(),
  linkedinUrl: z.string().optional(),
  twitterUrl: z.string().optional(),
  isPublic: z.boolean().optional(),
});

const teamMemberInput = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  bio: z.string().optional(),
  avatarUrl: z.string().optional(),
  linkedinUrl: z.string().optional(),
  equityPercent: z.number().optional(),
  isFounder: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

export const profileRouter = router({
  // ── Profile ──────────────────────────────────────────────────────────────
  get: protectedProcedure.query(async ({ ctx }) => {
    return getProfileByUserId(ctx.user.id);
  }),

  save: protectedProcedure.input(profileInput).mutation(async ({ ctx, input }) => {
    return upsertProfile(ctx.user.id, input);
  }),

  // ── Team Members ─────────────────────────────────────────────────────────
  getTeam: protectedProcedure.query(async ({ ctx }) => {
    const profile = await getProfileByUserId(ctx.user.id);
    if (!profile) return [];
    return getTeamByStartupId(profile.id);
  }),

  addTeamMember: protectedProcedure.input(teamMemberInput).mutation(async ({ ctx, input }) => {
    const profile = await getProfileByUserId(ctx.user.id);
    if (!profile) throw new Error('Create a startup profile first');
    await addTeamMember({ ...input, startupId: profile.id });
    return getTeamByStartupId(profile.id);
  }),

  updateTeamMember: protectedProcedure
    .input(z.object({ id: z.number(), data: teamMemberInput.partial() }))
    .mutation(async ({ ctx, input }) => {
      await updateTeamMember(input.id, input.data);
      const profile = await getProfileByUserId(ctx.user.id);
      if (!profile) return [];
      return getTeamByStartupId(profile.id);
    }),

  deleteTeamMember: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await deleteTeamMember(input.id);
      const profile = await getProfileByUserId(ctx.user.id);
      if (!profile) return [];
      return getTeamByStartupId(profile.id);
    }),

  // ── Saved Valuations ─────────────────────────────────────────────────────
  getSavedValuations: protectedProcedure.query(async ({ ctx }) => {
    return getSavedValuations(ctx.user.id);
  }),

  saveValuation: protectedProcedure
    .input(z.object({
      label: z.string(),
      inputs: z.any(),
      summary: z.any(),
      chatAnswers: z.any().optional(),
      blendedValue: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const profile = await getProfileByUserId(ctx.user.id);
      await saveValuation({
        userId: ctx.user.id,
        startupId: profile?.id,
        label: input.label,
        inputs: input.inputs,
        summary: input.summary,
        chatAnswers: input.chatAnswers,
        blendedValue: input.blendedValue,
      });
      return getSavedValuations(ctx.user.id);
    }),

  deleteSavedValuation: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await deleteSavedValuation(input.id);
      return getSavedValuations(ctx.user.id);
    }),

  // ── Milestones ────────────────────────────────────────────────────────────
  getMilestones: protectedProcedure.query(async ({ ctx }) => {
    const profile = await getProfileByUserId(ctx.user.id);
    if (!profile) return [];
    return getMilestonesByStartupId(profile.id);
  }),

  addMilestone: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      targetDate: z.date().optional(),
      category: z.enum(['product', 'revenue', 'team', 'funding', 'legal', 'other']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const profile = await getProfileByUserId(ctx.user.id);
      if (!profile) throw new Error('Create a startup profile first');
      await addMilestone({ ...input, startupId: profile.id, category: input.category ?? 'other' });
      return getMilestonesByStartupId(profile.id);
    }),

  updateMilestone: protectedProcedure
    .input(z.object({
      id: z.number(),
      data: z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        targetDate: z.date().optional().nullable(),
        completedAt: z.date().optional().nullable(),
        category: z.enum(['product', 'revenue', 'team', 'funding', 'legal', 'other']).optional(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      await updateMilestone(input.id, input.data);
      const profile = await getProfileByUserId(ctx.user.id);
      if (!profile) return [];
      return getMilestonesByStartupId(profile.id);
    }),

  deleteMilestone: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await deleteMilestone(input.id);
      const profile = await getProfileByUserId(ctx.user.id);
      if (!profile) return [];
      return getMilestonesByStartupId(profile.id);
    }),
});
