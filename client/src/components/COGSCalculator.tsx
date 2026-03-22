/**
 * COGS & Cost Management Suite
 * Full cost structure: direct (fixed/variable/semi-variable), indirect/OpEx,
 * overhead allocation, margin waterfall, break-even, monthly trend, AI analysis.
 * v2: Business-model templates + dedicated Unit Economics tab (LTV/CAC, payback, per-item waterfall)
 */
import { useState, useMemo, useCallback } from 'react';
import {
  Plus, Trash2, Loader2, Save, Sparkles, Calculator,
  History, RefreshCw, BarChart3, TrendingDown, TrendingUp,
  AlertCircle, Package, DollarSign, Percent, Target, Layers
} from 'lucide-react';
import { nanoid } from 'nanoid';
import { trpc } from '@/lib/trpc';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStartup } from '@/contexts/StartupContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { Streamdown } from 'streamdown';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, ReferenceLine, Legend
} from 'recharts';

// ── Types ──────────────────────────────────────────────────────────────────
type CostType = 'fixed' | 'variable' | 'semi-variable';
type DirectCategory = 'materials' | 'labor' | 'hosting' | 'payment_processing' | 'support' | 'packaging' | 'shipping' | 'licensing' | 'cloud' | 'other';
type IndirectCategory = 'sales' | 'marketing' | 'admin' | 'rd' | 'hr' | 'facilities' | 'legal' | 'insurance' | 'other';
type BusinessModel = 'saas' | 'ecommerce' | 'marketplace' | 'hardware' | 'services' | 'manufacturing' | 'other';

interface DirectCost {
  id: string;
  name: string;
  amount: number;
  /** 'fixed' = absolute currency amount; 'pct' = percentage of monthly revenue (e.g. 2.9 for 2.9%) */
  feeType: 'fixed' | 'pct';
  type: CostType;
  perUnit: boolean;
  fixedPortion?: number;
  variablePortion?: number;
  category: DirectCategory;
}

