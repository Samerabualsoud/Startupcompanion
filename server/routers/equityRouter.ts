/**
 * equityRouter — Unified cap table persistence
 * Stores the entire CapTableState as a single JSON blob per user
 * (toolKey = 'cap_table') using the existing tool_states table
 */
import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { toolStates, startupProfiles, teamMembers } from '../../drizzle/schema';
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

      // SYNC: Update team_members table with founders from cap table
      try {
        const startup = await db
          .select({ id: startupProfiles.id })
          .from(startupProfiles)
          .where(eq(startupProfiles.userId, ctx.user.id))
          .limit(1);

        if (startup.length && input.state?.shareholders) {
          const startupId = startup[0].id;
          const capTableShareholders = input.state.shareholders;

          // Get existing team members
          const existingMembers = await db
            .select()
            .from(teamMembers)
            .where(eq(teamMembers.startupId, startupId));

          // Sync founders from cap table to team_members
          for (const shareholder of capTableShareholders) {
            if (shareholder.type === 'founder') {
              const existing = existingMembers.find((m: any) => m.name === shareholder.name && m.isFounder);
              if (existing) {
                // Update existing founder
                await db
                  .update(teamMembers)
                  .set({ equityPercent: shareholder.equityPercent || 0 })
                  .where(eq(teamMembers.id, existing.id));
              } else {
                // Add new founder
                await db.insert(teamMembers).values({
                  startupId,
                  name: shareholder.name,
                  role: 'Founder',
                  equityPercent: shareholder.equityPercent || 0,
                  isFounder: true,
                });
              }
            }
          }
        }
      } catch (err) {
        console.warn('[DataSync] Failed to sync cap table to team_members:', err);
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
