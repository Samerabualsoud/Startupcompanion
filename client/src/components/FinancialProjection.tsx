/**
 * Financial Projection Tool
 * Supports 6 business models × 2 approaches (top-down / bottom-up)
 * 3-year monthly revenue forecasting with charts and export
 */
import { useState, useMemo, useCallback } from 'react';
import {
  TrendingUp, BarChart3, DollarSign, Users, Target, ArrowRight,
  Save, Trash2, ChevronDown, ChevronUp, Info, Loader2,
  Download, RefreshCw, BookOpen, Layers, Zap, ShoppingCart,
  Cpu, Store, Package, Briefcase, Globe, PieChart as PieChartIcon,
  CheckCircle2, AlertCircle, ArrowUpRight, ArrowDownRight, Sparkles
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell, ReferenceLine
} from 'recharts';
import {
  computeTopDown,
  computeBottomUp,
  DEFAULT_TOP_DOWN,
  DEFAULT_BOTTOM_UP,
  MODEL_META,
  type BusinessModel,
  type TopDownInputs,
  type BottomUpInputs,
  type ProjectionOutput,
} from '../../../shared/projectionEngine';

// ── Types ──────────────────────────────────────────────────────────────────
type Approach = 'top-down' | 'bottom-up';

// ── Constants ──────────────────────────────────────────────────────────────
const BUSINESS_MODELS: { id: BusinessModel; label: string; icon: React.ElementType; color: string; description: string }[] = [
  { id: 'saas',        label: 'SaaS',                     icon: Zap,          color: '#6366F1', description: 'Subscription software revenue' },
  { id: 'ecommerce',   label: 'E-commerce',               icon: ShoppingCart, color: '#F59E0B', description: 'Product sales & repeat orders' },
  { id: 'marketplace', label: 'Marketplace',              icon: Store,        color: '#10B981', description: 'GMV × take rate model' },
  { id: 'agency',      label: 'Agency / Services',        icon: Briefcase,    color: '#8B5CF6', description: 'Retainers + project revenue' },
  { id: 'hardware',    label: 'Hardware / IoT',           icon: Cpu,          color: '#EC4899', description: 'Unit sales + recurring subscriptions' },
  { id: 'procurement', label: 'Procurement-as-a-Service', icon: Package,      color: '#0EA5E9', description: 'PVF × take rate model' },
];

const CURRENCIES = ['USD', 'SAR', 'AED', 'EUR', 'GBP', 'EGP', 'KWD', 'QAR', 'BHD', 'OMR'];

// ── Formatting Helpers ─────────────────────────────────────────────────────
function fmt(n: number, currency = 'USD', compact = true): string {
  if (compact) {
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);
}

function fmtCurrency(n: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);
}

// ── Tooltip ────────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label, currency }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-semibold text-foreground">{fmt(p.value, currency)}</span>
        </div>
      ))}
    </div>
  );
};

