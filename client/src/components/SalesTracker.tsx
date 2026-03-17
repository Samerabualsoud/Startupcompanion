/**
 * SalesTracker — Full sales pipeline and revenue analytics tool.
 *
 * Features:
 * - Add/edit/delete sales entries (deals) with stage, channel, product, amount
 * - Revenue trend chart (monthly, area chart)
 * - MoM growth, win rate, avg deal size KPIs
 * - Deal stage funnel
 * - Channel & product breakdown (bar charts)
 * - Monthly target setting
 * - AI sales analysis
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, Edit2, TrendingUp, TrendingDown, Target,
  DollarSign, BarChart3, ShoppingCart, Sparkles, X, Check,
  ChevronDown, ChevronUp, ArrowUpRight, Loader2, Save
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, FunnelChart, Funnel, LabelList
} from 'recharts';
import { trpc } from '@/lib/trpc';
import { useStartup } from '@/contexts/StartupContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { FieldInfo } from '@/components/ui/field-info';
import { Streamdown } from 'streamdown';

// ── Constants ────────────────────────────────────────────────────────────

const DEAL_STAGES = [
  { value: 'lead',          label: 'Lead',          color: '#94A3B8' },
  { value: 'qualified',     label: 'Qualified',     color: '#60A5FA' },
  { value: 'proposal',      label: 'Proposal',      color: '#A78BFA' },
  { value: 'negotiation',   label: 'Negotiation',   color: '#F59E0B' },
  { value: 'closed_won',    label: 'Closed Won',    color: '#10B981' },
  { value: 'closed_lost',   label: 'Closed Lost',   color: '#EF4444' },
];

const CHANNELS = ['Direct', 'Referral', 'Inbound', 'Outbound', 'Partner', 'Event', 'Social Media', 'Other'];
const CURRENCIES = ['USD', 'SAR', 'AED', 'EGP', 'EUR', 'GBP'];

const STAGE_COLORS: Record<string, string> = Object.fromEntries(DEAL_STAGES.map(s => [s.value, s.color]));

function fmtCurrency(v: number, currency = 'USD') {
  if (v >= 1_000_000) return `${currency} ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${currency} ${(v / 1_000).toFixed(0)}K`;
  return `${currency} ${v.toLocaleString()}`;
}

// ── Entry Form ────────────────────────────────────────────────────────────

interface EntryFormData {
  clientName: string;
  dealStage: string;
  amount: string;
  currency: string;
  date: string;
  channel: string;
  product: string;
  notes: string;
}

const EMPTY_FORM: EntryFormData = {
  clientName: '',
  dealStage: 'lead',
  amount: '',
  currency: 'USD',
  date: new Date().toISOString().slice(0, 10),
  channel: 'Direct',
  product: '',
  notes: '',
};

// ── Main Component ────────────────────────────────────────────────────────

export default function SalesTracker() {
  const { t, lang } = useLanguage();
  const isRTL = lang === 'ar';
  const { refresh } = useStartup();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<EntryFormData>(EMPTY_FORM);
  const [activeTab, setActiveTab] = useState<'overview' | 'deals' | 'targets' | 'ai'>('overview');
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [targetMonth, setTargetMonth] = useState(new Date().toISOString().slice(0, 7));
  const [targetAmount, setTargetAmount] = useState('');
  const [expandedEntry, setExpandedEntry] = useState<number | null>(null);

  // Data queries
  const { data: analytics, refetch: refetchAnalytics } = trpc.sales.getAnalytics.useQuery(undefined, { retry: false });

  // Mutations
  const addEntry = trpc.sales.addEntry.useMutation({
    onSuccess: () => {
      toast.success('Deal added successfully.');
      setShowForm(false);
      setForm(EMPTY_FORM);
      refetchAnalytics();
      refresh();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateEntry = trpc.sales.updateEntry.useMutation({
    onSuccess: () => {
      toast.success('Deal updated.');
      setEditingId(null);
      setShowForm(false);
      setForm(EMPTY_FORM);
      refetchAnalytics();
      refresh();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteEntry = trpc.sales.deleteEntry.useMutation({
    onSuccess: () => {
      toast.success('Deal deleted.');
      refetchAnalytics();
      refresh();
    },
    onError: (err) => toast.error(err.message),
  });

  const setTarget = trpc.sales.setTarget.useMutation({
    onSuccess: () => {
      toast.success('Target saved.');
      setTargetAmount('');
      refetchAnalytics();
    },
    onError: (err) => toast.error(err.message),
  });

  const analyzeAI = trpc.sales.analyzeAI.useMutation({
    onSuccess: (data) => setAiAnalysis(typeof data.analysis === 'string' ? data.analysis : String(data.analysis)),
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = () => {
    const amount = parseFloat(form.amount);
    if (!form.clientName.trim()) { toast.error('Client name required'); return; }
    if (isNaN(amount) || amount < 0) { toast.error('Valid amount required'); return; }

    const payload = {
      customer: form.clientName.trim(),
      dealStage: form.dealStage as any,
      amount,
      currency: form.currency,
      date: form.date,
      channel: form.channel.toLowerCase().replace(' ', '_') as any,
      product: form.product.trim() || '',
      notes: form.notes.trim() || undefined,
    };

    if (editingId !== null) {
      updateEntry.mutate({ id: editingId, ...payload });
    } else {
      addEntry.mutate(payload);
    }
  };

  const handleEdit = (entry: any) => {
    setForm({
      clientName: entry.clientName,
      dealStage: entry.dealStage,
      amount: String(entry.amount),
      currency: entry.currency,
      date: new Date(entry.date).toISOString().slice(0, 10),
      channel: entry.channel,
      product: entry.product ?? '',
      notes: entry.notes ?? '',
    });
    setEditingId(entry.id);
    setShowForm(true);
  };

  const handleRunAI = () => {
    if (!analytics?.summary) return;
    analyzeAI.mutate({
      totalRevenue: analytics.summary.totalRevenue,
      totalDeals: analytics.summary.totalDeals,
      wonDeals: analytics.summary.wonDeals,
      avgDealSize: analytics.summary.avgDealSize,
      winRate: analytics.summary.winRate,
      topChannel: analytics.channels[0]?.channel,
      topProduct: analytics.products[0]?.product,
      recentMonths: (analytics.monthly ?? []).slice(-6).map(m => ({
        month: m.month,
        revenue: m.revenue,
        momGrowth: m.momGrowth ?? null,
      })),
      currency: 'USD',
    });
    setActiveTab('ai');
  };

  const summary = analytics?.summary;
  const monthly = analytics?.monthly ?? [];
  const channels = analytics?.channels ?? [];
  const products = analytics?.products ?? [];
  const stageFunnel = analytics?.stageFunnel ?? [];
  const entries = analytics?.entries ?? [];
  const targets = analytics?.targets ?? [];

  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const currentTarget = targets.find((t: any) => t.month === currentMonthKey);
  const targetProgress = currentTarget && summary
    ? Math.min(100, (summary.currentMonthRevenue / currentTarget.targetAmount) * 100)
    : null;

  const CHART_COLORS = ['#C4614A', '#2D4A6B', '#10B981', '#F59E0B', '#6366F1', '#8B5CF6', '#EC4899'];

  return (
    <div className="flex-1 overflow-y-auto" dir={isRTL ? 'rtl' : 'ltr'} style={{ background: 'oklch(0.978 0.008 80)' }}>
      {/* ── Header ── */}
      <div className="px-5 py-4 border-b border-border bg-card flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" style={{ color: '#F59E0B' }} />
            Sales Tracker
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Track your deals, revenue, and growth</p>
        </div>
        <div className="flex items-center gap-2">
          {summary && summary.totalDeals > 0 && (
            <Button size="sm" variant="outline" onClick={handleRunAI} disabled={analyzeAI.isPending}>
              {analyzeAI.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span className="ml-1.5 hidden sm:inline">AI Analysis</span>
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => { setEditingId(null); setForm(EMPTY_FORM); setShowForm(true); }}
            style={{ background: '#F59E0B', color: 'white' }}
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Deal
          </Button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-0 border-b border-border bg-card px-5 overflow-x-auto">
        {(['overview', 'deals', 'targets', 'ai'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'overview' ? 'Overview' : tab === 'deals' ? 'Deals' : tab === 'targets' ? 'Targets' : 'AI Analysis'}
          </button>
        ))}
      </div>

      <div className="p-5 lg:p-6 space-y-5">

        {/* ── Add/Edit Form ── */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Card className="border-amber-200 shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{editingId !== null ? 'Edit Deal' : 'Add New Deal'}</CardTitle>
                    <button onClick={() => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); }}>
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs flex items-center gap-1">
                        Client / Company Name *
                        <FieldInfo text="The name of the client or company you're selling to." />
                      </Label>
                      <Input
                        value={form.clientName}
                        onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))}
                        placeholder="Acme Corp"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs flex items-center gap-1">
                        Deal Stage *
                        <FieldInfo text="Current stage of this deal in your sales pipeline." />
                      </Label>
                      <Select value={form.dealStage} onValueChange={v => setForm(f => ({ ...f, dealStage: v }))}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DEAL_STAGES.map(s => (
                            <SelectItem key={s.value} value={s.value}>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                                {s.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs flex items-center gap-1">
                        Deal Amount *
                        <FieldInfo text="Total value of this deal. For recurring deals, enter the annual contract value (ACV)." />
                      </Label>
                      <div className="flex gap-1.5">
                        <Select value={form.currency} onValueChange={v => setForm(f => ({ ...f, currency: v }))}>
                          <SelectTrigger className="h-8 text-sm w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          value={form.amount}
                          onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                          placeholder="10000"
                          className="h-8 text-sm flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs flex items-center gap-1">
                        Date *
                        <FieldInfo text="The date this deal was created or closed." />
                      </Label>
                      <Input
                        type="date"
                        value={form.date}
                        onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs flex items-center gap-1">
                        Channel
                        <FieldInfo text="How did you acquire this lead? Helps identify your best-performing acquisition channels." />
                      </Label>
                      <Select value={form.channel} onValueChange={v => setForm(f => ({ ...f, channel: v }))}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CHANNELS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs flex items-center gap-1">
                        Product / Service
                        <FieldInfo text="Which product or service is this deal for? Helps track per-product revenue." />
                      </Label>
                      <Input
                        value={form.product}
                        onChange={e => setForm(f => ({ ...f, product: e.target.value }))}
                        placeholder="e.g. Enterprise Plan"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2 lg:col-span-3">
                      <Label className="text-xs">Notes</Label>
                      <Textarea
                        value={form.notes}
                        onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                        placeholder="Any additional context about this deal…"
                        className="text-sm resize-none"
                        rows={2}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4 justify-end">
                    <Button size="sm" variant="outline" onClick={() => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); }}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSubmit}
                      disabled={addEntry.isPending || updateEntry.isPending}
                      style={{ background: '#F59E0B', color: 'white' }}
                    >
                      {(addEntry.isPending || updateEntry.isPending)
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Save className="w-3.5 h-3.5" />}
                      <span className="ml-1.5">{editingId !== null ? 'Update' : 'Save Deal'}</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Overview Tab ── */}
        {activeTab === 'overview' && (
          <div className="space-y-5">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total Revenue', value: summary ? fmtCurrency(summary.totalRevenue) : '—', icon: DollarSign, color: '#10B981', sub: `${summary?.wonDeals ?? 0} won deals` },
                { label: 'This Month', value: summary ? fmtCurrency(summary.currentMonthRevenue) : '—', icon: TrendingUp, color: '#F59E0B', sub: currentTarget ? `Target: ${fmtCurrency(currentTarget.targetAmount)}` : 'No target set' },
                { label: 'Avg Deal Size', value: summary ? fmtCurrency(summary.avgDealSize) : '—', icon: BarChart3, color: '#6366F1', sub: `${summary?.totalDeals ?? 0} total deals` },
                { label: 'Win Rate', value: summary ? `${summary.winRate.toFixed(1)}%` : '—', icon: Target, color: '#C4614A', sub: `${summary?.wonDeals ?? 0} / ${(summary?.wonDeals ?? 0) + (entries.filter((e: any) => e.dealStage === 'closed_lost').length)} closed` },
              ].map((card, i) => (
                <motion.div key={card.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="border-border shadow-sm">
                    <CardContent className="p-4">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-2" style={{ background: `${card.color}18` }}>
                        <card.icon className="w-3.5 h-3.5" style={{ color: card.color }} />
                      </div>
                      <div className="text-xl font-bold text-foreground">{card.value}</div>
                      <div className="text-xs font-medium text-foreground mt-0.5">{card.label}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{card.sub}</div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Monthly target progress */}
            {targetProgress !== null && (
              <Card className="border-border shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold">Monthly Revenue vs Target</span>
                    <span className="text-sm font-bold" style={{ color: targetProgress >= 100 ? '#10B981' : '#F59E0B' }}>
                      {targetProgress.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(100, targetProgress)}%`,
                        background: targetProgress >= 100 ? '#10B981' : targetProgress >= 70 ? '#F59E0B' : '#EF4444'
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{fmtCurrency(summary?.currentMonthRevenue ?? 0)} achieved</span>
                    <span>{fmtCurrency(currentTarget?.targetAmount ?? 0)} target</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Revenue Trend */}
            {monthly.length > 0 && (
              <Card className="border-border shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Monthly Revenue Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={monthly} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0 0)" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(5)} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${v >= 1000 ? (v / 1000).toFixed(0) + 'K' : v}`} />
                      <Tooltip
                        formatter={(v: any, name: string) => [
                          name === 'revenue' ? `$${Number(v).toLocaleString()}` : `${Number(v).toFixed(1)}%`,
                          name === 'revenue' ? 'Revenue' : 'MoM Growth'
                        ]}
                        labelFormatter={l => `Month: ${l}`}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#F59E0B" strokeWidth={2} fill="url(#revGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Channel + Product breakdown */}
            {(channels.length > 0 || products.length > 0) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {channels.length > 0 && (
                  <Card className="border-border shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold">Revenue by Channel</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={channels} margin={{ top: 5, right: 10, left: 0, bottom: 0 }} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0 0)" horizontal={false} />
                          <XAxis type="number" tick={{ fontSize: 9 }} tickFormatter={v => `$${v >= 1000 ? (v / 1000).toFixed(0) + 'K' : v}`} />
                          <YAxis type="category" dataKey="channel" tick={{ fontSize: 10 }} width={70} />
                          <Tooltip formatter={(v: any) => [`$${Number(v).toLocaleString()}`, 'Revenue']} />
                          <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                            {channels.map((_: any, i: number) => (
                              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
                {products.length > 0 && (
                  <Card className="border-border shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold">Revenue by Product</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={products} margin={{ top: 5, right: 10, left: 0, bottom: 0 }} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0 0)" horizontal={false} />
                          <XAxis type="number" tick={{ fontSize: 9 }} tickFormatter={v => `$${v >= 1000 ? (v / 1000).toFixed(0) + 'K' : v}`} />
                          <YAxis type="category" dataKey="product" tick={{ fontSize: 10 }} width={90} />
                          <Tooltip formatter={(v: any) => [`$${Number(v).toLocaleString()}`, 'Revenue']} />
                          <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                            {products.map((_: any, i: number) => (
                              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Deal Stage Funnel */}
            {stageFunnel.some((s: any) => s.count > 0) && (
              <Card className="border-border shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Deal Stage Funnel</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stageFunnel.map((stage: any) => {
                      const maxCount = Math.max(...stageFunnel.map((s: any) => s.count), 1);
                      const pct = (stage.count / maxCount) * 100;
                      const stageInfo = DEAL_STAGES.find(s => s.value === stage.stage);
                      return (
                        <div key={stage.stage} className="flex items-center gap-3">
                          <div className="w-24 text-xs text-muted-foreground text-right shrink-0">
                            {stageInfo?.label ?? stage.stage}
                          </div>
                          <div className="flex-1 h-5 bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                              style={{ width: `${pct}%`, background: stageInfo?.color ?? '#94A3B8', minWidth: stage.count > 0 ? '2rem' : 0 }}
                            >
                              {stage.count > 0 && (
                                <span className="text-[10px] font-bold text-white">{stage.count}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {entries.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <ShoppingCart className="w-12 h-12 text-muted-foreground/20 mb-4" />
                <h3 className="text-base font-semibold text-foreground mb-1">No deals yet</h3>
                <p className="text-sm text-muted-foreground mb-4">Add your first deal to start tracking your sales pipeline.</p>
                <Button size="sm" onClick={() => { setEditingId(null); setForm(EMPTY_FORM); setShowForm(true); }} style={{ background: '#F59E0B', color: 'white' }}>
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add First Deal
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ── Deals Tab ── */}
        {activeTab === 'deals' && (
          <div className="space-y-2">
            {entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <ShoppingCart className="w-12 h-12 text-muted-foreground/20 mb-4" />
                <p className="text-sm text-muted-foreground">No deals yet. Add your first deal above.</p>
              </div>
            ) : (
              entries.map((entry: any) => {
                const stageInfo = DEAL_STAGES.find(s => s.value === entry.dealStage);
                const isExpanded = expandedEntry === entry.id;
                return (
                  <Card key={entry.id} className="border-border shadow-sm">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: stageInfo?.color ?? '#94A3B8' }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-foreground truncate">{entry.clientName}</span>
                            <Badge variant="outline" className="text-[10px]" style={{ borderColor: stageInfo?.color, color: stageInfo?.color }}>
                              {stageInfo?.label}
                            </Badge>
                            {entry.product && (
                              <Badge variant="secondary" className="text-[10px]">{entry.product}</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                            <span className="font-semibold text-foreground">{entry.currency} {Number(entry.amount).toLocaleString()}</span>
                            <span>{new Date(entry.date).toLocaleDateString()}</span>
                            <span>{entry.channel}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => setExpandedEntry(isExpanded ? null : entry.id)} className="p-1.5 rounded hover:bg-secondary text-muted-foreground">
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={() => handleEdit(entry)} className="p-1.5 rounded hover:bg-secondary text-muted-foreground">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteEntry.mutate({ id: entry.id })}
                            className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      {isExpanded && entry.notes && (
                        <div className="mt-2 pt-2 border-t border-border text-xs text-muted-foreground">
                          {entry.notes}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {/* ── Targets Tab ── */}
        {activeTab === 'targets' && (
          <div className="space-y-4">
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Set Monthly Revenue Target</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3 items-end">
                  <div className="space-y-1 flex-1">
                    <Label className="text-xs flex items-center gap-1">
                      Month
                      <FieldInfo text="Select the month you want to set a revenue target for." />
                    </Label>
                    <Input
                      type="month"
                      value={targetMonth}
                      onChange={e => setTargetMonth(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1 flex-1">
                    <Label className="text-xs flex items-center gap-1">
                      Target Amount (USD)
                      <FieldInfo text="Your revenue goal for this month. Used to track progress on the overview dashboard." />
                    </Label>
                    <Input
                      type="number"
                      value={targetAmount}
                      onChange={e => setTargetAmount(e.target.value)}
                      placeholder="50000"
                      className="h-8 text-sm"
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      if (!targetAmount) return;
                      setTarget.mutate({ month: targetMonth, targetAmount: parseFloat(targetAmount), currency: 'USD' });
                    }}
                    disabled={setTarget.isPending}
                    style={{ background: '#F59E0B', color: 'white' }}
                  >
                    {setTarget.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span className="ml-1">Save</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Existing targets */}
            {targets.length > 0 && (
              <Card className="border-border shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Monthly Targets</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[...targets].sort((a: any, b: any) => b.month.localeCompare(a.month)).map((target: any) => {
                      const monthData = monthly.find((m: any) => m.month === target.month);
                      const achieved = monthData?.revenue ?? 0;
                      const pct = Math.min(100, (achieved / target.targetAmount) * 100);
                      return (
                        <div key={target.id} className="flex items-center gap-3">
                          <div className="w-16 text-xs text-muted-foreground shrink-0">{target.month}</div>
                          <div className="flex-1">
                            <div className="h-2 bg-secondary rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${pct}%`, background: pct >= 100 ? '#10B981' : pct >= 70 ? '#F59E0B' : '#EF4444' }}
                              />
                            </div>
                          </div>
                          <div className="text-xs text-right shrink-0 w-32">
                            <span className="font-semibold">${achieved.toLocaleString()}</span>
                            <span className="text-muted-foreground"> / ${target.targetAmount.toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ── AI Analysis Tab ── */}
        {activeTab === 'ai' && (
          <div className="space-y-4">
            {!aiAnalysis && !analyzeAI.isPending && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Sparkles className="w-12 h-12 text-muted-foreground/20 mb-4" />
                <h3 className="text-base font-semibold text-foreground mb-1">AI Sales Analysis</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                  Get AI-powered insights on your revenue trends, win rate, channel strategy, and actionable recommendations.
                </p>
                <Button
                  onClick={handleRunAI}
                  disabled={!summary || summary.totalDeals === 0}
                  style={{ background: '#F59E0B', color: 'white' }}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Analysis
                </Button>
                {(!summary || summary.totalDeals === 0) && (
                  <p className="text-xs text-muted-foreground mt-2">Add at least one deal to enable AI analysis.</p>
                )}
              </div>
            )}
            {analyzeAI.isPending && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-3" />
                <p className="text-sm text-muted-foreground">Analyzing your sales data…</p>
              </div>
            )}
            {aiAnalysis && (
              <Card className="border-border shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      AI Sales Analysis
                    </CardTitle>
                    <Button size="sm" variant="outline" onClick={handleRunAI} disabled={analyzeAI.isPending}>
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none text-sm text-foreground">
                    <Streamdown>{aiAnalysis}</Streamdown>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
