/**
 * ESOP Planner — Industry best-practice option pool management
 *
 * Features:
 *  - Pool setup: total shares, option pool size, strike price, FMV, plan type, jurisdiction
 *  - Grant management: add/edit/cancel individual grants with full lifecycle
 *  - Vesting schedule: cliff + monthly vesting, visual waterfall
 *  - Pool utilization: real-time allocated / available / vested breakdown
 *  - AI recommendation: optimal pool size and vesting terms
 *  - Grant letter generation (AI)
 */

import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { useStartup } from '@/contexts/StartupContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import {
  Users, Plus, Edit2, XCircle, TrendingUp, Award, Calendar,
  DollarSign, Percent, FileText, Sparkles, CheckCircle2, Clock, Info
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';
import { toast } from 'sonner';
import { Streamdown } from 'streamdown';

// ── Types ────────────────────────────────────────────────────────────────────
interface Grant {
  id: string;
  employeeName: string;
  employeeEmail: string;
  role: string;
  department: string;
  grantDate: string;
  startDate: string;
  shares: number;
  strikePrice: number;
  vestingMonths: number;
  cliffMonths: number;
  status: 'active' | 'exercised' | 'cancelled';
  exercisedShares: number;
  notes: string;
}

interface PlanState {
  id?: number;
  label: string;
  totalShares: number;
  currentOptionPool: number;
  pricePerShare: number;
  fmvPerShare: number;
  vestingMonths: number;
  cliffMonths: number;
  grants: Grant[];
  jurisdiction: string;
  planType: 'iso' | 'nso' | 'rsu' | 'sar';
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmtNum = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M`
  : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K`
  : n.toLocaleString();

const fmtUSD = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 4 }).format(n);