interface IndirectCost {
  id: string;
  name: string;
  amount: number;
  category: IndirectCategory;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function fmt(n: number, currency = 'USD'): string {
  const sym = currency === 'USD' ? '$' : currency === 'SAR' ? 'SAR ' : currency === 'AED' ? 'AED ' : currency + ' ';
  return `${sym}${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}
function pct(n: number): string { return `${n.toFixed(1)}%`; }
function clamp(n: number, min: number, max: number) { return Math.min(max, Math.max(min, n)); }

const DIRECT_CATEGORIES: { value: DirectCategory; label: string }[] = [
  { value: 'materials', label: 'Raw Materials' },
  { value: 'labor', label: 'Direct Labor' },
  { value: 'hosting', label: 'Hosting / Infra' },
  { value: 'cloud', label: 'Cloud Services' },
  { value: 'payment_processing', label: 'Payment Processing' },
  { value: 'support', label: 'Customer Support' },
  { value: 'packaging', label: 'Packaging' },
  { value: 'shipping', label: 'Shipping / Delivery' },
  { value: 'licensing', label: 'Licensing / Royalties' },
  { value: 'other', label: 'Other Direct' },
];

const INDIRECT_CATEGORIES: { value: IndirectCategory; label: string }[] = [
  { value: 'sales', label: 'Sales' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'admin', label: 'G&A / Admin' },
  { value: 'rd', label: 'R&D' },
  { value: 'hr', label: 'HR / Recruiting' },
  { value: 'facilities', label: 'Facilities / Rent' },
  { value: 'legal', label: 'Legal & Compliance' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'other', label: 'Other OpEx' },
];

const MARGIN_BENCHMARKS: Record<BusinessModel, { gross: number; ebitda: number; label: string }> = {
  saas:          { gross: 72, ebitda: 20, label: 'SaaS' },
  ecommerce:     { gross: 35, ebitda: 8,  label: 'E-Commerce' },
  marketplace:   { gross: 60, ebitda: 15, label: 'Marketplace' },
  hardware:      { gross: 40, ebitda: 10, label: 'Hardware' },
  services:      { gross: 55, ebitda: 18, label: 'Services' },
  manufacturing: { gross: 38, ebitda: 12, label: 'Manufacturing' },
  other:         { gross: 50, ebitda: 15, label: 'General' },
};

// ── Business Model Cost Templates ─────────────────────────────────────────
const BM_TEMPLATES: Record<BusinessModel, { direct: Omit<DirectCost, 'id'>[]; indirect: Omit<IndirectCost, 'id'>[] }> = {
  saas: {
    direct: [
      { name: 'Cloud Hosting (AWS/GCP/Azure)', amount: 0, feeType: 'fixed', type: 'variable', perUnit: false, category: 'hosting' },
      { name: 'Payment Processing (2.9% of revenue)', amount: 2.9, feeType: 'pct', type: 'variable', perUnit: false, category: 'payment_processing' },
      { name: 'Customer Support (per user/mo)', amount: 0, feeType: 'fixed', type: 'variable', perUnit: true, category: 'support' },
      { name: 'Third-party SaaS / APIs', amount: 0, feeType: 'fixed', type: 'fixed', perUnit: false, category: 'licensing' },
      { name: 'Data Storage & CDN', amount: 0, feeType: 'fixed', type: 'variable', perUnit: false, category: 'cloud' },
    ],
    indirect: [
      { name: 'Sales & Marketing', amount: 0, category: 'marketing' },
      { name: 'R&D / Engineering', amount: 0, category: 'rd' },
      { name: 'G&A / Admin', amount: 0, category: 'admin' },
    ],
  },
  ecommerce: {
    direct: [
      { name: 'Product Cost / COGS per item', amount: 0, feeType: 'fixed', type: 'variable', perUnit: true, category: 'materials' },
      { name: 'Packaging & Labeling', amount: 0, feeType: 'fixed', type: 'variable', perUnit: true, category: 'packaging' },
      { name: 'Shipping & Last-Mile Delivery', amount: 0, feeType: 'fixed', type: 'variable', perUnit: true, category: 'shipping' },
      { name: 'Payment Processing (2.9% of revenue)', amount: 2.9, feeType: 'pct', type: 'variable', perUnit: false, category: 'payment_processing' },
      { name: 'BNPL Fee (e.g. Tabby/Tamara ~3-5%)', amount: 3.5, feeType: 'pct', type: 'variable', perUnit: false, category: 'payment_processing' },
      { name: 'Returns & Refunds Reserve', amount: 0, feeType: 'fixed', type: 'variable', perUnit: true, category: 'other' },
      { name: 'Warehouse / Fulfillment (fixed)', amount: 0, feeType: 'fixed', type: 'fixed', perUnit: false, category: 'other' },
    ],
    indirect: [
      { name: 'Digital Marketing / Ads', amount: 0, category: 'marketing' },
      { name: 'Platform Fees (Amazon/Shopify)', amount: 0, category: 'sales' },
      { name: 'G&A / Admin', amount: 0, category: 'admin' },
    ],
  },
  marketplace: {
    direct: [
      { name: 'Payment Processing (2.9% of GMV)', amount: 2.9, feeType: 'pct', type: 'variable', perUnit: false, category: 'payment_processing' },
      { name: 'Trust & Safety / Fraud Prevention', amount: 0, feeType: 'fixed', type: 'variable', perUnit: true, category: 'support' },
      { name: 'Customer Support per Transaction', amount: 0, feeType: 'fixed', type: 'variable', perUnit: true, category: 'support' },
      { name: 'Cloud Infrastructure (fixed)', amount: 0, feeType: 'fixed', type: 'fixed', perUnit: false, category: 'hosting' },
    ],
    indirect: [
      { name: 'Supply Acquisition (sellers/providers)', amount: 0, category: 'marketing' },
      { name: 'Demand Acquisition (buyers)', amount: 0, category: 'marketing' },
      { name: 'R&D / Platform Engineering', amount: 0, category: 'rd' },
      { name: 'G&A / Admin', amount: 0, category: 'admin' },
    ],
  },
  hardware: {
    direct: [
      { name: 'Bill of Materials (BOM)', amount: 0, feeType: 'fixed', type: 'variable', perUnit: true, category: 'materials' },
      { name: 'Contract Manufacturing', amount: 0, feeType: 'fixed', type: 'variable', perUnit: true, category: 'labor' },
      { name: 'Quality Control & Testing', amount: 0, feeType: 'fixed', type: 'variable', perUnit: true, category: 'other' },
      { name: 'Packaging & Retail Box', amount: 0, feeType: 'fixed', type: 'variable', perUnit: true, category: 'packaging' },
      { name: 'Shipping & Logistics', amount: 0, feeType: 'fixed', type: 'variable', perUnit: true, category: 'shipping' },
      { name: 'Tooling & Molds (amortized)', amount: 0, feeType: 'fixed', type: 'fixed', perUnit: false, category: 'other' },
    ],
    indirect: [
      { name: 'Sales & Distribution', amount: 0, category: 'sales' },
      { name: 'R&D / Product Engineering', amount: 0, category: 'rd' },
      { name: 'Warranty & Returns Reserve', amount: 0, category: 'admin' },
    ],
  },
  services: {
    direct: [
      { name: 'Direct Labor / Consultant Hours', amount: 0, feeType: 'fixed', type: 'variable', perUnit: true, category: 'labor' },
      { name: 'Subcontractors / Freelancers', amount: 0, feeType: 'fixed', type: 'variable', perUnit: false, category: 'labor' },
      { name: 'Travel & Expenses (project)', amount: 0, feeType: 'fixed', type: 'variable', perUnit: false, category: 'other' },
      { name: 'Software / Tools per Project', amount: 0, feeType: 'fixed', type: 'variable', perUnit: false, category: 'licensing' },
    ],
    indirect: [
      { name: 'Business Development / Sales', amount: 0, category: 'sales' },
      { name: 'Marketing & Proposals', amount: 0, category: 'marketing' },
      { name: 'Overhead / Facilities', amount: 0, category: 'facilities' },
      { name: 'G&A / Admin', amount: 0, category: 'admin' },
    ],
  },
  manufacturing: {
    direct: [
      { name: 'Raw Materials', amount: 0, feeType: 'fixed', type: 'variable', perUnit: true, category: 'materials' },
      { name: 'Direct Labor (production)', amount: 0, feeType: 'fixed', type: 'variable', perUnit: true, category: 'labor' },
      { name: 'Energy / Utilities (variable)', amount: 0, feeType: 'fixed', type: 'variable', perUnit: false, category: 'other' },
      { name: 'Machine Maintenance (amortized)', amount: 0, feeType: 'fixed', type: 'fixed', perUnit: false, category: 'other' },
      { name: 'Quality Control', amount: 0, feeType: 'fixed', type: 'variable', perUnit: true, category: 'other' },
    ],
    indirect: [
      { name: 'Factory Overhead / Rent', amount: 0, category: 'facilities' },
      { name: 'Sales & Distribution', amount: 0, category: 'sales' },
      { name: 'G&A / Admin', amount: 0, category: 'admin' },
    ],
  },
  other: {
    direct: [
      { name: 'Primary Direct Cost', amount: 0, feeType: 'fixed', type: 'variable', perUnit: true, category: 'other' },
    ],
    indirect: [
      { name: 'Sales & Marketing', amount: 0, category: 'marketing' },
      { name: 'G&A / Admin', amount: 0, category: 'admin' },
    ],
  },
};

// ── Main Component ─────────────────────────────────────────────────────────
export default function COGSCalculator() {
  const { lang } = useLanguage();
  const { refresh: refreshContext } = useStartup();
  const isRTL = lang === 'ar';

  // ── State ──────────────────────────────────────────────────────────────
  const [businessModel, setBusinessModel] = useState<BusinessModel>('saas');
  const [currency, setCurrency] = useState('USD');
  const [calcName, setCalcName] = useState('');
  const [revenuePerUnit, setRevenuePerUnit] = useState(0);
  const [unitsPerMonth, setUnitsPerMonth] = useState(0);
  const [directCosts, setDirectCosts] = useState<DirectCost[]>([]);
  const [indirectCosts, setIndirectCosts] = useState<IndirectCost[]>([]);
  const [notes, setNotes] = useState('');
  const [activeTab, setActiveTab] = useState('costs');
  const [showHistory, setShowHistory] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [loadedId, setLoadedId] = useState<number | null>(null);
  const [growthRate, setGrowthRate] = useState(10);

  // Unit Economics extra state
  const [cac, setCac] = useState(0);
  const [ltv, setLtv] = useState(0);
  const [avgLifetimeMonths, setAvgLifetimeMonths] = useState(24);

  // ── tRPC ───────────────────────────────────────────────────────────────
  const { data: history, refetch: refetchHistory } = trpc.cogs.list.useQuery(undefined, { enabled: showHistory });
  const saveMutation = trpc.cogs.save.useMutation();
  const updateMutation = trpc.cogs.update.useMutation();
  const deleteMutation = trpc.cogs.delete.useMutation();
  const analyzeMutation = trpc.ai.analyzeCOGS.useMutation({
    onSuccess: (data) => setAiAnalysis(data?.analysis ?? ''),
    onError: () => toast.error('AI analysis failed'),
  });

  // ── Computed Metrics ───────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const monthlyRevenue = revenuePerUnit * unitsPerMonth;

    let totalDirectFixed = 0;
    let totalDirectVariable = 0;
    let totalDirectSemiFixed = 0;
    let totalDirectSemiVariable = 0;

    const monthlyRevForPct = revenuePerUnit * unitsPerMonth;
    for (const c of directCosts) {
      // Resolve effective amount: percentage-based fees use % of monthly revenue
      const effectiveAmount = c.feeType === 'pct'
        ? (c.amount / 100) * monthlyRevForPct
        : c.amount;
      if (c.type === 'fixed') {
        totalDirectFixed += effectiveAmount;
      } else if (c.type === 'variable') {
        if (c.feeType === 'pct') {
          // Pct-of-revenue costs are already monthly totals
          totalDirectVariable += effectiveAmount;
        } else {
          totalDirectVariable += c.perUnit ? effectiveAmount * unitsPerMonth : effectiveAmount;
        }
      } else if (c.type === 'semi-variable') {
        if (c.feeType === 'pct') {
          totalDirectSemiVariable += effectiveAmount;
        } else {
          const fixedBase = c.fixedPortion ?? effectiveAmount * 0.4;
          const varPer = c.variablePortion ?? (effectiveAmount * 0.6) / Math.max(1, unitsPerMonth);
          totalDirectSemiFixed += fixedBase;
          totalDirectSemiVariable += varPer * unitsPerMonth;
        }
      }
    }

    const totalCOGS = totalDirectFixed + totalDirectVariable + totalDirectSemiFixed + totalDirectSemiVariable;
    const grossProfit = monthlyRevenue - totalCOGS;
    const grossMarginPct = monthlyRevenue > 0 ? (grossProfit / monthlyRevenue) * 100 : 0;

    const totalOpEx = indirectCosts.reduce((s, c) => s + c.amount, 0);
    const ebitda = grossProfit - totalOpEx;
    const ebitdaMarginPct = monthlyRevenue > 0 ? (ebitda / monthlyRevenue) * 100 : 0;

    const totalFixed = totalDirectFixed + totalDirectSemiFixed + totalOpEx;
    const variableCostPerUnit = unitsPerMonth > 0
      ? (totalDirectVariable + totalDirectSemiVariable) / unitsPerMonth
      : 0;
    const contributionMarginPerUnit = revenuePerUnit - variableCostPerUnit;
    const breakEvenUnits = contributionMarginPerUnit > 0
      ? Math.ceil(totalFixed / contributionMarginPerUnit)
      : null;
    const breakEvenRevenue = breakEvenUnits !== null ? breakEvenUnits * revenuePerUnit : null;

    const cogPerUnit = unitsPerMonth > 0 ? totalCOGS / unitsPerMonth : 0;
    const grossProfitPerUnit = revenuePerUnit - cogPerUnit;

    const benchmark = MARGIN_BENCHMARKS[businessModel];
    const grossVsBenchmark = grossMarginPct - benchmark.gross;
    const ebitdaVsBenchmark = ebitdaMarginPct - benchmark.ebitda;

    return {
      monthlyRevenue, totalCOGS, grossProfit, grossMarginPct,
      totalOpEx, ebitda, ebitdaMarginPct,
      totalFixed, variableCostPerUnit, contributionMarginPerUnit,
      breakEvenUnits, breakEvenRevenue,
      cogPerUnit, grossProfitPerUnit,
      totalDirectFixed, totalDirectVariable, totalDirectSemiFixed, totalDirectSemiVariable,
      benchmark, grossVsBenchmark, ebitdaVsBenchmark,
    };
  }, [directCosts, indirectCosts, revenuePerUnit, unitsPerMonth, businessModel]);

  // ── Chart Data ─────────────────────────────────────────────────────────
  const waterfallData = useMemo(() => [
    { name: 'Revenue', value: metrics.monthlyRevenue, fill: '#10B981' },
    { name: 'Direct Costs', value: -metrics.totalCOGS, fill: '#EF4444' },
    { name: 'Gross Profit', value: metrics.grossProfit, fill: metrics.grossProfit >= 0 ? '#3B82F6' : '#EF4444' },
    { name: 'OpEx', value: -metrics.totalOpEx, fill: '#F59E0B' },
    { name: 'EBITDA', value: metrics.ebitda, fill: metrics.ebitda >= 0 ? '#8B5CF6' : '#EF4444' },
  ], [metrics]);

  const breakEvenData = useMemo(() => {
    const maxUnits = Math.max(unitsPerMonth * 2, (metrics.breakEvenUnits ?? 0) * 1.5, 100);
    return Array.from({ length: 11 }, (_, i) => {
      const u = Math.round((maxUnits / 10) * i);
      const rev = u * revenuePerUnit;
      const totalCost = metrics.totalFixed + u * metrics.variableCostPerUnit;
      return { units: u, revenue: rev, totalCost };
    });
  }, [metrics, revenuePerUnit, unitsPerMonth]);

  const trendData = useMemo(() => {
    return ['M1', 'M2', 'M3', 'M4', 'M5', 'M6'].map((m, i) => {
      const gf = Math.pow(1 + growthRate / 100, i);
      const u = Math.round(unitsPerMonth * gf);
      const rev = u * revenuePerUnit;
      const varCost = u * metrics.variableCostPerUnit;
      const cogs = metrics.totalFixed + varCost;
      const gp = rev - cogs;
      const ebitda = gp - metrics.totalOpEx;
      return { month: m, revenue: rev, cogs, grossProfit: gp, ebitda };
    });
  }, [metrics, revenuePerUnit, unitsPerMonth, growthRate]);

  const costByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of directCosts) {
      const label = DIRECT_CATEGORIES.find(x => x.value === c.category)?.label ?? c.category;
      const amt = c.type === 'variable' ? (c.perUnit ? c.amount * unitsPerMonth : c.amount)
        : c.type === 'semi-variable' ? ((c.fixedPortion ?? c.amount * 0.4) + (c.variablePortion ?? (c.amount * 0.6) / Math.max(1, unitsPerMonth)) * unitsPerMonth)
        : c.amount;
      map[label] = (map[label] ?? 0) + amt;
    }
    for (const c of indirectCosts) {
      const label = INDIRECT_CATEGORIES.find(x => x.value === c.category)?.label ?? c.category;
      map[label] = (map[label] ?? 0) + c.amount;
    }
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [directCosts, indirectCosts, unitsPerMonth]);

  // ── Handlers ───────────────────────────────────────────────────────────
  const addDirectCost = () => setDirectCosts(prev => [...prev, {
    id: nanoid(), name: '', amount: 0, feeType: 'fixed' as 'fixed' | 'pct', type: 'variable' as CostType, perUnit: true, category: 'other' as DirectCategory,
  }]);

  const updateDirectCost = (id: string, field: keyof DirectCost, value: unknown) =>
    setDirectCosts(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));

  const removeDirectCost = (id: string) =>
    setDirectCosts(prev => prev.filter(c => c.id !== id));

  const addIndirectCost = () => setIndirectCosts(prev => [...prev, {
    id: nanoid(), name: '', amount: 0, category: 'admin',
  }]);

  const updateIndirectCost = (id: string, field: keyof IndirectCost, value: unknown) =>
    setIndirectCosts(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));

  const removeIndirectCost = (id: string) =>
    setIndirectCosts(prev => prev.filter(c => c.id !== id));

  const applyTemplate = useCallback(() => {
    const tpl = BM_TEMPLATES[businessModel];
    setDirectCosts(tpl.direct.map(c => ({ ...c, id: nanoid() })));
    setIndirectCosts(tpl.indirect.map(c => ({ ...c, id: nanoid() })));
    toast.success(`${MARGIN_BENCHMARKS[businessModel].label} template loaded — fill in the amounts`);
  }, [businessModel]);

  const handleSave = useCallback(async () => {
    if (!calcName.trim()) { toast.error('Please enter a name for this calculation'); return; }
    const payload = {
      name: calcName, businessModel, currency, revenuePerUnit, unitsPerMonth,
      directCostsJson: directCosts as any,
      indirectCostsJson: indirectCosts as any,
      totalCOGS: metrics.totalCOGS,
      grossProfit: metrics.grossProfit,
      grossMarginPct: metrics.grossMarginPct,
      totalOpEx: metrics.totalOpEx,
      ebitda: metrics.ebitda,
      breakEvenUnits: metrics.breakEvenUnits ?? undefined,
      notes,
    };
    try {
      if (loadedId) {
        await updateMutation.mutateAsync({ ...payload, id: loadedId });
        toast.success('Calculation updated');
      } else {
        await saveMutation.mutateAsync(payload);
        toast.success('Calculation saved');
      }
      refreshContext();
      refetchHistory();
    } catch { toast.error('Failed to save'); }
  }, [calcName, businessModel, currency, revenuePerUnit, unitsPerMonth, directCosts, indirectCosts, metrics, notes, loadedId]);

  const handleLoad = (item: any) => {
    setCalcName(item.name); setBusinessModel(item.businessModel); setCurrency(item.currency);
    setRevenuePerUnit(item.revenuePerUnit); setUnitsPerMonth(item.unitsPerMonth);
    setDirectCosts(Array.isArray(item.directCostsJson) ? item.directCostsJson : []);
    setIndirectCosts(Array.isArray(item.indirectCostsJson) ? item.indirectCostsJson : []);
    setNotes(item.notes ?? ''); setLoadedId(item.id); setShowHistory(false);
    toast.success(`Loaded: ${item.name}`);
  };

  const handleAIAnalysis = () => {
    analyzeMutation.mutate({
      businessModel, currency,
      monthlyRevenue: metrics.monthlyRevenue,
      totalCOGS: metrics.totalCOGS,
      grossMarginPct: metrics.grossMarginPct,
      totalOpEx: metrics.totalOpEx,
      ebitda: metrics.ebitda,
      breakEvenUnits: metrics.breakEvenUnits,
      directCosts: directCosts.map(c => ({ name: c.name, amount: c.amount, type: c.type })),
      indirectCosts: indirectCosts.map(c => ({ name: c.name, amount: c.amount, category: c.category })),
      language: lang === 'ar' ? 'arabic' : 'english',
    });
    setActiveTab('analysis');
  };

  // ── Sub-components ─────────────────────────────────────────────────────
  const BenchmarkPill = ({ delta, label }: { delta: number; label: string }) => (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${delta >= 0 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
      {delta >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {delta >= 0 ? '+' : ''}{delta.toFixed(1)}pp vs {label}
    </span>
  );

  // ── Unit Economics derived values ──────────────────────────────────────
  const ltvCacRatio = cac > 0 ? ltv / cac : null;
  const cacPaybackMonths = (revenuePerUnit > 0 && metrics.grossMarginPct > 0 && cac > 0)
    ? Math.ceil(cac / (revenuePerUnit * metrics.grossMarginPct / 100))
    : null;
  const opexPerUnit = unitsPerMonth > 0 ? metrics.totalOpEx / unitsPerMonth : 0;
  const netContribPerUnit = metrics.contributionMarginPerUnit - opexPerUnit;

  return (
    <div className={`space-y-6 ${isRTL ? 'rtl' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            Cost Management Suite
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">Full cost structure · Margin waterfall · Unit Economics · Break-even · AI analysis</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => { setShowHistory(v => !v); if (!showHistory) refetchHistory(); }}>
            <History className="w-4 h-4 mr-1.5" /> History
          </Button>
          <Button variant="outline" size="sm" onClick={handleAIAnalysis} disabled={analyzeMutation.isPending}>
            {analyzeMutation.isPending ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1.5" />}
            AI Analysis
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saveMutation.isPending || updateMutation.isPending}>
            {(saveMutation.isPending || updateMutation.isPending) ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
            {loadedId ? 'Update' : 'Save'}
          </Button>
        </div>
      </div>

      {/* History Panel */}
      {showHistory && (
        <Card>
          <CardHeader className="pb-2 pt-4"><CardTitle className="text-sm">Saved Calculations</CardTitle></CardHeader>
          <CardContent className="pb-4">
            {!history?.length ? (
              <p className="text-sm text-muted-foreground">No saved calculations yet.</p>
            ) : (
              <div className="space-y-2">
                {history.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/40">
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.businessModel} · GM {item.grossMarginPct?.toFixed(1)}% · {new Date(item.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleLoad(item)}>Load</Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={async () => { await deleteMutation.mutateAsync({ id: item.id }); refetchHistory(); toast.success('Deleted'); }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Setup Row */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="col-span-2">
              <Label className="text-xs">Calculation Name</Label>
              <Input value={calcName} onChange={e => setCalcName(e.target.value)} placeholder="e.g. Q2 2025 Cost Model" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Business Model</Label>
              <Select value={businessModel} onValueChange={v => setBusinessModel(v as BusinessModel)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(MARGIN_BENCHMARKS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['USD', 'SAR', 'AED', 'EUR', 'GBP', 'EGP', 'JOD'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Revenue / Unit ({currency})</Label>
              <Input type="number" min={0} value={revenuePerUnit || ''} onChange={e => setRevenuePerUnit(parseFloat(e.target.value) || 0)} placeholder="0" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Units / Month</Label>
              <Input type="number" min={0} value={unitsPerMonth || ''} onChange={e => setUnitsPerMonth(parseFloat(e.target.value) || 0)} placeholder="0" className="mt-1" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Monthly Revenue', value: fmt(metrics.monthlyRevenue, currency), icon: DollarSign, color: 'text-green-600 dark:text-green-400' },
          { label: 'Gross Margin', value: pct(metrics.grossMarginPct), icon: Percent, color: metrics.grossMarginPct >= metrics.benchmark.gross ? 'text-green-600 dark:text-green-400' : 'text-red-500', sub: <BenchmarkPill delta={metrics.grossVsBenchmark} label={metrics.benchmark.label} /> },
          { label: 'EBITDA', value: fmt(metrics.ebitda, currency), icon: TrendingUp, color: metrics.ebitda >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-500', sub: `${pct(metrics.ebitdaMarginPct)} margin` },
          { label: 'Break-even', value: metrics.breakEvenUnits !== null ? `${metrics.breakEvenUnits.toLocaleString()} units` : 'N/A', icon: Target, color: 'text-foreground', sub: metrics.breakEvenRevenue !== null ? `${fmt(metrics.breakEvenRevenue, currency)}/mo` : undefined },
        ].map(card => (
          <Card key={card.label}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{card.label}</p>
                  <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
                  {card.sub && <div className="mt-1">{typeof card.sub === 'string' ? <p className="text-xs text-muted-foreground">{card.sub}</p> : card.sub}</div>}
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
          <TabsTrigger value="costs">Cost Inputs</TabsTrigger>
          <TabsTrigger value="unit-econ">Unit Economics</TabsTrigger>
          <TabsTrigger value="waterfall">Margin Waterfall</TabsTrigger>
          <TabsTrigger value="breakeven">Break-even</TabsTrigger>
          <TabsTrigger value="trend">6-Month Trend</TabsTrigger>
          <TabsTrigger value="breakdown">Cost Breakdown</TabsTrigger>
          <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
        </TabsList>

        {/* ── COST INPUTS ── */}
        <TabsContent value="costs" className="space-y-4 mt-4">
          {/* Direct Costs */}
          <Card>
            <CardHeader className="pb-2 pt-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" />
                  Direct Costs (COGS)
                  <Badge variant="secondary">{fmt(metrics.totalCOGS, currency)}</Badge>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={applyTemplate}
                    title={`Load ${MARGIN_BENCHMARKS[businessModel].label} cost template`}
                    className="text-primary border-primary/40 hover:bg-primary/5"
                  >
                    <Layers className="w-3.5 h-3.5 mr-1" />
                    Load {MARGIN_BENCHMARKS[businessModel].label} Template
                  </Button>
                  <Button variant="outline" size="sm" onClick={addDirectCost}><Plus className="w-4 h-4 mr-1" /> Add Cost</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-4 space-y-3">
              {directCosts.length === 0 && (
                <div className="text-center py-6 space-y-2">
                  <p className="text-sm text-muted-foreground">No direct costs yet.</p>
                  <p className="text-xs text-muted-foreground">Click <strong>Load {MARGIN_BENCHMARKS[businessModel].label} Template</strong> to pre-fill common cost lines for your business model, or add costs manually.</p>
                </div>
              )}
              {directCosts.map(cost => (
                <div key={cost.id} className="flex flex-wrap gap-2 items-end p-3 rounded-lg border border-border bg-muted/20 w-full">
                  <div className="w-full sm:w-auto sm:flex-[2] min-w-[140px]">
                    <Label className="text-xs">Cost Name</Label>
                    <Input value={cost.name} onChange={e => updateDirectCost(cost.id, 'name', e.target.value)} placeholder="e.g. AWS hosting" className="mt-1 h-8 text-sm" />
                  </div>
                  <div className="flex-1 min-w-[120px]">
                    <Label className="text-xs">Category</Label>
                    <Select value={cost.category} onValueChange={v => updateDirectCost(cost.id, 'category', v as DirectCategory)}>
                      <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {DIRECT_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 min-w-[110px]">
                    <Label className="text-xs">Type</Label>
                    <Select value={cost.type} onValueChange={v => updateDirectCost(cost.id, 'type', v as CostType)}>
                      <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Fixed</SelectItem>
                        <SelectItem value="variable">Variable</SelectItem>
                        <SelectItem value="semi-variable">Semi-Variable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Fee Type toggle: fixed amount vs % of revenue */}
                  <div className="flex-1 min-w-[110px]">
                    <Label className="text-xs">Fee Type</Label>
                    <Select value={cost.feeType ?? 'fixed'} onValueChange={v => updateDirectCost(cost.id, 'feeType', v as 'fixed' | 'pct')}>
                      <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Fixed ({currency})</SelectItem>
                        <SelectItem value="pct">% of Revenue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {cost.feeType === 'pct' ? (
                    <div className="flex-1 min-w-[90px]">
                      <Label className="text-xs">Rate (%)</Label>
                      <div className="relative mt-1">
                        <Input type="number" min={0} max={100} step={0.1} value={cost.amount || ''} onChange={e => updateDirectCost(cost.id, 'amount', parseFloat(e.target.value) || 0)} placeholder="e.g. 2.9" className="h-8 text-sm pr-7" />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        = {metrics.monthlyRevenue > 0 ? fmt((cost.amount / 100) * metrics.monthlyRevenue, currency) : '—'}/mo
                      </p>
                    </div>
                  ) : cost.type === 'semi-variable' ? (
                    <>
                      <div className="flex-1 min-w-[90px]">
                        <Label className="text-xs">Fixed ({currency})</Label>
                        <Input type="number" min={0} value={cost.fixedPortion ?? ''} onChange={e => updateDirectCost(cost.id, 'fixedPortion', parseFloat(e.target.value) || 0)} placeholder="0" className="mt-1 h-8 text-sm" />
                      </div>
                      <div className="flex-1 min-w-[90px]">
                        <Label className="text-xs">Var/Unit ({currency})</Label>
                        <Input type="number" min={0} value={cost.variablePortion ?? ''} onChange={e => updateDirectCost(cost.id, 'variablePortion', parseFloat(e.target.value) || 0)} placeholder="0" className="mt-1 h-8 text-sm" />
                      </div>
                    </>
                  ) : (
                    <>
                        <div className="flex-1 min-w-[90px]">
                        <Label className="text-xs">{cost.type === 'variable' && cost.perUnit ? `Per Unit (${currency})` : `Monthly (${currency})`}</Label>
                        <Input type="number" min={0} value={cost.amount || ''} onChange={e => updateDirectCost(cost.id, 'amount', parseFloat(e.target.value) || 0)} placeholder="0" className="mt-1 h-8 text-sm" />
                      </div>
                      {cost.type === 'variable' && (
                        <div className="flex items-center pb-1">
                          <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                            <input type="checkbox" checked={cost.perUnit} onChange={e => updateDirectCost(cost.id, 'perUnit', e.target.checked)} className="rounded" />
                            Per unit
                          </label>
                        </div>
                      )}
                    </>
                  )}
                  <div className="flex items-center pb-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => removeDirectCost(cost.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {directCosts.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2">
                  <div className="text-xs text-muted-foreground bg-muted/30 rounded p-2"><span className="font-medium">Fixed:</span> {fmt(metrics.totalDirectFixed, currency)}</div>
                  <div className="text-xs text-muted-foreground bg-muted/30 rounded p-2"><span className="font-medium">Variable:</span> {fmt(metrics.totalDirectVariable, currency)}</div>
                  <div className="text-xs text-muted-foreground bg-muted/30 rounded p-2"><span className="font-medium">Semi-Var:</span> {fmt(metrics.totalDirectSemiFixed + metrics.totalDirectSemiVariable, currency)}</div>
                  <div className="text-xs bg-primary/10 text-primary rounded p-2 font-semibold">Total COGS: {fmt(metrics.totalCOGS, currency)}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Indirect / OpEx */}
          <Card>
            <CardHeader className="pb-2 pt-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-orange-500" />
                  Operating Expenses (OpEx)
                  <Badge variant="secondary">{fmt(metrics.totalOpEx, currency)}</Badge>
                </CardTitle>
                <Button variant="outline" size="sm" onClick={addIndirectCost}><Plus className="w-4 h-4 mr-1" /> Add Expense</Button>
              </div>
            </CardHeader>
            <CardContent className="pb-4 space-y-3">
              {indirectCosts.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No operating expenses yet.</p>
              )}
              {indirectCosts.map(cost => (
                <div key={cost.id} className="flex flex-wrap gap-2 items-end p-3 rounded-lg border border-border bg-muted/20 w-full">
                  <div className="w-full sm:w-auto sm:flex-[2] min-w-[140px]">
                    <Label className="text-xs">Expense Name</Label>
                    <Input value={cost.name} onChange={e => updateIndirectCost(cost.id, 'name', e.target.value)} placeholder="e.g. Google Ads" className="mt-1 h-8 text-sm" />
                  </div>
                  <div className="flex-1 min-w-[120px]">
                    <Label className="text-xs">Category</Label>
                    <Select value={cost.category} onValueChange={v => updateIndirectCost(cost.id, 'category', v as IndirectCategory)}>
                      <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {INDIRECT_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 min-w-[100px]">
                    <Label className="text-xs">Monthly ({currency})</Label>
                    <Input type="number" min={0} value={cost.amount || ''} onChange={e => updateIndirectCost(cost.id, 'amount', parseFloat(e.target.value) || 0)} placeholder="0" className="mt-1 h-8 text-sm" />
                  </div>
                  <div className="flex items-center pb-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => removeIndirectCost(cost.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Unit Economics Summary (shown when data is available) */}
          {revenuePerUnit > 0 && unitsPerMonth > 0 && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-2 pt-4"><CardTitle className="text-sm">Unit Economics Summary</CardTitle></CardHeader>
              <CardContent className="pb-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {[
                    { label: 'Revenue / Unit', value: fmt(revenuePerUnit, currency), color: 'text-green-600 dark:text-green-400' },
                    { label: 'COGS / Unit', value: fmt(metrics.cogPerUnit, currency), color: 'text-red-500' },
                    { label: 'Gross Profit / Unit', value: fmt(metrics.grossProfitPerUnit, currency), color: metrics.grossProfitPerUnit >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-500' },
                    { label: 'Contribution Margin / Unit', value: fmt(metrics.contributionMarginPerUnit, currency), color: metrics.contributionMarginPerUnit >= 0 ? 'text-purple-600 dark:text-purple-400' : 'text-red-500' },
                  ].map(item => (
                    <div key={item.label}>
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className={`font-bold ${item.color}`}>{item.value}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  → For full LTV/CAC analysis, payback period, and per-item waterfall, see the <button className="underline text-primary" onClick={() => setActiveTab('unit-econ')}>Unit Economics tab</button>.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <div>
            <Label className="text-xs">Notes / Assumptions</Label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add assumptions, pricing notes, or context..." className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] resize-y focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
        </TabsContent>

        {/* ── UNIT ECONOMICS ── */}
        <TabsContent value="unit-econ" className="space-y-4 mt-4">
          {/* LTV / CAC Inputs */}
          <Card>
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                Customer Acquisition & Lifetime Value
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs">CAC — Cost to Acquire 1 Customer ({currency})</Label>
                  <Input type="number" min={0} value={cac || ''} onChange={e => setCac(parseFloat(e.target.value) || 0)} placeholder="0" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">LTV — Lifetime Value per Customer ({currency})</Label>
                  <Input type="number" min={0} value={ltv || ''} onChange={e => setLtv(parseFloat(e.target.value) || 0)} placeholder="0" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Avg Customer Lifetime (months)</Label>
                  <Input type="number" min={1} value={avgLifetimeMonths} onChange={e => setAvgLifetimeMonths(parseInt(e.target.value) || 24)} placeholder="24" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Revenue / Unit ({currency}) — from Setup</Label>
                  <Input type="number" min={0} value={revenuePerUnit || ''} onChange={e => setRevenuePerUnit(parseFloat(e.target.value) || 0)} placeholder="0" className="mt-1" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Per-Unit KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                label: 'Revenue / Unit',
                value: fmt(revenuePerUnit, currency),
                sub: 'Selling price per unit',
                color: 'text-green-600 dark:text-green-400',
              },
              {
                label: 'COGS / Unit',
                value: fmt(metrics.cogPerUnit, currency),
                sub: `${pct(revenuePerUnit > 0 ? (metrics.cogPerUnit / revenuePerUnit) * 100 : 0)} of revenue`,
                color: 'text-red-500',
              },
              {
                label: 'Gross Profit / Unit',
                value: fmt(metrics.grossProfitPerUnit, currency),
                sub: `${pct(revenuePerUnit > 0 ? (metrics.grossProfitPerUnit / revenuePerUnit) * 100 : 0)} gross margin`,
                color: metrics.grossProfitPerUnit >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-500',
              },
              {
                label: 'Contribution Margin / Unit',
                value: fmt(metrics.contributionMarginPerUnit, currency),
                sub: 'After variable costs only',
                color: metrics.contributionMarginPerUnit >= 0 ? 'text-purple-600 dark:text-purple-400' : 'text-red-500',
              },
            ].map(card => (
              <Card key={card.label}>
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground mb-1">{card.label}</p>
                  <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* LTV / CAC Analysis */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                label: 'LTV / CAC Ratio',
                value: ltvCacRatio !== null ? `${ltvCacRatio.toFixed(2)}x` : 'N/A',
                sub: ltvCacRatio !== null
                  ? (ltvCacRatio >= 3 ? '✅ Healthy (≥3x)' : ltvCacRatio >= 1 ? '⚠️ Below target (<3x)' : '🔴 Unprofitable (<1x)')
                  : 'Enter CAC & LTV to calculate',
                color: ltvCacRatio !== null
                  ? (ltvCacRatio >= 3 ? 'text-green-600 dark:text-green-400' : ltvCacRatio >= 1 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-500')
                  : 'text-muted-foreground',
              },
              {
                label: 'CAC Payback Period',
                value: cacPaybackMonths !== null ? `${cacPaybackMonths} months` : 'N/A',
                sub: 'Months to recover CAC from gross profit',
                color: cacPaybackMonths !== null ? (cacPaybackMonths <= 12 ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400') : 'text-muted-foreground',
              },
              {
                label: 'Customer Lifetime Revenue',
                value: fmt(revenuePerUnit * avgLifetimeMonths, currency),
                sub: `${revenuePerUnit > 0 ? fmt(revenuePerUnit, currency) : '—'}/mo × ${avgLifetimeMonths}mo`,
                color: 'text-foreground',
              },
              {
                label: 'Net Contribution / Unit',
                value: fmt(netContribPerUnit, currency),
                sub: 'After COGS + allocated OpEx',
                color: netContribPerUnit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500',
              },
            ].map(card => (
              <Card key={card.label}>
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground mb-1">{card.label}</p>
                  <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Per-Unit Waterfall */}
          <Card>
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm">Per-Unit P&L Waterfall</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              {revenuePerUnit === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Enter Revenue / Unit in the Setup card above to see the waterfall.</p>
              ) : (
                <div className="space-y-3">
                  {[
                    { label: 'Revenue per Unit', value: revenuePerUnit, color: 'bg-green-500', textColor: 'text-green-600 dark:text-green-400' },
                    { label: '− COGS per Unit', value: metrics.cogPerUnit, color: 'bg-red-400', textColor: 'text-red-500', negative: true },
                    { label: '= Gross Profit per Unit', value: metrics.grossProfitPerUnit, color: metrics.grossProfitPerUnit >= 0 ? 'bg-blue-500' : 'bg-red-500', textColor: metrics.grossProfitPerUnit >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-500' },
                    { label: '− OpEx Allocated per Unit', value: opexPerUnit, color: 'bg-orange-400', textColor: 'text-orange-500', negative: true },
                    { label: '= Net Contribution per Unit', value: netContribPerUnit, color: netContribPerUnit >= 0 ? 'bg-purple-500' : 'bg-red-500', textColor: netContribPerUnit >= 0 ? 'text-purple-600 dark:text-purple-400' : 'text-red-500' },
                  ].map(row => (
                    <div key={row.label} className="flex items-center gap-3">
                      <div className="w-52 text-xs text-muted-foreground shrink-0">{row.label}</div>
                      <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${row.color} rounded-full transition-all`}
                          style={{ width: `${revenuePerUnit > 0 ? Math.min(100, Math.abs(row.value) / revenuePerUnit * 100) : 0}%` }}
                        />
                      </div>
                      <div className={`text-xs font-semibold w-24 text-right ${row.textColor}`}>
                        {row.negative ? '−' : ''}{fmt(Math.abs(row.value), currency)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Industry Benchmarks for this model */}
          <Card>
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm">Industry Benchmarks — {MARGIN_BENCHMARKS[businessModel].label}</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 rounded-lg bg-muted/40">
                  <p className="text-xs text-muted-foreground">Target Gross Margin</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">{MARGIN_BENCHMARKS[businessModel].gross}%</p>
                  <p className="text-xs text-muted-foreground">Your: {pct(metrics.grossMarginPct)}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/40">
                  <p className="text-xs text-muted-foreground">Target EBITDA Margin</p>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{MARGIN_BENCHMARKS[businessModel].ebitda}%</p>
                  <p className="text-xs text-muted-foreground">Your: {pct(metrics.ebitdaMarginPct)}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/40">
                  <p className="text-xs text-muted-foreground">Target LTV/CAC</p>
                  <p className="text-lg font-bold text-purple-600 dark:text-purple-400">3x+</p>
                  <p className="text-xs text-muted-foreground">Your: {ltvCacRatio !== null ? `${ltvCacRatio.toFixed(1)}x` : 'N/A'}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/40">
                  <p className="text-xs text-muted-foreground">CAC Payback Target</p>
                  <p className="text-lg font-bold text-orange-600 dark:text-orange-400">&lt;12 months</p>
                  <p className="text-xs text-muted-foreground">
                    {cacPaybackMonths !== null ? `Your: ${cacPaybackMonths}mo` : 'Enter CAC & Revenue/Unit'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── WATERFALL ── */}
        <TabsContent value="waterfall" className="mt-4">
          <Card>
            <CardHeader className="pb-2 pt-4"><CardTitle className="text-sm">Margin Waterfall</CardTitle></CardHeader>
            <CardContent className="pb-4">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={waterfallData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: any) => fmt(Math.abs(v), currency)} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {waterfallData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-1.5">
                {[
                  { label: 'Revenue', value: metrics.monthlyRevenue, pctVal: 100, color: 'text-green-600 dark:text-green-400' },
                  { label: '− Direct Costs (COGS)', value: -metrics.totalCOGS, pctVal: metrics.monthlyRevenue > 0 ? -(metrics.totalCOGS / metrics.monthlyRevenue) * 100 : 0, color: 'text-red-500' },
                  { label: '= Gross Profit', value: metrics.grossProfit, pctVal: metrics.grossMarginPct, color: metrics.grossProfit >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-500', bold: true },
                  { label: '− Operating Expenses', value: -metrics.totalOpEx, pctVal: metrics.monthlyRevenue > 0 ? -(metrics.totalOpEx / metrics.monthlyRevenue) * 100 : 0, color: 'text-orange-500' },
                  { label: '= EBITDA', value: metrics.ebitda, pctVal: metrics.ebitdaMarginPct, color: metrics.ebitda >= 0 ? 'text-purple-600 dark:text-purple-400' : 'text-red-500', bold: true },
                ].map(row => (
                  <div key={row.label} className={`flex items-center justify-between text-sm px-3 py-2 rounded ${row.bold ? 'bg-muted/50 font-semibold' : ''}`}>
                    <span className="text-muted-foreground">{row.label}</span>
                    <div className="flex items-center gap-4">
                      <span className={row.color}>{fmt(row.value, currency)}</span>
                      <span className="text-xs text-muted-foreground w-14 text-right">{row.pctVal.toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 rounded-lg bg-muted/30 text-sm">
                <p className="font-medium mb-2 text-xs text-muted-foreground uppercase tracking-wide">Industry Benchmarks — {metrics.benchmark.label}</p>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Gross Margin:</span>
                    <span className="font-medium">{metrics.benchmark.gross}%</span>
                    <BenchmarkPill delta={metrics.grossVsBenchmark} label={metrics.benchmark.label} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">EBITDA:</span>
                    <span className="font-medium">{metrics.benchmark.ebitda}%</span>
                    <BenchmarkPill delta={metrics.ebitdaVsBenchmark} label={metrics.benchmark.label} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── BREAK-EVEN ── */}
        <TabsContent value="breakeven" className="mt-4">
          <Card>
            <CardHeader className="pb-2 pt-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Break-even Analysis</CardTitle>
                {metrics.breakEvenUnits !== null && (
                  <Badge className="bg-primary/10 text-primary border-0">BEP: {metrics.breakEvenUnits.toLocaleString()} units</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              {metrics.contributionMarginPerUnit <= 0 ? (
                <div className="flex items-center gap-2 p-4 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  Variable cost per unit exceeds revenue per unit — break-even is not achievable at current pricing.
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={breakEvenData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="units" tickFormatter={v => v.toLocaleString()} tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: any) => fmt(v, currency)} />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} dot={false} name="Revenue" />
                      <Line type="monotone" dataKey="totalCost" stroke="#EF4444" strokeWidth={2} dot={false} name="Total Cost" />
                      {metrics.breakEvenUnits !== null && (
                        <ReferenceLine x={metrics.breakEvenUnits} stroke="#6366F1" strokeDasharray="4 4" label={{ value: 'BEP', fill: '#6366F1', fontSize: 11 }} />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4 text-sm">
                    {[
                      { label: 'Fixed Costs / Month', value: fmt(metrics.totalFixed, currency), color: '' },
                      { label: 'Variable Cost / Unit', value: fmt(metrics.variableCostPerUnit, currency), color: '' },
                      { label: 'Contribution Margin / Unit', value: fmt(metrics.contributionMarginPerUnit, currency), color: 'text-purple-600 dark:text-purple-400' },
                      metrics.breakEvenUnits !== null ? { label: 'Break-even Units', value: metrics.breakEvenUnits.toLocaleString(), color: 'text-primary' } : null,
                      metrics.breakEvenRevenue !== null ? { label: 'Break-even Revenue', value: `${fmt(metrics.breakEvenRevenue, currency)}/mo`, color: 'text-primary' } : null,
                      metrics.breakEvenUnits !== null && unitsPerMonth > 0 ? {
                        label: 'Current vs BEP',
                        value: unitsPerMonth >= metrics.breakEvenUnits ? `+${(unitsPerMonth - metrics.breakEvenUnits).toLocaleString()} above` : `${(metrics.breakEvenUnits - unitsPerMonth).toLocaleString()} to go`,
                        color: unitsPerMonth >= metrics.breakEvenUnits ? 'text-green-600 dark:text-green-400' : 'text-red-500',
                      } : null,
                    ].filter(Boolean).map((item: any) => (
                      <div key={item.label} className="p-3 rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground">{item.label}</p>
                        <p className={`font-bold ${item.color}`}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TREND ── */}
        <TabsContent value="trend" className="mt-4">
          <Card>
            <CardHeader className="pb-2 pt-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle className="text-sm">6-Month Projection</CardTitle>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">Monthly Growth:</span>
                  <div className="flex items-center gap-2 w-36">
                    <Slider value={[growthRate]} onValueChange={([v]) => setGrowthRate(v)} min={-20} max={50} step={1} className="flex-1" />
                    <span className="text-sm font-medium w-10 text-right">{growthRate}%</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={trendData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: any) => fmt(v, currency)} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#10B981" name="Revenue" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="cogs" fill="#EF4444" name="COGS" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="grossProfit" fill="#3B82F6" name="Gross Profit" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="ebitda" fill="#8B5CF6" name="EBITDA" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      {['Month', 'Revenue', 'COGS', 'Gross Profit', 'EBITDA'].map(h => (
                        <th key={h} className={`py-2 text-muted-foreground font-medium ${h === 'Month' ? 'text-left' : 'text-right'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {trendData.map(row => (
                      <tr key={row.month} className="border-b border-border/50">
                        <td className="py-2 font-medium">{row.month}</td>
                        <td className="text-right text-green-600 dark:text-green-400">{fmt(row.revenue, currency)}</td>
                        <td className="text-right text-red-500">{fmt(row.cogs, currency)}</td>
                        <td className={`text-right ${row.grossProfit >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-500'}`}>{fmt(row.grossProfit, currency)}</td>
                        <td className={`text-right ${row.ebitda >= 0 ? 'text-purple-600 dark:text-purple-400' : 'text-red-500'}`}>{fmt(row.ebitda, currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── BREAKDOWN ── */}
        <TabsContent value="breakdown" className="mt-4">
          <Card>
            <CardHeader className="pb-2 pt-4"><CardTitle className="text-sm">Cost Breakdown by Category</CardTitle></CardHeader>
            <CardContent className="pb-4">
              {costByCategory.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Add costs to see the breakdown.</p>
              ) : (
                <div className="space-y-3">
                  {costByCategory.map((item, i) => {
                    const total = metrics.totalCOGS + metrics.totalOpEx;
                    const share = total > 0 ? (item.value / total) * 100 : 0;
                    const colors = ['#EF4444', '#F59E0B', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'];
                    return (
                      <div key={item.name}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>{item.name}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-muted-foreground">{fmt(item.value, currency)}</span>
                            <span className="text-xs font-medium w-12 text-right">{share.toFixed(1)}%</span>
                          </div>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div className="h-2 rounded-full transition-all" style={{ width: `${clamp(share, 0, 100)}%`, background: colors[i % colors.length] }} />
                        </div>
                      </div>
                    );
                  })}
                  <Separator className="my-3" />
                  <div className="flex items-center justify-between text-sm font-semibold">
                    <span>Total Costs</span>
                    <span>{fmt(metrics.totalCOGS + metrics.totalOpEx, currency)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── AI ANALYSIS ── */}
        <TabsContent value="analysis" className="mt-4">
          <Card>
            <CardHeader className="pb-2 pt-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" /> AI Cost Analysis
                </CardTitle>
                <Button variant="outline" size="sm" onClick={handleAIAnalysis} disabled={analyzeMutation.isPending}>
                  {analyzeMutation.isPending ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1.5" />}
                  {analyzeMutation.isPending ? 'Analyzing…' : 'Refresh'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              {!aiAnalysis && !analyzeMutation.isPending && (
                <div className="text-center py-10">
                  <Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">Get CFO-level analysis of your cost structure, margin optimization, and industry benchmarks.</p>
                  <Button onClick={handleAIAnalysis}><Sparkles className="w-4 h-4 mr-2" /> Generate Analysis</Button>
                </div>
              )}
              {analyzeMutation.isPending && (
                <div className="flex items-center gap-3 py-8 justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Analyzing your cost structure…</span>
                </div>
              )}
              {aiAnalysis && !analyzeMutation.isPending && (
                <div className="prose prose-sm max-w-none"><Streamdown>{aiAnalysis}</Streamdown></div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
