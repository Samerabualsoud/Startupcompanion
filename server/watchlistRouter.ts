import { protectedProcedure, publicProcedure } from "./_core/trpc";
import { router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDb } from "./db";
import { savedProfiles, startupProfiles } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const watchlistRouter = router({
  /**
   * Save a startup profile to watchlist
   */
  saveProfile: protectedProcedure
    .input(z.object({ startupProfileId: z.number() }))
    .mutation(async ({ ctx, input }: any) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      // Check if already saved
      const existing = await database
        .select()
        .from(savedProfiles)
        .where(
          and(
            eq(savedProfiles.userId, ctx.user.id),
            eq(savedProfiles.startupProfileId, input.startupProfileId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Profile already saved",
        });
      }

      await database.insert(savedProfiles).values({
        userId: ctx.user.id,
        startupProfileId: input.startupProfileId,
      });

      return { success: true };
    }),

  /**
   * Remove a startup profile from watchlist
   */
  unsaveProfile: protectedProcedure
    .input(z.object({ startupProfileId: z.number() }))
    .mutation(async ({ ctx, input }: any) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      await database
        .delete(savedProfiles)
        .where(
          and(
            eq(savedProfiles.userId, ctx.user.id),
            eq(savedProfiles.startupProfileId, input.startupProfileId)
          )
        );

      return { success: true };
    }),

  /**
   * Check if a profile is saved by current user
   */
  isSaved: protectedProcedure
    .input(z.object({ startupProfileId: z.number() }))
    .query(async ({ ctx, input }: any) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      const result = await database
        .select()
        .from(savedProfiles)
        .where(
          and(
            eq(savedProfiles.userId, ctx.user.id),
            eq(savedProfiles.startupProfileId, input.startupProfileId)
          )
        )
        .limit(1);

      return result.length > 0;
    }),

  /**
   * Get all saved profiles for current user
   */
  getSavedProfiles: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        sector: z.string().optional(),
        stage: z.string().optional(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }: any) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      // Get saved profile IDs
      const saved = await database
        .select({ startupProfileId: savedProfiles.startupProfileId })
        .from(savedProfiles)
        .where(eq(savedProfiles.userId, ctx.user.id));

      const savedIds = saved.map((s) => s.startupProfileId);

      if (savedIds.length === 0) {
        return { profiles: [], total: 0 };
      }

      // Build query for profiles
      let query = database
        .select({
          id: startupProfiles.id,
          name: startupProfiles.name,
          tagline: startupProfiles.tagline,
          description: startupProfiles.description,
          publicProfileLogoUrl: startupProfiles.publicProfileLogoUrl,
          stage: startupProfiles.stage,
          sector: startupProfiles.sector,
          country: startupProfiles.country,
          city: startupProfiles.city,
          foundedYear: startupProfiles.foundedYear,
          currentARR: startupProfiles.currentARR,
          totalRaised: startupProfiles.totalRaised,
          businessModel: startupProfiles.businessModel,
          publicProfileSlug: startupProfiles.publicProfileSlug,
        })
        .from(startupProfiles)
        .where(
          and(
            eq(startupProfiles.isPublicProfilePublished, true),
            ...(savedIds.length > 0
              ? [
                  // @ts-ignore - drizzle-orm doesn't have proper inArray support in this version
                  startupProfiles.id.inArray(savedIds),
                ]
              : [])
          ) as any
        ) as any;

      // Apply filters
      if (input.search) {
        query = query.where(
          // @ts-ignore
          startupProfiles.name.like(`%${input.search}%`)
        ) as any;
      }

      if (input.sector) {
        query = query.where(
          // @ts-ignore
          eq(startupProfiles.sector, input.sector)
        ) as any;
      }

      if (input.stage) {
        query = query.where(
          // @ts-ignore
          eq(startupProfiles.stage, input.stage)
        ) as any;
      }

      const profiles = await query.limit(input.limit).offset(input.offset);

      return {
        profiles,
        total: savedIds.length,
      };
    }),

  /**
   * Get count of saved profiles
   */
  getSavedCount: protectedProcedure.query(async ({ ctx }: any) => {
    const database = await getDb();
    if (!database) throw new Error("Database not available");

    const result = await database
      .select()
      .from(savedProfiles)
      .where(eq(savedProfiles.userId, ctx.user.id));

    return result.length;
  }),
});
