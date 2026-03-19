import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { VC_FIRMS_DATA, ANGEL_INVESTORS_DATA, GRANTS_DATA, VENTURE_LAWYERS_DATA } from "./resourcesRouter";

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

  banUser: adminProcedure
    .input(z.object({
      userId: z.number().int().positive(),
      banned: z.boolean(),
      reason: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.banUser(input.userId, input.banned, input.reason);
      await db.addAuditLog({
        adminId: ctx.user.id,
        adminEmail: ctx.user.email,
        action: input.banned ? "ban_user" : "unban_user",
        targetType: "user",
        targetId: input.userId,
        details: { reason: input.reason },
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

  // ── All Saved Valuations ──────────────────────────────────────────────────
  getAllValuations: adminProcedure
    .input(z.object({
      limit: z.number().int().min(1).max(500).default(100),
      offset: z.number().int().min(0).default(0),
    }))
    .query(async ({ input }) => {
      return db.getAllSavedValuations(input.limit, input.offset);
    }),

  // ── Platform Settings ─────────────────────────────────────────────────────
  getPlatformSettings: adminProcedure.query(async () => {
    return db.getPlatformSettings();
  }),

  setPlatformSettings: adminProcedure
    .input(z.object({
      announcementText: z.string().max(500).optional().nullable(),
      announcementActive: z.boolean().optional(),
      announcementType: z.enum(['info', 'warning', 'success', 'error']).optional(),
      maintenanceMode: z.boolean().optional(),
      maintenanceMessage: z.string().max(500).optional().nullable(),
      allowNewRegistrations: z.boolean().optional(),
      featuredStartupIds: z.array(z.number().int()).optional().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.setPlatformSettings({ ...input, updatedBy: ctx.user.id });
      await db.addAuditLog({
        adminId: ctx.user.id,
        adminEmail: ctx.user.email,
        action: "update_platform_settings",
        targetType: "platform_settings",
        targetId: 1,
        details: input,
      });
      return { success: true };
    }),

  // ── Resource Database CRUD ────────────────────────────────────────────────
  getResourceDatabase: adminProcedure.query(async () => {
    // Static curated arrays are the source of truth for the ecosystem database.
    // DB tables hold user-submitted KYC entries only — merge both.
    const [dbVcs, dbAngels, dbGrantsList, dbLawyers] = await Promise.all([
      db.adminGetAllVcFirms(),
      db.adminGetAllAngelInvestors(),
      db.adminGetAllGrants(),
      db.adminGetAllVentureLawyers(),
    ]);
    const staticVcIds = new Set(VC_FIRMS_DATA.map(v => v.id));
    const staticAngelIds = new Set(ANGEL_INVESTORS_DATA.map(a => a.id));
    const staticGrantIds = new Set(GRANTS_DATA.map(g => g.id));
    const staticLawyerIds = new Set(VENTURE_LAWYERS_DATA.map(l => l.id));
    return {
      vcs: [
        ...VC_FIRMS_DATA.map(v => ({ ...v, source: 'curated' })),
        ...dbVcs.filter(v => !staticVcIds.has(v.id as number)).map(v => ({ ...v, source: 'user' })),
      ],
      angels: [
        ...ANGEL_INVESTORS_DATA.map(a => ({ ...a, source: 'curated' })),
        ...dbAngels.filter(a => !staticAngelIds.has(a.id as number)).map(a => ({ ...a, source: 'user' })),
      ],
      grants: [
        ...GRANTS_DATA.map(g => ({ ...g, source: 'curated' })),
        ...dbGrantsList.filter(g => !staticGrantIds.has(g.id as number)).map(g => ({ ...g, source: 'user' })),
      ],
      lawyers: [
        ...VENTURE_LAWYERS_DATA.map(l => ({ ...l, source: 'curated' })),
        ...dbLawyers.filter(l => !staticLawyerIds.has(l.id as number)).map(l => ({ ...l, source: 'user' })),
      ],
    };
  }),

  deleteVC: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await db.adminDeleteVcFirm(input.id);
      await db.addAuditLog({ adminId: ctx.user.id, adminEmail: ctx.user.email, action: 'delete_vc', targetType: 'vc_firm', targetId: input.id });
      return { success: true };
    }),

  deleteAngel: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await db.adminDeleteAngelInvestor(input.id);
      await db.addAuditLog({ adminId: ctx.user.id, adminEmail: ctx.user.email, action: 'delete_angel', targetType: 'angel_investor', targetId: input.id });
      return { success: true };
    }),

  deleteGrant: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await db.adminDeleteGrant(input.id);
      await db.addAuditLog({ adminId: ctx.user.id, adminEmail: ctx.user.email, action: 'delete_grant', targetType: 'grant', targetId: input.id });
      return { success: true };
    }),

  deleteLawyer: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await db.adminDeleteVentureLawyer(input.id);
      await db.addAuditLog({ adminId: ctx.user.id, adminEmail: ctx.user.email, action: 'delete_lawyer', targetType: 'venture_lawyer', targetId: input.id });
      return { success: true };
    }),

  updateVC: adminProcedure
    .input(z.object({
      id: z.number().int().positive(),
      name: z.string().min(1).max(256).optional(),
      description: z.string().optional().nullable(),
      website: z.string().optional().nullable(),
      hqCity: z.string().optional().nullable(),
      hqCountry: z.string().optional().nullable(),
      checkSizeMin: z.number().optional().nullable(),
      checkSizeMax: z.number().optional().nullable(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await db.adminUpdateVcFirm(id, data);
      await db.addAuditLog({ adminId: ctx.user.id, adminEmail: ctx.user.email, action: 'update_vc', targetType: 'vc_firm', targetId: id, details: data });
      return { success: true };
    }),

  updateAngel: adminProcedure
    .input(z.object({
      id: z.number().int().positive(),
      name: z.string().min(1).max(256).optional(),
      bio: z.string().optional().nullable(),
      location: z.string().optional().nullable(),
      checkSizeMin: z.number().optional().nullable(),
      checkSizeMax: z.number().optional().nullable(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await db.adminUpdateAngelInvestor(id, data);
      await db.addAuditLog({ adminId: ctx.user.id, adminEmail: ctx.user.email, action: 'update_angel', targetType: 'angel_investor', targetId: id, details: data });
      return { success: true };
    }),

  updateGrant: adminProcedure
    .input(z.object({
      id: z.number().int().positive(),
      name: z.string().min(1).max(256).optional(),
      provider: z.string().optional(),
      description: z.string().optional().nullable(),
      amountMin: z.number().optional().nullable(),
      amountMax: z.number().optional().nullable(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await db.adminUpdateGrant(id, data);
      await db.addAuditLog({ adminId: ctx.user.id, adminEmail: ctx.user.email, action: 'update_grant', targetType: 'grant', targetId: id, details: data });
      return { success: true };
    }),

  updateLawyer: adminProcedure
    .input(z.object({
      id: z.number().int().positive(),
      name: z.string().min(1).max(256).optional(),
      firm: z.string().optional().nullable(),
      bio: z.string().optional().nullable(),
      location: z.string().optional().nullable(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await db.adminUpdateVentureLawyer(id, data);
      await db.addAuditLog({ adminId: ctx.user.id, adminEmail: ctx.user.email, action: 'update_lawyer', targetType: 'venture_lawyer', targetId: id, details: data });
      return { success: true };
    }),
});
