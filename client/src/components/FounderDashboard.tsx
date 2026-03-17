/**
 * FounderDashboard — Centralized overview of the founder's startup workspace.
 *
 * Shows key metrics pulled from StartupContext (profile, valuations, COGS),
 * quick-action buttons to each major tool, and a workspace progress tracker.
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, Users, DollarSign, BarChart3, Target,
  FileText, Sparkles, ChevronRight, AlertCircle,
  ArrowUpRight, Building2, Globe, Zap, ClipboardCheck,
  GitBranch, BookOpen, Rocket, Calculator
} from 'lucide-react';
import { useStartup } from '@/contexts/StartupContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

// ── Helpers ────────────────────────────────────────────────────────────────

function formatCurrency(value: number | null, currency = 'USD'): string {
  if (value === null) return '—';
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

function formatPercent(value: number | null): string {
  if (value === null) return '—';
  return `${value.toFixed(1)}%`;
}

function computeRunway(cashOnHand: number | null, burnRate: number | null): number | null {
  if (!cashOnHand || !burnRate || burnRate <= 0) return null;
  return Math.floor(cashOnHand / burnRate);
}

// ── Types ──────────────────────────────────────────────────────────────────

interface QuickAction {
  id: string;
  labelKey: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

interface ToolProgress {
  id: string;
  label: string;
  done: boolean;
}

// ── Component ──────────────────────────────────────────────────────────────

interface FounderDashboardProps {
  onNavigate: (toolId: string) => void;
}

export default function FounderDashboard({ onNavigate }: FounderDashboardProps) {
  const { snapshot, isLoading } = useStartup();
  const { t, lang } = useLanguage();
  const isRTL = lang === 'ar';

  const runway = useMemo(
    () => computeRunway(snapshot.cashOnHand, snapshot.monthlyBurnRate),
    [snapshot.cashOnHand, snapshot.monthlyBurnRate]
  );

  const hasProfile = !!snapshot.companyName;

  // Determine which tools have been used (based on data presence)
  const toolProgress: ToolProgress[] = [
    { id: 'valuation',     label: t('navValuation'),      done: snapshot.latestValuation !== null },
    { id: 'equity-split',  label: t('navEquitySplit'),     done: false }, // no DB storage yet
    { id: 'readiness',     label: t('navReadiness'),       done: snapshot.readinessScore !== null },
    { id: 'pitch-deck',    label: t('navPitchDeck'),       done: snapshot.pitchScore !== null },
    { id: 'investor-crm',  label: t('navInvestorCRM'),     done: false }, // check via CRM data
    { id: 'cogs',          label: t('navCOGS'),            done: snapshot.latestMonthlyCOGS !== null },
    { id: 'esop',          label: t('navESOP'),            done: false },
    { id: 'safe-note',     label: t('navSAFENote'),        done: false },
  ];

  const completedCount = toolProgress.filter(t => t.done).length;
  const progressPct = Math.round((completedCount / toolProgress.length) * 100);

  const quickActions: QuickAction[] = [
    { id: 'valuation',    labelKey: 'dashboardValuationCard',   icon: TrendingUp,     color: '#C4614A', bgColor: 'oklch(0.97 0.01 30)' },
    { id: 'equity-split', labelKey: 'dashboardEquityCard',      icon: Users,          color: '#2D4A6B', bgColor: 'oklch(0.97 0.01 240)' },
    { id: 'readiness',    labelKey: 'dashboardFundraisingCard', icon: Target,         color: '#F59E0B', bgColor: 'oklch(0.97 0.02 80)' },
    { id: 'cogs',         labelKey: 'dashboardCOGSCard',        icon: Calculator,     color: '#059669', bgColor: 'oklch(0.97 0.01 160)' },
    { id: 'investor-crm', labelKey: 'dashboardInvestorsCard',   icon: Building2,      color: '#7C3AED', bgColor: 'oklch(0.97 0.01 290)' },
    { id: 'safe-note',    labelKey: 'dashboardLegalCard',       icon: FileText,       color: '#0284C7', bgColor: 'oklch(0.97 0.01 210)' },
  ];

  const metricCards = [
    {
      label: t('dashboardValuation'),
      value: formatCurrency(snapshot.latestValuation),
      icon: TrendingUp,
      color: '#C4614A',
      sub: snapshot.latestValuationDate
        ? new Date(snapshot.latestValuationDate).toLocaleDateString()
        : undefined,
    },
    {
      label: t('dashboardRunway'),
      value: runway !== null ? `${runway} ${t('dashboardMonths')}` : '—',
      icon: BarChart3,
      color: '#059669',
      sub: snapshot.cashOnHand ? `${formatCurrency(snapshot.cashOnHand)} cash` : undefined,
    },
    {
      label: t('dashboardBurnRate'),
      value: formatCurrency(snapshot.monthlyBurnRate),
      icon: DollarSign,
      color: '#F59E0B',
      sub: snapshot.monthlyBurnRate ? '/month' : undefined,
    },
    {
      label: t('dashboardRaised'),
      value: formatCurrency(snapshot.totalRaised),
      icon: ArrowUpRight,
      color: '#2D4A6B',
      sub: snapshot.stage || undefined,
    },
    {
      label: t('dashboardARR'),
      value: formatCurrency(snapshot.currentARR),
      icon: Zap,
      color: '#7C3AED',
      sub: snapshot.revenueGrowthRate
        ? `+${snapshot.revenueGrowthRate}% growth`
        : undefined,
    },
    {
      label: t('dashboardGrossMargin'),
      value: snapshot.latestGrossMarginPct !== null
        ? formatPercent(snapshot.latestGrossMarginPct)
        : formatPercent(snapshot.grossMargin),
      icon: ClipboardCheck,
      color: '#0284C7',
      sub: snapshot.latestMonthlyCOGS
        ? `COGS: ${formatCurrency(snapshot.latestMonthlyCOGS)}/mo`
        : undefined,
    },
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
      style={{ background: 'oklch(0.978 0.008 80)' }}
    >
      {/* ── Header ── */}
      <div
        className="px-6 py-5 border-b border-border"
        style={{ background: 'oklch(0.18 0.05 240)' }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1
              className="text-2xl font-bold text-white"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              {hasProfile ? snapshot.companyName : t('dashboardTitle')}
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'oklch(0.62 0.02 240)' }}>
              {hasProfile
                ? `${snapshot.sector || ''}${snapshot.sector && snapshot.stage ? ' · ' : ''}${snapshot.stage || ''}`
                : t('dashboardSubtitle')}
            </p>
          </div>
          {hasProfile && (
            <div className="flex items-center gap-2">
              {snapshot.stage && (
                <Badge
                  variant="outline"
                  className="text-xs border-white/20 text-white/70"
                >
                  {snapshot.stage}
                </Badge>
              )}
              {snapshot.country && (
                <Badge
                  variant="outline"
                  className="text-xs border-white/20 text-white/70"
                >
                  <Globe className="w-3 h-3 mr-1" />
                  {snapshot.country}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="p-5 lg:p-6 space-y-6">

        {/* ── Profile Setup CTA (if no profile) ── */}
        {!hasProfile && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800">{t('dashboardCompleteProfile')}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 border-amber-300 text-amber-700 hover:bg-amber-100"
              onClick={() => onNavigate('profile')}
            >
              {t('dashboardGoToProfile')}
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </motion.div>
        )}

        {/* ── Metrics Grid ── */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Key Metrics
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {metricCards.map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: `${card.color}18` }}
                      >
                        <card.icon className="w-4 h-4" style={{ color: card.color }} />
                      </div>
                    </div>
                    <div
                      className="text-xl font-bold"
                      style={{ color: 'oklch(0.18 0.05 240)' }}
                    >
                      {card.value}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{card.label}</div>
                    {card.sub && (
                      <div className="text-[10px] text-muted-foreground/70 mt-1">{card.sub}</div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── Quick Actions ── */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            {t('dashboardQuickActions')}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {quickActions.map((action, i) => (
              <motion.button
                key={action.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => onNavigate(action.id)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card hover:shadow-md transition-all hover:-translate-y-0.5 active:scale-95 text-center"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: action.bgColor }}
                >
                  <action.icon className="w-5 h-5" style={{ color: action.color }} />
                </div>
                <span className="text-xs font-semibold text-foreground leading-tight">
                  {t(action.labelKey as any)}
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* ── Workspace Progress ── */}
        <div>
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">
                  {t('dashboardProgress')}
                </CardTitle>
                <span className="text-xs text-muted-foreground">
                  {completedCount}/{toolProgress.length} {t('dashboardToolsCompleted')}
                </span>
              </div>
              <Progress value={progressPct} className="h-2 mt-2" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {toolProgress.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary/50 transition-colors text-left"
                  >
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                        item.done
                          ? 'bg-green-500'
                          : 'border-2 border-muted-foreground/30'
                      }`}
                    >
                      {item.done && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
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
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            All Tools
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ALL_TOOLS.map((tool, i) => (
              <motion.button
                key={tool.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => onNavigate(tool.id)}
                className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-card hover:shadow-md transition-all hover:-translate-y-0.5 active:scale-95 text-left"
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${tool.color}18` }}
                >
                  <tool.icon className="w-4.5 h-4.5" style={{ color: tool.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground truncate">{tool.label}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{tool.desc}</div>
                </div>
                {tool.badge && (
                  <Badge
                    variant="secondary"
                    className="text-[9px] shrink-0"
                    style={{ background: `${tool.color}18`, color: tool.color }}
                  >
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
  { id: 'valuation',            label: 'Valuation Calculator',        desc: '7 methods: DCF, Scorecard, Berkus…',    icon: TrendingUp,     color: '#C4614A', badge: '7 methods' },
  { id: 'equity-split',         label: 'Co-Founder Equity Split',     desc: 'Fair equity allocation for founders',   icon: Users,          color: '#2D4A6B', badge: undefined },
  { id: 'dilution',             label: 'Dilution Simulator',          desc: 'Model funding rounds & dilution',       icon: GitBranch,      color: '#8B4A38', badge: undefined },
  { id: 'vesting',              label: 'Vesting Schedule Builder',    desc: 'Design vesting for your team',          icon: BarChart3,      color: '#7C3AED', badge: undefined },
  { id: 'esop',                 label: 'ESOP / Option Pool Planner',  desc: 'Plan employee stock options',           icon: Users,          color: '#059669', badge: 'New' },
  { id: 'cogs',                 label: 'COGS & Cost Calculator',      desc: 'Calculate gross margin & burn',         icon: Calculator,     color: '#059669', badge: 'New' },
  { id: 'readiness',            label: 'Fundraising Readiness',       desc: '20-point investor readiness check',     icon: Target,         color: '#F59E0B', badge: '20 checks' },
  { id: 'pitch-deck',           label: 'Pitch Deck Scorecard',        desc: 'Score your pitch deck',                 icon: ClipboardCheck, color: '#6366F1', badge: undefined },
  { id: 'investor-crm',         label: 'Investor CRM',                desc: 'Track your investor pipeline',          icon: Building2,      color: '#C4614A', badge: undefined },
  { id: 'safe-note',            label: 'SAFE / Convertible Note',     desc: 'Build SAFE or note agreements',         icon: FileText,       color: '#7C3AED', badge: 'New' },
  { id: 'nda',                  label: 'NDA Generator',               desc: 'Generate NDAs for your startup',        icon: FileText,       color: '#0284C7', badge: 'New' },
  { id: 'free-zones',           label: 'Free Zones & Jurisdictions',  desc: 'MENA & global incorporation guide',     icon: Globe,          color: '#0284C7', badge: undefined },
  { id: 'accelerators',         label: 'Accelerator Finder',          desc: 'Find the right accelerator for you',   icon: Rocket,         color: '#10B981', badge: undefined },
  { id: 'term-sheet',           label: 'Term Sheet Glossary',         desc: '75+ terms explained simply',            icon: BookOpen,       color: '#0F1B2D', badge: '75 terms' },
  { id: 'runway',               label: 'Runway Optimizer',            desc: 'Optimize your cash runway',             icon: BarChart3,      color: '#059669', badge: undefined },
  { id: 'valuation-timeline',   label: '409A / Valuation History',    desc: 'Track your valuation over time',        icon: TrendingUp,     color: '#2D4A6B', badge: undefined },
  { id: 'ai-fundraising-advisor', label: 'AI Fundraising Advisor',   desc: 'Chat with an AI fundraising expert',   icon: Sparkles,       color: '#C4614A', badge: 'AI' },
  { id: 'ai-market-research',   label: 'AI Market Research',          desc: 'Generate market analysis reports',      icon: BarChart3,      color: '#0EA5E9', badge: 'AI' },
  { id: 'ai-investor-email',    label: 'AI Investor Email Writer',    desc: 'Write personalized investor emails',    icon: FileText,       color: '#EC4899', badge: 'AI' },
  { id: 'ai-term-sheet',        label: 'AI Term Sheet Analyzer',      desc: 'Analyze term sheets with AI',           icon: FileText,       color: '#F97316', badge: 'AI' },
  { id: 'ai-cofounder-agreement', label: 'AI Co-founder Agreement',  desc: 'Draft co-founder agreements with AI',  icon: Users,          color: '#14B8A6', badge: 'AI' },
  { id: 'ai-due-diligence',     label: 'AI Due Diligence',            desc: 'Generate due diligence checklists',     icon: ClipboardCheck, color: '#8B5CF6', badge: 'AI' },
];
