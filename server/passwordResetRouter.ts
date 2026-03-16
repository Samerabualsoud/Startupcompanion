import bcrypt from "bcryptjs";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "./_core/trpc";
import { notifyOwner } from "./_core/notification";
import * as db from "./db";

export const passwordResetRouter = router({
  // ── Request password reset ────────────────────────────────────────────────
  requestReset: publicProcedure
    .input(z.object({
      email: z.string().email("Please enter a valid email address"),
      origin: z.string().url().optional(),
    }))
    .mutation(async ({ input }) => {
      const user = await db.getUserByEmail(input.email);
      // Always return success to prevent email enumeration
      if (!user) {
        return { success: true };
      }

      const token = await db.createPasswordResetToken(user.id);
      const origin = input.origin ?? "https://aivalcalc-m2sxuioy.manus.space";
      const resetUrl = `${origin}/reset-password?token=${token}`;

      // Notify the owner (used as an email relay for now)
      // In production, replace with a proper email service (SendGrid, Resend, etc.)
      try {
        await notifyOwner({
          title: `Password Reset Request — ${user.email}`,
          content: `A password reset was requested for ${user.email} (ID: ${user.id}).\n\nReset link (expires in 1 hour):\n${resetUrl}\n\nIf you did not request this, ignore this message.`,
        });
      } catch {
        // Silently fail — user still gets success response
        console.warn("[PasswordReset] Could not send notification");
      }

      // In development, log the reset URL to the console for easy testing
      if (process.env.NODE_ENV === "development") {
        console.log(`[PasswordReset] Reset URL for ${user.email}: ${resetUrl}`);
      }

      return { success: true };
    }),

  // ── Verify token (used to check if token is valid before showing form) ────
  verifyToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const record = await db.getPasswordResetToken(input.token);
      if (!record) return { valid: false, reason: "Token not found" };
      if (record.usedAt) return { valid: false, reason: "Token already used" };
      if (new Date() > record.expiresAt) return { valid: false, reason: "Token expired" };
      return { valid: true };
    }),

  // ── Reset password ────────────────────────────────────────────────────────
  resetPassword: publicProcedure
    .input(z.object({
      token: z.string(),
      newPassword: z.string().min(8, "Password must be at least 8 characters"),
    }))
    .mutation(async ({ input }) => {
      const record = await db.getPasswordResetToken(input.token);
      if (!record) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid or expired reset link" });
      }
      if (record.usedAt) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This reset link has already been used" });
      }
      if (new Date() > record.expiresAt) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This reset link has expired. Please request a new one." });
      }

      const passwordHash = await bcrypt.hash(input.newPassword, 12);
      await db.updateUserPassword(record.userId, passwordHash);
      await db.markPasswordResetTokenUsed(input.token);

      return { success: true };
    }),
});
