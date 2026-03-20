/**
 * toolState router — generic per-user JSON state persistence for all tools
 * Tools: readiness, pitch_scorecard, dilution, runway, equity_split, etc.
 */
import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { toolStates } from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';

export const toolStateRouter = router({
  /** Load state for a specific tool */
  get: protectedProcedure
    .input(z.object({ toolKey: z.string().max(64) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;
      const rows = await db
        .select()
        .from(toolStates)
        .where(and(eq(toolStates.userId, ctx.user.id), eq(toolStates.toolKey, input.toolKey)))
        .limit(1);
      return rows[0]?.state ?? null;
    }),

  /** Save (upsert) state for a specific tool */
  save: protectedProcedure
    .input(z.object({
      toolKey: z.string().max(64),
      state: z.unknown(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { ok: false };
      // Check if row exists
      const existing = await db
        .select({ id: toolStates.id })
        .from(toolStates)
        .where(and(eq(toolStates.userId, ctx.user.id), eq(toolStates.toolKey, input.toolKey)))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(toolStates)
          .set({ state: input.state as any })
          .where(and(eq(toolStates.userId, ctx.user.id), eq(toolStates.toolKey, input.toolKey)));
      } else {
        await db.insert(toolStates).values({
          userId: ctx.user.id,
          toolKey: input.toolKey,
          state: input.state as any,
        });
      }
      return { ok: true };
    }),
});