// ── Number Input Helper ────────────────────────────────────────────────────
function NumInput({
  label, value, onChange, min = 0, max, step = 1, suffix, prefix, hint, required
}: {
  label: string; value: number; onChange: (v: number) => void;
  min?: number; max?: number; step?: number;
  suffix?: string; prefix?: string; hint?: string; required?: boolean;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium text-foreground">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      <div className="relative flex items-center">
        {prefix && <span className="absolute left-3 text-xs text-muted-foreground pointer-events-none">{prefix}</span>}
        <Input
          type="number"
          value={value}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          min={min}
          max={max}
          step={step}
          className={`text-sm h-9 ${prefix ? 'pl-7' : ''} ${suffix ? 'pr-10' : ''}`}
        />
        {suffix && <span className="absolute right-3 text-xs text-muted-foreground pointer-events-none">{suffix}</span>}
      </div>
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function FinancialProjection() {
  // State
  const [approach, setApproach] = useState<Approach>('bottom-up');
  const [model, setModel] = useState<BusinessModel>('saas');
  const [currency, setCurrency] = useState('USD');
  const [projectionName, setProjectionName] = useState('My 3-Year Projection');
  const [savedId, setSavedId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'inputs' | 'results' | 'history'>('inputs');
  const [showMonthly, setShowMonthly] = useState(false);

  // Top-Down Inputs
  const [tdInputs, setTdInputs] = useState<TopDownInputs>({ ...DEFAULT_TOP_DOWN, currency });

  // Bottom-Up Inputs (one per model)
  const [buInputs, setBuInputs] = useState<Record<BusinessModel, BottomUpInputs>>({
    saas:        { ...DEFAULT_BOTTOM_UP.saas, currency },
    ecommerce:   { ...DEFAULT_BOTTOM_UP.ecommerce, currency },
    marketplace: { ...DEFAULT_BOTTOM_UP.marketplace, currency },
    agency:      { ...DEFAULT_BOTTOM_UP.agency, currency },
    hardware:    { ...DEFAULT_BOTTOM_UP.hardware, currency },
    procurement: { ...DEFAULT_BOTTOM_UP.procurement, currency },
  });

  // tRPC
  const computeMutation = trpc.projection.compute.useMutation();
  const saveMutation = trpc.projection.save.useMutation();
  const deleteMutation = trpc.projection.delete.useMutation();
  const { data: savedProjections, refetch: refetchSaved } = trpc.projection.list.useQuery();

  // Computed projection (local, no server round-trip for live preview)
  const projection = useMemo<ProjectionOutput | null>(() => {
    try {
      if (approach === 'top-down') {
        return computeTopDown({ ...tdInputs, currency }, model);
      } else {
        const bu = { ...buInputs[model], currency } as BottomUpInputs;
        return computeBottomUp(bu);
      }
    } catch {
      return null;
    }
  }, [approach, model, currency, tdInputs, buInputs]);

  // Helpers
  const updateTd = useCallback((key: keyof TopDownInputs, val: number | string) => {
    setTdInputs(prev => ({ ...prev, [key]: val }));
  }, []);

  const updateBu = useCallback((key: string, val: number | string) => {
    setBuInputs(prev => ({
      ...prev,
      [model]: { ...prev[model], [key]: val },
    }));
  }, [model]);

  const handleSave = async () => {
    try {
      const result = await saveMutation.mutateAsync({
        id: savedId ?? undefined,
        name: projectionName,
        businessModel: model,
        approach,
        topDownInputs: approach === 'top-down' ? { ...tdInputs, currency } : undefined,
        bottomUpInputs: approach === 'bottom-up' ? ({ ...buInputs[model], currency } as any) : undefined,
        currency,
      });
      setSavedId(result.id);
      refetchSaved();
      toast.success('Projection saved successfully');
    } catch {
      toast.error('Failed to save projection');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      if (savedId === id) setSavedId(null);
      refetchSaved();
      toast.success('Projection deleted');
    } catch {
      toast.error('Failed to delete projection');
    }
  };

  const loadProjection = (proj: any) => {
    setSavedId(proj.id);
    setProjectionName(proj.name);
    setModel(proj.businessModel as BusinessModel);
    setApproach(proj.approach as Approach);
    setCurrency(proj.currency);
    if (proj.topDownInputs) setTdInputs(proj.topDownInputs);
    if (proj.bottomUpInputs) setBuInputs(prev => ({
      ...prev,
      [proj.businessModel]: proj.bottomUpInputs,
    }));
    setActiveTab('inputs');
    toast.success(`Loaded: ${proj.name}`);
  };

  const selectedModelMeta = MODEL_META[model];
  const modelConfig = BUSINESS_MODELS.find(m => m.id === model)!;

  // Chart data
  const chartMonthlyData = useMemo(() => {
    if (!projection) return [];
    return projection.monthly.map(m => ({
      name: `M${m.month}`,
      revenue: Math.round(m.revenue),
      label: `Y${m.year} M${m.monthInYear}`,
    }));
  }, [projection]);

  const chartYearlyData = useMemo(() => {
    if (!projection) return [];
    return projection.yearly.map(y => ({
      name: `Year ${y.year}`,
      revenue: Math.round(y.totalRevenue),
      growth: y.revenueGrowth ? Math.round(y.revenueGrowth) : 0,
    }));
  }, [projection]);

  const quarterlyData = useMemo(() => {
    if (!projection) return [];
    const quarters: { name: string; revenue: number }[] = [];
    for (let q = 0; q < 12; q++) {
      const startMonth = q * 3;
      const qRevenue = projection.monthly.slice(startMonth, startMonth + 3).reduce((s, m) => s + m.revenue, 0);
      const year = Math.floor(q / 4) + 1;
      const qNum = (q % 4) + 1;
      quarters.push({ name: `Y${year} Q${qNum}`, revenue: Math.round(qRevenue) });
    }
    return quarters;
  }, [projection]);

  return (
    <div className="flex-1 min-w-0 overflow-y-auto">
      <div className="p-5 lg:p-6 max-w-7xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--primary)', opacity: 0.9 }}>
                <TrendingUp className="w-4 h-4 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold text-foreground">Financial Projection</h1>
              <Badge variant="outline" className="text-xs">3-Year Forecast</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Build data-driven revenue projections using top-down market analysis or bottom-up unit economics.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="w-24 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map(c => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              onClick={handleSave}
              disabled={saveMutation.isPending || !projection}
              className="gap-1.5"
            >
              {saveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save
            </Button>
          </div>
        </div>

        {/* ── Approach Toggle ── */}
        <div className="grid grid-cols-2 gap-3">
          {(['bottom-up', 'top-down'] as Approach[]).map(a => (
            <button
              key={a}
              onClick={() => setApproach(a)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                approach === a
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card hover:border-primary/40'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                {a === 'bottom-up' ? (
                  <Zap className={`w-4 h-4 ${approach === a ? 'text-primary' : 'text-muted-foreground'}`} />
                ) : (
                  <Globe className={`w-4 h-4 ${approach === a ? 'text-primary' : 'text-muted-foreground'}`} />
                )}
                <span className={`text-sm font-semibold ${approach === a ? 'text-primary' : 'text-foreground'}`}>
                  {a === 'bottom-up' ? 'Bottom-Up' : 'Top-Down'}
                </span>
                {approach === a && <CheckCircle2 className="w-3.5 h-3.5 text-primary ml-auto" />}
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {a === 'bottom-up'
                  ? 'Start from unit economics: customers, pricing, growth rate, churn. Most accurate for early-stage.'
                  : 'Start from TAM → SAM → SOM and apply market capture rate. Best for investor presentations.'}
              </p>
            </button>
          ))}
        </div>

        {/* ── Business Model Selector ── */}
        <div>
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Business Model</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {BUSINESS_MODELS.map(bm => {
              const Icon = bm.icon;
              const isActive = model === bm.id;
              return (
                <button
                  key={bm.id}
                  onClick={() => setModel(bm.id)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    isActive
                      ? 'border-2 bg-card'
                      : 'border-border bg-card hover:border-primary/30'
                  }`}
                  style={isActive ? { borderColor: bm.color } : {}}
                >
                  <div className="w-7 h-7 rounded-md flex items-center justify-center mb-1.5" style={{ background: `${bm.color}20` }}>
                    <Icon className="w-3.5 h-3.5" style={{ color: bm.color }} />
                  </div>
                  <div className="text-xs font-semibold text-foreground leading-tight">{bm.label}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight hidden sm:block">{bm.description}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Main Tabs ── */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid grid-cols-3 w-full max-w-sm">
            <TabsTrigger value="inputs" className="text-xs">Inputs</TabsTrigger>
            <TabsTrigger value="results" className="text-xs">
              Results
              {projection && <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />}
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs">
              Saved
              {savedProjections && savedProjections.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-[9px] px-1 py-0 h-4">{savedProjections.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ── INPUTS TAB ── */}
          <TabsContent value="inputs" className="mt-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground mb-1 block">Projection Name</Label>
                <Input
                  value={projectionName}
                  onChange={e => setProjectionName(e.target.value)}
                  className="h-9 text-sm"
                  placeholder="My 3-Year Projection"
                />
              </div>
              <Button
                size="sm"
                onClick={() => setActiveTab('results')}
                disabled={!projection}
                className="gap-1.5 mt-5"
              >
                View Results <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>

            {approach === 'top-down' ? (
              <TopDownForm inputs={tdInputs} onChange={updateTd} currency={currency} model={model} />
            ) : (
              <BottomUpForm model={model} inputs={buInputs[model]} onChange={updateBu} currency={currency} />
            )}
          </TabsContent>

          {/* ── RESULTS TAB ── */}
          <TabsContent value="results" className="mt-4">
            {!projection ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <AlertCircle className="w-10 h-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">Enter your inputs to generate a projection</p>
                <Button size="sm" variant="outline" className="mt-3" onClick={() => setActiveTab('inputs')}>
                  Go to Inputs
                </Button>
              </div>
            ) : (
              <ProjectionResults
                projection={projection}
                currency={currency}
                model={model}
                approach={approach}
                chartMonthlyData={chartMonthlyData}
                chartYearlyData={chartYearlyData}
                quarterlyData={quarterlyData}
                showMonthly={showMonthly}
                onToggleMonthly={() => setShowMonthly(v => !v)}
              />
            )}
          </TabsContent>

          {/* ── HISTORY TAB ── */}
          <TabsContent value="history" className="mt-4">
            <SavedProjectionsList
              projections={savedProjections ?? []}
              onLoad={loadProjection}
              onDelete={handleDelete}
              deletePending={deleteMutation.isPending}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ── Top-Down Form ──────────────────────────────────────────────────────────
function TopDownForm({
  inputs, onChange, currency, model
}: {
  inputs: TopDownInputs;
  onChange: (key: keyof TopDownInputs, val: number | string) => void;
  currency: string;
  model: BusinessModel;
}) {
  const sam = inputs.tam * (inputs.samPct / 100);
  const som = sam * (inputs.somPct / 100);

  return (
    <div className="space-y-4">
      {/* Market Sizing */}
      <Card>
        <CardHeader className="pb-3 pt-4 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" />
            Market Sizing
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <NumInput
              label="TAM — Total Addressable Market"
              value={inputs.tam}
              onChange={v => onChange('tam', v)}
              prefix={currency === 'USD' ? '$' : ''}
              suffix={currency !== 'USD' ? currency : ''}
              hint="Total market if you captured 100%"
              required
            />
            <NumInput
              label="SAM — Serviceable Addressable Market"
              value={inputs.samPct}
              onChange={v => onChange('samPct', v)}
              suffix="%"
              min={0} max={100} step={0.1}
              hint={`= ${fmt(sam, currency)} of TAM`}
              required
            />
            <NumInput
              label="SOM — Serviceable Obtainable Market"
              value={inputs.somPct}
              onChange={v => onChange('somPct', v)}
              suffix="%"
              min={0} max={100} step={0.1}
              hint={`= ${fmt(som, currency)} of SAM`}
              required
            />
          </div>

          {/* Visual funnel */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/30 rounded-lg p-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span>TAM: <strong className="text-foreground">{fmt(inputs.tam, currency)}</strong></span>
            </div>
            <ArrowRight className="w-3 h-3" />
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-indigo-500" />
              <span>SAM: <strong className="text-foreground">{fmt(sam, currency)}</strong></span>
            </div>
            <ArrowRight className="w-3 h-3" />
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span>SOM: <strong className="text-foreground">{fmt(som, currency)}</strong></span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Market Capture */}
      <Card>
        <CardHeader className="pb-3 pt-4 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            Market Capture Rate (% of SOM)
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <NumInput
              label="Year 1 Capture"
              value={inputs.captureY1}
              onChange={v => onChange('captureY1', v)}
              suffix="%" min={0} max={100} step={0.1}
              hint={`≈ ${fmt(som * inputs.captureY1 / 100, currency)} revenue`}
            />
            <NumInput
              label="Year 2 Capture"
              value={inputs.captureY2}
              onChange={v => onChange('captureY2', v)}
              suffix="%" min={0} max={100} step={0.1}
              hint={`≈ ${fmt(som * inputs.captureY2 / 100, currency)} revenue`}
            />
            <NumInput
              label="Year 3 Capture"
              value={inputs.captureY3}
              onChange={v => onChange('captureY3', v)}
              suffix="%" min={0} max={100} step={0.1}
              hint={`≈ ${fmt(som * inputs.captureY3 / 100, currency)} revenue`}
            />
          </div>
          <NumInput
            label="Average Annual Revenue per Customer / Deal"
            value={inputs.avgDealSize}
            onChange={v => onChange('avgDealSize', v)}
            prefix={currency === 'USD' ? '$' : ''}
            hint="Used to estimate customer count from revenue"
          />
        </CardContent>
      </Card>
    </div>
  );
}

// ── Bottom-Up Form ─────────────────────────────────────────────────────────
function BottomUpForm({
  model, inputs, onChange, currency
}: {
  model: BusinessModel;
  inputs: BottomUpInputs;
  onChange: (key: string, val: number | string) => void;
  currency: string;
}) {
  const prefix = currency === 'USD' ? '$' : '';
  const suffix = currency !== 'USD' ? ` ${currency}` : '';

  switch (model) {
    case 'saas': {
      const i = inputs as any;
      return (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Customer Acquisition
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <NumInput label="Starting Customers" value={i.startingCustomers} onChange={v => onChange('startingCustomers', v)} hint="Customers at month 0" />
                <NumInput label="New Customers / Month" value={i.newCustomersPerMonth} onChange={v => onChange('newCustomersPerMonth', v)} hint="Month 1 new adds" />
                <NumInput label="MoM Growth in New Customers" value={i.monthlyGrowthRate} onChange={v => onChange('monthlyGrowthRate', v)} suffix="%" min={0} max={200} hint="How fast new adds grow" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                Revenue Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <NumInput label="Avg MRR per Customer" value={i.avgMRRPerCustomer} onChange={v => onChange('avgMRRPerCustomer', v)} prefix={prefix} hint="Monthly recurring revenue per seat" />
                <NumInput label="Monthly Churn Rate" value={i.monthlyChurnRate} onChange={v => onChange('monthlyChurnRate', v)} suffix="%" min={0} max={100} step={0.1} hint="% customers lost per month" />
                <NumInput label="Expansion Revenue" value={i.expansionRevenuePct} onChange={v => onChange('expansionRevenuePct', v)} suffix="%" min={0} hint="% MoM upsell on existing MRR" />
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    case 'ecommerce': {
      const i = inputs as any;
      return (
        <Card>
          <CardHeader className="pb-3 pt-4 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-primary" />
              Order & Revenue Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <NumInput label="Starting Monthly Orders" value={i.startingMonthlyOrders} onChange={v => onChange('startingMonthlyOrders', v)} hint="Orders in month 1" />
              <NumInput label="MoM Order Growth" value={i.orderGrowthRateMoM} onChange={v => onChange('orderGrowthRateMoM', v)} suffix="%" min={0} hint="% monthly order volume growth" />
              <NumInput label="Average Order Value (AOV)" value={i.avgOrderValue} onChange={v => onChange('avgOrderValue', v)} prefix={prefix} hint="Revenue per order" />
              <NumInput label="Return Rate" value={i.returnRate} onChange={v => onChange('returnRate', v)} suffix="%" min={0} max={100} hint="% of orders returned" />
              <NumInput label="Repeat Purchase Rate" value={i.repeatPurchaseRate} onChange={v => onChange('repeatPurchaseRate', v)} suffix="%" min={0} max={100} hint="% of customers buying again" />
            </div>
          </CardContent>
        </Card>
      );
    }

    case 'marketplace': {
      const i = inputs as any;
      return (
        <Card>
          <CardHeader className="pb-3 pt-4 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Store className="w-4 h-4 text-primary" />
              GMV & Take Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <NumInput label="Starting Monthly GMV" value={i.startingMonthlyGMV} onChange={v => onChange('startingMonthlyGMV', v)} prefix={prefix} hint="Gross Merchandise Value in month 1" />
              <NumInput label="MoM GMV Growth" value={i.gmvGrowthRateMoM} onChange={v => onChange('gmvGrowthRateMoM', v)} suffix="%" min={0} hint="% monthly GMV growth" />
              <NumInput label="Take Rate" value={i.takeRate} onChange={v => onChange('takeRate', v)} suffix="%" min={0} max={100} step={0.1} hint="% of GMV kept as revenue" />
            </div>
          </CardContent>
        </Card>
      );
    }

    case 'agency': {
      const i = inputs as any;
      return (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Client Acquisition
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <NumInput label="Starting Clients" value={i.startingClients} onChange={v => onChange('startingClients', v)} hint="Active clients at month 0" />
                <NumInput label="New Clients / Month" value={i.newClientsPerMonth} onChange={v => onChange('newClientsPerMonth', v)} hint="Month 1 new client adds" />
                <NumInput label="MoM Growth in New Clients" value={i.clientGrowthRateMoM} onChange={v => onChange('clientGrowthRateMoM', v)} suffix="%" min={0} hint="How fast new client adds grow" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                Revenue Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <NumInput label="Avg Monthly Retainer" value={i.avgMonthlyRetainer} onChange={v => onChange('avgMonthlyRetainer', v)} prefix={prefix} hint="Monthly fee per client" />
                <NumInput label="Monthly Client Churn" value={i.clientChurnRateMonthly} onChange={v => onChange('clientChurnRateMonthly', v)} suffix="%" min={0} max={100} step={0.1} hint="% clients lost per month" />
                <NumInput label="Project Revenue %" value={i.projectRevenuePct} onChange={v => onChange('projectRevenuePct', v)} suffix="%" min={0} hint="% additional from one-off projects" />
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    case 'hardware': {
      const i = inputs as any;
      return (
        <Card>
          <CardHeader className="pb-3 pt-4 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Cpu className="w-4 h-4 text-primary" />
              Hardware & Recurring Revenue
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <NumInput label="Starting Monthly Units" value={i.startingMonthlyUnits} onChange={v => onChange('startingMonthlyUnits', v)} hint="Units sold in month 1" />
              <NumInput label="MoM Unit Growth" value={i.unitGrowthRateMoM} onChange={v => onChange('unitGrowthRateMoM', v)} suffix="%" min={0} hint="% monthly unit sales growth" />
              <NumInput label="Avg Selling Price (ASP)" value={i.avgSellingPrice} onChange={v => onChange('avgSellingPrice', v)} prefix={prefix} hint="Revenue per unit sold" />
              <NumInput label="COGS per Unit" value={i.cogs} onChange={v => onChange('cogs', v)} prefix={prefix} hint="Cost of goods sold per unit" />
              <NumInput label="Recurring Revenue / Unit / Month" value={i.recurringRevenuePerUnit} onChange={v => onChange('recurringRevenuePerUnit', v)} prefix={prefix} hint="IoT subscription per installed unit" />
            </div>
          </CardContent>
        </Card>
      );
    }

    case 'procurement': {
      const i = inputs as any;
      return (
        <Card>
          <CardHeader className="pb-3 pt-4 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              Procurement Volume & Take Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <NumInput label="Starting Monthly PVF" value={i.startingMonthlyPVF} onChange={v => onChange('startingMonthlyPVF', v)} prefix={prefix} hint="Procurement Volume Facilitated in month 1" />
              <NumInput label="MoM PVF Growth" value={i.pvfGrowthRateMoM} onChange={v => onChange('pvfGrowthRateMoM', v)} suffix="%" min={0} hint="% monthly PVF growth" />
              <NumInput label="Take Rate (Service Fee)" value={i.takeRate} onChange={v => onChange('takeRate', v)} suffix="%" min={0} max={100} step={0.1} hint="% of PVF as service fee revenue" />
              <NumInput label="Average Order Value" value={i.avgOrderValue} onChange={v => onChange('avgOrderValue', v)} prefix={prefix} hint="Average procurement order size" />
              <NumInput label="Buyer Retention Rate" value={i.buyerRetentionRate} onChange={v => onChange('buyerRetentionRate', v)} suffix="%" min={0} max={100} hint="% of buyers returning monthly" />
            </div>
          </CardContent>
        </Card>
      );
    }
  }
}

// ── Projection Results ─────────────────────────────────────────────────────
function ProjectionResults({
  projection, currency, model, approach,
  chartMonthlyData, chartYearlyData, quarterlyData,
  showMonthly, onToggleMonthly
}: {
  projection: ProjectionOutput;
  currency: string;
  model: BusinessModel;
  approach: Approach;
  chartMonthlyData: any[];
  chartYearlyData: any[];
  quarterlyData: any[];
  showMonthly: boolean;
  onToggleMonthly: () => void;
}) {
  const meta = MODEL_META[model];
  const modelConfig = BUSINESS_MODELS.find(m => m.id === model)!;

  return (
    <div className="space-y-5">
      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {projection.yearly.map(y => (
          <Card key={y.year} className="relative overflow-hidden">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground mb-1">Year {y.year} Revenue</div>
              <div className="text-xl font-bold text-foreground">{fmt(y.revenue, currency)}</div>
              {y.revenueGrowth !== undefined && y.revenueGrowth !== null && (
                <div className={`flex items-center gap-1 text-xs mt-1 ${y.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {y.revenueGrowth >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {Math.abs(Math.round(y.revenueGrowth))}% YoY
                </div>
              )}
              <div className="text-[10px] text-muted-foreground mt-1">
                Avg {fmt(y.revenue / 12, currency)}/mo
              </div>
            </CardContent>
            <div className="absolute top-0 right-0 w-1 h-full" style={{ background: modelConfig.color, opacity: 0.6 }} />
          </Card>
        ))}
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">3-Year Total</div>
            <div className="text-xl font-bold text-foreground">
              {fmt(projection.yearly.reduce((s, y) => s + y.revenue, 0), currency)}
            </div>
            {projection.cagr !== undefined && (
              <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {Math.round(projection.cagr)}% CAGR
              </div>
            )}
            {approach === 'top-down' && projection.som && (
              <div className="text-[10px] text-muted-foreground mt-1">
                SOM: {fmt(projection.som, currency)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top-Down Market Funnel */}
      {approach === 'top-down' && projection.tam && (
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm">Market Funnel</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="flex flex-col sm:flex-row items-center gap-2 text-sm">
              {[
                { label: 'TAM', value: projection.tam, color: '#3B82F6' },
                { label: 'SAM', value: projection.sam!, color: '#6366F1' },
                { label: 'SOM', value: projection.som!, color: modelConfig.color },
              ].map((item, i) => (
                <div key={item.label} className="flex items-center gap-2">
                  {i > 0 && <ArrowRight className="w-4 h-4 text-muted-foreground hidden sm:block" />}
                  <div className="flex-1 sm:flex-none text-center p-3 rounded-lg bg-secondary/30 min-w-[100px]">
                    <div className="text-xs text-muted-foreground">{item.label}</div>
                    <div className="font-bold text-foreground" style={{ color: item.color }}>{fmt(item.value, currency)}</div>
                    {i > 0 && (
                      <div className="text-[10px] text-muted-foreground">
                        {i === 1 ? `${((item.value / projection.tam!) * 100).toFixed(1)}% of TAM` : `${((item.value / projection.sam!) * 100).toFixed(1)}% of SAM`}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Yearly Revenue Bar Chart */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm flex items-center justify-between">
            <span>Annual Revenue Forecast</span>
            <Badge variant="outline" className="text-[10px]">{approach === 'top-down' ? 'Market-Based' : 'Unit Economics'}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartYearlyData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickFormatter={v => fmt(v, currency)} width={60} />
                <Tooltip content={<CustomTooltip currency={currency} />} />
                <Bar dataKey="revenue" name="Revenue" radius={[4, 4, 0, 0]}>
                  {chartYearlyData.map((_, i) => (
                    <Cell key={i} fill={modelConfig.color} opacity={0.6 + i * 0.2} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Quarterly Revenue Chart */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm">Quarterly Revenue Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={quarterlyData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={modelConfig.color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={modelConfig.color} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickFormatter={v => fmt(v, currency)} width={60} />
                <Tooltip content={<CustomTooltip currency={currency} />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke={modelConfig.color}
                  fill="url(#revenueGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Table Toggle */}
      <div>
        <button
          onClick={onToggleMonthly}
          className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          {showMonthly ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {showMonthly ? 'Hide' : 'Show'} Monthly Breakdown
        </button>

        {showMonthly && (
          <div className="mt-3 overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-secondary/50">
                  <th className="text-left px-3 py-2 text-muted-foreground font-medium">Month</th>
                  <th className="text-right px-3 py-2 text-muted-foreground font-medium">Revenue</th>
                  <th className="text-right px-3 py-2 text-muted-foreground font-medium">Cumulative</th>
                  {projection.monthly[0].customers !== undefined && (
                    <th className="text-right px-3 py-2 text-muted-foreground font-medium">{meta.customerLabel}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {projection.monthly.map((m, i) => (
                  <tr key={i} className={`border-t border-border ${m.monthInYear === 12 ? 'bg-primary/5 font-semibold' : ''}`}>
                    <td className="px-3 py-1.5 text-muted-foreground">
                      Y{m.year} M{m.monthInYear}
                      {m.monthInYear === 12 && <span className="ml-1 text-[9px] text-primary">EOY</span>}
                    </td>
                    <td className="px-3 py-1.5 text-right text-foreground">{fmtCurrency(m.revenue, currency)}</td>
                    <td className="px-3 py-1.5 text-right text-muted-foreground">{fmtCurrency(m.cumulativeRevenue, currency)}</td>
                    {m.customers !== undefined && (
                      <td className="px-3 py-1.5 text-right text-foreground">{Math.round(m.customers).toLocaleString()}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Year Summary Table */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm">Year-by-Year Summary</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-muted-foreground font-medium text-xs">Metric</th>
                  <th className="text-right py-2 text-muted-foreground font-medium text-xs">Year 1</th>
                  <th className="text-right py-2 text-muted-foreground font-medium text-xs">Year 2</th>
                  <th className="text-right py-2 text-muted-foreground font-medium text-xs">Year 3</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="py-2 text-muted-foreground text-xs">Annual Revenue</td>
                  {projection.yearly.map(y => (
                    <td key={y.year} className="py-2 text-right font-semibold text-foreground text-xs">{fmtCurrency(y.revenue, currency)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2 text-muted-foreground text-xs">Avg Monthly Revenue</td>
                  {projection.yearly.map(y => (
                    <td key={y.year} className="py-2 text-right text-foreground text-xs">{fmtCurrency(y.revenue / 12, currency)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2 text-muted-foreground text-xs">YoY Growth</td>
                  {projection.yearly.map(y => (
                    <td key={y.year} className={`py-2 text-right text-xs font-medium ${y.revenueGrowth && y.revenueGrowth > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {y.revenueGrowth !== undefined && y.revenueGrowth !== null ? `${Math.round(y.revenueGrowth)}%` : '—'}
                    </td>
                  ))}
                </tr>
                {approach === 'top-down' && (
                  <tr>
                    <td className="py-2 text-muted-foreground text-xs">Market Share (SOM)</td>
                    {projection.yearly.map(y => (
                      <td key={y.year} className="py-2 text-right text-foreground text-xs">
                        {y.marketShare !== undefined ? `${y.marketShare}%` : '—'}
                      </td>
                    ))}
                  </tr>
                )}
                <tr>
                  <td className="py-2 text-muted-foreground text-xs">{meta.customerLabel}</td>
                  {projection.yearly.map(y => (
                    <td key={y.year} className="py-2 text-right text-foreground text-xs">
                      {y.customers !== undefined ? y.customers.toLocaleString() : '—'}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* CAGR & Assumptions */}
      <Card className="bg-secondary/20">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 text-xs">
            <div>
              <span className="text-muted-foreground">Approach: </span>
              <span className="font-semibold text-foreground capitalize">{approach.replace('-', ' ')}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Model: </span>
              <span className="font-semibold text-foreground">{meta.label}</span>
            </div>
            {projection.cagr !== undefined && (
              <div>
                <span className="text-muted-foreground">CAGR (Y1→Y3): </span>
                <span className="font-semibold text-green-600">{Math.round(projection.cagr)}%</span>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">3-Year Total: </span>
              <span className="font-semibold text-foreground">
                {fmtCurrency(projection.yearly.reduce((s, y) => s + y.revenue, 0), currency)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Saved Projections List ─────────────────────────────────────────────────
function SavedProjectionsList({
  projections, onLoad, onDelete, deletePending
}: {
  projections: any[];
  onLoad: (proj: any) => void;
  onDelete: (id: number) => void;
  deletePending: boolean;
}) {
  const { data: fullProjections, isLoading } = trpc.projection.list.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!projections.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <BookOpen className="w-10 h-10 text-muted-foreground mb-3" />
        <p className="text-sm font-medium text-foreground mb-1">No saved projections yet</p>
        <p className="text-xs text-muted-foreground">Create a projection and click Save to store it here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {projections.map(proj => {
        const bm = BUSINESS_MODELS.find(b => b.id === proj.businessModel);
        const Icon = bm?.icon ?? TrendingUp;
        return (
          <div key={proj.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:border-primary/30 transition-colors">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${bm?.color ?? '#6366F1'}20` }}>
              <Icon className="w-4 h-4" style={{ color: bm?.color ?? '#6366F1' }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-foreground truncate">{proj.name}</div>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 capitalize">{proj.approach.replace('-', ' ')}</Badge>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">{proj.currency}</Badge>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(proj.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={() => onLoad(proj)}>
                Load
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => onDelete(proj.id)}
                disabled={deletePending}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
