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
  // ── Platform Stats (dashboard overview) ──────────────────────────────────
  getStats: adminProcedure.query(async () => {
    return db.getPlatformStats();
  }),

  // ── Audit Log ─────────────────────────────────────────────────────────────
  getAuditLog: adminProcedure
    .input(z.object({
      limit: z.number().int().min(1).max(500).default(100),
      offset: z.number().int().min(0).default(0),
    }))
    .query(async ({ input }) => {
      return db.getAuditLog(input.limit, input.offset);
    }),

  // ── User Management ───────────────────────────────────────────────────────
  getUsers: adminProcedure
    .input(z.object({
      limit: z.number().int().min(1).max(200).default(50),
      offset: z.number().int().min(0).default(0),
    }))
    .query(async ({ input }) => {
      const allUsers = await db.getUsersWithStats(input.limit, input.offset);
      return allUsers.map(({ passwordHash: _ph, ...safe }) => safe);
    }),

  setUserRole: adminProcedure
    .input(z.object({
      userId: z.number().int().positive(),
      role: z.enum(["user", "admin"]),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.setUserRole(input.userId, input.role);
      await db.addAuditLog({
        adminId: ctx.user.id,
        adminEmail: ctx.user.email,
        action: "set_user_role",
        targetType: "user",
        targetId: input.userId,
        details: { role: input.role },
      });
      return { success: true };
    }),

  deleteUser: adminProcedure
    .input(z.object({ userId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await db.deleteUser(input.userId);
      await db.addAuditLog({
        adminId: ctx.user.id,
        adminEmail: ctx.user.email,
        action: "delete_user",
        targetType: "user",
        targetId: input.userId,
      });
      return { success: true };
    }),

  // ── KYC Management ────────────────────────────────────────────────────────
  getKycSubmissions: adminProcedure.query(async () => {
    return db.getAllKycSubmissions();
  }),

  verifyKyc: adminProcedure
    .input(z.object({
      type: z.enum(["vc", "angel", "lawyer", "startup"]),
      id: z.number().int().positive(),
      verified: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.verifyKycSubmission(input.type, input.id, input.verified);
      await db.addAuditLog({
        adminId: ctx.user.id,
        adminEmail: ctx.user.email,
        action: input.verified ? "verify_kyc" : "unverify_kyc",
        targetType: `kyc_${input.type}`,
        targetId: input.id,
      });
      return { success: true };
    }),

  setPublicStatus: adminProcedure
    .input(z.object({
      type: z.enum(["vc", "angel", "lawyer", "startup"]),
      id: z.number().int().positive(),
      isPublic: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.setKycPublicStatus(input.type, input.id, input.isPublic);
      await db.addAuditLog({
        adminId: ctx.user.id,
        adminEmail: ctx.user.email,
        action: input.isPublic ? "set_public" : "set_private",
        targetType: `kyc_${input.type}`,
        targetId: input.id,
      });
      return { success: true };
    }),

  // ── Resource Submissions (self-registration) ──────────────────────────────
  getResourceSubmissions: adminProcedure
    .input(z.object({
      status: z.enum(["pending", "approved", "rejected"]).optional(),
    }))
    .query(async ({ input }) => {
      return db.getAllResourceSubmissions(input.status);
    }),

  reviewResourceSubmission: adminProcedure
    .input(z.object({
      id: z.number().int().positive(),
      status: z.enum(["approved", "rejected"]),
      adminNote: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await db.reviewResourceSubmission(input.id, input.status, ctx.user.id, input.adminNote);
      await db.addAuditLog({
        adminId: ctx.user.id,
        adminEmail: ctx.user.email,
        action: `${input.status}_resource_submission`,
        targetType: "resource_submission",
        targetId: input.id,
        details: { adminNote: input.adminNote },
      });
      return result;
    }),
});
