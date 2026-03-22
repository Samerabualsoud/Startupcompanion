/**
 * VestingScheduleBuilder — Interactive equity vesting schedule tool
 * Design: "Venture Capital Clarity" — Editorial Finance
 * Features: multi-stakeholder, cliff, custom schedules, visual chart, AI recommendations
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Info, Download, Calendar, Users, TrendingUp, Clock, Sparkles, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { nanoid } from 'nanoid';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip,
  ResponsiveContainer, Legend, BarChart, Bar, Cell,
} from 'recharts';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCapTable } from '@/hooks/useCapTable';
import { Link2, RefreshCw } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type VestingType = 'standard' | 'backloaded' | 'milestone' | 'immediate';

interface Stakeholder {
  id: string;
  name: string;
  role: string;
  totalShares: number;
  vestingMonths: number;
  cliffMonths: number;
  vestingType: VestingType;
  color: string;
  startMonth: number; // offset from company founding
}

interface MilestoneEvent {
  id: string;
  stakeholderId: string;
  month: number;
  pct: number; // % of total shares unlocked at this milestone
  label: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STAKEHOLDER_COLORS = [
  '#C4614A', '#2D4A6B', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#0EA5E9', '#14B8A6',
];

const VESTING_TYPE_LABELS: Record<VestingType, string> = {
  standard: 'Standard (linear monthly)',
  backloaded: 'Back-loaded (more later)',
  milestone: 'Milestone-based',
  immediate: 'Immediate (fully vested)',
};

const ROLE_OPTIONS = [
  'CEO / Co-founder', 'CTO / Co-founder', 'COO / Co-founder', 'CFO / Co-founder',
  'Early Employee', 'Advisor', 'Investor (SAFE/Note)', 'ESOP Pool',
  'Contractor', 'Other',
];

const DEFAULT_STAKEHOLDERS: Stakeholder[] = [
  { id: nanoid(), name: 'Founder 1', role: 'CEO / Co-founder', totalShares: 3_000_000, vestingMonths: 48, cliffMonths: 12, vestingType: 'standard', color: STAKEHOLDER_COLORS[0], startMonth: 0 },
  { id: nanoid(), name: 'Founder 2', role: 'CTO / Co-founder', totalShares: 2_500_000, vestingMonths: 48, cliffMonths: 12, vestingType: 'standard', color: STAKEHOLDER_COLORS[1], startMonth: 0 },
  { id: nanoid(), name: 'ESOP Pool', role: 'ESOP Pool', totalShares: 1_000_000, vestingMonths: 48, cliffMonths: 0, vestingType: 'standard', color: STAKEHOLDER_COLORS[2], startMonth: 0 },
];

// ─── Calculation Engine ───────────────────────────────────────────────────────

function calcVestedAtMonth(s: Stakeholder, milestones: MilestoneEvent[], absoluteMonth: number): number {
  const relMonth = absoluteMonth - s.startMonth;
  if (relMonth <= 0) return 0;
  if (s.vestingType === 'immediate') return s.totalShares;
  if (s.vestingType === 'milestone') {
    const reached = milestones
      .filter(m => m.stakeholderId === s.id && m.month <= relMonth)
      .reduce((sum, m) => sum + m.pct, 0);
    return Math.round((Math.min(reached, 100) / 100) * s.totalShares);
  }
  if (relMonth < s.cliffMonths) return 0;
  const postCliff = relMonth - s.cliffMonths;
  const vestingAfterCliff = s.vestingMonths - s.cliffMonths;
  if (vestingAfterCliff <= 0) return s.totalShares;
  let ratio: number;
  if (s.vestingType === 'backloaded') {
    // quadratic back-loading: more shares vest in later months
    const t = Math.min(postCliff / vestingAfterCliff, 1);
    ratio = t * t;
  } else {
    // standard linear
    ratio = Math.min(postCliff / vestingAfterCliff, 1);
  }
  // cliff tranche: shares that vest at cliff date
  const cliffShares = s.cliffMonths > 0 ? Math.round((s.cliffMonths / s.vestingMonths) * s.totalShares) : 0;
  const remainingShares = s.totalShares - cliffShares;
  return Math.round(cliffShares + ratio * remainingShares);
}

function buildChartData(stakeholders: Stakeholder[], milestones: MilestoneEvent[], totalMonths: number) {
  const data: Record<string, any>[] = [];
  for (let m = 0; m <= totalMonths; m += (totalMonths > 60 ? 3 : 1)) {
    const point: Record<string, any> = { month: m };
    let total = 0;
    for (const s of stakeholders) {
      const vested = calcVestedAtMonth(s, milestones, m);
      point[s.id] = vested;
      total += vested;
    }
    point['_total'] = total;
    data.push(point);
  }
  return data;
}

function buildScheduleTable(s: Stakeholder, milestones: MilestoneEvent[]) {
  const rows: { month: number; vested: number; newlyVested: number; pct: number }[] = [];
  const checkpoints = [0, s.cliffMonths, ...Array.from({ length: Math.ceil(s.vestingMonths / 12) }, (_, i) => (i + 1) * 12), s.vestingMonths].filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b);
  let prev = 0;
  for (const m of checkpoints) {
    const vested = calcVestedAtMonth(s, milestones, m + s.startMonth);
    rows.push({ month: m, vested, newlyVested: vested - prev, pct: s.totalShares > 0 ? Math.round((vested / s.totalShares) * 100) : 0 });
    prev = vested;
  }
  return rows;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(0)}K` : `${n}`;
const fmtPct = (n: number) => `${n.toFixed(1)}%`;

// ─── Component ────────────────────────────────────────────────────────────────

export default function VestingScheduleBuilder() {
  const { lang } = useLanguage();
  const { state: capState, isLoading: capLoading } = useCapTable();

  // Build stakeholders from cap table on first load
  const [synced, setSynced] = useState(false);
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>(DEFAULT_STAKEHOLDERS);

  // Sync from cap table once it loads
  useMemo(() => {
    if (!capLoading && capState && !synced) {
      const result: Stakeholder[] = [];
      capState.shareholders
        .filter(s => s.type === 'founder')
        .forEach((f, i) => {
          result.push({
            id: f.id,
            name: f.name,
            role: 'CEO / Co-founder',
            totalShares: f.shares,
            vestingMonths: f.vestingMonths ?? 48,
            cliffMonths: f.cliffMonths ?? 12,
            vestingType: 'standard',
            color: STAKEHOLDER_COLORS[i % STAKEHOLDER_COLORS.length],
            startMonth: 0,
          });
        });
      const grants = capState.esop.grants ?? [];
      const activeGrants = grants.filter(g => g.status === 'active');
      if (activeGrants.length > 0) {
        activeGrants.forEach((g, i) => {
          result.push({
            id: g.id,
            name: g.employeeName || `Employee ${i + 1}`,
            role: g.employeeTitle || 'Early Employee',
            totalShares: g.shares,
            vestingMonths: g.vestingMonths,
            cliffMonths: g.cliffMonths,
            vestingType: 'standard',
            color: STAKEHOLDER_COLORS[(result.length) % STAKEHOLDER_COLORS.length],
            startMonth: 0,
          });
        });
      } else if (capState.esop.totalPoolShares > 0) {
        result.push({
          id: 'esop-pool',
          name: 'ESOP Pool',
          role: 'ESOP Pool',
          totalShares: capState.esop.totalPoolShares,
          vestingMonths: capState.esop.vestingMonths,
          cliffMonths: capState.esop.cliffMonths,
          vestingType: 'standard',
          color: STAKEHOLDER_COLORS[result.length % STAKEHOLDER_COLORS.length],
          startMonth: 0,
        });
      }
      if (result.length > 0) setStakeholders(result);
      setSynced(true);
    }
  }, [capLoading, capState, synced]);
  const [milestones, setMilestones] = useState<MilestoneEvent[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'chart' | 'table' | 'summary'>('chart');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<string | null>(null);
  const [showAiPanel, setShowAiPanel] = useState(false);

  // New stakeholder form
  const [newForm, setNewForm] = useState<Omit<Stakeholder, 'id' | 'color'>>({
    name: '', role: 'Early Employee', totalShares: 500_000, vestingMonths: 48, cliffMonths: 12, vestingType: 'standard', startMonth: 0,
  });

  const totalMonths = useMemo(() => Math.max(...stakeholders.map(s => s.startMonth + s.vestingMonths), 48), [stakeholders]);
  const chartData = useMemo(() => buildChartData(stakeholders, milestones, totalMonths), [stakeholders, milestones, totalMonths]);
  const totalShares = useMemo(() => stakeholders.reduce((s, k) => s + k.totalShares, 0), [stakeholders]);

  const aiMutation = trpc.ai.vestingRecommendation.useMutation({
    onSuccess: (data) => {
      setAiRecommendation(data.recommendation);
      setAiLoading(false);
    },
    onError: () => {
      toast.error('AI recommendation failed. Please try again.');
      setAiLoading(false);
    },
  });

  const handleAiRecommend = () => {
    setAiLoading(true);
    setShowAiPanel(true);
    aiMutation.mutate({
      stakeholders: stakeholders.map(s => ({
        name: s.name,
        role: s.role,
        shares: s.totalShares,
        vestingMonths: s.vestingMonths,
        cliffMonths: s.cliffMonths,
        vestingType: s.vestingType,
      })),
      totalShares,
      language: lang === 'ar' ? 'arabic' : 'english',
    });
  };

  const addStakeholder = () => {
    if (!newForm.name.trim()) { toast.error('Please enter a name'); return; }
    const color = STAKEHOLDER_COLORS[stakeholders.length % STAKEHOLDER_COLORS.length];
    setStakeholders(s => [...s, { ...newForm, id: nanoid(), color }]);
    setNewForm({ name: '', role: 'Early Employee', totalShares: 500_000, vestingMonths: 48, cliffMonths: 12, vestingType: 'standard', startMonth: 0 });
    setShowAdd(false);
    toast.success('Stakeholder added');
  };

  const removeStakeholder = (id: string) => {
    setStakeholders(s => s.filter(x => x.id !== id));
    setMilestones(m => m.filter(x => x.stakeholderId !== id));
  };

  const updateStakeholder = (id: string, patch: Partial<Stakeholder>) => {
    setStakeholders(s => s.map(x => x.id === id ? { ...x, ...patch } : x));
  };

  const downloadCSV = () => {
    const rows = ['Month,' + stakeholders.map(s => `"${s.name}"`).join(',') + ',Total'];
    for (const pt of chartData) {
      const vals = stakeholders.map(s => pt[s.id] ?? 0);
      rows.push(`${pt.month},${vals.join(',')},${pt['_total']}`);
    }
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'vesting-schedule.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-card border border-border rounded-xl p-3 shadow-lg text-xs min-w-[160px]">
        <div className="font-bold text-foreground mb-2">Month {label}</div>
        {payload.map((p: any) => {
          const s = stakeholders.find(x => x.id === p.dataKey);
          if (!s) return null;
          return (
            <div key={p.dataKey} className="flex justify-between gap-4 mb-1">
              <span style={{ color: p.stroke }}>{s.name}</span>
              <span className="font-mono font-semibold text-foreground">{fmt(p.value)}</span>
            </div>
          );
        })}
        <div className="border-t border-border mt-2 pt-2 flex justify-between">
          <span className="text-muted-foreground">Total Vested</span>
          <span className="font-mono font-bold text-foreground">{fmt(payload.reduce((s: number, p: any) => s + (p.value || 0), 0))}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5 pb-8">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Vesting Schedule Builder
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Model equity vesting for founders, employees, and advisors — with cliff, back-loading, and milestone options.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          {/* Cap table sync badge */}
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-2 py-1 rounded-full">
            <Link2 className="w-3 h-3" />
            <span>Synced with Cap Table</span>
          </div>
          {/* Re-sync button */}
          <button
            onClick={() => { setSynced(false); }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-border text-muted-foreground hover:bg-secondary/40 transition-all"
            title="Re-sync founders and ESOP grants from Cap Table"
          >
            <RefreshCw className="w-3 h-3" /> Re-sync
          </button>
          <button
            onClick={handleAiRecommend}
            disabled={aiLoading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
            style={{ background: 'var(--primary)' }}
          >
            {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            AI Review
          </button>
          <button
            onClick={downloadCSV}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border border-border text-foreground hover:bg-secondary/40 transition-all"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button
            onClick={() => setShowAdd(v => !v)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border border-border text-foreground hover:bg-secondary/40 transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Add Stakeholder
          </button>
        </div>
      </div>

      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Shares', value: fmt(totalShares), icon: TrendingUp, color: '#C4614A' },
          { label: 'Stakeholders', value: stakeholders.length.toString(), icon: Users, color: '#2D4A6B' },
          { label: 'Vesting Period', value: `${totalMonths}mo`, icon: Calendar, color: '#10B981' },
          { label: 'Vested at 12mo', value: fmtPct(totalShares > 0 ? (chartData.find(d => d.month === 12)?.['_total'] ?? 0) / totalShares * 100 : 0), icon: Clock, color: '#F59E0B' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-3.5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: `${color}18` }}>
                <Icon className="w-3.5 h-3.5" style={{ color }} />
              </div>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
            </div>
            <div className="text-xl font-bold text-foreground font-mono">{value}</div>
          </div>
        ))}
      </div>

      {/* ── AI Recommendation Panel ── */}
      <AnimatePresence>
        {showAiPanel && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="border border-border rounded-xl p-4 bg-card"
            style={{ borderLeft: '3px solid #5B4EFF' }}>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4" style={{ color: 'var(--primary)' }} />
              <span className="text-sm font-semibold text-foreground">AI Vesting Review</span>
              <button onClick={() => setShowAiPanel(false)} className="ml-auto text-muted-foreground hover:text-foreground">✕</button>
            </div>
            {aiLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Analysing your vesting structure…
              </div>
            ) : (
              <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{aiRecommendation}</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Add Stakeholder Form ── */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="border border-border rounded-xl p-4 bg-card space-y-4">
            <div className="text-sm font-semibold text-foreground">New Stakeholder</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Name</label>
                <input value={newForm.name} onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Jane Smith" className="vc-input w-full px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Role</label>
                <select value={newForm.role} onChange={e => setNewForm(f => ({ ...f, role: e.target.value }))}
                  className="vc-input w-full px-3 py-2 text-sm">
                  {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Total Shares</label>
                <input type="number" value={newForm.totalShares} onChange={e => setNewForm(f => ({ ...f, totalShares: +e.target.value }))}
                  className="vc-input w-full px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Vesting Period (months)</label>
                <select value={newForm.vestingMonths} onChange={e => setNewForm(f => ({ ...f, vestingMonths: +e.target.value }))}
                  className="vc-input w-full px-3 py-2 text-sm">
                  {[12, 24, 36, 48, 60].map(v => <option key={v} value={v}>{v} months ({v / 12} yr{v > 12 ? 's' : ''})</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Cliff (months)</label>
                <select value={newForm.cliffMonths} onChange={e => setNewForm(f => ({ ...f, cliffMonths: +e.target.value }))}
                  className="vc-input w-full px-3 py-2 text-sm">
                  {[0, 3, 6, 12, 18, 24].map(v => <option key={v} value={v}>{v === 0 ? 'No cliff' : `${v} months`}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Vesting Type</label>
                <select value={newForm.vestingType} onChange={e => setNewForm(f => ({ ...f, vestingType: e.target.value as VestingType }))}
                  className="vc-input w-full px-3 py-2 text-sm">
                  {Object.entries(VESTING_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Start Month (from founding)</label>
                <input type="number" min={0} value={newForm.startMonth} onChange={e => setNewForm(f => ({ ...f, startMonth: +e.target.value }))}
                  className="vc-input w-full px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={addStakeholder}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
                style={{ background: '#C4614A' }}>
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
              <button onClick={() => setShowAdd(false)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border border-border text-muted-foreground hover:bg-secondary/40">
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Stakeholder Cards ── */}
      <div className="space-y-2">
        {stakeholders.map((s) => {
          const vestedNow = calcVestedAtMonth(s, milestones, s.vestingMonths + s.startMonth);
          const pctTotal = totalShares > 0 ? (s.totalShares / totalShares) * 100 : 0;
          const isExpanded = expandedId === s.id;
          return (
            <motion.div key={s.id} layout className="border border-border rounded-xl bg-card overflow-hidden">
              {/* Card header */}
              <div className="flex items-center gap-3 p-3.5 cursor-pointer hover:bg-secondary/20 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : s.id)}>
                <div className="w-3 h-3 rounded-full shrink-0" style={{ background: s.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground truncate">{s.name}</span>
                    <span className="text-[10px] text-muted-foreground border border-border rounded-full px-2 py-0.5 shrink-0">{s.role}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-[11px] text-muted-foreground">
                    <span>{fmt(s.totalShares)} shares ({fmtPct(pctTotal)})</span>
                    <span>·</span>
                    <span>{s.vestingMonths}mo vesting</span>
                    {s.cliffMonths > 0 && <><span>·</span><span>{s.cliffMonths}mo cliff</span></>}
                    <span>·</span>
                    <span className="capitalize">{s.vestingType}</span>
                  </div>
                </div>
                {/* Mini progress bar */}
                <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
                  <span className="text-[10px] text-muted-foreground">Ownership</span>
                  <div className="w-24 h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pctTotal}%`, background: s.color }} />
                  </div>
                  <span className="text-[10px] font-mono font-semibold text-foreground">{fmtPct(pctTotal)}</span>
                </div>
                <button onClick={(e) => { e.stopPropagation(); removeStakeholder(s.id); }}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:bg-red-950/30 transition-colors shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
              </div>

              {/* Expanded editor */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="border-t border-border overflow-hidden">
                    <div className="p-4 space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        <div>
                          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Name</label>
                          <input value={s.name} onChange={e => updateStakeholder(s.id, { name: e.target.value })}
                            className="vc-input w-full px-2.5 py-1.5 text-sm" />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Role</label>
                          <select value={s.role} onChange={e => updateStakeholder(s.id, { role: e.target.value })}
                            className="vc-input w-full px-2.5 py-1.5 text-sm">
                            {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Total Shares</label>
                          <input type="number" value={s.totalShares} onChange={e => updateStakeholder(s.id, { totalShares: +e.target.value })}
                            className="vc-input w-full px-2.5 py-1.5 text-sm" />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Vesting (months)</label>
                          <select value={s.vestingMonths} onChange={e => updateStakeholder(s.id, { vestingMonths: +e.target.value })}
                            className="vc-input w-full px-2.5 py-1.5 text-sm">
                            {[12, 24, 36, 48, 60].map(v => <option key={v} value={v}>{v}mo</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Cliff (months)</label>
                          <select value={s.cliffMonths} onChange={e => updateStakeholder(s.id, { cliffMonths: +e.target.value })}
                            className="vc-input w-full px-2.5 py-1.5 text-sm">
                            {[0, 3, 6, 12, 18, 24].map(v => <option key={v} value={v}>{v === 0 ? 'None' : `${v}mo`}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Vesting Type</label>
                          <select value={s.vestingType} onChange={e => updateStakeholder(s.id, { vestingType: e.target.value as VestingType })}
                            className="vc-input w-full px-2.5 py-1.5 text-sm">
                            {Object.entries(VESTING_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Start Month</label>
                          <input type="number" min={0} value={s.startMonth} onChange={e => updateStakeholder(s.id, { startMonth: +e.target.value })}
                            className="vc-input w-full px-2.5 py-1.5 text-sm" />
                        </div>
                      </div>

                      {/* Mini schedule table */}
                      <div>
                        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Vesting Schedule Preview</div>
                        <div className="overflow-x-auto rounded-lg border border-border">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b border-border" style={{ background: 'var(--background)' }}>
                                <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Month</th>
                                <th className="text-right px-3 py-2 font-semibold text-muted-foreground">Newly Vested</th>
                                <th className="text-right px-3 py-2 font-semibold text-muted-foreground">Total Vested</th>
                                <th className="text-right px-3 py-2 font-semibold text-muted-foreground">% Vested</th>
                              </tr>
                            </thead>
                            <tbody>
                              {buildScheduleTable(s, milestones).map((row, i) => (
                                <tr key={i} className="border-b border-border last:border-0 hover:bg-secondary/20">
                                  <td className="px-3 py-2 font-mono text-foreground">
                                    {row.month === 0 ? 'Founding' : `Month ${row.month}`}
                                    {row.month === s.cliffMonths && s.cliffMonths > 0 && (
                                      <span className="ml-1.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full text-white" style={{ background: s.color }}>CLIFF</span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 font-mono text-right text-foreground">{row.newlyVested > 0 ? `+${fmt(row.newlyVested)}` : '—'}</td>
                                  <td className="px-3 py-2 font-mono text-right font-semibold text-foreground">{fmt(row.vested)}</td>
                                  <td className="px-3 py-2 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <div className="w-16 h-1.5 rounded-full bg-secondary overflow-hidden">
                                        <div className="h-full rounded-full" style={{ width: `${row.pct}%`, background: s.color }} />
                                      </div>
                                      <span className="font-mono text-foreground w-8 text-right">{row.pct}%</span>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* ── Visualization Tabs ── */}
      <div className="border border-border rounded-xl bg-card overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-border">
          {(['chart', 'table', 'summary'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-3 text-xs font-semibold capitalize transition-colors ${activeTab === tab ? 'text-foreground border-b-2 border-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              {tab === 'chart' ? 'Vesting Chart' : tab === 'table' ? 'Full Table' : 'Cap Table Summary'}
            </button>
          ))}
        </div>

        {/* Chart view */}
        {activeTab === 'chart' && (
          <div className="p-4">
            <div className="text-xs text-muted-foreground mb-4">Cumulative shares vested over time per stakeholder</div>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  {stakeholders.map(s => (
                    <linearGradient key={s.id} id={`grad-${s.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={s.color} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={s.color} stopOpacity={0.02} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} tickFormatter={v => `M${v}`} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => fmt(v)} width={55} />
                <RechartTooltip content={<CustomTooltip />} />
                <Legend formatter={(value) => stakeholders.find(s => s.id === value)?.name ?? value} wrapperStyle={{ fontSize: 11 }} />
                {stakeholders.map(s => (
                  <Area key={s.id} type="monotone" dataKey={s.id} name={s.id}
                    stroke={s.color} strokeWidth={2} fill={`url(#grad-${s.id})`} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Full table view */}
        {activeTab === 'table' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border" style={{ background: 'var(--background)' }}>
                  <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground sticky left-0 bg-inherit">Month</th>
                  {stakeholders.map(s => (
                    <th key={s.id} className="text-right px-3 py-2.5 font-semibold" style={{ color: s.color }}>{s.name}</th>
                  ))}
                  <th className="text-right px-3 py-2.5 font-semibold text-foreground">Total</th>
                  <th className="text-right px-3 py-2.5 font-semibold text-muted-foreground">% Vested</th>
                </tr>
              </thead>
              <tbody>
                {chartData.filter((_, i) => i % (totalMonths > 48 ? 4 : 1) === 0).map((row, i) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-secondary/20">
                    <td className="px-3 py-2 font-mono text-foreground sticky left-0 bg-card">M{row.month}</td>
                    {stakeholders.map(s => (
                      <td key={s.id} className="px-3 py-2 font-mono text-right text-foreground">{fmt(row[s.id] ?? 0)}</td>
                    ))}
                    <td className="px-3 py-2 font-mono text-right font-bold text-foreground">{fmt(row['_total'])}</td>
                    <td className="px-3 py-2 font-mono text-right text-muted-foreground">
                      {totalShares > 0 ? fmtPct((row['_total'] / totalShares) * 100) : '0%'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Cap table summary */}
        {activeTab === 'summary' && (
          <div className="p-4 space-y-4">
            <div className="text-xs text-muted-foreground mb-2">Ownership breakdown at full vesting</div>
            {/* Ownership bar */}
            <div className="flex h-6 rounded-full overflow-hidden gap-0.5">
              {stakeholders.map(s => {
                const pct = totalShares > 0 ? (s.totalShares / totalShares) * 100 : 0;
                return pct > 0 ? (
                  <div key={s.id} style={{ width: `${pct}%`, background: s.color }} title={`${s.name}: ${fmtPct(pct)}`} />
                ) : null;
              })}
            </div>
            {/* Legend */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {stakeholders.map(s => {
                const pct = totalShares > 0 ? (s.totalShares / totalShares) * 100 : 0;
                const cliff12 = calcVestedAtMonth(s, milestones, 12 + s.startMonth);
                const cliff24 = calcVestedAtMonth(s, milestones, 24 + s.startMonth);
                return (
                  <div key={s.id} className="flex items-start gap-3 p-3 rounded-lg border border-border">
                    <div className="w-3 h-3 rounded-full mt-0.5 shrink-0" style={{ background: s.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-foreground truncate">{s.name}</span>
                        <span className="text-sm font-bold font-mono text-foreground ml-2">{fmtPct(pct)}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{s.role}</div>
                      <div className="grid grid-cols-3 gap-1 mt-2 text-[10px]">
                        <div className="text-center p-1 rounded bg-secondary/50">
                          <div className="font-mono font-semibold text-foreground">{fmt(cliff12)}</div>
                          <div className="text-muted-foreground">@ 12mo</div>
                        </div>
                        <div className="text-center p-1 rounded bg-secondary/50">
                          <div className="font-mono font-semibold text-foreground">{fmt(cliff24)}</div>
                          <div className="text-muted-foreground">@ 24mo</div>
                        </div>
                        <div className="text-center p-1 rounded bg-secondary/50">
                          <div className="font-mono font-semibold text-foreground">{fmt(s.totalShares)}</div>
                          <div className="text-muted-foreground">Full vest</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Info box */}
            <div className="flex gap-2.5 p-3 rounded-lg text-xs" style={{ background: 'var(--background)', border: '1.5px solid var(--border)' }}>
              <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Standard 4-year / 1-year cliff</strong> is the most common structure for founders and early employees.
                Advisors typically receive 0.1–0.5% over 2 years with a 6-month cliff.
                ESOP pools are usually 10–20% of fully diluted shares, vesting on employee grant schedules.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
