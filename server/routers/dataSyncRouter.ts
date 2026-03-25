/**
 * dataSyncRouter — Unified data synchronization across all tools
 * Provides single source of truth for:
 * - Cap Table (shareholders, ESOP, instruments)
 * - Valuation scenarios (pre-money valuation, investment amounts)
 * - Equity splits (founder percentages)
 * - Funding rounds
 *
 * All tools read from this router to ensure data consistency
 */

import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { toolStates } from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import type { CapTableState } from '../../shared/equity';
import { DEFAULT_CAP_TABLE } from '../../shared/equity';

// ─── Tool Keys ─────────────────────────────────────────────────────────────────
const TOOL_KEYS = {
  CAP_TABLE: 'cap_table',
  VALUATION: 'valuation_scenarios',
  DILUTION: 'dilution_rounds',
  EQUITY_SPLIT: 'equity_split',
} as const;

export const dataSyncRouter = router({
  /**
   * Get unified snapshot of all tool data for a user
   * Returns consolidated view across Cap Table, Valuation, Dilution, Equity Split
   */
  getSnapshot: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      return {
        capTable: DEFAULT_CAP_TABLE,
        valuation: null,
        dilution: null,
        equitySplit: null,
      };
    }

    // Fetch all tool states for this user
    const toolStatesRows = await db
      .select()
      .from(toolStates)
      .where(eq(toolStates.userId, ctx.user.id));

    const stateMap = new Map(
      toolStatesRows.map((row) => [row.toolKey, row.state])
    );

    return {
      capTable: (stateMap.get(TOOL_KEYS.CAP_TABLE) as CapTableState) || DEFAULT_CAP_TABLE,
      valuation: stateMap.get(TOOL_KEYS.VALUATION) || null,
      dilution: stateMap.get(TOOL_KEYS.DILUTION) || null,
      equitySplit: stateMap.get(TOOL_KEYS.EQUITY_SPLIT) || null,
    };
  }),

  /**
   * Get Cap Table with sync status
   * Indicates whether data is synced with other tools
   */
  getCapTableWithSync: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      return {
        capTable: DEFAULT_CAP_TABLE,
        syncStatus: {
          isSyncedWithDilution: false,
          isSyncedWithValuation: false,
          isSyncedWithEquitySplit: false,
          lastSyncTime: null,
        },
      };
    }

    const toolStatesRows = await db
      .select()
      .from(toolStates)
      .where(eq(toolStates.userId, ctx.user.id));

    const stateMap = new Map(
      toolStatesRows.map((row) => [row.toolKey, row.state])
    );

    const capTable = (stateMap.get(TOOL_KEYS.CAP_TABLE) as CapTableState) || DEFAULT_CAP_TABLE;
    const dilution = stateMap.get(TOOL_KEYS.DILUTION) as any;
    const valuation = stateMap.get(TOOL_KEYS.VALUATION) as any;
    const equitySplit = stateMap.get(TOOL_KEYS.EQUITY_SPLIT) as any;

    // Check sync status
    const capTableShareholders = capTable.shareholders || [];
    const dilutionFounders = dilution?.founders || [];
    const valuationPreMoney = valuation?.preMoneyValuation;
    const equitySplitPcts = equitySplit?.founderPercentages;

    return {
      capTable,
      syncStatus: {
        // Dilution is synced if it has the same number of founders as cap table
        isSyncedWithDilution:
          dilutionFounders.length === capTableShareholders.filter((s: any) => s.type === 'founder').length &&
          dilutionFounders.length > 0,

        // Valuation is synced if dilution has pre-money valuation
        isSyncedWithValuation: !!valuationPreMoney && dilution?.initialValuation === valuationPreMoney,

        // Equity split is synced if founder percentages match cap table
        isSyncedWithEquitySplit:
          equitySplitPcts &&
          capTableShareholders
            .filter((s: any) => s.type === 'founder')
            .every((founder: any) =>
              Math.abs(
                (founder.shares / (capTable.shareholders.reduce((sum: number, s: any) => sum + s.shares, 0) || 1)) * 100 -
                  (equitySplitPcts[founder.name] || 0)
              ) < 0.1
            ),

        lastSyncTime: toolStatesRows.find((r) => r.toolKey === TOOL_KEYS.CAP_TABLE)?.updatedAt || null,
      },
    };
  }),

  /**
   * Sync Cap Table founders to Dilution Simulator
   * Called when Cap Table is saved to ensure Dilution has latest founders
   */
  syncCapTableToDilution: protectedProcedure
    .input(z.object({ capTable: z.any() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { ok: false };

      const capTable = input.capTable as CapTableState;
      const founders = capTable.shareholders.filter((s: any) => s.type === 'founder');

      // Get or create dilution state
      const existing = await db
        .select({ id: toolStates.id, state: toolStates.state })
        .from(toolStates)
        .where(
          and(
            eq(toolStates.userId, ctx.user.id),
            eq(toolStates.toolKey, TOOL_KEYS.DILUTION)
          )
        )
        .limit(1);

      const dilutionState = (existing.length ? existing[0].state : { rounds: [], initialValuation: 3_000_000, founders: [] }) as any;

      // Update founders in dilution state
      const updatedDilutionState = {
        ...dilutionState,
        founders: founders.map((f: any) => ({
          name: f.name,
          initialShares: f.shares,
          initialPct: (f.shares / capTable.shareholders.reduce((sum: number, s: any) => sum + s.shares, 0)) * 100,
        })),
      };

      if (existing.length) {
        await db
          .update(toolStates)
          .set({ state: updatedDilutionState })
          .where(eq(toolStates.id, existing[0].id));
      } else {
        await db.insert(toolStates).values({
          userId: ctx.user.id,
          toolKey: TOOL_KEYS.DILUTION,
          state: updatedDilutionState,
        });
      }

      return { ok: true, synced: founders.length };
    }),

  /**
   * Sync Valuation pre-money to Dilution Simulator
   * Called when Valuation is saved to update Dilution's initial valuation
   */
  syncValuationToDilution: protectedProcedure
    .input(z.object({ preMoneyValuation: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { ok: false };

      // Get or create dilution state
      const existing = await db
        .select({ id: toolStates.id, state: toolStates.state })
        .from(toolStates)
        .where(
          and(
            eq(toolStates.userId, ctx.user.id),
            eq(toolStates.toolKey, TOOL_KEYS.DILUTION)
          )
        )
        .limit(1);

      const dilutionState = (existing.length ? existing[0].state : { rounds: [], initialValuation: 3_000_000, founders: [] }) as any;

      // Update initial valuation
      const updatedDilutionState = {
        ...dilutionState,
        initialValuation: input.preMoneyValuation,
      };

      if (existing.length) {
        await db
          .update(toolStates)
          .set({ state: updatedDilutionState })
          .where(eq(toolStates.id, existing[0].id));
      } else {
        await db.insert(toolStates).values({
          userId: ctx.user.id,
          toolKey: TOOL_KEYS.DILUTION,
          state: updatedDilutionState,
        });
      }

      return { ok: true };
    }),

  /**
   * Sync Equity Split percentages to Cap Table
   * Called when Equity Split is saved to update founder shares in Cap Table
   */
  syncEquitySplitToCapTable: protectedProcedure
    .input(
      z.object({
        founderPercentages: z.record(z.string(), z.number()),
        totalShares: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { ok: false };

      // Get current cap table
      const existing = await db
        .select({ id: toolStates.id, state: toolStates.state })
        .from(toolStates)
        .where(
          and(
            eq(toolStates.userId, ctx.user.id),
            eq(toolStates.toolKey, TOOL_KEYS.CAP_TABLE)
          )
        )
        .limit(1);

      const capTable = (existing.length ? (existing[0].state as CapTableState) : DEFAULT_CAP_TABLE) as CapTableState;

      // Update founder shares based on percentages
      const updatedCapTable = {
        ...capTable,
        shareholders: capTable.shareholders.map((s: any) => {
          if (s.type === 'founder' && input.founderPercentages[s.name]) {
            const newShares = Math.round((input.founderPercentages[s.name] / 100) * input.totalShares);
            return { ...s, shares: newShares };
          }
          return s;
        }),
      };

      if (existing.length) {
        await db
          .update(toolStates)
          .set({ state: updatedCapTable })
          .where(eq(toolStates.id, existing[0].id));
      } else {
        await db.insert(toolStates).values({
          userId: ctx.user.id,
          toolKey: TOOL_KEYS.CAP_TABLE,
          state: updatedCapTable,
        });
      }

      return { ok: true };
    }),

  /**
   * Force full sync across all tools
   * Ensures Cap Table is source of truth for founders, shares, and ESOP
   */
  forceFullSync: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { ok: false };

    // Get current cap table
    const capTableRow = await db
      .select()
      .from(toolStates)
      .where(
        and(
          eq(toolStates.userId, ctx.user.id),
          eq(toolStates.toolKey, TOOL_KEYS.CAP_TABLE)
        )
      )
      .limit(1);

    const capTable = (capTableRow.length ? capTableRow[0].state : DEFAULT_CAP_TABLE) as CapTableState;
    const founders = capTable.shareholders.filter((s: any) => s.type === 'founder');
    const totalShares = capTable.shareholders.reduce((sum: number, s: any) => sum + s.shares, 0) || 1;

    // Sync to Dilution
    const dilutionState = {
      rounds: capTable.rounds || [],
      initialValuation: capTable.nextRoundPreMoneyValuation || 3_000_000,
      founders: founders.map((f: any) => ({
        name: f.name,
        initialShares: f.shares,
        initialPct: (f.shares / totalShares) * 100,
      })),
    };

    const dilutionRow = await db
      .select({ id: toolStates.id })
      .from(toolStates)
      .where(
        and(
          eq(toolStates.userId, ctx.user.id),
          eq(toolStates.toolKey, TOOL_KEYS.DILUTION)
        )
      )
      .limit(1);

    if (dilutionRow.length) {
      await db
        .update(toolStates)
        .set({ state: dilutionState })
        .where(eq(toolStates.id, dilutionRow[0].id));
    } else {
      await db.insert(toolStates).values({
        userId: ctx.user.id,
        toolKey: TOOL_KEYS.DILUTION,
        state: dilutionState,
      });
    }

    // Sync to Equity Split
    const equitySplitState = {
      founderPercentages: Object.fromEntries(
        founders.map((f: any) => [f.name, (f.shares / totalShares) * 100])
      ),
      totalShares,
    };

    const equitySplitRow = await db
      .select({ id: toolStates.id })
      .from(toolStates)
      .where(
        and(
          eq(toolStates.userId, ctx.user.id),
          eq(toolStates.toolKey, TOOL_KEYS.EQUITY_SPLIT)
        )
      )
      .limit(1);

    if (equitySplitRow.length) {
      await db
        .update(toolStates)
        .set({ state: equitySplitState })
        .where(eq(toolStates.id, equitySplitRow[0].id));
    } else {
      await db.insert(toolStates).values({
        userId: ctx.user.id,
        toolKey: TOOL_KEYS.EQUITY_SPLIT,
        state: equitySplitState,
      });
    }

    return {
      ok: true,
      synced: {
        dilution: founders.length,
        equitySplit: founders.length,
      },
    };
  }),
});
