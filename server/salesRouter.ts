/**
 * Sales Tracker Router
 * Handles: adding/editing/deleting sales entries, setting monthly targets,
 * computing analytics (MoM growth, channel breakdown, product breakdown),
 * and AI-powered sales analysis.
 */
import { z } from 'zod';
import { router, protectedProcedure } from './_core/trpc';
import { getDb } from './db';
import { salesEntries, salesTargets } from '../drizzle/schema';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { invokeLLM } from './_core/llm';

export const salesRouter = router({
  // ── Add a sales entry ──────────────────────────────────────────────────
  addEntry: protectedProcedure
    .input(z.object({
      date: z.string(), // ISO date string
      amount: z.number().min(0),
      currency: z.string().default('USD'),
      channel: z.enum(['direct', 'online', 'referral', 'partner', 'inbound', 'outbound', 'other']).default('direct'),
      product: z.string().max(256).default(''),
      customer: z.string().max(256).default(''),
      dealStage: z.enum(['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost']).default('closed_won'),
      notes: z.string().max(2000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database unavailable');
      const [entry] = await db
        .insert(salesEntries)
        .values({
          userId: ctx.user.id,
          date: new Date(input.date),
          amount: input.amount,
          currency: input.currency,
          channel: input.channel,
          product: input.product,
          customer: input.customer,
          dealStage: input.dealStage,
          notes: input.notes ?? null,
        })
        .$returningId();
      const created = await db
        .select()
        .from(salesEntries)
        .where(eq(salesEntries.id, entry.id))
        .limit(1);
      return created[0];
    }),

  // ── Update a sales entry ───────────────────────────────────────────────
  updateEntry: protectedProcedure
    .input(z.object({
      id: z.number(),
      date: z.string().optional(),
      amount: z.number().min(0).optional(),
      currency: z.string().optional(),
      channel: z.enum(['direct', 'online', 'referral', 'partner', 'inbound', 'outbound', 'other']).optional(),
      product: z.string().max(256).optional(),
      customer: z.string().max(256).optional(),
      dealStage: z.enum(['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost']).optional(),
      notes: z.string().max(2000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database unavailable');
      const { id, date, ...rest } = input;
      const updateData: Record<string, any> = { ...rest };
      if (date) updateData.date = new Date(date);
      await db
        .update(salesEntries)
        .set(updateData)
        .where(and(eq(salesEntries.id, id), eq(salesEntries.userId, ctx.user.id)));
      return { success: true };
    }),

  // ── Delete a sales entry ───────────────────────────────────────────────
  deleteEntry: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database unavailable');
      await db
        .delete(salesEntries)
        .where(and(eq(salesEntries.id, input.id), eq(salesEntries.userId, ctx.user.id)));
      return { success: true };
    }),

  // ── List sales entries (with optional date range) ──────────────────────
  listEntries: protectedProcedure
    .input(z.object({
      fromDate: z.string().optional(),
      toDate: z.string().optional(),
      limit: z.number().min(1).max(500).default(200),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const conditions = [eq(salesEntries.userId, ctx.user.id)];
      if (input.fromDate) conditions.push(gte(salesEntries.date, new Date(input.fromDate)));
      if (input.toDate) conditions.push(lte(salesEntries.date, new Date(input.toDate)));
      return db
        .select()
        .from(salesEntries)
        .where(and(...conditions))
        .orderBy(desc(salesEntries.date))
        .limit(input.limit);
    }),

  // ── Set / update a monthly target ─────────────────────────────────────
  setTarget: protectedProcedure
    .input(z.object({
      month: z.string().regex(/^\d{4}-\d{2}$/), // YYYY-MM
      targetAmount: z.number().min(0),
      currency: z.string().default('USD'),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database unavailable');
      // Upsert: check if target for this month exists
      const existing = await db
        .select()
        .from(salesTargets)
        .where(and(eq(salesTargets.userId, ctx.user.id), eq(salesTargets.month, input.month)))
        .limit(1);
      if (existing.length > 0) {
        await db
          .update(salesTargets)
          .set({ targetAmount: input.targetAmount, currency: input.currency })
          .where(and(eq(salesTargets.userId, ctx.user.id), eq(salesTargets.month, input.month)));
      } else {
        await db.insert(salesTargets).values({
          userId: ctx.user.id,
          month: input.month,
          targetAmount: input.targetAmount,
          currency: input.currency,
        });
      }
      return { success: true };
    }),

  // ── List monthly targets ───────────────────────────────────────────────
  listTargets: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(salesTargets)
      .where(eq(salesTargets.userId, ctx.user.id))
      .orderBy(desc(salesTargets.month));
  }),

  // ── Compute analytics: monthly aggregates, channel/product breakdown ───
  getAnalytics: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    const entries = await db
      .select()
      .from(salesEntries)
      .where(eq(salesEntries.userId, ctx.user.id))
      .orderBy(salesEntries.date);

    const targets = await db
      .select()
      .from(salesTargets)
      .where(eq(salesTargets.userId, ctx.user.id));

    if (entries.length === 0) return { entries: [], monthly: [], channels: [], products: [], targets };

    // ── Monthly aggregates ──
    const monthlyMap: Record<string, { month: string; revenue: number; deals: number; wonDeals: number }> = {};
    for (const e of entries) {
      const m = new Date(e.date).toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyMap[m]) monthlyMap[m] = { month: m, revenue: 0, deals: 0, wonDeals: 0 };
      monthlyMap[m].deals++;
      if (e.dealStage === 'closed_won') {
        monthlyMap[m].revenue += e.amount;
        monthlyMap[m].wonDeals++;
      }
    }
    const monthly = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));

    // Add MoM growth
    const monthlyWithGrowth = monthly.map((m, i) => {
      const prev = monthly[i - 1];
      const growth = prev && prev.revenue > 0
        ? ((m.revenue - prev.revenue) / prev.revenue) * 100
        : null;
      return { ...m, momGrowth: growth };
    });

    // ── Channel breakdown (won deals only) ──
    const channelMap: Record<string, number> = {};
    for (const e of entries) {
      if (e.dealStage === 'closed_won') {
        channelMap[e.channel] = (channelMap[e.channel] ?? 0) + e.amount;
      }
    }
    const channels = Object.entries(channelMap)
      .map(([channel, revenue]) => ({ channel, revenue }))
      .sort((a, b) => b.revenue - a.revenue);

    // ── Product breakdown ──
    const productMap: Record<string, { revenue: number; deals: number }> = {};
    for (const e of entries) {
      if (e.dealStage === 'closed_won') {
        const key = e.product || 'Unspecified';
        if (!productMap[key]) productMap[key] = { revenue: 0, deals: 0 };
        productMap[key].revenue += e.amount;
        productMap[key].deals++;
      }
    }
    const products = Object.entries(productMap)
      .map(([product, data]) => ({ product, ...data }))
      .sort((a, b) => b.revenue - a.revenue);

    // ── Deal stage funnel ──
    const stageMap: Record<string, number> = {};
    for (const e of entries) {
      stageMap[e.dealStage] = (stageMap[e.dealStage] ?? 0) + 1;
    }
    const stageFunnel = ['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost']
      .map(stage => ({ stage, count: stageMap[stage] ?? 0 }));

    // ── Summary KPIs ──
    const wonEntries = entries.filter(e => e.dealStage === 'closed_won');
    const totalRevenue = wonEntries.reduce((s, e) => s + e.amount, 0);
    const avgDealSize = wonEntries.length > 0 ? totalRevenue / wonEntries.length : 0;
    const winRate = entries.length > 0
      ? (wonEntries.length / entries.filter(e => ['closed_won', 'closed_lost'].includes(e.dealStage)).length) * 100
      : 0;

    // Current month revenue
    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentMonthRevenue = monthlyMap[currentMonth]?.revenue ?? 0;
    const currentTarget = targets.find(t => t.month === currentMonth);

    return {
      entries,
      monthly: monthlyWithGrowth,
      channels,
      products,
      stageFunnel,
      targets,
      summary: {
        totalRevenue,
        totalDeals: entries.length,
        wonDeals: wonEntries.length,
        avgDealSize,
        winRate: isFinite(winRate) ? winRate : 0,
        currentMonthRevenue,
        currentMonthTarget: currentTarget?.targetAmount ?? null,
      },
    };
  }),

  // ── AI Sales Analysis ─────────────────────────────────────────────────
  // ── Lightweight summary for dashboard context ─────────────────────────
  summary: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { total: 0, thisMonth: 0, lastMonth: 0 };
    const entries = await db
      .select()
      .from(salesEntries)
      .where(eq(salesEntries.userId, ctx.user.id));
    const now = new Date();
    const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthKey = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;
    // Build monthly revenue map for all closed_won entries
    const monthlyRevMap: Record<string, number> = {};
    let total = 0, thisMonth = 0, lastMonth = 0;
    for (const e of entries) {
      if (e.dealStage !== 'closed_won') continue;
      const m = new Date(e.date).toISOString().slice(0, 7);
      total += e.amount;
      monthlyRevMap[m] = (monthlyRevMap[m] ?? 0) + e.amount;
      if (m === thisMonthKey) thisMonth += e.amount;
      if (m === lastMonthKey) lastMonth += e.amount;
    }
    // Annualized revenue: average of last 3 months with data × 12
    const sortedMonths = Object.keys(monthlyRevMap).sort().reverse();
    const last3 = sortedMonths.slice(0, 3);
    const annualizedRevenue = last3.length > 0
      ? (last3.reduce((s, m) => s + monthlyRevMap[m], 0) / last3.length) * 12
      : 0;
    return { total, thisMonth, lastMonth, annualizedRevenue };
  }),

  analyzeAI: protectedProcedure
    .input(z.object({
      totalRevenue: z.number(),
      totalDeals: z.number(),
      wonDeals: z.number(),
      avgDealSize: z.number(),
      winRate: z.number(),
      topChannel: z.string().optional(),
      topProduct: z.string().optional(),
      recentMonths: z.array(z.object({
        month: z.string(),
        revenue: z.number(),
        momGrowth: z.number().nullable(),
      })).max(12),
      currency: z.string().default('USD'),
    }))
    .mutation(async ({ input }) => {
      const prompt = `You are an expert startup sales analyst. Analyze the following sales data and provide actionable insights.

Sales Summary:
- Total Revenue: ${input.currency} ${input.totalRevenue.toLocaleString()}
- Total Deals: ${input.totalDeals}
- Won Deals: ${input.wonDeals}
- Average Deal Size: ${input.currency} ${input.avgDealSize.toLocaleString()}
- Win Rate: ${input.winRate.toFixed(1)}%
- Top Channel: ${input.topChannel ?? 'N/A'}
- Top Product: ${input.topProduct ?? 'N/A'}

Monthly Revenue Trend (last ${input.recentMonths.length} months):
${input.recentMonths.map(m => `- ${m.month}: ${input.currency} ${m.revenue.toLocaleString()} (MoM: ${m.momGrowth !== null ? m.momGrowth.toFixed(1) + '%' : 'N/A'})`).join('\n')}

Please provide:
1. **Revenue Trend Analysis** — What does the growth pattern indicate?
2. **Win Rate Assessment** — Is the win rate healthy for this stage? What can improve it?
3. **Channel Strategy** — Which channels to double down on and which to reconsider?
4. **Deal Size Optimization** — How to increase average deal size?
5. **3 Actionable Recommendations** — Specific, prioritized actions to grow revenue in the next 90 days.

Keep the analysis concise, specific, and founder-friendly.`;

      const response = await invokeLLM({
        messages: [
          { role: 'system', content: 'You are an expert startup sales analyst. Provide clear, actionable analysis in markdown format.' },
          { role: 'user', content: prompt },
        ],
      });
      return { analysis: response.choices[0]?.message?.content ?? 'Analysis unavailable.' };
    }),
});
