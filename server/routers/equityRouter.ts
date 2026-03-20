/**
 * equityRouter — Unified cap table persistence
 * Stores the entire CapTableState as a single JSON blob per user
 * (toolKey = 'cap_table') using the existing tool_states table
 */
import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { toolStates } from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import type { CapTableState } from '../../shared/equity';
import { DEFAULT_CAP_TABLE } from '../../shared/equity';

const TOOL_KEY = 'cap_table';

export const equityRouter = router({
  // ── Get the user's cap table ──────────────────────────────────────────────
  get: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return DEFAULT_CAP_TABLE;

    const rows = await db
      .select()
      .from(toolStates)
      .where(and(eq(toolStates.userId, ctx.user.id), eq(toolStates.toolKey, TOOL_KEY)))
      .limit(1);

    if (!rows.length) return DEFAULT_CAP_TABLE;
    return rows[0].state as CapTableState;
  }),

  // ── Save / upsert the user's cap table ───────────────────────────────────
  save: protectedProcedure
    .input(z.object({ state: z.any() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { ok: false };

      const existing = await db
        .select({ id: toolStates.id })
        .from(toolStates)
        .where(and(eq(toolStates.userId, ctx.user.id), eq(toolStates.toolKey, TOOL_KEY)))
        .limit(1);

      if (existing.length) {
        await db
          .update(toolStates)
          .set({ state: input.state })
          .where(eq(toolStates.id, existing[0].id));
      } else {
        await db.insert(toolStates).values({
          userId: ctx.user.id,
          toolKey: TOOL_KEY,
          state: input.state,
        });
      }
      return { ok: true };
    }),

  // ── Reset to defaults ─────────────────────────────────────────────────────
  reset: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { ok: false };

    const existing = await db
      .select({ id: toolStates.id })
      .from(toolStates)
      .where(and(eq(toolStates.userId, ctx.user.id), eq(toolStates.toolKey, TOOL_KEY)))
      .limit(1);

    if (existing.length) {
      await db
        .update(toolStates)
        .set({ state: DEFAULT_CAP_TABLE })
        .where(eq(toolStates.id, existing[0].id));
    }
    return { ok: true };
  }),
});
