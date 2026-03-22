import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import { startupProfiles } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { getDb } from "./db";
import { storagePut } from "./storage";
import { TRPCError } from "@trpc/server";
import { randomBytes } from "crypto";

/**
 * Generate a URL-safe slug from company name
 */
function generateSlug(companyName: string): string {
  return companyName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

/**
 * Generate a unique slug by appending a random suffix if needed
 */
async function generateUniqueSlug(companyName: string): Promise<string> {
  let slug = generateSlug(companyName);
  let attempts = 0;
  const maxAttempts = 10;
  const database = await getDb();
  if (!database) throw new Error("Database not available");

  while (attempts < maxAttempts) {
    const existing = await database.select().from(startupProfiles).where(eq(startupProfiles.publicProfileSlug, slug)).limit(1);

    if (existing.length === 0) {
      return slug;
    }

    slug = `${generateSlug(companyName)}-${randomBytes(3).toString("hex")}`;
    attempts++;
  }

  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "Failed to generate unique profile slug",
  });
}

export const publicProfileRouter = router({
  /**
   * Get the current user's public profile settings
   */
  getMyProfile: protectedProcedure.query(async ({ ctx }) => {
    const database = await getDb();
    if (!database) throw new Error("Database not available");

    const profiles = await database.select().from(startupProfiles).where(eq(startupProfiles.userId, ctx.user.id)).limit(1);
    const profile = profiles[0];

    if (!profile) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Startup profile not found",
      });
    }

    return {
      id: profile.id,
      name: profile.name,
      tagline: profile.tagline,
      description: profile.description,
      logoUrl: profile.logoUrl,
      stage: profile.stage,
      sector: profile.sector,
      country: profile.country,
      city: profile.city,
      currentARR: profile.currentARR,
      totalRaised: profile.totalRaised,
      targetRaise: profile.targetRaise,
      problem: profile.problem,
      solution: profile.solution,
      businessModel: profile.businessModel,
      // Public profile fields
      isPublicProfilePublished: profile.isPublicProfilePublished,
      publicProfileSlug: profile.publicProfileSlug,
      publicProfileLogoUrl: profile.publicProfileLogoUrl,
      publicProfileBio: profile.publicProfileBio,
      publicProfileHighlights: profile.publicProfileHighlights,
      publicProfileContactEmail: profile.publicProfileContactEmail,
      publicProfileInvestorNote: profile.publicProfileInvestorNote,
      publicProfileAiScore: profile.publicProfileAiScore,
      publicProfileVerified: profile.publicProfileVerified,
      publicProfileViewCount: profile.publicProfileViewCount,
    };
  }),

  /**
   * Upload startup logo to S3 and return the URL
   */
  uploadLogo: protectedProcedure
    .input(
      z.object({
        fileName: z.string(),
        fileData: z.string(), // Base64 encoded file data
        mimeType: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate file size (max 5MB)
      const fileSizeInBytes = Buffer.from(input.fileData, "base64").length;
      if (fileSizeInBytes > 5 * 1024 * 1024) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Logo file must be smaller than 5MB",
        });
      }

      // Validate MIME type
      const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
      if (!allowedMimeTypes.includes(input.mimeType)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only JPEG, PNG, WebP, and SVG images are allowed",
        });
      }

      try {
        // Generate unique file key
        const fileKey = `public-profiles/${ctx.user.id}/logos/${randomBytes(8).toString("hex")}-${input.fileName}`;

        // Upload to S3
        const { url } = await storagePut(
          fileKey,
          Buffer.from(input.fileData, "base64"),
          input.mimeType
        );

        return {
          success: true,
          url,
          fileKey,
        };
      } catch (error) {
        console.error("Logo upload error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to upload logo",
        });
      }
    }),

  /**
   * Update public profile settings and publish
   */
  updatePublicProfile: protectedProcedure
    .input(
      z.object({
        publicProfileBio: z.string().max(1000).optional(),
        publicProfileLogoUrl: z.string().url().optional(),
        publicProfileLogoKey: z.string().optional(),
        publicProfileHighlights: z.array(z.string()).optional(),
        publicProfileContactEmail: z.string().email().optional(),
        publicProfileInvestorNote: z.string().max(2000).optional(),
        isPublicProfilePublished: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      const profiles = await database.select().from(startupProfiles).where(eq(startupProfiles.userId, ctx.user.id)).limit(1);
      const profile = profiles[0];

      if (!profile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Startup profile not found",
        });
      }

      // Generate slug if publishing for the first time
      let publicProfileSlug = profile.publicProfileSlug;
      if (input.isPublicProfilePublished && !publicProfileSlug) {
        publicProfileSlug = await generateUniqueSlug(profile.name);
      }

      // Update the profile
      await database
        .update(startupProfiles)
        .set({
          publicProfileBio: input.publicProfileBio ?? profile.publicProfileBio,
          publicProfileLogoUrl: input.publicProfileLogoUrl ?? profile.publicProfileLogoUrl,
          publicProfileLogoKey: input.publicProfileLogoKey ?? profile.publicProfileLogoKey,
          publicProfileHighlights: input.publicProfileHighlights ?? profile.publicProfileHighlights,
          publicProfileContactEmail: input.publicProfileContactEmail ?? profile.publicProfileContactEmail,
          publicProfileInvestorNote: input.publicProfileInvestorNote ?? profile.publicProfileInvestorNote,
          isPublicProfilePublished: input.isPublicProfilePublished ?? profile.isPublicProfilePublished,
          publicProfileSlug,
          updatedAt: new Date(),
        })
        .where(eq(startupProfiles.id, profile.id));

      return {
        success: true,
        publicProfileSlug,
        isPublicProfilePublished: input.isPublicProfilePublished ?? profile.isPublicProfilePublished,
      };
    }),

  /**
   * Get a public startup profile by slug (public endpoint)
   */
  getPublicProfile: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      const profiles = await database.select().from(startupProfiles).where(
        and(
          eq(startupProfiles.publicProfileSlug, input.slug),
          eq(startupProfiles.isPublicProfilePublished, true)
        ) as any
      ).limit(1);
      const profile = profiles[0];

      if (!profile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Public profile not found",
        });
      }

      // Increment view count
      await database
        .update(startupProfiles)
        .set({
          publicProfileViewCount: (profile.publicProfileViewCount ?? 0) + 1,
        })
        .where(eq(startupProfiles.id, profile.id));

      return {
        id: profile.id,
        name: profile.name,
        tagline: profile.tagline,
        description: profile.description,
        logoUrl: profile.logoUrl,
        publicProfileLogoUrl: profile.publicProfileLogoUrl,
        stage: profile.stage,
        sector: profile.sector,
        country: profile.country,
        city: profile.city,
        foundedYear: profile.foundedYear,
        currentARR: profile.currentARR,
        totalRaised: profile.totalRaised,
        targetRaise: profile.targetRaise,
        problem: profile.problem,
        solution: profile.solution,
        targetCustomer: profile.targetCustomer,
        businessModel: profile.businessModel,
        productStatus: profile.productStatus,
        publicProfileBio: profile.publicProfileBio,
        publicProfileHighlights: profile.publicProfileHighlights,
        publicProfileContactEmail: profile.publicProfileContactEmail,
        publicProfileInvestorNote: profile.publicProfileInvestorNote,
        publicProfileAiScore: profile.publicProfileAiScore,
        publicProfileVerified: profile.publicProfileVerified,
        publicProfileViewCount: profile.publicProfileViewCount,
        linkedinUrl: profile.linkedinUrl,
        twitterUrl: profile.twitterUrl,
        websiteUrl: profile.websiteUrl,
      };
    }),

  /**
   * List all published public profiles (directory)
   */
  listPublicProfiles: publicProcedure
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(50).default(20),
        sector: z.string().optional(),
        stage: z.string().optional(),
        country: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      // Build where clause
      const whereConditions: any[] = [eq(startupProfiles.isPublicProfilePublished, true)];

      if (input.sector) {
        whereConditions.push(eq(startupProfiles.sector, input.sector));
      }
      if (input.stage) {
        whereConditions.push(eq(startupProfiles.stage, input.stage as any));
      }
      if (input.country) {
        whereConditions.push(eq(startupProfiles.country, input.country));
      }

      const offset = (input.page - 1) * input.limit;

      const profiles = await database.select().from(startupProfiles).where(
        and(...whereConditions) as any
      ).limit(input.limit).offset(offset);

      const total = await database.select().from(startupProfiles).where(
        and(...whereConditions) as any
      );

      return {
        profiles: profiles.map((p: any) => ({
          id: p.id,
          slug: p.publicProfileSlug,
          name: p.name,
          tagline: p.tagline,
          logoUrl: p.publicProfileLogoUrl || p.logoUrl,
          stage: p.stage,
          sector: p.sector,
          country: p.country,
          city: p.city,
          currentARR: p.currentARR,
          totalRaised: p.totalRaised,
          targetRaise: p.targetRaise,
          aiScore: p.publicProfileAiScore,
          verified: p.publicProfileVerified,
          viewCount: p.publicProfileViewCount,
        })),
        pagination: {
          page: input.page,
          limit: input.limit,
          total: total.length,
          totalPages: Math.ceil(total.length / input.limit),
        },
      };
    }),

  /**
   * Get directory stats
   */
  getDirectoryStats: publicProcedure.query(async () => {
    const database = await getDb();
    if (!database) throw new Error("Database not available");

    const profiles = await database.select().from(startupProfiles).where(
      eq(startupProfiles.isPublicProfilePublished, true)
    );

    // Group by sector and stage
    const bySector: Record<string, number> = {};
    const byStage: Record<string, number> = {};
    const byCountry: Record<string, number> = {};

    profiles.forEach((p: any) => {
      if (p.sector) {
        bySector[p.sector] = (bySector[p.sector] ?? 0) + 1;
      }
      if (p.stage) {
        byStage[p.stage] = (byStage[p.stage] ?? 0) + 1;
      }
      if (p.country) {
        byCountry[p.country] = (byCountry[p.country] ?? 0) + 1;
      }
    });

    const totalFundingRaised = profiles.reduce((sum: number, p: any) => sum + (p.totalRaised ?? 0), 0);
    const totalFundingSeeking = profiles.reduce((sum: number, p: any) => sum + (p.targetRaise ?? 0), 0);

    return {
      totalProfiles: profiles.length,
      bySector,
      byStage,
      byCountry,
      totalFundingRaised,
      totalFundingSeeking,
    };
  }),
});
