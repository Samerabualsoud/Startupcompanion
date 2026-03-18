/**
 * Sales Tracker — Full Pipeline CRM
 * Kanban pipeline, detailed deal form, analytics: MoM revenue, channel, product,
 * win rate, weighted pipeline, forecast, AI analysis.
 */
import { useState, useMemo, useCallback } from 'react';
import {
  Plus, Trash2, Loader2, Edit2, X, Check, ChevronDown, ChevronUp,
  BarChart3, TrendingUp, DollarSign, Target, Users, Mail, Phone,
  Calendar, Sparkles, RefreshCw, Filter, Search, ArrowUpDown,
  AlertCircle, CheckCircle2, Clock, XCircle, GitMerge
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Streamdown } from 'streamdown';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, Legend, PieChart, Pie
} from 'recharts';

// ── Types ──────────────────────────────────────────────────────────────────
type DealStage = 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
type Channel = 'direct' | 'online' | 'referral' | 'partner' | 'inbound' | 'outbound' | 'other';

interface Deal {
  id: number;
  date: string | Date;
  amount: number;
  currency: string;
  channel: Channel;
  product: string;
  customer: string;
  dealStage: DealStage;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  dealValue?: number | null;
  probability?: number | null;
  expectedCloseDate?: string | Date | null;
  lostReason?: string | null;
  nextAction?: string | null;
  notes?: string | null;
  createdAt?: string | Date;
}

const STAGE_CONFIG: Record<DealStage, { label: string; color: string; bg: string; icon: React.ElementType; defaultProb: number }> = {
  lead:         { label: 'Lead',        color: 'text-slate-600',  bg: 'bg-slate-100',  icon: Users,        defaultProb: 10 },
  qualified:    { label: 'Qualified',   color: 'text-blue-600',   bg: 'bg-blue-50',    icon: CheckCircle2, defaultProb: 25 },
  proposal:     { label: 'Proposal',    color: 'text-yellow-600', bg: 'bg-yellow-50',  icon: Clock,        defaultProb: 50 },
  negotiation:  { label: 'Negotiation', color: 'text-orange-600', bg: 'bg-orange-50',  icon: ArrowUpDown,  defaultProb: 75 },
  closed_won:   { label: 'Won',         color: 'text-green-600',  bg: 'bg-green-50',   icon: CheckCircle2, defaultProb: 100 },
  closed_lost:  { label: 'Lost',        color: 'text-red-600',    bg: 'bg-red-50',     icon: XCircle,      defaultProb: 0 },
};

const CHANNELS: { value: Channel; label: string }[] = [
  { value: 'direct', label: 'Direct' },
  { value: 'inbound', label: 'Inbound' },
  { value: 'outbound', label: 'Outbound' },
  { value: 'referral', label: 'Referral' },
  { value: 'partner', label: 'Partner' },
  { value: 'online', label: 'Online' },
  { value: 'other', label: 'Other' },
];

const CHANNEL_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

