import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { getSessionCookieOptions } from "./_core/cookies";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import * as db from "./db";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "fallback-dev-secret-change-in-prod"
);

async function createSessionToken(userId: number, email: string, name: string | null): Promise<string> {
  return new SignJWT({ sub: String(userId), email, name: name ?? "" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1y")
    .sign(JWT_SECRET);
}

export const authRouter = router({
  // ── Current user ──────────────────────────────────────────────────────────
  me: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) return null;
    // Return safe subset (no passwordHash)
    const { passwordHash: _ph, ...safe } = ctx.user;
    return safe;
  }),

  // ── Register ──────────────────────────────────────────────────────────────
  register: publicProcedure
    .input(z.object({
      email: z.string().email("Please enter a valid email address"),
      password: z.string().min(8, "Password must be at least 8 characters"),
      name: z.string().min(1, "Name is required").max(100),
    }))
    .mutation(async ({ input, ctx }) => {
      const existing = await db.getUserByEmail(input.email);
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An account with this email already exists",
        });
      }

      const passwordHash = await bcrypt.hash(input.password, 12);
      const user = await db.createUser({
        email: input.email,
        passwordHash,
        name: input.name,
      });

      if (!user) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create account" });
      }

      const token = await createSessionToken(user.id, user.email, user.name ?? null);
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      const { passwordHash: _ph, ...safe } = user;
      return { user: safe };
    }),

  // ── Login ─────────────────────────────────────────────────────────────────
  login: publicProcedure
    .input(z.object({
      email: z.string().email("Please enter a valid email address"),
      password: z.string().min(1, "Password is required"),
    }))
    .mutation(async ({ input, ctx }) => {
      const user = await db.getUserByEmail(input.email);
      if (!user || !user.passwordHash) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      const valid = await bcrypt.compare(input.password, user.passwordHash);
      if (!valid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      await db.updateUserLastSignedIn(user.id);

      const token = await createSessionToken(user.id, user.email, user.name ?? null);
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      const { passwordHash: _ph, ...safe } = user;
      return { user: safe };
    }),

  // ── Logout ────────────────────────────────────────────────────────────────
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),

  // ── Update profile ────────────────────────────────────────────────────────
  updateProfile: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(100).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (input.name) {
        await db.updateUserName(ctx.user.id, input.name);
      }
      const updated = await db.getUserById(ctx.user.id);
      if (!updated) throw new TRPCError({ code: "NOT_FOUND" });
      const { passwordHash: _ph, ...safe } = updated;
      return safe;
    }),
});
