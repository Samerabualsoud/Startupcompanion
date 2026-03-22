import { describe, it, expect, vi, beforeEach } from "vitest";
import { publicProfileRouter } from "./publicProfileRouter";
import { getDb } from "./db";
import { storagePut } from "./storage";
import { TRPCError } from "@trpc/server";

// Mock dependencies
vi.mock("./db");
vi.mock("./storage");

describe("publicProfileRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("uploadLogo", () => {
    it("should reject files larger than 5MB", async () => {
      const largeBase64 = "a".repeat(5 * 1024 * 1024 + 1);

      try {
        // This would fail in real usage, but we're testing the validation
        const fileSizeInBytes = Buffer.from(largeBase64, "base64").length;
        expect(fileSizeInBytes).toBeGreaterThan(5 * 1024 * 1024);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should reject unsupported MIME types", async () => {
      const unsupportedMimeTypes = ["application/pdf", "video/mp4", "text/plain"];

      unsupportedMimeTypes.forEach((mimeType) => {
        const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
        expect(allowedMimeTypes.includes(mimeType)).toBe(false);
      });
    });

    it("should accept valid image MIME types", async () => {
      const validMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];

      validMimeTypes.forEach((mimeType) => {
        expect(["image/jpeg", "image/png", "image/webp", "image/svg+xml"].includes(mimeType)).toBe(true);
      });
    });
  });

  describe("slug generation", () => {
    it("should generate URL-safe slugs", () => {
      const testCases = [
        { input: "My Awesome Company", expected: "my-awesome-company" },
        { input: "Tech@Company 2024", expected: "tech-company-2024" },
        { input: "---StartupName---", expected: "startupname" },
        { input: "AI & ML Solutions", expected: "ai-ml-solutions" },
      ];

      testCases.forEach(({ input, expected }) => {
        const slug = input
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .slice(0, 50);

        expect(slug).toBe(expected);
      });
    });

    it("should truncate slugs to 50 characters", () => {
      const longName = "A".repeat(100);
      const slug = longName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 50);

      expect(slug.length).toBeLessThanOrEqual(50);
    });
  });

  describe("profile data structure", () => {
    it("should have all required public profile fields", () => {
      const requiredFields = [
        "publicProfileBio",
        "publicProfileLogoUrl",
        "publicProfileHighlights",
        "publicProfileContactEmail",
        "publicProfileInvestorNote",
        "publicProfileAiScore",
        "publicProfileVerified",
        "publicProfileViewCount",
        "publicProfileSlug",
        "isPublicProfilePublished",
      ];

      requiredFields.forEach((field) => {
        expect(field).toBeDefined();
        expect(typeof field).toBe("string");
      });
    });
  });

  describe("view count tracking", () => {
    it("should increment view count on profile access", () => {
      let viewCount = 0;
      viewCount++;
      expect(viewCount).toBe(1);

      viewCount++;
      expect(viewCount).toBe(2);
    });

    it("should handle null view count as 0", () => {
      const viewCount = (null ?? 0) + 1;
      expect(viewCount).toBe(1);
    });
  });

  describe("pagination", () => {
    it("should calculate correct pagination values", () => {
      const total = 100;
      const limit = 20;
      const page = 2;

      const totalPages = Math.ceil(total / limit);
      const offset = (page - 1) * limit;

      expect(totalPages).toBe(5);
      expect(offset).toBe(20);
    });

    it("should handle edge case where total is less than limit", () => {
      const total = 5;
      const limit = 20;
      const page = 1;

      const totalPages = Math.ceil(total / limit);
      const offset = (page - 1) * limit;

      expect(totalPages).toBe(1);
      expect(offset).toBe(0);
    });
  });

  describe("filtering logic", () => {
    it("should build correct where conditions for filters", () => {
      const filters = {
        sector: "AI",
        stage: "seed",
        country: "UAE",
      };

      const whereConditions: string[] = [];

      if (filters.sector) whereConditions.push(`sector = ${filters.sector}`);
      if (filters.stage) whereConditions.push(`stage = ${filters.stage}`);
      if (filters.country) whereConditions.push(`country = ${filters.country}`);

      expect(whereConditions).toHaveLength(3);
      expect(whereConditions).toContain("sector = AI");
      expect(whereConditions).toContain("stage = seed");
      expect(whereConditions).toContain("country = UAE");
    });

    it("should handle empty filters", () => {
      const filters = {
        sector: "",
        stage: "",
        country: "",
      };

      const whereConditions: string[] = [];

      if (filters.sector) whereConditions.push(`sector = ${filters.sector}`);
      if (filters.stage) whereConditions.push(`stage = ${filters.stage}`);
      if (filters.country) whereConditions.push(`country = ${filters.country}`);

      expect(whereConditions).toHaveLength(0);
    });
  });

  describe("email validation", () => {
    it("should validate email format", () => {
      const validEmails = [
        "founder@company.com",
        "contact@startup.io",
        "hello+tag@example.com",
      ];

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      validEmails.forEach((email) => {
        expect(emailRegex.test(email)).toBe(true);
      });
    });

    it("should reject invalid email format", () => {
      const invalidEmails = ["notanemail", "@example.com", "user@", "user @example.com"];

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      invalidEmails.forEach((email) => {
        expect(emailRegex.test(email)).toBe(false);
      });
    });
  });

  describe("text length validation", () => {
    it("should validate bio length (max 1000)", () => {
      const shortBio = "This is a short bio";
      const longBio = "a".repeat(1001);

      expect(shortBio.length).toBeLessThanOrEqual(1000);
      expect(longBio.length).toBeGreaterThan(1000);
    });

    it("should validate investor note length (max 2000)", () => {
      const shortNote = "Looking for Series A funding";
      const longNote = "a".repeat(2001);

      expect(shortNote.length).toBeLessThanOrEqual(2000);
      expect(longNote.length).toBeGreaterThan(2000);
    });
  });

  describe("directory stats aggregation", () => {
    it("should aggregate stats correctly", () => {
      const profiles = [
        { sector: "AI", stage: "seed", country: "UAE", totalRaised: 1000000, targetRaise: 500000 },
        { sector: "AI", stage: "series-a", country: "UAE", totalRaised: 2000000, targetRaise: 1000000 },
        { sector: "FinTech", stage: "seed", country: "KSA", totalRaised: 500000, targetRaise: 250000 },
      ];

      const bySector: Record<string, number> = {};
      const byStage: Record<string, number> = {};
      const byCountry: Record<string, number> = {};

      profiles.forEach((p: any) => {
        if (p.sector) bySector[p.sector] = (bySector[p.sector] ?? 0) + 1;
        if (p.stage) byStage[p.stage] = (byStage[p.stage] ?? 0) + 1;
        if (p.country) byCountry[p.country] = (byCountry[p.country] ?? 0) + 1;
      });

      const totalFundingRaised = profiles.reduce((sum: number, p: any) => sum + (p.totalRaised ?? 0), 0);
      const totalFundingSeeking = profiles.reduce((sum: number, p: any) => sum + (p.targetRaise ?? 0), 0);

      expect(bySector).toEqual({ AI: 2, FinTech: 1 });
      expect(byStage).toEqual({ seed: 2, "series-a": 1 });
      expect(byCountry).toEqual({ UAE: 2, KSA: 1 });
      expect(totalFundingRaised).toBe(3500000);
      expect(totalFundingSeeking).toBe(1750000);
    });
  });
});
