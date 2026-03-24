/**
 * FounderDashboard — Centralized overview of the founder's startup workspace.
 *
 * Shows key metrics pulled from StartupContext (profile, valuations, COGS, ESOP, sales),
 * equity split pie chart, ESOP pool widget, sales KPIs, runway gauge,
 * quick-action buttons to each major tool, and a workspace progress tracker.
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, Users, DollarSign, BarChart3, Target,
  FileText, Sparkles, ChevronRight, AlertCircle,
  ArrowUpRight, Building2, Globe, Zap, ClipboardCheck,
  GitBranch, BookOpen, Rocket, Calculator, ShoppingCart,
  FolderOpen, TrendingDown, Check, Clock
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { useStartup } from '@/contexts/StartupContext';
import { useReport } from '@/contexts/ReportContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

// ── Helpers ────────────────────────────────────────────────────────────────

function fmtCurrency(value: number | null, currency = 'USD'): string {
  if (value === null || value === undefined) return '—';
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

function fmtPct(value: number | null): string {
  if (value === null || value === undefined) return '—';
  return `${value.toFixed(1)}%`;
}

function computeRunway(cashOnHand: number | null, burnRate: number | null): number | null {
  if (!cashOnHand || !burnRate || burnRate <= 0) return null;
  return Math.floor(cashOnHand / burnRate);
}

const CHART_COLORS = ['#5B4EFF', '#22C55E', '#F59E0B', '#EC4899', '#0EA5E9', '#8B5CF6', '#C4614A', '#2D4A6B'];

// ── Component ──────────────────────────────────────────────────────────────

interface FounderDashboardProps {
  onNavigate: (toolId: string) => void;
}

export default function FounderDashboard({ onNavigate }: FounderDashboardProps) {
  const { snapshot, isLoading } = useStartup();
  const { readiness, pitchScore: reportPitchScore } = useReport();
  const { t, lang } = useLanguage();
  // Wire readiness and pitch scores from ReportContext (session-based, populated when tools are used)
  const readinessScore = readiness?.score ?? snapshot.readinessScore;
  const pitchScore = reportPitchScore?.totalScore ?? snapshot.pitchScore;
  const isRTL = lang === 'ar';

  // Load sales analytics for the trend chart
  const { data: salesAnalytics } = trpc.sales.getAnalytics.useQuery(undefined, { retry: false });

  const runway = useMemo(
    () => computeRunway(snapshot.cashOnHand, snapshot.monthlyBurnRate),
    [snapshot.cashOnHand, snapshot.monthlyBurnRate]
  );

  const hasProfile = !!snapshot.companyName;

  // Equity split data from team members
  const equityData = useMemo(() => {
    const members = snapshot.teamMembers.filter(m => m.equityPercent && m.equityPercent > 0);
    if (members.length === 0) return null;
    return members.map((m, i) => ({
      name: m.name || m.role || `Member ${i + 1}`,
      value: m.equityPercent!,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }));
  }, [snapshot.teamMembers]);

  // ESOP pool data — allocated = sum of individual grants, available = pool - allocated
  const esopData = useMemo(() => {
    if (!snapshot.currentOptionPool) return null;
    const allocated = snapshot.esopAllocatedShares ?? 0;
    const available = Math.max(0, snapshot.currentOptionPool - allocated);
    if (allocated === 0 && available === 0) return null;
    return [
      ...(allocated > 0 ? [{ name: 'Allocated', value: allocated, color: '#5B4EFF' }] : []),
      ...(available > 0 ? [{ name: 'Available', value: available, color: '#10B981' }] : []),
    ];
  }, [snapshot.currentOptionPool, snapshot.esopAllocatedShares]);

  // Monthly sales trend (last 6 months)
  const salesTrend = useMemo(() => {
    if (!salesAnalytics?.monthly) return [];
    return salesAnalytics.monthly.slice(-6);
  }, [salesAnalytics]);

  // Runway color
  const runwayColor = runway === null ? '#6B7280'
    : runway <= 3 ? '#EF4444'
    : runway <= 6 ? '#F59E0B'
    : '#10B981';

  // Tool progress — covers profile completeness + tool usage
  const toolProgress = [
    { id: 'profile',        label: 'Startup Profile',         done: hasProfile && !!snapshot.companyName },
    { id: 'problem',        label: 'Problem & Solution',      done: !!snapshot.problem && !!snapshot.solution },
    { id: 'business-model', label: 'Business Model',          done: !!snapshot.businessModel },
    { id: 'financials',     label: 'Financial Metrics',       done: (snapshot.currentARR ?? 0) > 0 || (snapshot.mrr ?? 0) > 0 },
    { id: 'traction',       label: 'Traction Metrics',        done: (snapshot.numberOfCustomers ?? 0) > 0 || (snapshot.monthlyActiveUsers ?? 0) > 0 },
    { id: 'valuation',      label: t('navValuation'),         done: snapshot.latestValuation !== null },
    { id: 'cogs',           label: t('navCOGS'),              done: snapshot.latestMonthlyCOGS !== null },
    { id: 'esop',           label: t('navESOP'),              done: snapshot.currentOptionPool !== null },
    { id: 'sales',          label: 'Sales Tracker',           done: snapshot.totalSalesRevenue !== null && snapshot.totalSalesRevenue > 0 },
    { id: 'readiness',      label: t('navReadiness'),         done: readinessScore !== null },
    { id: 'pitch-deck',     label: t('navPitchDeck'),         done: pitchScore !== null },
    { id: 'data-room',      label: 'Data Room',               done: false },
  ];

  const completedCount = toolProgress.filter(tp => tp.done).length;
  const progressPct = Math.round((completedCount / toolProgress.length) * 100);

  const quickActions = [
    { id: 'valuation',    label: 'Valuation',        icon: TrendingUp,   color: '#5B4EFF', bg: '#5B4EFF1A' },
    { id: 'cogs',         label: 'COGS',             icon: Calculator,   color: '#059669', bg: '#0596691A' },
    { id: 'esop',         label: 'ESOP',             icon: Users,        color: '#2D4A6B', bg: '#2D4A6B1A' },
    { id: 'sales',        label: 'Sales',            icon: ShoppingCart, color: '#F59E0B', bg: '#F59E0B1A' },
    { id: 'investor-crm', label: 'Investors',        icon: Building2,    color: '#7C3AED', bg: '#7C3AED1A' },
    { id: 'data-room',    label: 'Data Room',        icon: FolderOpen,   color: '#0284C7', bg: '#0284C71A' },
    { id: 'readiness',    label: 'Readiness',        icon: Target,       color: '#F59E0B', bg: '#F59E0B1A' },
    { id: 'dilution',     label: 'Dilution',         icon: GitBranch,    color: '#8B4A38', bg: '#8B4A381A' },
  ];

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading your workspace…</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-y-auto"
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{ background: 'var(--background)' }}
    >
      {/* ── Header ── */}
      <div className="px-6 py-5 border-b border-border bg-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-display text-foreground">
              {hasProfile ? snapshot.companyName : t('dashboardTitle')}
            </h1>
            <p className="text-sm mt-0.5 text-muted-foreground">
              {hasProfile
                ? `${snapshot.sector || ''}${snapshot.sector && snapshot.stage ? ' · ' : ''}${snapshot.stage || ''}`
                : t('dashboardSubtitle')}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {snapshot.stage && (
              <Badge variant="outline" className="text-xs">{snapshot.stage}</Badge>
            )}
            {snapshot.country && (
              <Badge variant="outline" className="text-xs">
                <Globe className="w-3 h-3 mr-1" />{snapshot.country}
              </Badge>
            )}
            {runway !== null && (
              <Badge
                variant="outline"
                className="text-xs"
                style={{ color: runwayColor }}
              >
                <Clock className="w-3 h-3 mr-1" />{runway}mo runway
              </Badge>
            )}
          </div>
        </div>

        {/* Workspace progress bar in header */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Workspace Completion
            </span>
            <span className="text-xs font-semibold text-foreground">{progressPct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${progressPct}%`, background: progressPct >= 80 ? '#22C55E' : progressPct >= 50 ? '#F59E0B' : '#5B4EFF' }}
            />
          </div>
        </div>
      </div>

      <div className="p-5 lg:p-6 space-y-6">

        {/* ── Profile Setup CTA ── */}
        {!hasProfile && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">{t('dashboardCompleteProfile')}</p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">Complete your startup profile to unlock personalized insights across all tools.</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:bg-amber-900/30"
              onClick={() => onNavigate('profile')}
            >
              {t('dashboardGoToProfile')}
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </motion.div>
        )}

        {/* ── KPI Cards Row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            {
              label: 'Valuation',
              value: fmtCurrency(snapshot.latestValuation),
              icon: TrendingUp,
              color: '#5B4EFF',
              sub: snapshot.latestValuationDate
                ? new Date(snapshot.latestValuationDate).toLocaleDateString()
                : 'Not set',
              action: 'valuation',
            },
            {
              label: 'Total Raised',
              value: fmtCurrency(snapshot.totalRaised),
              icon: ArrowUpRight,
              color: '#2D4A6B',
              sub: snapshot.stage || 'No stage',
              action: 'valuation-timeline',
            },
            {
              label: 'ARR',
              value: fmtCurrency(snapshot.currentARR ?? snapshot.salesARR),
              icon: Zap,
              color: '#7C3AED',
              sub: snapshot.currentARR
                ? (snapshot.revenueGrowthRate ? `+${snapshot.revenueGrowthRate}% growth` : 'From profile')
                : snapshot.salesARR
                  ? 'Annualized from Sales'
                  : 'No data',
              action: 'cogs',
            },
            {
              label: 'Gross Margin',
              value: snapshot.latestGrossMarginPct !== null
                ? fmtPct(snapshot.latestGrossMarginPct)
                : fmtPct(snapshot.grossMargin),
              icon: ClipboardCheck,
              color: '#0284C7',
              sub: snapshot.latestMonthlyCOGS ? `COGS: ${fmtCurrency(snapshot.latestMonthlyCOGS)}/mo` : 'No COGS data',
              action: 'cogs',
            },
            {
              label: 'Runway',
              value: runway !== null ? `${runway} mo` : '—',
              icon: BarChart3,
              color: runwayColor,
              sub: snapshot.cashOnHand ? `${fmtCurrency(snapshot.cashOnHand)} cash` : 'No data',
              action: 'runway',
            },
            {
              label: 'Sales (MTD)',
              value: fmtCurrency(snapshot.salesThisMonth),
              icon: ShoppingCart,
              color: '#F59E0B',
              sub: snapshot.salesMoMGrowth !== null
                ? `${snapshot.salesMoMGrowth >= 0 ? '+' : ''}${snapshot.salesMoMGrowth.toFixed(1)}% MoM`
                : 'No data',
              action: 'sales',
            },
          ].map((card, i) => (
            <motion.button
              key={card.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onNavigate(card.action)}
              className="text-left"
            >
              <Card className="border-border shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 h-full">
                <CardContent className="p-4">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-2" style={{ background: `${card.color}18` }}>
                    <card.icon className="w-3.5 h-3.5" style={{ color: card.color }} />
                  </div>
                  <div className="text-lg font-bold text-foreground">{card.value}</div>
                  <div className="text-xs font-medium text-foreground mt-0.5">{card.label}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 truncate">{card.sub}</div>
                </CardContent>
              </Card>
            </motion.button>
          ))}
        </div>

        {/* ── Charts Row: Equity Split + ESOP Pool + Sales Trend ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Equity Split Pie */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Equity Split</CardTitle>
                <button
                  onClick={() => onNavigate('equity-split')}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5"
                >
                  View <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {equityData ? (
                <div>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie
                        data={equityData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {equityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any) => `${Number(v).toFixed(1)}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1 mt-1">
                    {equityData.slice(0, 4).map((item) => (
                      <div key={item.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: item.color }} />
                          <span className="text-muted-foreground truncate max-w-[100px]">{item.name}</span>
                        </div>
                        <span className="font-semibold text-foreground">{item.value.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[160px] text-center">
                  <Users className="w-8 h-8 text-muted-foreground/30 mb-2" />
                  <p className="text-xs text-muted-foreground">Add team members with equity % in your Startup Profile</p>
                  <button
                    onClick={() => onNavigate('profile')}
                    className="text-xs text-primary mt-2 hover:underline"
                  >
                    Go to Profile →
                  </button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ESOP Pool */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">ESOP Pool</CardTitle>
                <button
                  onClick={() => onNavigate('esop')}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5"
                >
                  View <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {esopData ? (
                <div>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie
                        data={esopData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {esopData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any) => Number(v).toLocaleString() + ' shares'} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1 mt-1">
                    {esopData.map((item) => (
                      <div key={item.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: item.color }} />
                          <span className="text-muted-foreground">{item.name}</span>
                        </div>
                        <span className="font-semibold text-foreground">{(item.value / 1_000_000).toFixed(1)}M</span>
                      </div>
                    ))}
                    {snapshot.esopPricePerShare && (
                      <div className="text-[10px] text-muted-foreground mt-1 pt-1 border-t border-border">
                        Strike: ${snapshot.esopPricePerShare.toFixed(2)}/share
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[160px] text-center">
                  <Users className="w-8 h-8 text-muted-foreground/30 mb-2" />
                  <p className="text-xs text-muted-foreground">Save an ESOP plan to see your option pool here</p>
                  <button
                    onClick={() => onNavigate('esop')}
                    className="text-xs text-primary mt-2 hover:underline"
                  >
                    Open ESOP Planner →
                  </button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sales Trend */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Revenue Trend</CardTitle>
                <button
                  onClick={() => onNavigate('sales')}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5"
                >
                  View <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {salesTrend.length > 0 ? (
                <div>
                  <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={salesTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#5B4EFF" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#5B4EFF" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="month" tick={{ fontSize: 9 }} tickFormatter={v => v.slice(5)} />
                      <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `$${v >= 1000 ? (v / 1000).toFixed(0) + 'K' : v}`} />
                      <Tooltip formatter={(v: any) => [`$${Number(v).toLocaleString()}`, 'Revenue']} labelFormatter={l => `Month: ${l}`} />
                      <Area type="monotone" dataKey="revenue" stroke="#5B4EFF" strokeWidth={2} fill="url(#salesGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span className="text-muted-foreground">Total: {fmtCurrency(snapshot.totalSalesRevenue)}</span>
                    {snapshot.salesMoMGrowth !== null && (
                      <span className={`font-semibold flex items-center gap-0.5 ${snapshot.salesMoMGrowth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                        {snapshot.salesMoMGrowth >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Math.abs(snapshot.salesMoMGrowth).toFixed(1)}% MoM
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[160px] text-center">
                  <BarChart3 className="w-8 h-8 text-muted-foreground/30 mb-2" />
                  <p className="text-xs text-muted-foreground">Log your first sale to see revenue trends</p>
                  <button
                    onClick={() => onNavigate('sales')}
                    className="text-xs text-primary mt-2 hover:underline"
                  >
                    Open Sales Tracker →
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Quick Actions ── */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            {t('dashboardQuickActions')}
          </h2>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {quickActions.map((action, i) => (
              <motion.button
                key={action.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => onNavigate(action.id)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border bg-card hover:shadow-md transition-all hover:-translate-y-0.5 active:scale-95 text-center"
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: action.bg }}>
                  <action.icon className="w-4.5 h-4.5" style={{ color: action.color }} />
                </div>
                <span className="text-[10px] font-semibold text-foreground leading-tight">{action.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* ── Workspace Checklist ── */}
        <div>
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">{t('dashboardProgress')}</CardTitle>
                <span className="text-xs text-muted-foreground">
                  {completedCount}/{toolProgress.length} {t('dashboardToolsCompleted')}
                </span>
              </div>
              <Progress value={progressPct} className="h-1.5 mt-2" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {toolProgress.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary/50 transition-colors text-left"
                  >
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                        item.done ? 'bg-green-500' : 'border-2 border-muted-foreground/30'
                      }`}
                    >
                      {item.done && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <span className={`text-xs ${item.done ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── All Tools Grid ── */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">All Tools</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ALL_TOOLS.map((tool, i) => (
              <motion.button
                key={tool.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                onClick={() => onNavigate(tool.id)}
                className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-card hover:shadow-md transition-all hover:-translate-y-0.5 active:scale-95 text-left"
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${tool.color}18` }}>
                  <tool.icon className="w-4.5 h-4.5" style={{ color: tool.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground truncate">{tool.label}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{tool.desc}</div>
                </div>
                {tool.badge && (
                  <Badge variant="secondary" className="text-[9px] shrink-0" style={{ background: `${tool.color}18`, color: tool.color }}>
                    {tool.badge}
                  </Badge>
                )}
              </motion.button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Static tool catalog ────────────────────────────────────────────────────

const ALL_TOOLS = [
  { id: 'valuation',              label: 'Valuation Calculator',        desc: '7 methods: DCF, Scorecard, Berkus…',    icon: TrendingUp,     color: '#5B4EFF', badge: '7 methods' },
  { id: 'equity-split',           label: 'Co-Founder Equity Split',     desc: 'Fair equity allocation for founders',   icon: Users,          color: '#2D4A6B', badge: undefined },
  { id: 'dilution',               label: 'Dilution Simulator',          desc: 'Model funding rounds & dilution',       icon: GitBranch,      color: '#8B4A38', badge: undefined },
  { id: 'vesting',                label: 'Vesting Schedule Builder',    desc: 'Design vesting for your team',          icon: BarChart3,      color: '#7C3AED', badge: undefined },
  { id: 'esop',                   label: 'ESOP / Option Pool Planner',  desc: 'Plan employee stock options',           icon: Users,          color: '#059669', badge: 'New' },
  { id: 'cogs',                   label: 'COGS & Cost Calculator',      desc: 'Calculate gross margin & burn',         icon: Calculator,     color: '#059669', badge: 'New' },
  { id: 'sales',                  label: 'Sales Tracker',               desc: 'Track deals, revenue & growth',        icon: ShoppingCart,   color: '#F59E0B', badge: 'New' },
  { id: 'data-room',              label: 'Data Room',                   desc: 'Share docs with investors securely',   icon: FolderOpen,     color: '#0284C7', badge: 'New' },
  { id: 'readiness',              label: 'Fundraising Readiness',       desc: '20-point investor readiness check',     icon: Target,         color: '#F59E0B', badge: '20 checks' },
  { id: 'pitch-deck',             label: 'Pitch Deck Scorecard',        desc: 'Score your pitch deck',                 icon: ClipboardCheck, color: '#6366F1', badge: undefined },
  { id: 'investor-crm',           label: 'Investor CRM',                desc: 'Track your investor pipeline',          icon: Building2,      color: '#5B4EFF', badge: undefined },
  { id: 'safe-note',              label: 'SAFE / Convertible Note',     desc: 'Build SAFE or note agreements',         icon: FileText,       color: '#7C3AED', badge: 'New' },
  { id: 'nda',                    label: 'NDA Generator',               desc: 'Generate NDAs for your startup',        icon: FileText,       color: '#0284C7', badge: 'New' },
  { id: 'free-zones',             label: 'Free Zones & Jurisdictions',  desc: 'MENA & global incorporation guide',     icon: Globe,          color: '#0284C7', badge: undefined },
  { id: 'accelerators',           label: 'Accelerator Finder',          desc: 'Find the right accelerator for you',   icon: Rocket,         color: '#10B981', badge: undefined },
  { id: 'term-sheet',             label: 'Term Sheet Glossary',         desc: '75+ terms explained simply',            icon: BookOpen,       color: '#0F1B2D', badge: '75 terms' },
  { id: 'runway',                 label: 'Runway Optimizer',            desc: 'Optimize your cash runway',             icon: BarChart3,      color: '#059669', badge: undefined },
  { id: 'valuation-timeline',     label: '409A / Valuation History',    desc: 'Track your valuation over time',        icon: TrendingUp,     color: '#2D4A6B', badge: undefined },
  { id: 'ai-fundraising-advisor', label: 'AI Fundraising Advisor',      desc: 'Chat with an AI fundraising expert',   icon: Sparkles,       color: '#5B4EFF', badge: 'AI' },
  { id: 'ai-market-research',     label: 'AI Market Research',          desc: 'Generate market analysis reports',      icon: BarChart3,      color: '#0EA5E9', badge: 'AI' },
  { id: 'ai-investor-email',      label: 'AI Investor Email Writer',    desc: 'Write personalized investor emails',    icon: FileText,       color: '#EC4899', badge: 'AI' },
  { id: 'ai-term-sheet',          label: 'AI Term Sheet Analyzer',      desc: 'Analyze term sheets with AI',           icon: FileText,       color: '#F97316', badge: 'AI' },
  { id: 'ai-cofounder-agreement', label: 'AI Co-founder Agreement',     desc: 'Draft co-founder agreements with AI',  icon: Users,          color: '#14B8A6', badge: 'AI' },
  { id: 'ai-due-diligence',       label: 'AI Due Diligence',            desc: 'Generate due diligence checklists',     icon: ClipboardCheck, color: '#8B5CF6', badge: 'AI' },
];
