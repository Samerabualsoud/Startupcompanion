import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";

// ── Matching Score Algorithm ──────────────────────────────────────────────
// Scores 0-100 based on sector, stage, region, and check size overlap

function scoreMatch(
  startup: {
    sector?: string | null;
    stage?: string | null;
    country?: string | null;
    targetRaise?: number | null;
  },
  investor: {
    sectors?: unknown;
    stages?: unknown;
    regions?: unknown;
    checkSizeMin?: number | null;
    checkSizeMax?: number | null;
  }
): number {
  let score = 0;
  const sectors = (investor.sectors as string[]) ?? [];
  const stages = (investor.stages as string[]) ?? [];
  const regions = (investor.regions as string[]) ?? [];

  // Sector match (35 pts)
  if (startup.sector && sectors.length > 0) {
    const sectorLower = startup.sector.toLowerCase();
    const match = sectors.some(s =>
      s.toLowerCase().includes(sectorLower) ||
      sectorLower.includes(s.toLowerCase())
    );
    if (match) score += 35;
    else if (sectors.includes("Any") || sectors.includes("All")) score += 20;
  } else {
    score += 15; // Partial credit when no filter set
  }

  // Stage match (30 pts)
  if (startup.stage && stages.length > 0) {
    const stageMap: Record<string, string[]> = {
      "idea": ["Pre-Seed", "Idea"],
      "pre-seed": ["Pre-Seed", "Idea", "Seed"],
      "seed": ["Seed", "Pre-Seed"],
      "series-a": ["Series A", "Seed"],
      "series-b": ["Series B", "Series A"],
      "growth": ["Series B", "Growth", "Late Stage"],
    };
    const compatible = stageMap[startup.stage] ?? [];
    const match = stages.some(s => compatible.some(c => s.toLowerCase().includes(c.toLowerCase())));
    if (match) score += 30;
    else if (stages.includes("Any Stage") || stages.includes("All Stages")) score += 20;
  } else {
    score += 15;
  }

  // Region match (20 pts)
  if (startup.country && regions.length > 0) {
    const countryLower = startup.country.toLowerCase();
    const regionMap: Record<string, string[]> = {
      "usa": ["north america", "global", "us"],
      "united states": ["north america", "global", "us"],
      "uk": ["europe", "global", "uk"],
      "united kingdom": ["europe", "global", "uk"],
      "germany": ["europe", "global", "dach"],
      "france": ["europe", "global"],
      "uae": ["mena", "global", "middle east"],
      "saudi arabia": ["mena", "global", "middle east"],
      "india": ["asia", "global", "south asia"],
      "nigeria": ["africa", "global", "west africa"],
      "kenya": ["africa", "global", "east africa"],
      "brazil": ["latin america", "global", "south america"],
    };
    const compatibleRegions = regionMap[countryLower] ?? [countryLower];
    const match = regions.some(r =>
      compatibleRegions.some(cr => r.toLowerCase().includes(cr)) ||
      r.toLowerCase() === "global" ||
      r.toLowerCase() === "worldwide"
    );
    if (match) score += 20;
    else score += 5;
  } else {
    score += 10;
  }

  // Check size match (15 pts)
  if (startup.targetRaise && (investor.checkSizeMin || investor.checkSizeMax)) {
    const min = investor.checkSizeMin ?? 0;
    const max = investor.checkSizeMax ?? Infinity;
    if (startup.targetRaise >= min && startup.targetRaise <= max) {
      score += 15;
    } else if (startup.targetRaise >= min * 0.5 && startup.targetRaise <= max * 2) {
      score += 8; // Close range
    }
  } else {
    score += 8;
  }

  return Math.min(100, score);
}