function fmt(n: number, currency = 'USD'): string {
  const sym = currency === 'USD' ? '$' : currency === 'SAR' ? 'SAR ' : currency === 'AED' ? 'AED ' : currency + ' ';
  return `${sym}${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function dateStr(d: string | Date | null | undefined): string {
  if (!d) return '';
  return new Date(d).toLocaleDateString();
}

function isoDate(d: string | Date | null | undefined): string {
  if (!d) return '';
  return new Date(d).toISOString().split('T')[0];
}

// ── Empty form ─────────────────────────────────────────────────────────────
const emptyForm = (): Omit<Deal, 'id' | 'createdAt'> => ({
  date: new Date().toISOString().split('T')[0],
  amount: 0,
  currency: 'USD',
  channel: 'direct',
  product: '',
  customer: '',
  dealStage: 'lead',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  dealValue: 0,
  probability: 10,
  expectedCloseDate: '',
  lostReason: '',
  nextAction: '',
  notes: '',
});

// ── Main Component ─────────────────────────────────────────────────────────
export default function SalesTracker() {
  const { lang } = useLanguage();
  const isRTL = lang === 'ar';

  const [activeTab, setActiveTab] = useState('pipeline');
  const [showForm, setShowForm] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [form, setForm] = useState<Omit<Deal, 'id' | 'createdAt'>>(emptyForm());
  const [expandedDeal, setExpandedDeal] = useState<number | null>(null);
  const [stageFilter, setStageFilter] = useState<DealStage | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [targetMonth, setTargetMonth] = useState(new Date().toISOString().slice(0, 7));
  const [targetAmount, setTargetAmount] = useState(0);
  const [targetCurrency, setTargetCurrency] = useState('USD');

  // ── tRPC ───────────────────────────────────────────────────────────────
  const { data: rawEntries = [], refetch } = trpc.sales.listEntries.useQuery({ limit: 500 });
  const entries: Deal[] = rawEntries as Deal[];
  const { data: analytics } = trpc.sales.getAnalytics.useQuery(undefined as any);
  const addMutation = trpc.sales.addEntry.useMutation({ onSuccess: () => { refetch(); setShowForm(false); setForm(emptyForm()); toast.success('Deal added'); } });
  const updateMutation = trpc.sales.updateEntry.useMutation({ onSuccess: () => { refetch(); setEditingDeal(null); toast.success('Deal updated'); } });
  const deleteMutation = trpc.sales.deleteEntry.useMutation({ onSuccess: () => { refetch(); toast.success('Deal deleted'); } });
  const targetMutation = trpc.sales.setTarget.useMutation({ onSuccess: () => toast.success('Target saved') });
  const analyzeMutation = trpc.ai.analyzeCOGS.useMutation({
    onSuccess: (d: any) => setAiAnalysis(d?.analysis ?? ''),
    onError: () => toast.error('AI analysis failed'),
  });

  // ── Computed ───────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = entries;
    if (stageFilter !== 'all') list = list.filter(d => d.dealStage === stageFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(d =>
        d.customer.toLowerCase().includes(q) ||
        d.product.toLowerCase().includes(q) ||
        (d.contactName ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [entries, stageFilter, searchQuery]);

  const kpis = useMemo(() => {
    const won = entries.filter(d => d.dealStage === 'closed_won');
    const lost = entries.filter(d => d.dealStage === 'closed_lost');
    const active = entries.filter(d => !['closed_won', 'closed_lost'].includes(d.dealStage));
    const totalRevenue = won.reduce((s, d) => s + d.amount, 0);
    const pipeline = active.reduce((s, d) => s + (d.dealValue ?? d.amount), 0);
    const weighted = active.reduce((s, d) => s + (d.dealValue ?? d.amount) * ((d.probability ?? 50) / 100), 0);
    const winRate = (won.length + lost.length) > 0 ? (won.length / (won.length + lost.length)) * 100 : 0;
    const avgDealSize = won.length > 0 ? totalRevenue / won.length : 0;
    return { totalRevenue, pipeline, weighted, winRate, avgDealSize, wonCount: won.length, lostCount: lost.length, activeCount: active.length };
  }, [entries]);

  const stageGroups = useMemo(() => {
    const groups: Record<DealStage, Deal[]> = {
      lead: [], qualified: [], proposal: [], negotiation: [], closed_won: [], closed_lost: [],
    };
    for (const d of filtered) groups[d.dealStage].push(d);
    return groups;
  }, [filtered]);

  const channelData = useMemo(() => {
    const map: Record<string, { revenue: number; deals: number }> = {};
    for (const d of entries.filter(e => e.dealStage === 'closed_won')) {
      const ch = CHANNELS.find(c => c.value === d.channel)?.label ?? d.channel;
      if (!map[ch]) map[ch] = { revenue: 0, deals: 0 };
      map[ch].revenue += d.amount;
      map[ch].deals++;
    }
    return Object.entries(map).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.revenue - a.revenue);
  }, [entries]);

  const productData = useMemo(() => {
    const map: Record<string, { revenue: number; deals: number }> = {};
    for (const d of entries.filter(e => e.dealStage === 'closed_won' && e.product)) {
      if (!map[d.product]) map[d.product] = { revenue: 0, deals: 0 };
      map[d.product].revenue += d.amount;
      map[d.product].deals++;
    }
    return Object.entries(map).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  }, [entries]);

  // ── Handlers ───────────────────────────="────────────────────────────────
  const openAdd = () => { setForm(emptyForm()); setEditingDeal(null); setShowForm(true); };
  const openEdit = (deal: Deal) => {
    setEditingDeal(deal);
    setForm({
      date: isoDate(deal.date),
      amount: deal.amount,
      currency: deal.currency,
      channel: deal.channel,
      product: deal.product,
      customer: deal.customer,
      dealStage: deal.dealStage,
      contactName: deal.contactName ?? '',
      contactEmail: deal.contactEmail ?? '',
      contactPhone: deal.contactPhone ?? '',
      dealValue: deal.dealValue ?? 0,
      probability: deal.probability ?? STAGE_CONFIG[deal.dealStage].defaultProb,
      expectedCloseDate: isoDate(deal.expectedCloseDate),
      lostReason: deal.lostReason ?? '',
      nextAction: deal.nextAction ?? '',
      notes: deal.notes ?? '',
    });
    setShowForm(true);
  };

  const setField = (key: keyof typeof form, value: unknown) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleStageChange = (stage: DealStage) => {
    setField('dealStage', stage);
    setField('probability', STAGE_CONFIG[stage].defaultProb);
  };

  const handleSubmit = () => {
    const dateStr2 = typeof form.date === 'string' ? form.date : new Date(form.date).toISOString().split('T')[0];
    const payload = {
      ...form,
      date: dateStr2,
      amount: Number(form.amount) || 0,
      dealValue: Number(form.dealValue) || undefined,
      probability: Number(form.probability) || undefined,
      expectedCloseDate: form.expectedCloseDate ? String(form.expectedCloseDate) : undefined,
      contactName: form.contactName || undefined,
      contactEmail: form.contactEmail || undefined,
      contactPhone: form.contactPhone || undefined,
      lostReason: form.lostReason || undefined,
      nextAction: form.nextAction || undefined,
      notes: form.notes || undefined,
    };
    if (editingDeal) {
      updateMutation.mutate({ id: editingDeal.id, ...payload });
    } else {
      addMutation.mutate(payload);
    }
  };

  const handleAI = useCallback(() => {
    const won = entries.filter(d => d.dealStage === 'closed_won');
    const active = entries.filter(d => !['closed_won', 'closed_lost'].includes(d.dealStage));
    // Use analyzeCOGS as a general business analysis endpoint
    analyzeMutation.mutate({
      businessModel: 'services',
      totalCOGS: 0,
      grossMarginPct: kpis.winRate,
      totalOpEx: 0,
      ebitda: kpis.totalRevenue,
      directCosts: [],
      indirectCosts: channelData.slice(0, 3).map(c => ({ name: c.name, amount: c.revenue, category: 'sales' as const })),
      monthlyRevenue: kpis.totalRevenue,
      language: lang === 'ar' ? 'arabic' : 'english',
    });
    setActiveTab('ai');
  }, [entries, kpis, channelData, productData, lang]);

  const currency = entries[0]?.currency ?? 'USD';

  // ── Deal Card ──────────────────────────────────────────────────────────
  const DealCard = ({ deal }: { deal: Deal }) => {
    const cfg = STAGE_CONFIG[deal.dealStage];
    const isExpanded = expandedDeal === deal.id;
    return (
      <div className={`rounded-lg border border-border bg-card shadow-sm transition-all ${isExpanded ? 'ring-1 ring-primary/30' : ''}`}>
        <div
          className="flex items-start justify-between p-3 cursor-pointer"
          onClick={() => setExpandedDeal(isExpanded ? null : deal.id)}
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{deal.customer || 'Unnamed'}</p>
            {deal.product && <p className="text-xs text-muted-foreground truncate">{deal.product}</p>}
            {deal.contactName && <p className="text-xs text-muted-foreground">{deal.contactName}</p>}
          </div>
          <div className="flex flex-col items-end gap-1 ml-2 shrink-0">
            <span className="text-sm font-bold text-foreground">{fmt(deal.dealValue ?? deal.amount, deal.currency)}</span>
            {deal.probability != null && deal.dealStage !== 'closed_won' && deal.dealStage !== 'closed_lost' && (
              <span className="text-xs text-muted-foreground">{deal.probability}%</span>
            )}
          </div>
        </div>
        {isExpanded && (
          <div className="px-3 pb-3 border-t border-border/50 pt-2 space-y-2">
            <div className="grid grid-cols-2 gap-2 text-xs">
              {deal.contactEmail && <div className="flex items-center gap-1 text-muted-foreground"><Mail className="w-3 h-3" />{deal.contactEmail}</div>}
              {deal.contactPhone && <div className="flex items-center gap-1 text-muted-foreground"><Phone className="w-3 h-3" />{deal.contactPhone}</div>}
              {deal.expectedCloseDate && <div className="flex items-center gap-1 text-muted-foreground"><Calendar className="w-3 h-3" />Close: {dateStr(deal.expectedCloseDate)}</div>}
              <div className="flex items-center gap-1 text-muted-foreground"><DollarSign className="w-3 h-3" />Closed: {fmt(deal.amount, deal.currency)}</div>
            </div>
            {deal.nextAction && (
              <div className="text-xs bg-blue-50 text-blue-700 rounded p-2">
                <span className="font-medium">Next: </span>{deal.nextAction}
              </div>
            )}
            {deal.lostReason && (
              <div className="text-xs bg-red-50 text-red-700 rounded p-2">
                <span className="font-medium">Lost: </span>{deal.lostReason}
              </div>
            )}
            {deal.notes && <p className="text-xs text-muted-foreground">{deal.notes}</p>}
            <div className="flex gap-2 pt-1">
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => openEdit(deal)}>
                <Edit2 className="w-3 h-3 mr-1" /> Edit
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={() => deleteMutation.mutate({ id: deal.id })}>
                <Trash2 className="w-3 h-3 mr-1" /> Delete
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${isRTL ? 'rtl' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Sales Pipeline Tracker
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">Full CRM pipeline · Channel & product analytics · AI forecasting</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleAI} disabled={analyzeMutation.isPending}>
            {analyzeMutation.isPending ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1.5" />}
            AI Analysis
          </Button>
          <Button size="sm" onClick={openAdd}><Plus className="w-4 h-4 mr-1.5" /> Add Deal</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Revenue', value: fmt(kpis.totalRevenue, currency), sub: `${kpis.wonCount} won deals`, icon: DollarSign, color: 'text-green-600' },
          { label: 'Pipeline Value', value: fmt(kpis.pipeline, currency), sub: `${kpis.activeCount} active deals`, icon: GitMerge, color: 'text-blue-600' },
          { label: 'Weighted Pipeline', value: fmt(kpis.weighted, currency), sub: 'probability-adjusted', icon: BarChart3, color: 'text-purple-600' },
          { label: 'Win Rate', value: `${kpis.winRate.toFixed(1)}%`, sub: `Avg deal: ${fmt(kpis.avgDealSize, currency)}`, icon: TrendingUp, color: kpis.winRate >= 30 ? 'text-green-600' : 'text-orange-500' },
        ].map(card => (
          <Card key={card.label}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{card.label}</p>
                  <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{card.sub}</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <card.icon className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="list">Deal List</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="targets">Targets</TabsTrigger>
          <TabsTrigger value="ai">AI Analysis</TabsTrigger>
        </TabsList>

        {/* ── PIPELINE (Kanban) ── */}
        <TabsContent value="pipeline" className="mt-4">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search deals…" className="pl-9 h-9" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 overflow-x-auto">
            {(Object.keys(STAGE_CONFIG) as DealStage[]).map(stage => {
              const cfg = STAGE_CONFIG[stage];
              const deals = stageGroups[stage];
              const total = deals.reduce((s, d) => s + (d.dealValue ?? d.amount), 0);
              return (
                <div key={stage} className="flex flex-col min-w-[160px]">
                  <div className={`flex items-center justify-between p-2 rounded-t-lg ${cfg.bg}`}>
                    <div className="flex items-center gap-1.5">
                      <cfg.icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                      <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs h-5 px-1.5">{deals.length}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground text-center py-1 bg-muted/30 border-x border-border">
                    {fmt(total, currency)}
                  </div>
                  <div className="flex-1 space-y-2 p-2 bg-muted/10 rounded-b-lg border border-border border-t-0 min-h-[100px]">
                    {deals.map(deal => <DealCard key={deal.id} deal={deal} />)}
                    {deals.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">No deals</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* ── DEAL LIST ── */}
        <TabsContent value="list" className="mt-4">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search deals…" className="pl-9 h-9" />
            </div>
            <Select value={stageFilter} onValueChange={v => setStageFilter(v as DealStage | 'all')}>
              <SelectTrigger className="w-36 h-9"><SelectValue placeholder="All stages" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {(Object.keys(STAGE_CONFIG) as DealStage[]).map(s => (
                  <SelectItem key={s} value={s}>{STAGE_CONFIG[s].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {['Customer', 'Product', 'Contact', 'Stage', 'Deal Value', 'Prob.', 'Close Date', 'Channel', 'Actions'].map(h => (
                    <th key={h} className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={9} className="text-center py-8 text-muted-foreground text-sm">No deals found. Add your first deal.</td></tr>
                )}
                {filtered.map(deal => {
                  const cfg = STAGE_CONFIG[deal.dealStage];
                  return (
                    <tr key={deal.id} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="py-2.5 px-3 font-medium">{deal.customer || '—'}</td>
                      <td className="py-2.5 px-3 text-muted-foreground">{deal.product || '—'}</td>
                      <td className="py-2.5 px-3">
                        <div>{deal.contactName || '—'}</div>
                        {deal.contactEmail && <div className="text-xs text-muted-foreground">{deal.contactEmail}</div>}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-medium">{fmt(deal.dealValue ?? deal.amount, deal.currency)}</td>
                      <td className="py-2.5 px-3 text-muted-foreground">{deal.probability ?? '—'}%</td>
                      <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">{dateStr(deal.expectedCloseDate) || '—'}</td>
                      <td className="py-2.5 px-3 text-muted-foreground capitalize">{deal.channel}</td>
                      <td className="py-2.5 px-3">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(deal)}>
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate({ id: deal.id })}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* ── REVENUE ── */}
        <TabsContent value="revenue" className="mt-4">
          <Card>
            <CardHeader className="pb-2 pt-4"><CardTitle className="text-sm">Monthly Revenue (Won Deals)</CardTitle></CardHeader>
            <CardContent className="pb-4">
              {analytics?.monthly?.length ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={analytics.monthly.map(m => ({ ...m, revenue: m.revenue ?? 0, wonDeals: m.wonDeals ?? 0 }))} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId={0} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                    <YAxis yAxisId={1} orientation="right" tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: any, name: string) => name === 'Revenue' ? fmt(v, currency) : v} />
                    <Legend />
                    <Bar yAxisId={0} dataKey="revenue" fill="#10B981" name="Revenue" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId={1} dataKey="wonDeals" fill="#3B82F6" name="Won Deals" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No revenue data yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── CHANNELS ── */}
        <TabsContent value="channels" className="mt-4">
          <Card>
            <CardHeader className="pb-2 pt-4"><CardTitle className="text-sm">Revenue by Channel</CardTitle></CardHeader>
            <CardContent className="pb-4">
              {channelData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No channel data yet.</p>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={channelData} dataKey="revenue" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {channelData.map((_, i) => <Cell key={i} fill={CHANNEL_COLORS[i % CHANNEL_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: any) => fmt(v, currency)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2">
                    {channelData.map((c, i) => (
                      <div key={c.name} className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ background: CHANNEL_COLORS[i % CHANNEL_COLORS.length] }} />
                          <span>{c.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-muted-foreground">{c.deals} deals</span>
                          <span className="font-medium">{fmt(c.revenue, currency)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── PRODUCTS ── */}
        <TabsContent value="products" className="mt-4">
          <Card>
            <CardHeader className="pb-2 pt-4"><CardTitle className="text-sm">Revenue by Product / Service</CardTitle></CardHeader>
            <CardContent className="pb-4">
              {productData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No product data yet. Add deals with product names.</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={productData} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                      <XAxis type="number" tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                      <Tooltip formatter={(v: any) => fmt(v, currency)} />
                      <Bar dataKey="revenue" fill="#8B5CF6" name="Revenue" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    {productData.map((p, i) => (
                      <div key={p.name} className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/30">
                        <span>{p.name}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-muted-foreground">{p.deals} deals</span>
                          <span className="font-medium">{fmt(p.revenue, currency)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TARGETS ── */}
        <TabsContent value="targets" className="mt-4">
          <Card>
            <CardHeader className="pb-2 pt-4"><CardTitle className="text-sm">Monthly Sales Target</CardTitle></CardHeader>
            <CardContent className="pb-4 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Month</Label>
                  <Input type="month" value={targetMonth} onChange={e => setTargetMonth(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Target Amount</Label>
                  <Input type="number" min={0} value={targetAmount || ''} onChange={e => setTargetAmount(parseFloat(e.target.value) || 0)} placeholder="0" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Currency</Label>
                  <Select value={targetCurrency} onValueChange={setTargetCurrency}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['USD', 'SAR', 'AED', 'EUR', 'GBP'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={() => targetMutation.mutate({ month: targetMonth, targetAmount, currency: targetCurrency })} disabled={targetMutation.isPending}>
                {targetMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                Save Target
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── AI ── */}
        <TabsContent value="ai" className="mt-4">
          <Card>
            <CardHeader className="pb-2 pt-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> AI Sales Analysis</CardTitle>
                <Button variant="outline" size="sm" onClick={handleAI} disabled={analyzeMutation.isPending}>
                  {analyzeMutation.isPending ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1.5" />}
                  {analyzeMutation.isPending ? 'Analyzing…' : 'Refresh'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              {!aiAnalysis && !analyzeMutation.isPending && (
                <div className="text-center py-10">
                  <Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">Get AI-powered analysis of your pipeline health, win rate, and revenue forecast.</p>
                  <Button onClick={handleAI}><Sparkles className="w-4 h-4 mr-2" /> Generate Analysis</Button>
                </div>
              )}
              {analyzeMutation.isPending && (
                <div className="flex items-center gap-3 py-8 justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Analyzing your pipeline…</span>
                </div>
              )}
              {aiAnalysis && !analyzeMutation.isPending && (
                <div className="prose prose-sm max-w-none"><Streamdown>{aiAnalysis}</Streamdown></div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Deal Form Dialog ── */}
      <Dialog open={showForm} onOpenChange={open => { if (!open) { setShowForm(false); setEditingDeal(null); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingDeal ? 'Edit Deal' : 'Add New Deal'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-xs">Company / Customer *</Label>
                <Input value={form.customer} onChange={e => setField('customer', e.target.value)} placeholder="e.g. Acme Corp" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Product / Service</Label>
                <Input value={form.product} onChange={e => setField('product', e.target.value)} placeholder="e.g. Enterprise Plan" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Deal Stage</Label>
                <Select value={form.dealStage} onValueChange={v => handleStageChange(v as DealStage)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STAGE_CONFIG) as DealStage[]).map(s => (
                      <SelectItem key={s} value={s}>{STAGE_CONFIG[s].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Contact */}
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contact Details</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Contact Name</Label>
                <Input value={form.contactName ?? ''} onChange={e => setField('contactName', e.target.value)} placeholder="John Smith" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Contact Email</Label>
                <Input type="email" value={form.contactEmail ?? ''} onChange={e => setField('contactEmail', e.target.value)} placeholder="john@acme.com" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Contact Phone</Label>
                <Input value={form.contactPhone ?? ''} onChange={e => setField('contactPhone', e.target.value)} placeholder="+1 555 0100" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Channel</Label>
                <Select value={form.channel} onValueChange={v => setField('channel', v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CHANNELS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Financials */}
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Deal Financials</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Deal Value (Expected)</Label>
                <Input type="number" min={0} value={form.dealValue ?? ''} onChange={e => setField('dealValue', parseFloat(e.target.value) || 0)} placeholder="0" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Closed Amount (Actual)</Label>
                <Input type="number" min={0} value={form.amount || ''} onChange={e => setField('amount', parseFloat(e.target.value) || 0)} placeholder="0" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Currency</Label>
                <Select value={form.currency} onValueChange={v => setField('currency', v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['USD', 'SAR', 'AED', 'EUR', 'GBP', 'EGP'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Win Probability (%)</Label>
                <Input type="number" min={0} max={100} value={form.probability ?? ''} onChange={e => setField('probability', parseInt(e.target.value) || 0)} placeholder="50" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Date</Label>
                <Input type="date" value={typeof form.date === 'string' ? form.date : isoDate(form.date)} onChange={e => setField('date', e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Expected Close Date</Label>
                <Input type="date" value={form.expectedCloseDate ? String(form.expectedCloseDate) : ''} onChange={e => setField('expectedCloseDate', e.target.value)} className="mt-1" />
              </div>
            </div>

            <Separator />

            {/* Actions & Notes */}
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Next Action</Label>
                <Input value={form.nextAction ?? ''} onChange={e => setField('nextAction', e.target.value)} placeholder="e.g. Follow up call on Friday" className="mt-1" />
              </div>
              {form.dealStage === 'closed_lost' && (
                <div>
                  <Label className="text-xs">Lost Reason</Label>
                  <Input value={form.lostReason ?? ''} onChange={e => setField('lostReason', e.target.value)} placeholder="e.g. Price too high, chose competitor" className="mt-1" />
                </div>
              )}
              <div>
                <Label className="text-xs">Notes</Label>
                <textarea value={form.notes ?? ''} onChange={e => setField('notes', e.target.value)} placeholder="Additional context, meeting notes…" className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] resize-y focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowForm(false); setEditingDeal(null); }}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={addMutation.isPending || updateMutation.isPending}>
              {(addMutation.isPending || updateMutation.isPending) ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {editingDeal ? 'Update Deal' : 'Add Deal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