function computeVested(grant: Grant, asOf: Date = new Date()): number {
  if (grant.status === 'cancelled') return 0;
  const start = new Date(grant.startDate);
  const monthsElapsed = Math.floor(
    (asOf.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
  );
  if (monthsElapsed < grant.cliffMonths) return 0;
  const fraction = Math.min(monthsElapsed / grant.vestingMonths, 1);
  return Math.floor(grant.shares * fraction);
}

function buildVestingSchedule(grant: Grant) {
  const points: { month: number; date: string; cumulative: number; pct: number }[] = [];
  for (let m = 0; m <= grant.vestingMonths; m += 3) {
    const d = new Date(grant.startDate);
    d.setMonth(d.getMonth() + m);
    const vested = computeVested(grant, d);
    points.push({
      month: m,
      date: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      cumulative: vested,
      pct: grant.shares > 0 ? Math.round((vested / grant.shares) * 100) : 0,
    });
  }
  return points;
}

const DEPT_OPTIONS = ['Engineering', 'Product', 'Design', 'Sales', 'Marketing', 'Operations', 'Finance', 'Legal', 'HR', 'Other'];
const PLAN_TYPES = [
  { value: 'iso', label: 'ISO (Incentive Stock Options)' },
  { value: 'nso', label: 'NSO (Non-Qualified Stock Options)' },
  { value: 'rsu', label: 'RSU (Restricted Stock Units)' },
  { value: 'sar', label: 'SAR (Stock Appreciation Rights)' },
];
const JURISDICTIONS = ['Delaware', 'Cayman Islands', 'BVI', 'Singapore', 'ADGM', 'DIFC', 'Saudi Arabia', 'UAE', 'Other'];
const STATUS_CONFIG = {
  active:    { label: 'Active',    color: 'bg-green-100 text-green-700',  icon: CheckCircle2 },
  exercised: { label: 'Exercised', color: 'bg-blue-100 text-blue-700',    icon: Award },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700',      icon: XCircle },
};

const EMPTY_GRANT: Omit<Grant, 'id'> = {
  employeeName: '',
  employeeEmail: '',
  role: '',
  department: 'Engineering',
  grantDate: new Date().toISOString().split('T')[0],
  startDate: new Date().toISOString().split('T')[0],
  shares: 10000,
  strikePrice: 0.10,
  vestingMonths: 48,
  cliffMonths: 12,
  status: 'active',
  exercisedShares: 0,
  notes: '',
};

// ── Main Component ───────────────────────────────────────────────────────────
export default function ESOPPlanner() {
  const { snapshot, refresh } = useStartup();
  const { lang } = useLanguage();

  // ── Local plan state ────────────────────────────────────────────────────
  const [plan, setPlan] = useState<PlanState>({
    label: 'ESOP Plan',
    totalShares: snapshot.esopTotalShares ?? 10_000_000,
    currentOptionPool: snapshot.currentOptionPool ?? 1_000_000,
    pricePerShare: snapshot.esopPricePerShare ?? 0.10,
    fmvPerShare: (snapshot as any).esopFmvPerShare ?? 0.10,
    vestingMonths: 48,
    cliffMonths: 12,
    grants: [],
    jurisdiction: (snapshot as any).esopJurisdiction ?? 'Delaware',
    planType: ((snapshot as any).esopPlanType as any) ?? 'iso',
  });

  const [activeTab, setActiveTab] = useState('overview');
  const [grantDialog, setGrantDialog] = useState<{ open: boolean; grant: Omit<Grant, 'id'> & { id?: string } }>({
    open: false,
    grant: { ...EMPTY_GRANT },
  });
  const [selectedGrantId, setSelectedGrantId] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [letterLoading, setLetterLoading] = useState(false);
  const [letterContent, setLetterContent] = useState<string | null>(null);
  const [letterDialog, setLetterDialog] = useState(false);

  // ── Load active plan ────────────────────────────────────────────────────
  trpc.esop.getActive.useQuery(undefined, {
    onSuccess: (data: any) => {
      if (data && !plan.id) {
        setPlan({
          id: data.id,
          label: data.label ?? 'ESOP Plan',
          totalShares: Number(data.totalShares) || 10_000_000,
          currentOptionPool: Number(data.currentOptionPool) || 1_000_000,
          pricePerShare: Number(data.pricePerShare) || 0.10,
          fmvPerShare: Number(data.fmvPerShare) || 0.10,
          vestingMonths: Number(data.vestingMonths) || 48,
          cliffMonths: Number(data.cliffMonths) || 12,
          grants: (data.grants as Grant[] | null) ?? [],
          jurisdiction: data.jurisdiction ?? 'Delaware',
          planType: (data.planType as any) ?? 'iso',
        });
      }
    },
  } as any);

  // ── Mutations ───────────────────────────────────────────────────────────
  const saveMutation = trpc.esop.save.useMutation({
    onSuccess: () => { toast.success('Plan saved'); refresh(); },
    onError: (e: any) => toast.error(e.message),
  });

  const aiMutation = trpc.ai.esopRecommendation.useMutation({
    onSuccess: (data: any) => {
      setAiResult(data.analysis ?? data.recommendation ?? data.content ?? JSON.stringify(data));
      setAiLoading(false);
    },
    onError: (e: any) => { toast.error(e.message); setAiLoading(false); },
  });

  const letterMutation = trpc.ai.generateGrantLetter.useMutation({
    onSuccess: (data: any) => {
      setLetterContent(data.letter ?? data.content ?? '');
      setLetterLoading(false);
      setLetterDialog(true);
    },
    onError: (e: any) => { toast.error(e.message); setLetterLoading(false); },
  });

  // ── Derived pool summary ────────────────────────────────────────────────
  const poolSummary = useMemo(() => {
    const activeGrants = plan.grants.filter(g => g.status !== 'cancelled');
    const allocated = activeGrants.reduce((s, g) => s + g.shares, 0);
    const vested = activeGrants.reduce((s, g) => s + computeVested(g), 0);
    const exercised = activeGrants.reduce((s, g) => s + (g.exercisedShares ?? 0), 0);
    const available = Math.max(0, plan.currentOptionPool - allocated);
    const utilPct = plan.currentOptionPool > 0 ? (allocated / plan.currentOptionPool) * 100 : 0;
    const poolAsPct = plan.totalShares > 0 ? (plan.currentOptionPool / plan.totalShares) * 100 : 0;
    return { allocated, vested, exercised, available, utilPct, poolAsPct, grantCount: activeGrants.length };
  }, [plan]);

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleSavePlan = () => {
    saveMutation.mutate({
      id: plan.id,
      label: plan.label,
      totalShares: plan.totalShares,
      currentOptionPool: plan.currentOptionPool,
      pricePerShare: plan.pricePerShare,
      fmvPerShare: plan.fmvPerShare,
      vestingMonths: plan.vestingMonths,
      cliffMonths: plan.cliffMonths,
      grants: plan.grants,
      jurisdiction: plan.jurisdiction,
      planType: plan.planType,
    });
  };

  const handleSaveGrant = () => {
    const g = grantDialog.grant;
    if (!g.employeeName.trim()) { toast.error('Employee name is required'); return; }
    if (!g.role.trim()) { toast.error('Role is required'); return; }
    if (g.shares <= 0) { toast.error('Shares must be positive'); return; }

    const grant: Grant = {
      id: g.id ?? `grant-${Date.now()}`,
      employeeName: g.employeeName,
      employeeEmail: g.employeeEmail,
      role: g.role,
      department: g.department,
      grantDate: g.grantDate,
      startDate: g.startDate,
      shares: g.shares,
      strikePrice: g.strikePrice,
      vestingMonths: g.vestingMonths,
      cliffMonths: g.cliffMonths,
      status: g.status,
      exercisedShares: g.exercisedShares,
      notes: g.notes,
    };

    setPlan(prev => ({
      ...prev,
      grants: g.id
        ? prev.grants.map(x => x.id === g.id ? grant : x)
        : [...prev.grants, grant],
    }));

    setGrantDialog({ open: false, grant: { ...EMPTY_GRANT } });
    toast.success(g.id ? 'Grant updated' : 'Grant added — save the plan to persist');
  };

  const handleCancelGrant = (grantId: string) => {
    setPlan(prev => ({
      ...prev,
      grants: prev.grants.map(g => g.id === grantId ? { ...g, status: 'cancelled' as const } : g),
    }));
    toast.info('Grant cancelled — save the plan to persist');
  };

  const handleAIRecommendation = () => {
    setAiLoading(true);
    aiMutation.mutate({
      companyName: plan.label,
      stage: snapshot.stage ?? 'seed',
      totalShares: plan.totalShares,
      currentOptionPool: plan.currentOptionPool,
      plannedHires: 5,
      seniorHires: 2,
      jurisdiction: plan.jurisdiction,
      nextRoundSize: 2_000_000,
      language: lang === 'ar' ? 'arabic' : 'english',
    });
  };

  const handleGenerateLetter = (grant: Grant) => {
    setLetterLoading(true);
    letterMutation.mutate({
      companyName: snapshot.companyName || plan.label || 'The Company',
      employeeName: grant.employeeName,
      employeeRole: grant.role,
      grantDate: grant.grantDate,
      shares: grant.shares,
      strikePrice: grant.strikePrice,
      vestingMonths: grant.vestingMonths,
      cliffMonths: grant.cliffMonths,
      jurisdiction: plan.jurisdiction,
      pricePerShare: plan.pricePerShare,
      language: lang === 'ar' ? 'arabic' : 'english',
    });
  };

  const selectedGrant = plan.grants.find(g => g.id === selectedGrantId) ?? null;
  const vestingData = selectedGrant ? buildVestingSchedule(selectedGrant) : [];

  // ── Pool utilization bar chart data ────────────────────────────────────
  const poolChartData = [
    { name: 'Vested', value: poolSummary.vested, fill: '#10B981' },
    { name: 'Unvested', value: poolSummary.allocated - poolSummary.vested, fill: '#3B82F6' },
    { name: 'Available', value: poolSummary.available, fill: '#D1D5DB' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6 p-1">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">ESOP / Option Pool Planner</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your employee equity program following industry best practices
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleAIRecommendation} disabled={aiLoading}>
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            {aiLoading ? 'Analyzing…' : 'AI Recommendation'}
          </Button>
          <Button size="sm" onClick={handleSavePlan} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Saving…' : 'Save Plan'}
          </Button>
        </div>
      </div>

      {/* ── Pool KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Option Pool', value: fmtNum(plan.currentOptionPool), sub: `${poolSummary.poolAsPct.toFixed(1)}% of total`, icon: Percent, color: 'text-purple-600' },
          { label: 'Allocated', value: fmtNum(poolSummary.allocated), sub: `${poolSummary.utilPct.toFixed(1)}% utilised`, icon: Users, color: 'text-blue-600' },
          { label: 'Vested Today', value: fmtNum(poolSummary.vested), sub: `${poolSummary.grantCount} active grants`, icon: CheckCircle2, color: 'text-green-600' },
          { label: 'Strike Price', value: fmtUSD(plan.pricePerShare), sub: `FMV: ${fmtUSD(plan.fmvPerShare)}`, icon: DollarSign, color: 'text-amber-600' },
        ].map(card => (
          <Card key={card.label} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <card.icon className={`w-4 h-4 ${card.color}`} />
                <span className="text-xs text-muted-foreground">{card.label}</span>
              </div>
              <div className="text-xl font-bold text-foreground">{card.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{card.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Pool Utilization Progress ── */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Pool Utilization</span>
            <span className="text-sm text-muted-foreground">{fmtNum(poolSummary.allocated)} / {fmtNum(plan.currentOptionPool)} shares</span>
          </div>
          <Progress value={Math.min(poolSummary.utilPct, 100)} className="h-3" />
          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />Vested: {fmtNum(poolSummary.vested)}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />Unvested: {fmtNum(poolSummary.allocated - poolSummary.vested)}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-300 inline-block" />Available: {fmtNum(poolSummary.available)}</span>
          </div>
        </CardContent>
      </Card>

      {/* ── Tabs ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="grants">Grants ({poolSummary.grantCount})</TabsTrigger>
          <TabsTrigger value="vesting">Vesting</TabsTrigger>
          <TabsTrigger value="settings">Plan Settings</TabsTrigger>
        </TabsList>

        {/* ── OVERVIEW TAB ── */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm">Pool Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              {poolChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={poolChartData} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tickFormatter={v => fmtNum(v)} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                    <Tooltip formatter={(v: any) => fmtNum(Number(v))} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {poolChartData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No grants added yet. Add grants to see pool breakdown.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-blue-50/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-2 mb-3">
                <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <span className="text-sm font-semibold text-blue-800">ESOP Best Practices</span>
              </div>
              <ul className="space-y-1.5 text-xs text-blue-700">
                <li>• <strong>Pool size:</strong> 10–20% of fully diluted shares is standard for seed/Series A</li>
                <li>• <strong>Standard vesting:</strong> 4 years with 1-year cliff (industry standard)</li>
                <li>• <strong>Strike price:</strong> Set at FMV (409A valuation) to avoid tax issues</li>
                <li>• <strong>ISO vs NSO:</strong> ISOs for US employees (tax-advantaged); NSOs for contractors/advisors</li>
                <li>• <strong>Refresh grants:</strong> Issue top-up grants every 2–3 years to retain key employees</li>
                <li>• <strong>Acceleration:</strong> Consider single-trigger (change of control) for senior hires</li>
              </ul>
            </CardContent>
          </Card>

          {aiResult && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  AI Recommendation
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="prose prose-sm max-w-none text-sm">
                  <Streamdown>{aiResult}</Streamdown>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── GRANTS TAB ── */}
        <TabsContent value="grants" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">{poolSummary.grantCount} active grants · {fmtNum(poolSummary.allocated)} shares allocated</p>
            <Button size="sm" onClick={() => setGrantDialog({ open: true, grant: { ...EMPTY_GRANT, strikePrice: plan.pricePerShare, vestingMonths: plan.vestingMonths, cliffMonths: plan.cliffMonths } })}>
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Add Grant
            </Button>
          </div>

          {plan.grants.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="p-8 text-center">
                <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground mb-1">No grants yet</p>
                <p className="text-xs text-muted-foreground mb-4">Add your first employee stock option grant to get started</p>
                <Button size="sm" onClick={() => setGrantDialog({ open: true, grant: { ...EMPTY_GRANT, strikePrice: plan.pricePerShare } })}>
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Add First Grant
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {plan.grants.map(grant => {
                const vested = computeVested(grant);
                const vestPct = grant.shares > 0 ? (vested / grant.shares) * 100 : 0;
                const cfg = STATUS_CONFIG[grant.status];
                const StatusIcon = cfg.icon;
                return (
                  <Card key={grant.id} className={`border-0 shadow-sm ${grant.status === 'cancelled' ? 'opacity-50' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-foreground">{grant.employeeName}</span>
                            <span className="text-xs text-muted-foreground">{grant.role}</span>
                            <Badge variant="outline" className={`text-xs ${cfg.color} border-0`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {cfg.label}
                            </Badge>
                            <Badge variant="outline" className="text-xs">{grant.department}</Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-xs text-muted-foreground">
                            <span><strong className="text-foreground">{fmtNum(grant.shares)}</strong> shares</span>
                            <span>Strike: <strong className="text-foreground">{fmtUSD(grant.strikePrice)}</strong></span>
                            <span>Cliff: <strong className="text-foreground">{grant.cliffMonths}mo</strong> · Vest: <strong className="text-foreground">{grant.vestingMonths}mo</strong></span>
                            <span>Start: <strong className="text-foreground">{new Date(grant.startDate).toLocaleDateString()}</strong></span>
                          </div>
                          {grant.status === 'active' && (
                            <div className="mt-2">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-muted-foreground">Vested</span>
                                <span className="font-medium">{fmtNum(vested)} ({vestPct.toFixed(0)}%)</span>
                              </div>
                              <Progress value={vestPct} className="h-1.5" />
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button
                            variant="ghost" size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              setSelectedGrantId(grant.id);
                              setActiveTab('vesting');
                            }}
                            title="View vesting schedule"
                          >
                            <TrendingUp className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            className="h-7 w-7"
                            onClick={() => handleGenerateLetter(grant)}
                            disabled={letterLoading}
                            title="Generate grant letter"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </Button>
                          {grant.status === 'active' && (
                            <>
                              <Button
                                variant="ghost" size="icon"
                                className="h-7 w-7"
                                onClick={() => setGrantDialog({ open: true, grant: { ...grant } })}
                                title="Edit grant"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost" size="icon"
                                className="h-7 w-7 text-red-500 hover:text-red-600"
                                onClick={() => handleCancelGrant(grant.id)}
                                title="Cancel grant"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── VESTING TAB ── */}
        <TabsContent value="vesting" className="mt-4 space-y-4">
          {plan.grants.filter(g => g.status === 'active').length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="p-8 text-center">
                <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Add grants to see vesting schedules</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <Label className="text-sm shrink-0">Select grant:</Label>
                <Select value={selectedGrantId ?? ''} onValueChange={setSelectedGrantId}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Choose a grant…" />
                  </SelectTrigger>
                  <SelectContent>
                    {plan.grants.filter(g => g.status === 'active').map(g => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.employeeName} — {fmtNum(g.shares)} shares
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedGrant && (
                <>
                  <Card className="border-0 shadow-sm bg-muted/30">
                    <CardContent className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div><div className="text-xs text-muted-foreground">Employee</div><div className="font-semibold">{selectedGrant.employeeName}</div></div>
                      <div><div className="text-xs text-muted-foreground">Total Shares</div><div className="font-semibold">{fmtNum(selectedGrant.shares)}</div></div>
                      <div><div className="text-xs text-muted-foreground">Vested Today</div><div className="font-semibold text-green-600">{fmtNum(computeVested(selectedGrant))}</div></div>
                      <div><div className="text-xs text-muted-foreground">Cliff / Vesting</div><div className="font-semibold">{selectedGrant.cliffMonths}mo / {selectedGrant.vestingMonths}mo</div></div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-2 pt-4">
                      <CardTitle className="text-sm">Cumulative Vesting Schedule</CardTitle>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={vestingData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                          <defs>
                            <linearGradient id="vestGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={3} />
                          <YAxis tickFormatter={v => fmtNum(v)} tick={{ fontSize: 11 }} />
                          <Tooltip formatter={(v: any) => fmtNum(Number(v))} labelFormatter={(l) => `${l}`} />
                          <Area type="stepAfter" dataKey="cumulative" stroke="#10B981" fill="url(#vestGrad)" strokeWidth={2} name="Vested Shares" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-sm bg-amber-50/50">
                    <CardContent className="p-3 flex items-start gap-2">
                      <Clock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                      <div className="text-xs text-amber-800">
                        <strong>Cliff date:</strong>{' '}
                        {(() => {
                          const d = new Date(selectedGrant.startDate);
                          d.setMonth(d.getMonth() + selectedGrant.cliffMonths);
                          return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                        })()}
                        {' '}— {fmtNum(Math.floor(selectedGrant.shares * (selectedGrant.cliffMonths / selectedGrant.vestingMonths)))} shares vest at cliff ({selectedGrant.cliffMonths} months),
                        then {fmtNum(Math.floor(selectedGrant.shares / selectedGrant.vestingMonths))} shares/month until fully vested.
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </>
          )}
        </TabsContent>

        {/* ── SETTINGS TAB ── */}
        <TabsContent value="settings" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs mb-1.5 block">Plan Name</Label>
                  <Input value={plan.label} onChange={e => setPlan(p => ({ ...p, label: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs mb-1.5 block">Plan Type</Label>
                  <Select value={plan.planType} onValueChange={v => setPlan(p => ({ ...p, planType: v as any }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PLAN_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs mb-1.5 block">Total Company Shares</Label>
                  <Input type="number" value={plan.totalShares} onChange={e => setPlan(p => ({ ...p, totalShares: Number(e.target.value) }))} />
                </div>
                <div>
                  <Label className="text-xs mb-1.5 block">Option Pool Size (shares)</Label>
                  <Input type="number" value={plan.currentOptionPool} onChange={e => setPlan(p => ({ ...p, currentOptionPool: Number(e.target.value) }))} />
                </div>
                <div>
                  <Label className="text-xs mb-1.5 block">Strike Price (default, $)</Label>
                  <Input type="number" step="0.001" value={plan.pricePerShare} onChange={e => setPlan(p => ({ ...p, pricePerShare: Number(e.target.value) }))} />
                </div>
                <div>
                  <Label className="text-xs mb-1.5 block">FMV / 409A Price ($)</Label>
                  <Input type="number" step="0.001" value={plan.fmvPerShare} onChange={e => setPlan(p => ({ ...p, fmvPerShare: Number(e.target.value) }))} />
                </div>
                <div>
                  <Label className="text-xs mb-1.5 block">Default Vesting (months)</Label>
                  <Input type="number" value={plan.vestingMonths} onChange={e => setPlan(p => ({ ...p, vestingMonths: Number(e.target.value) }))} />
                </div>
                <div>
                  <Label className="text-xs mb-1.5 block">Default Cliff (months)</Label>
                  <Input type="number" value={plan.cliffMonths} onChange={e => setPlan(p => ({ ...p, cliffMonths: Number(e.target.value) }))} />
                </div>
                <div>
                  <Label className="text-xs mb-1.5 block">Jurisdiction</Label>
                  <Select value={plan.jurisdiction} onValueChange={v => setPlan(p => ({ ...p, jurisdiction: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {JURISDICTIONS.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleSavePlan} disabled={saveMutation.isPending} className="w-full">
                {saveMutation.isPending ? 'Saving…' : 'Save Plan Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Add / Edit Grant Dialog ── */}
      <Dialog open={grantDialog.open} onOpenChange={open => setGrantDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{grantDialog.grant.id ? 'Edit Grant' : 'Add New Grant'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-xs mb-1 block">Employee Name *</Label>
                <Input
                  placeholder="Jane Smith"
                  value={grantDialog.grant.employeeName}
                  onChange={e => setGrantDialog(prev => ({ ...prev, grant: { ...prev.grant, employeeName: e.target.value } }))}
                />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Email</Label>
                <Input
                  type="email"
                  placeholder="jane@company.com"
                  value={grantDialog.grant.employeeEmail}
                  onChange={e => setGrantDialog(prev => ({ ...prev, grant: { ...prev.grant, employeeEmail: e.target.value } }))}
                />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Role / Title *</Label>
                <Input
                  placeholder="Senior Engineer"
                  value={grantDialog.grant.role}
                  onChange={e => setGrantDialog(prev => ({ ...prev, grant: { ...prev.grant, role: e.target.value } }))}
                />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Department</Label>
                <Select value={grantDialog.grant.department} onValueChange={v => setGrantDialog(prev => ({ ...prev, grant: { ...prev.grant, department: v } }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DEPT_OPTIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1 block">Shares *</Label>
                <Input
                  type="number"
                  value={grantDialog.grant.shares}
                  onChange={e => setGrantDialog(prev => ({ ...prev, grant: { ...prev.grant, shares: Number(e.target.value) } }))}
                />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Strike Price ($)</Label>
                <Input
                  type="number" step="0.001"
                  value={grantDialog.grant.strikePrice}
                  onChange={e => setGrantDialog(prev => ({ ...prev, grant: { ...prev.grant, strikePrice: Number(e.target.value) } }))}
                />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Grant Date</Label>
                <Input
                  type="date"
                  value={grantDialog.grant.grantDate}
                  onChange={e => setGrantDialog(prev => ({ ...prev, grant: { ...prev.grant, grantDate: e.target.value } }))}
                />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Vesting Start Date</Label>
                <Input
                  type="date"
                  value={grantDialog.grant.startDate}
                  onChange={e => setGrantDialog(prev => ({ ...prev, grant: { ...prev.grant, startDate: e.target.value } }))}
                />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Vesting Period (months)</Label>
                <Input
                  type="number"
                  value={grantDialog.grant.vestingMonths}
                  onChange={e => setGrantDialog(prev => ({ ...prev, grant: { ...prev.grant, vestingMonths: Number(e.target.value) } }))}
                />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Cliff (months)</Label>
                <Input
                  type="number"
                  value={grantDialog.grant.cliffMonths}
                  onChange={e => setGrantDialog(prev => ({ ...prev, grant: { ...prev.grant, cliffMonths: Number(e.target.value) } }))}
                />
              </div>
              {grantDialog.grant.id && (
                <div>
                  <Label className="text-xs mb-1 block">Status</Label>
                  <Select value={grantDialog.grant.status} onValueChange={v => setGrantDialog(prev => ({ ...prev, grant: { ...prev.grant, status: v as any } }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="exercised">Exercised</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="col-span-2">
                <Label className="text-xs mb-1 block">Notes</Label>
                <Textarea
                  placeholder="Optional notes about this grant…"
                  value={grantDialog.grant.notes}
                  onChange={e => setGrantDialog(prev => ({ ...prev, grant: { ...prev.grant, notes: e.target.value } }))}
                  rows={2}
                />
              </div>
            </div>
            {grantDialog.grant.shares > 0 && plan.totalShares > 0 && (
              <div className="bg-muted/40 rounded-lg p-3 text-xs text-muted-foreground">
                <strong>Preview:</strong> {fmtNum(grantDialog.grant.shares)} shares = {((grantDialog.grant.shares / plan.totalShares) * 100).toFixed(3)}% of total ·
                Value at FMV: {fmtUSD(grantDialog.grant.shares * plan.fmvPerShare)} ·
                Cliff vests: {fmtNum(Math.floor(grantDialog.grant.shares * (grantDialog.grant.cliffMonths / grantDialog.grant.vestingMonths)))} shares after {grantDialog.grant.cliffMonths} months
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGrantDialog({ open: false, grant: { ...EMPTY_GRANT } })}>Cancel</Button>
            <Button onClick={handleSaveGrant}>
              {grantDialog.grant.id ? 'Update Grant' : 'Add Grant'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Grant Letter Dialog ── */}
      <Dialog open={letterDialog} onOpenChange={setLetterDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Stock Option Grant Letter</DialogTitle>
          </DialogHeader>
          <div className="prose prose-sm max-w-none text-sm py-2">
            {letterContent && <Streamdown>{letterContent}</Streamdown>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLetterDialog(false)}>Close</Button>
            <Button onClick={() => {
              if (letterContent) {
                const blob = new Blob([letterContent], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = 'grant-letter.txt'; a.click();
                URL.revokeObjectURL(url);
              }
            }}>Download</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
