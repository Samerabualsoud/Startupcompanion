import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";

// Admin-only middleware
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

export const adminRouter = router({
  // ── Get all KYC submissions ───────────────────────────────────────────────
  getKycSubmissions: adminProcedure.query(async () => {
    return db.getAllKycSubmissions();
  }),

  // ── Verify / unverify a KYC submission ───────────────────────────────────
  verifyKyc: adminProcedure
    .input(z.object({
      type: z.enum(["vc", "angel", "lawyer", "startup"]),
      id: z.number().int().positive(),
      verified: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      await db.verifyKycSubmission(input.type, input.id, input.verified);
      return { success: true };
    }),

  // ── Set public/private status ─────────────────────────────────────────────
  setPublicStatus: adminProcedure
    .input(z.object({
      type: z.enum(["vc", "angel", "lawyer", "startup"]),
      id: z.number().int().positive(),
      isPublic: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      await db.setKycPublicStatus(input.type, input.id, input.isPublic);
      return { success: true };
    }),

  // ── Get all users (for admin user management) ─────────────────────────────
  getUsers: adminProcedure
    .input(z.object({
      limit: z.number().int().min(1).max(200).default(50),
      offset: z.number().int().min(0).default(0),
    }))
    .query(async ({ input }) => {
      const allUsers = await db.getAllUsers(input.limit, input.offset);
      // Strip password hashes
      return allUsers.map(({ passwordHash: _ph, ...safe }) => safe);
    }),

  // ── Promote user to admin ─────────────────────────────────────────────────
  setUserRole: adminProcedure
    .input(z.object({
      userId: z.number().int().positive(),
      role: z.enum(["user", "admin"]),
    }))
    .mutation(async ({ input }) => {
      await db.setUserRole(input.userId, input.role);
      return { success: true };
    }),
});
