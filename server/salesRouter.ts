/**
 * Sales Tracker Router
 * Handles: adding/editing/deleting sales entries, setting monthly targets,
 * computing analytics (MoM growth, channel breakdown, product breakdown),
 * and AI-powered sales analysis.
 */
import { z } from 'zod';
import { router, protectedProcedure } from './_core/trpc';
import { getDb } from './db';
import { salesEntries, salesTargets, startupProfiles } from '../drizzle/schema';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { invokeLLM } from './_core/llm';
import { BUSINESS_MODEL_BENCHMARKS, INDUSTRY_CONTEXT, getKpiStatus, getBenchmarkLabel } from '../shared/kpiBenchmarks';

export const salesRouter = router({
  // ── Add a sales entry ──────────────────────────────────────────────────
  addEntry: protectedProcedure
    .input(z.object({
      date: z.string(),
      amount: z.number().min(0),
      currency: z.string().default('USD'),
      channel: z.enum(['direct', 'online', 'referral', 'partner', 'inbound', 'outbound', 'other']).default('direct'),
      product: z.string().max(256).default(''),
      customer: z.string().max(256).default(''),
      dealStage: z.string().max(64).default('closed_won'), // flexible string to support all business model stages
      // Pipeline fields
      contactName: z.string().max(256).optional(),
      contactEmail: z.string().max(320).optional(),
      contactPhone: z.string().max(64).optional(),
      dealValue: z.number().min(0).optional(),
      probability: z.number().min(0).max(100).optional(),
      expectedCloseDate: z.string().optional(),
      lostReason: z.string().max(512).optional(),
      nextAction: z.string().max(512).optional(),
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
          contactName: input.contactName ?? null,
          contactEmail: input.contactEmail ?? null,
          contactPhone: input.contactPhone ?? null,
          dealValue: input.dealValue ?? null,
          probability: input.probability ?? 50,
          expectedCloseDate: input.expectedCloseDate ? new Date(input.expectedCloseDate) : null,
          lostReason: input.lostReason ?? null,
          nextAction: input.nextAction ?? null,
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
      dealStage: z.string().max(64).optional(),
      contactName: z.string().max(256).nullable().optional(),
      contactEmail: z.string().max(320).nullable().optional(),
      contactPhone: z.string().max(64).nullable().optional(),
      dealValue: z.number().min(0).nullable().optional(),
      probability: z.number().min(0).max(100).optional(),
      expectedCloseDate: z.string().nullable().optional(),
      lostReason: z.string().max(512).nullable().optional(),
      nextAction: z.string().max(512).nullable().optional(),
      notes: z.string().max(2000).nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database unavailable');
      const { id, date, expectedCloseDate, ...rest } = input;
      const updateData: Record<string, any> = { ...rest };
      if (date) updateData.date = new Date(date);
      if (expectedCloseDate !== undefined) {
        updateData.expectedCloseDate = expectedCloseDate ? new Date(expectedCloseDate) : null;
      }
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
    const closedCount = entries.filter(e => ['closed_won', 'closed_lost'].includes(e.dealStage)).length;
    const winRate = closedCount > 0 ? (wonEntries.length / closedCount) * 100 : 0;

    // ── Date helpers ──
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM
    const currentYear = now.getFullYear();
    const currentMonthRevenue = monthlyMap[currentMonth]?.revenue ?? 0;
    const currentTarget = targets.find(t => t.month === currentMonth);

    // ── MRR: revenue in the most recent month that has data ──
    const sortedMonthKeys = Object.keys(monthlyMap).sort();
    const lastMonthWithData = sortedMonthKeys[sortedMonthKeys.length - 1] ?? currentMonth;
    const mrr = monthlyMap[lastMonthWithData]?.revenue ?? 0;

    // ── ARR: MRR × 12 (annualised from most recent month) ──
    const arr = mrr * 12;

    // ── MoM growth: compare last two months with data ──
    const prevMonthKey = sortedMonthKeys[sortedMonthKeys.length - 2];
    const prevMrr = prevMonthKey ? (monthlyMap[prevMonthKey]?.revenue ?? 0) : 0;
    const momGrowthPct = prevMrr > 0 ? ((mrr - prevMrr) / prevMrr) * 100 : null;

    // ── YTD: revenue from Jan 1 of current year to today ──
    const ytd = wonEntries
      .filter(e => new Date(e.date).getFullYear() === currentYear)
      .reduce((s, e) => s + e.amount, 0);

    // ── LTD (Launch to Date): all-time total revenue ──
    const ltd = totalRevenue;

    // ── First revenue date (launch date proxy) ──
    const firstRevenueDate = wonEntries.length > 0
      ? wonEntries.reduce((earliest, e) => {
          const d = new Date(e.date);
          return d < earliest ? d : earliest;
        }, new Date(wonEntries[0].date))
      : null;

    // ── Quarterly revenue breakdown ──
    const quarterlyMap: Record<string, number> = {};
    for (const e of wonEntries) {
      const d = new Date(e.date);
      const q = `${d.getFullYear()}-Q${Math.ceil((d.getMonth() + 1) / 3)}`;
      quarterlyMap[q] = (quarterlyMap[q] ?? 0) + e.amount;
    }
    const quarterly = Object.entries(quarterlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([quarter, revenue]) => ({ quarter, revenue }));

    // ── Revenue growth rate (3-month CAGR proxy) ──
    const last3Months = sortedMonthKeys.slice(-3);
    const last3Revenue = last3Months.reduce((s, m) => s + (monthlyMap[m]?.revenue ?? 0), 0);
    const prev3Months = sortedMonthKeys.slice(-6, -3);
    const prev3Revenue = prev3Months.reduce((s, m) => s + (monthlyMap[m]?.revenue ?? 0), 0);
    const qoqGrowthPct = prev3Revenue > 0 ? ((last3Revenue - prev3Revenue) / prev3Revenue) * 100 : null;

    return {
      entries,
      monthly: monthlyWithGrowth,
      channels,
      products,
      stageFunnel,
      targets,
      quarterly,
      summary: {
        totalRevenue,
        totalDeals: entries.length,
        wonDeals: wonEntries.length,
        avgDealSize,
        winRate: isFinite(winRate) ? winRate : 0,
        currentMonthRevenue,
        currentMonthTarget: currentTarget?.targetAmount ?? null,
        // ── New analytics ──
        mrr,
        arr,
        ytd,
        ltd,
        momGrowthPct: momGrowthPct !== null && isFinite(momGrowthPct) ? momGrowthPct : null,
        qoqGrowthPct: qoqGrowthPct !== null && isFinite(qoqGrowthPct) ? qoqGrowthPct : null,
        firstRevenueDate: firstRevenueDate?.toISOString() ?? null,
        lastMonthWithData,
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

  // ── KPI Benchmarking: compute actuals vs industry benchmarks ────────────
  getKpiBenchmarks: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    // 1. Fetch startup profile for business model, sector, and manually entered KPIs
    const [profile] = await db
      .select()
      .from(startupProfiles)
      .where(eq(startupProfiles.userId, ctx.user.id))
      .limit(1);

    const businessModel = (profile?.businessModel ?? 'saas').toLowerCase();
    const sector = (profile?.sector ?? '').toLowerCase();

    // 2. Get benchmark profile for this business model
    const benchmarkProfile = BUSINESS_MODEL_BENCHMARKS[businessModel] ?? BUSINESS_MODEL_BENCHMARKS['saas'];

    // 3. Fetch all closed_won sales entries to compute actuals
    const entries = await db
      .select()
      .from(salesEntries)
      .where(and(eq(salesEntries.userId, ctx.user.id), eq(salesEntries.dealStage, 'closed_won')));

    // 4. Compute actual KPI values from sales data + profile
    const now = new Date();
    const monthlyMap: Record<string, number> = {};
    for (const e of entries) {
      const m = new Date(e.date).toISOString().slice(0, 7);
      monthlyMap[m] = (monthlyMap[m] ?? 0) + e.amount;
    }
    const sortedMonthKeys = Object.keys(monthlyMap).sort();
    const lastMonthKey = sortedMonthKeys[sortedMonthKeys.length - 1];
    const prevMonthKey = sortedMonthKeys[sortedMonthKeys.length - 2];

    const mrr = lastMonthKey ? (monthlyMap[lastMonthKey] ?? 0) : 0;
    const prevMrr = prevMonthKey ? (monthlyMap[prevMonthKey] ?? 0) : 0;
    const momGrowthPct = prevMrr > 0 ? ((mrr - prevMrr) / prevMrr) * 100 : null;

    // CAC payback: if profile has cac and gross margin, compute months
    const cacPayback = (profile?.cac && profile?.grossMargin && profile.grossMargin > 0)
      ? profile.cac / (mrr > 0 ? mrr / Math.max(profile.numberOfCustomers ?? 1, 1) * (profile.grossMargin / 100) : 1)
      : null;

    // LTV:CAC ratio from profile fields
    const ltvCacRatio = (profile?.ltv && profile?.cac && profile.cac > 0)
      ? profile.ltv / profile.cac
      : null;

    // Build actuals map
    const actuals: Record<string, number | null> = {
      mom_growth: momGrowthPct !== null && isFinite(momGrowthPct) ? momGrowthPct : null,
      churn_rate: profile?.churnRate ?? null,
      ltv_cac_ratio: ltvCacRatio,
      cac_payback_months: cacPayback !== null && isFinite(cacPayback) ? cacPayback : null,
      gross_margin: profile?.grossMargin ?? null,
      nps_score: profile?.npsScore ?? null,
      gmv_growth: momGrowthPct !== null && isFinite(momGrowthPct) ? momGrowthPct : null,
      revenue_growth: momGrowthPct !== null && isFinite(momGrowthPct) ? momGrowthPct : null,
      net_revenue_retention: null, // requires historical data not yet tracked
      revenue_per_employee: (entries.length > 0 && profile?.employeeCount && profile.employeeCount > 0)
        ? entries.reduce((s, e) => s + e.amount, 0) / profile.employeeCount
        : null,
    };

    // North Star actual value
    const northStarKey = benchmarkProfile.northStar.key;
    let northStarActual: number | null = null;
    if (northStarKey === 'arr') northStarActual = mrr * 12;
    else if (northStarKey === 'revenue_growth' || northStarKey === 'gmv_growth') northStarActual = actuals.mom_growth;
    else if (northStarKey === 'gross_margin') northStarActual = actuals.gross_margin;
    else if (northStarKey === 'net_revenue_retention') northStarActual = actuals.net_revenue_retention;
    else if (northStarKey === 'revenue_per_employee') northStarActual = actuals.revenue_per_employee;

    // 5. Build KPI result rows
    const kpiResults = benchmarkProfile.kpis.map(kpi => {
      const actual = actuals[kpi.key] ?? null;
      const status = getKpiStatus(kpi, actual);
      const benchmarkLabel = getBenchmarkLabel(kpi);
      return {
        key: kpi.key,
        label: kpi.label,
        labelAr: kpi.labelAr,
        unit: kpi.unit,
        description: kpi.description,
        descriptionAr: kpi.descriptionAr,
        actual,
        status,
        benchmarkLabel,
        excellent: kpi.excellent,
        good: kpi.good,
        fair: kpi.fair,
        lowerIsBetter: kpi.lowerIsBetter ?? false,
        source: kpi.source,
      };
    });

    // 6. Industry context note
    const industryNote = INDUSTRY_CONTEXT[sector] ?? INDUSTRY_CONTEXT[businessModel] ?? null;

    return {
      businessModel,
      sector,
      northStar: {
        ...benchmarkProfile.northStar,
        actual: northStarActual,
        mrr,
        arr: mrr * 12,
      },
      kpis: kpiResults,
      industryNote,
      hasProfileData: !!profile,
      hasRevenueData: entries.length > 0,
    };
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