export const matchingRouter = router({
  // ── Match startups with investors ─────────────────────────────────────────
  findMatches: publicProcedure
    .input(z.object({
      sector: z.string().optional(),
      stage: z.string().optional(),
      country: z.string().optional(),
      targetRaise: z.number().optional(),
      investorTypes: z.array(z.enum(["vc", "angel"])).default(["vc", "angel"]),
      limit: z.number().int().min(1).max(50).default(20),
    }))
    .query(async ({ input }) => {
      const startup = {
        sector: input.sector,
        stage: input.stage,
        country: input.country,
        targetRaise: input.targetRaise,
      };

      const results: Array<{
        id: number;
        type: "vc" | "angel";
        name: string;
        description?: string | null;
        location?: string | null;
        sectors?: unknown;
        stages?: unknown;
        regions?: unknown;
        checkSizeMin?: number | null;
        checkSizeMax?: number | null;
        website?: string | null;
        applyUrl?: string | null;
        linkedinUrl?: string | null;
        notablePortfolio?: unknown;
        score: number;
        matchReasons: string[];
        isCommunity: boolean;
      }> = [];

      // Score VCs
      if (input.investorTypes.includes("vc")) {
        const vcs = await db.getVcFirms();
        const communityVcs = await db.getPublicKycVcProfiles();

        for (const vc of vcs) {
          const score = scoreMatch(startup, vc);
          if (score >= 30) {
            const reasons: string[] = [];
            if (score >= 80) reasons.push("Excellent match");
            else if (score >= 60) reasons.push("Strong match");
            else reasons.push("Partial match");
            if (vc.sectors && (vc.sectors as string[]).some(s => s.toLowerCase().includes((input.sector ?? "").toLowerCase()))) {
              reasons.push(`Invests in ${input.sector}`);
            }
            if (vc.stages && (vc.stages as string[]).some(s => s.toLowerCase().includes(input.stage ?? ""))) {
              reasons.push(`Funds ${input.stage} stage`);
            }
            results.push({
              id: vc.id,
              type: "vc",
              name: vc.name,
              description: vc.description,
              location: vc.hqCity ? `${vc.hqCity}, ${vc.hqCountry}` : vc.hqCountry,
              sectors: vc.sectors,
              stages: vc.stages,
              regions: vc.regions,
              checkSizeMin: vc.checkSizeMin,
              checkSizeMax: vc.checkSizeMax,
              website: vc.website,
              applyUrl: vc.applyUrl,
              linkedinUrl: vc.linkedinUrl,
              notablePortfolio: vc.notablePortfolio,
              score,
              matchReasons: reasons,
              isCommunity: false,
            });
          }
        }

        // Also score community VC profiles
        for (const vc of communityVcs) {
          const score = scoreMatch(startup, vc);
          if (score >= 30) {
            results.push({
              id: vc.id + 100000, // Offset to avoid ID collision
              type: "vc",
              name: vc.firmName,
              description: vc.description,
              location: vc.hqCity ? `${vc.hqCity}, ${vc.hqCountry}` : vc.hqCountry,
              sectors: vc.sectors,
              stages: vc.stages,
              regions: vc.regions,
              checkSizeMin: vc.checkSizeMin,
              checkSizeMax: vc.checkSizeMax,
              website: vc.website,
              applyUrl: vc.applyUrl,
              linkedinUrl: vc.linkedinUrl,
              notablePortfolio: vc.notablePortfolio,
              score,
              matchReasons: ["Community member"],
              isCommunity: true,
            });
          }
        }
      }

      // Score Angels
      if (input.investorTypes.includes("angel")) {
        const angels = await db.getAngelInvestors();
        const communityAngels = await db.getPublicKycAngelProfiles();

        for (const angel of angels) {
          const score = scoreMatch(startup, angel);
          if (score >= 30) {
            const reasons: string[] = [];
            if (score >= 80) reasons.push("Excellent match");
            else if (score >= 60) reasons.push("Strong match");
            else reasons.push("Partial match");
            results.push({
              id: angel.id + 200000,
              type: "angel",
              name: angel.name,
              description: angel.bio,
              location: angel.location,
              sectors: angel.sectors,
              stages: angel.stages,
              regions: angel.regions,
              checkSizeMin: angel.checkSizeMin,
              checkSizeMax: angel.checkSizeMax,
              website: angel.angellistUrl,
              applyUrl: angel.linkedinUrl,
              linkedinUrl: angel.linkedinUrl,
              notablePortfolio: angel.notableInvestments,
              score,
              matchReasons: reasons,
              isCommunity: false,
            });
          }
        }

        for (const angel of communityAngels) {
          const score = scoreMatch(startup, angel);
          if (score >= 30) {
            results.push({
              id: angel.id + 300000,
              type: "angel",
              name: angel.displayName,
              description: angel.bio,
              location: angel.location,
              sectors: angel.sectors,
              stages: angel.stages,
              regions: angel.regions,
              checkSizeMin: angel.checkSizeMin,
              checkSizeMax: angel.checkSizeMax,
              website: angel.angellistUrl,
              applyUrl: angel.linkedinUrl,
              linkedinUrl: angel.linkedinUrl,
              notablePortfolio: angel.notableInvestments,
              score,
              matchReasons: ["Community member"],
              isCommunity: true,
            });
          }
        }
      }

      // Sort by score descending, limit results
      results.sort((a, b) => b.score - a.score);
      return results.slice(0, input.limit);
    }),

  // ── Get match for the logged-in startup user ──────────────────────────────
  getMyMatches: protectedProcedure
    .input(z.object({
      limit: z.number().int().min(1).max(50).default(20),
    }))
    .query(async ({ ctx, input }) => {
      const kycProfile = await db.getKycStartupProfile(ctx.user.id);
      if (!kycProfile) {
        return { matches: [], hasProfile: false };
      }
      // Re-use the public findMatches logic by calling the DB helpers directly
      const startup = {
        sector: kycProfile.sector,
        stage: kycProfile.stage,
        country: kycProfile.country,
        targetRaise: kycProfile.targetRaise,
      };

      const results: Array<{
        id: number;
        type: "vc" | "angel";
        name: string;
        description?: string | null;
        location?: string | null;
        sectors?: unknown;
        stages?: unknown;
        checkSizeMin?: number | null;
        checkSizeMax?: number | null;
        website?: string | null;
        applyUrl?: string | null;
        score: number;
        matchReasons: string[];
        isCommunity: boolean;
      }> = [];

      const [vcs, angels] = await Promise.all([
        db.getVcFirms(),
        db.getAngelInvestors(),
      ]);

      for (const vc of vcs) {
        const score = scoreMatch(startup, vc);
        if (score >= 40) {
          results.push({
            id: vc.id,
            type: "vc",
            name: vc.name,
            description: vc.description,
            location: vc.hqCity ? `${vc.hqCity}, ${vc.hqCountry}` : vc.hqCountry,
            sectors: vc.sectors,
            stages: vc.stages,
            checkSizeMin: vc.checkSizeMin,
            checkSizeMax: vc.checkSizeMax,
            website: vc.website,
            applyUrl: vc.applyUrl,
            score,
            matchReasons: score >= 80 ? ["Excellent match"] : score >= 60 ? ["Strong match"] : ["Partial match"],
            isCommunity: false,
          });
        }
      }

      for (const angel of angels) {
        const score = scoreMatch(startup, angel);
        if (score >= 40) {
          results.push({
            id: angel.id + 200000,
            type: "angel",
            name: angel.name,
            description: angel.bio,
            location: angel.location,
            sectors: angel.sectors,
            stages: angel.stages,
            checkSizeMin: angel.checkSizeMin,
            checkSizeMax: angel.checkSizeMax,
            website: angel.angellistUrl,
            applyUrl: angel.linkedinUrl,
            score,
            matchReasons: score >= 80 ? ["Excellent match"] : score >= 60 ? ["Strong match"] : ["Partial match"],
            isCommunity: false,
          });
        }
      }

      results.sort((a, b) => b.score - a.score);
      return { matches: results.slice(0, input.limit), hasProfile: true };
    }),
});
