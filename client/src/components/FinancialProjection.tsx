/**
 * Financial Projection Tool — Best-Practice CFO-Grade Model
 * Features:
 * - 6 business models with driver-based revenue inputs
 * - 3 scenarios: Bear / Base / Bull
 * - 3 / 5 / 10 year horizons
 * - Full P&L: Revenue → COGS → Gross Profit → OPEX → EBITDA → Net Income
 * - Headcount planning with payroll costs
 * - AI-powered review (VC partner perspective)
 * - PDF + Excel export
 * - Auto-links to Unit Economics (COGS) data
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  TrendingUp, BarChart3, DollarSign, Users, Target,
  Save, Trash2, Loader2, Download, RefreshCw, Sparkles,
  Zap, ShoppingCart, Store, Briefcase, Cpu, Package,
  ChevronDown, ChevronRight, CheckCircle2,
  FileSpreadsheet, FileText, Calendar,
  Plus, Minus, Info, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Streamdown } from 'streamdown';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, ReferenceLine,
} from 'recharts';
import {
  computeFinancialModel,
  DEFAULT_MODEL_INPUTS,
  MODEL_META,
  type BusinessModel,
  type FinancialModelInputs,
  type FinancialModelOutput,
  type YearHorizon,
  type HeadcountRole,
  type Scenario,
  type OPEXInputs,
  type CapitalInputs,
} from '../../../shared/projectionEngine';
import { useLanguage } from '@/contexts/LanguageContext';
import * as XLSX from 'xlsx';

// ── Constants ──────────────────────────────────────────────────────────────────
const BUSINESS_MODELS: { id: BusinessModel; label: string; icon: React.ElementType; color: string; description: string }[] = [
  { id: 'saas',        label: 'SaaS',                     icon: Zap,          color: '#6366F1', description: 'Subscription software revenue' },
  { id: 'ecommerce',   label: 'E-commerce',               icon: ShoppingCart, color: '#F59E0B', description: 'Product sales & repeat orders' },
  { id: 'marketplace', label: 'Marketplace',              icon: Store,        color: '#10B981', description: 'GMV × take rate model' },
  { id: 'agency',      label: 'Agency / Services',        icon: Briefcase,    color: '#8B5CF6', description: 'Retainers + project revenue' },
  { id: 'hardware',    label: 'Hardware / IoT',           icon: Cpu,          color: '#EC4899', description: 'Unit sales + recurring subscriptions' },
  { id: 'procurement', label: 'Procurement-as-a-Service', icon: Package,      color: '#0EA5E9', description: 'PVF × take rate model' },
];

const SCENARIOS: { id: Scenario; label: string; color: string; description: string }[] = [
  { id: 'bear', label: 'Bear',  color: '#EF4444', description: 'Conservative: slower growth, higher costs' },
  { id: 'base', label: 'Base',  color: '#6366F1', description: 'Realistic: expected trajectory' },
  { id: 'bull', label: 'Bull',  color: '#10B981', description: 'Optimistic: strong growth, efficient scaling' },
];

const YEAR_HORIZONS: { value: YearHorizon; label: string }[] = [
  { value: 3,  label: '3 Years' },
  { value: 5,  label: '5 Years' },
  { value: 10, label: '10 Years' },
];

const CURRENCIES = ['USD', 'SAR', 'AED', 'EUR', 'GBP', 'EGP', 'JOD'];

const DEPARTMENTS: HeadcountRole['department'][] = ['engineering', 'sales', 'marketing', 'operations', 'gna'];
const DEPT_LABELS: Record<HeadcountRole['department'], string> = {
  engineering: 'Engineering', sales: 'Sales', marketing: 'Marketing',
  operations: 'Operations', gna: 'G&A',
};

// ── Formatters ─────────────────────────────────────────────────────────────────
function fmtCurrency(n: number, currency = 'USD', compact = true): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (compact) {
    if (abs >= 1e9) return `${sign}${currency} ${(abs / 1e9).toFixed(2)}B`;
    if (abs >= 1e6) return `${sign}${currency} ${(abs / 1e6).toFixed(2)}M`;
    if (abs >= 1e3) return `${sign}${currency} ${(abs / 1e3).toFixed(0)}K`;
  }
  return `${sign}${currency} ${abs.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function fmtPct(n: number): string {
  return `${n.toFixed(1)}%`;
}

// ── Numeric Input Helper ───────────────────────────────────────────────────────
function NumInput({
  label, value, onChange, min = 0, max, step = 1, suffix, prefix, tooltip, className = ''
}: {
  label: string; value: number; onChange: (v: number) => void;
  min?: number; max?: number; step?: number; suffix?: string; prefix?: string; tooltip?: string; className?: string;
}) {
  return (
    <div className={`space-y-1 ${className}`}>
      <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
        {label}
        {tooltip && (
          <span title={tooltip} className="cursor-help text-muted-foreground/60">
            <Info className="w-3 h-3" />
          </span>
        )}
      </Label>
      <div className="relative flex items-center">
        {prefix && <span className="absolute left-2 text-xs text-muted-foreground">{prefix}</span>}
        <Input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          className={`h-8 text-sm ${prefix ? 'pl-8' : ''} ${suffix ? 'pr-10' : ''}`}
        />
        {suffix && <span className="absolute right-2 text-xs text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}

// ── KPI Card ───────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, trend, color = '#6366F1', icon: Icon }: {
  label: string; value: string; sub?: string; trend?: number; color?: string; icon?: React.ElementType;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
        {Icon && <Icon className="w-4 h-4" style={{ color }} />}
      </div>
      <div className="text-xl font-bold text-foreground">{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-xs font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {Math.abs(trend).toFixed(1)}% YoY
        </div>
      )}
    </div>
  );
}

// ── Section Collapse ───────────────────────────────────────────────────────────
function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-sm font-semibold text-foreground"
      >
        {title}
        {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
      {open && <div className="p-4">{children}</div>}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function FinancialProjection() {
  const { lang, isRTL } = useLanguage();
  const isAr = isRTL;

  // ── State ──────────────────────────────────────────────────────────────────
  const [selectedModel, setSelectedModel] = useState<BusinessModel>('saas');
  const [scenario, setScenario] = useState<Scenario>('base');
  const [yearHorizon, setYearHorizon] = useState<YearHorizon>(3);
  const [currency, setCurrency] = useState('USD');
  const [projName, setProjName] = useState('My Financial Projection');
  const [activeTab, setActiveTab] = useState('setup');
  const [aiReview, setAiReview] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<number | null>(null);
  const [cogsLinked, setCogsLinked] = useState(false);

  // Model inputs state
  const [modelInputs, setModelInputs] = useState<FinancialModelInputs>(
    () => DEFAULT_MODEL_INPUTS('saas', 3)
  );

  // ── COGS Integration ───────────────────────────────────────────────────────
  const cogsQuery = trpc.cogs.list.useQuery(undefined, { retry: false });
  const latestCogs = cogsQuery.data?.[0];

  useEffect(() => {
    if (latestCogs && !cogsLinked && latestCogs.grossMarginPct != null) {
      setCogsLinked(true);
      const grossMarginPct = latestCogs.grossMarginPct;
      const cogsPct = 100 - grossMarginPct;
      setModelInputs(prev => {
        const rd = { ...prev.revenueDrivers } as any;
        if (rd.model === 'saas') rd.grossMarginPct = grossMarginPct;
        else if (rd.model === 'ecommerce') rd.cogsAsPctOfRevenue = cogsPct;
        else if (rd.model === 'agency') rd.deliveryCostPct = cogsPct;
        else if (rd.model === 'marketplace') rd.paymentProcessingCost = Math.min(cogsPct, 5);
        else if (rd.model === 'procurement') rd.operationalCostPct = cogsPct;
        return { ...prev, revenueDrivers: rd };
      });
      toast.success(`Unit Economics linked — gross margin ${grossMarginPct.toFixed(1)}% applied`);
    }
  }, [latestCogs, cogsLinked]);

  // ── When model or horizon changes, reset inputs ────────────────────────────
  const handleModelChange = useCallback((model: BusinessModel) => {
    setSelectedModel(model);
    setModelInputs(prev => ({
      ...DEFAULT_MODEL_INPUTS(model, yearHorizon),
      companyName: prev.companyName,
      currency: prev.currency,
      scenario: prev.scenario,
      yearHorizon: prev.yearHorizon,
    }));
    setAiReview(null);
    setSavedId(null);
    setCogsLinked(false);
  }, [yearHorizon]);

  const handleHorizonChange = useCallback((h: YearHorizon) => {
    setYearHorizon(h);
    setModelInputs(prev => ({ ...prev, yearHorizon: h }));
  }, []);

  const handleScenarioChange = useCallback((s: Scenario) => {
    setScenario(s);
    setModelInputs(prev => ({ ...prev, scenario: s }));
  }, []);

  // ── Compute projection (memoized) ──────────────────────────────────────────
  const output: FinancialModelOutput = useMemo(() => {
    return computeFinancialModel({
      ...modelInputs,
      currency,
      scenario,
      yearHorizon,
    });
  }, [modelInputs, currency, scenario, yearHorizon]);

  // ── Derived yearly P&L with payroll breakdown ──────────────────────────────
  const yearlyWithPayroll = useMemo(() => {
    return output.yearly.map((y, i) => {
      const slice = output.monthly.filter(m => m.year === y.year);
      const payroll = slice.reduce((s, m) => s + m.headcountCost, 0);
      const marketing = slice.reduce((s, m) => s + m.marketingSpend, 0);
      const rd = slice.reduce((s, m) => s + m.rdSpend, 0);
      const ga = slice.reduce((s, m) => s + m.gaSpend, 0);
      return { ...y, payroll, marketing, rd, ga };
    });
  }, [output]);

  // ── tRPC mutations ─────────────────────────────────────────────────────────
  const saveMutation = trpc.projection.save.useMutation({
    onSuccess: (data) => {
      setSavedId(data.id);
      toast.success('Projection saved');
    },
    onError: () => toast.error('Failed to save projection'),
  });

  const listQuery = trpc.projection.list.useQuery();

  const deleteMutation = trpc.projection.delete.useMutation({
    onSuccess: () => {
      listQuery.refetch();
      toast.success('Projection deleted');
    },
  });

  const aiReviewMutation = trpc.ai.reviewProjection.useMutation({
    onSuccess: (data) => {
      setAiReview(data.review);
      setActiveTab('ai-review');
    },
    onError: () => toast.error('AI review failed — please try again'),
  });

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSave = () => {
    saveMutation.mutate({
      id: savedId ?? undefined,
      name: projName,
      businessModel: selectedModel,
      scenario,
      yearHorizon,
      modelInputs: modelInputs as any,
      projectionOutput: output as any,
      currency,
    });
  };

  const handleAiReview = () => {
    const y = output.yearly;
    const lastY = y[y.length - 1];
    const totalPayroll = output.monthly.reduce((s, m) => s + m.headcountCost, 0) / yearHorizon;
    aiReviewMutation.mutate({
      companyName: modelInputs.companyName || 'My Startup',
      businessModel: MODEL_META[selectedModel].label,
      scenario,
      yearHorizon,
      currency,
      language: isAr ? 'arabic' : 'english',
      year1Revenue: y[0]?.revenue ?? 0,
      year2Revenue: y[1]?.revenue ?? 0,
      year3Revenue: y[2]?.revenue ?? 0,
      finalYearRevenue: lastY?.revenue ?? 0,
      year1GrossMargin: y[0]?.grossMarginPct ?? 0,
      finalYearGrossMargin: lastY?.grossMarginPct ?? 0,
      year1Ebitda: y[0]?.ebitda ?? 0,
      finalYearEbitda: lastY?.ebitda ?? 0,
      cagr: output.cagr ?? null,
      breakEvenMonth: output.breakEvenMonth ?? null,
      totalCashBurned: output.totalCashBurned3Y,
      endingCashBalance: output.monthly[output.monthly.length - 1]?.cashBalance ?? 0,
      runwayMonths: output.defaultRunwayMonths ?? 0,
      peakCustomers: Math.max(...output.monthly.map(m => m.customers)),
      avgCac: output.cac,
      avgLtv: output.ltv,
      totalHeadcount: modelInputs.headcount.length,
      totalPayroll,
    });
  };

  // ── Excel Export ───────────────────────────────────────────────────────────
  const handleExcelExport = useCallback(() => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Summary
    const summaryData = [
      ['Financial Projection Report'],
      ['Company', modelInputs.companyName, 'Model', MODEL_META[selectedModel].label],
      ['Scenario', scenario.toUpperCase(), 'Horizon', `${yearHorizon} Years`],
      ['Currency', currency, 'Generated', new Date().toLocaleDateString()],
      [],
      ['KEY METRICS'],
      ['CAGR', output.cagr != null ? `${output.cagr.toFixed(1)}%` : 'N/A'],
      ['Break-even Month', output.breakEvenMonth ?? 'Not reached'],
      ['Total Cash Burned', fmtCurrency(output.totalCashBurned3Y, currency)],
      ['Runway (months)', output.defaultRunwayMonths ?? 0],
      [],
      ['YEARLY P&L', ...output.yearly.map((_, i) => `Year ${i + 1}`)],
      ['Revenue', ...output.yearly.map(y => y.revenue.toFixed(0))],
      ['COGS', ...output.yearly.map(y => y.cogs.toFixed(0))],
      ['Gross Profit', ...output.yearly.map(y => y.grossProfit.toFixed(0))],
      ['Gross Margin %', ...output.yearly.map(y => `${y.grossMarginPct.toFixed(1)}%`)],
      ['Marketing', ...yearlyWithPayroll.map(y => y.marketing.toFixed(0))],
      ['R&D', ...yearlyWithPayroll.map(y => y.rd.toFixed(0))],
      ['G&A', ...yearlyWithPayroll.map(y => y.ga.toFixed(0))],
      ['Payroll', ...yearlyWithPayroll.map(y => y.payroll.toFixed(0))],
      ['Total OPEX', ...output.yearly.map(y => y.totalOpex.toFixed(0))],
      ['EBITDA', ...output.yearly.map(y => y.ebitda.toFixed(0))],
      ['EBITDA Margin %', ...output.yearly.map(y => `${y.ebitdaMarginPct.toFixed(1)}%`)],
      ['Net Income', ...output.yearly.map(y => y.netIncome.toFixed(0))],
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws1, 'Summary');

    // Sheet 2: Monthly P&L
    const monthlyHeaders = ['Month', 'Year', 'Revenue', 'COGS', 'Gross Profit', 'GM%', 'Marketing', 'R&D', 'G&A', 'Payroll', 'EBITDA', 'Net Income', 'Cash Balance', 'Customers'];
    const monthlyRows = output.monthly.map(m => [
      m.month, m.year, m.revenue.toFixed(0), m.cogs.toFixed(0),
      m.grossProfit.toFixed(0), `${m.grossMarginPct.toFixed(1)}%`,
      m.marketingSpend.toFixed(0), m.rdSpend.toFixed(0), m.gaSpend.toFixed(0),
      m.headcountCost.toFixed(0), m.ebitda.toFixed(0), m.netIncome.toFixed(0),
      m.cashBalance.toFixed(0), m.customers,
    ]);
    const ws2 = XLSX.utils.aoa_to_sheet([monthlyHeaders, ...monthlyRows]);
    XLSX.utils.book_append_sheet(wb, ws2, 'Monthly P&L');

    // Sheet 3: Headcount
    const headcountHeaders = ['Title', 'Department', 'Monthly Salary', 'Start Month', 'Annual Cost'];
    const headcountRows = modelInputs.headcount.map(r => [
      r.title, DEPT_LABELS[r.department], r.monthlySalary.toFixed(0),
      r.startMonth, (r.monthlySalary * 12).toFixed(0),
    ]);
    const ws3 = XLSX.utils.aoa_to_sheet([headcountHeaders, ...headcountRows]);
    XLSX.utils.book_append_sheet(wb, ws3, 'Headcount');

    XLSX.writeFile(wb, `${projName.replace(/\s+/g, '_')}_${yearHorizon}Y_${scenario}.xlsx`);
    toast.success('Excel file downloaded');
  }, [output, yearlyWithPayroll, modelInputs, selectedModel, scenario, yearHorizon, currency, projName]);

  // ── PDF Export ─────────────────────────────────────────────────────────────
  const handlePdfExport = useCallback(() => {
    const y = yearlyWithPayroll;
    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${projName} — Financial Projection</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #1a1a2e; background: #fff; }
  .cover { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: white; padding: 48px 40px; }
  .cover h1 { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
  .cover .meta { font-size: 13px; opacity: 0.7; margin-top: 16px; display: flex; gap: 24px; flex-wrap: wrap; }
  .cover .badge { background: rgba(255,255,255,0.15); padding: 4px 12px; border-radius: 20px; font-size: 11px; }
  .content { padding: 32px 40px; }
  h2 { font-size: 16px; font-weight: 700; color: #0f172a; border-bottom: 2px solid #6366f1; padding-bottom: 6px; margin: 24px 0 12px; }
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
  .kpi { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
  .kpi .label { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
  .kpi .value { font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 10px; }
  th { background: #0f172a; color: white; padding: 8px 10px; text-align: right; font-weight: 600; }
  th:first-child { text-align: left; }
  td { padding: 7px 10px; border-bottom: 1px solid #f1f5f9; text-align: right; }
  td:first-child { text-align: left; font-weight: 500; }
  tr:nth-child(even) { background: #f8fafc; }
  .highlight { background: #eff6ff !important; font-weight: 600; }
  .negative { color: #ef4444; }
  .positive { color: #10b981; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 9px; color: #94a3b8; text-align: center; }
  @media print { body { -webkit-print-color-adjust: exact; } }
</style>
</head>
<body>
<div class="cover">
  <h1>${projName}</h1>
  <p style="opacity:0.8;margin-top:4px">Financial Projection Report</p>
  <div class="meta">
    <span class="badge">📊 ${MODEL_META[selectedModel].label}</span>
    <span class="badge">📅 ${yearHorizon}-Year Horizon</span>
    <span class="badge">🎯 ${scenario.charAt(0).toUpperCase() + scenario.slice(1)} Scenario</span>
    <span class="badge">💱 ${currency}</span>
    <span class="badge">🗓 ${new Date().toLocaleDateString()}</span>
  </div>
</div>
<div class="content">
  <h2>Executive Summary</h2>
  <div class="kpi-grid">
    <div class="kpi"><div class="label">Year 1 Revenue</div><div class="value">${fmtCurrency(output.yearly[0]?.revenue ?? 0, currency)}</div></div>
    <div class="kpi"><div class="label">Final Year Revenue</div><div class="value">${fmtCurrency(output.yearly[output.yearly.length - 1]?.revenue ?? 0, currency)}</div></div>
    <div class="kpi"><div class="label">Revenue CAGR</div><div class="value">${output.cagr != null ? output.cagr.toFixed(1) + '%' : 'N/A'}</div></div>
    <div class="kpi"><div class="label">Break-even</div><div class="value">${output.breakEvenMonth ? 'Month ' + output.breakEvenMonth : 'Not reached'}</div></div>
    <div class="kpi"><div class="label">Final Gross Margin</div><div class="value">${(output.yearly[output.yearly.length - 1]?.grossMarginPct ?? 0).toFixed(1)}%</div></div>
    <div class="kpi"><div class="label">Final EBITDA</div><div class="value ${(output.yearly[output.yearly.length - 1]?.ebitda ?? 0) >= 0 ? 'positive' : 'negative'}">${fmtCurrency(output.yearly[output.yearly.length - 1]?.ebitda ?? 0, currency)}</div></div>
    <div class="kpi"><div class="label">Total Cash Burned</div><div class="value">${fmtCurrency(output.totalCashBurned3Y, currency)}</div></div>
    <div class="kpi"><div class="label">Runway</div><div class="value">${output.defaultRunwayMonths ?? 0} months</div></div>
  </div>

  <h2>Income Statement (Annual)</h2>
  <table>
    <thead><tr>
      <th>Line Item</th>
      ${y.map((_, i) => `<th>Year ${i + 1}</th>`).join('')}
    </tr></thead>
    <tbody>
      <tr><td>Revenue</td>${y.map(yr => `<td>${fmtCurrency(yr.revenue, currency)}</td>`).join('')}</tr>
      <tr><td>Cost of Revenue (COGS)</td>${y.map(yr => `<td class="negative">(${fmtCurrency(yr.cogs, currency)})</td>`).join('')}</tr>
      <tr class="highlight"><td>Gross Profit</td>${y.map(yr => `<td>${fmtCurrency(yr.grossProfit, currency)}</td>`).join('')}</tr>
      <tr><td>  Gross Margin %</td>${y.map(yr => `<td>${yr.grossMarginPct.toFixed(1)}%</td>`).join('')}</tr>
      <tr><td>Marketing & Sales</td>${y.map(yr => `<td class="negative">(${fmtCurrency(yr.marketing, currency)})</td>`).join('')}</tr>
      <tr><td>Research & Development</td>${y.map(yr => `<td class="negative">(${fmtCurrency(yr.rd, currency)})</td>`).join('')}</tr>
      <tr><td>General & Administrative</td>${y.map(yr => `<td class="negative">(${fmtCurrency(yr.ga, currency)})</td>`).join('')}</tr>
      <tr><td>Payroll & Benefits</td>${y.map(yr => `<td class="negative">(${fmtCurrency(yr.payroll, currency)})</td>`).join('')}</tr>
      <tr class="highlight"><td>EBITDA</td>${y.map(yr => `<td class="${yr.ebitda >= 0 ? 'positive' : 'negative'}">${fmtCurrency(yr.ebitda, currency)}</td>`).join('')}</tr>
      <tr><td>  EBITDA Margin %</td>${y.map(yr => `<td>${yr.ebitdaMarginPct.toFixed(1)}%</td>`).join('')}</tr>
      <tr class="highlight"><td>Net Income</td>${y.map(yr => `<td class="${yr.netIncome >= 0 ? 'positive' : 'negative'}">${fmtCurrency(yr.netIncome, currency)}</td>`).join('')}</tr>
    </tbody>
  </table>

  <h2>Headcount Plan</h2>
  <table>
    <thead><tr><th>Title</th><th>Department</th><th>Monthly Salary</th><th>Start Month</th><th>Annual Cost</th></tr></thead>
    <tbody>
      ${modelInputs.headcount.map(r => `
        <tr>
          <td>${r.title}</td><td>${DEPT_LABELS[r.department]}</td>
          <td>${fmtCurrency(r.monthlySalary, currency)}</td>
          <td>Month ${r.startMonth}</td>
          <td>${fmtCurrency(r.monthlySalary * 12, currency)}</td>
        </tr>
      `).join('')}
      <tr class="highlight">
        <td colspan="2"><strong>Total</strong></td>
        <td></td><td></td>
        <td>${fmtCurrency(modelInputs.headcount.reduce((s, r) => s + r.monthlySalary * 12, 0), currency)}</td>
      </tr>
    </tbody>
  </table>

  ${aiReview ? `<h2>AI Review</h2><div style="font-size:11px;line-height:1.7;white-space:pre-wrap;background:#f8fafc;padding:16px;border-radius:8px;border:1px solid #e2e8f0">${aiReview.replace(/##\s/g, '\n').replace(/\*\*/g, '')}</div>` : ''}

  <div class="footer">
    Generated by Polaris Arabia — ${new Date().toLocaleString()} — For internal planning purposes only. Not financial advice.
  </div>
</div>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      setTimeout(() => { win.print(); }, 500);
    }
    toast.success('PDF report opened — use browser Print to save as PDF');
  }, [output, yearlyWithPayroll, modelInputs, selectedModel, scenario, yearHorizon, currency, projName, aiReview]);

  // ── Revenue Driver Inputs (model-specific) ─────────────────────────────────
  const renderRevenueDrivers = () => {
    const rd = modelInputs.revenueDrivers as any;
    const update = (field: string, val: number) => {
      setModelInputs(prev => ({
        ...prev,
        revenueDrivers: { ...prev.revenueDrivers, [field]: val } as any,
      }));
    };

    switch (selectedModel) {
      case 'saas': return (
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Starting Customers" value={rd.startingCustomers} onChange={v => update('startingCustomers', v)} />
          <NumInput label="New Customers / Month (M1)" value={rd.newCustomersM1} onChange={v => update('newCustomersM1', v)} />
          <NumInput label="Monthly New Customer Growth %" value={rd.monthlyNewCustomerGrowth} onChange={v => update('monthlyNewCustomerGrowth', v)} suffix="%" tooltip="Month-over-month growth in new customer acquisition" />
          <NumInput label="Avg MRR / Customer" value={rd.avgMRRPerCustomer} onChange={v => update('avgMRRPerCustomer', v)} prefix={currency} tooltip="Monthly recurring revenue per customer" />
          <NumInput label="Monthly Churn Rate %" value={rd.monthlyChurnRate} onChange={v => update('monthlyChurnRate', v)} suffix="%" min={0} max={100} tooltip="% of customers lost each month" />
          <NumInput label="Annual Price Increase %" value={rd.annualPriceIncreasePct} onChange={v => update('annualPriceIncreasePct', v)} suffix="%" tooltip="Annual price increase applied each year" />
          <NumInput label="Expansion Revenue %" value={rd.expansionRevenuePct} onChange={v => update('expansionRevenuePct', v)} suffix="%" tooltip="Upsell / expansion revenue as % of base MRR" />
          <NumInput label="Gross Margin %" value={rd.grossMarginPct} onChange={v => update('grossMarginPct', v)} suffix="%" tooltip="Subscription gross margin (after hosting, support)" />
          <NumInput label="CAC (per customer)" value={rd.cacPerCustomer} onChange={v => update('cacPerCustomer', v)} prefix={currency} />
        </div>
      );
      case 'ecommerce': return (
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Starting Monthly Orders" value={rd.startingMonthlyOrders} onChange={v => update('startingMonthlyOrders', v)} />
          <NumInput label="Order Growth MoM %" value={rd.orderGrowthMoM} onChange={v => update('orderGrowthMoM', v)} suffix="%" />
          <NumInput label="Avg Order Value" value={rd.avgOrderValue} onChange={v => update('avgOrderValue', v)} prefix={currency} />
          <NumInput label="Return Rate %" value={rd.returnRate} onChange={v => update('returnRate', v)} suffix="%" max={100} />
          <NumInput label="COGS as % of Revenue" value={rd.cogsAsPctOfRevenue} onChange={v => update('cogsAsPctOfRevenue', v)} suffix="%" tooltip="Product cost + fulfillment" />
          <NumInput label="CAC (per order)" value={rd.cacPerOrder} onChange={v => update('cacPerOrder', v)} prefix={currency} />
        </div>
      );
      case 'marketplace': return (
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Starting Monthly GMV" value={rd.startingMonthlyGMV} onChange={v => update('startingMonthlyGMV', v)} prefix={currency} tooltip="Gross Merchandise Value" />
          <NumInput label="GMV Growth MoM %" value={rd.gmvGrowthMoM} onChange={v => update('gmvGrowthMoM', v)} suffix="%" />
          <NumInput label="Take Rate %" value={rd.takeRate} onChange={v => update('takeRate', v)} suffix="%" tooltip="Revenue as % of GMV" />
          <NumInput label="Payment Processing Cost %" value={rd.paymentProcessingCost} onChange={v => update('paymentProcessingCost', v)} suffix="%" />
          <NumInput label="CAC (per buyer)" value={rd.cacPerBuyer} onChange={v => update('cacPerBuyer', v)} prefix={currency} />
        </div>
      );
      case 'agency': return (
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Starting Clients" value={rd.startingClients} onChange={v => update('startingClients', v)} />
          <NumInput label="New Clients / Month" value={rd.newClientsPerMonth} onChange={v => update('newClientsPerMonth', v)} />
          <NumInput label="Client Growth MoM %" value={rd.clientGrowthMoM} onChange={v => update('clientGrowthMoM', v)} suffix="%" />
          <NumInput label="Avg Monthly Retainer" value={rd.avgMonthlyRetainer} onChange={v => update('avgMonthlyRetainer', v)} prefix={currency} />
          <NumInput label="Client Churn Monthly %" value={rd.clientChurnMonthly} onChange={v => update('clientChurnMonthly', v)} suffix="%" />
          <NumInput label="Project Revenue %" value={rd.projectRevenuePct} onChange={v => update('projectRevenuePct', v)} suffix="%" tooltip="One-off project revenue as % of retainer revenue" />
          <NumInput label="Delivery Cost %" value={rd.deliveryCostPct} onChange={v => update('deliveryCostPct', v)} suffix="%" tooltip="Freelancers, contractors, delivery costs" />
          <NumInput label="CAC (per client)" value={rd.cacPerClient} onChange={v => update('cacPerClient', v)} prefix={currency} />
        </div>
      );
      case 'hardware': return (
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Starting Monthly Units" value={rd.startingMonthlyUnits} onChange={v => update('startingMonthlyUnits', v)} />
          <NumInput label="Unit Growth MoM %" value={rd.unitGrowthMoM} onChange={v => update('unitGrowthMoM', v)} suffix="%" />
          <NumInput label="Avg Selling Price" value={rd.avgSellingPrice} onChange={v => update('avgSellingPrice', v)} prefix={currency} />
          <NumInput label="COGS per Unit" value={rd.cogsPerUnit} onChange={v => update('cogsPerUnit', v)} prefix={currency} />
          <NumInput label="Recurring Revenue / Unit / Month" value={rd.recurringRevenuePerUnit} onChange={v => update('recurringRevenuePerUnit', v)} prefix={currency} tooltip="SaaS or subscription attached to hardware" />
          <NumInput label="Recurring Cost %" value={rd.recurringCostPct} onChange={v => update('recurringCostPct', v)} suffix="%" />
          <NumInput label="CAC (per unit)" value={rd.cacPerUnit} onChange={v => update('cacPerUnit', v)} prefix={currency} />
        </div>
      );
      case 'procurement': return (
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Starting Monthly PVF" value={rd.startingMonthlyPVF} onChange={v => update('startingMonthlyPVF', v)} prefix={currency} tooltip="Procurement Volume Facilitated" />
          <NumInput label="PVF Growth MoM %" value={rd.pvfGrowthMoM} onChange={v => update('pvfGrowthMoM', v)} suffix="%" />
          <NumInput label="Take Rate %" value={rd.takeRate} onChange={v => update('takeRate', v)} suffix="%" />
          <NumInput label="Avg Order Value" value={rd.avgOrderValue} onChange={v => update('avgOrderValue', v)} prefix={currency} />
          <NumInput label="Operational Cost %" value={rd.operationalCostPct} onChange={v => update('operationalCostPct', v)} suffix="%" />
          <NumInput label="CAC per Buyer" value={rd.cacPerBuyer} onChange={v => update('cacPerBuyer', v)} prefix={currency} />
        </div>
      );
    }
  };

  // ── Headcount Inputs ───────────────────────────────────────────────────────
  const renderHeadcount = () => {
    const roles = modelInputs.headcount;
    const updateRole = (idx: number, field: keyof HeadcountRole, val: any) => {
      setModelInputs(prev => ({
        ...prev,
        headcount: prev.headcount.map((r, i) => i === idx ? { ...r, [field]: val } : r),
      }));
    };
    const addRole = () => {
      setModelInputs(prev => ({
        ...prev,
        headcount: [...prev.headcount, { title: 'New Role', department: 'engineering' as const, monthlySalary: 5000, startMonth: 1 }],
      }));
    };
    const removeRole = (idx: number) => {
      setModelInputs(prev => ({ ...prev, headcount: prev.headcount.filter((_, i) => i !== idx) }));
    };

    const totalAnnualCost = roles.reduce((s, r) => s + r.monthlySalary * 12, 0);

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {roles.length} roles · {fmtCurrency(totalAnnualCost, currency)} annual payroll
          </div>
          <Button size="sm" variant="outline" onClick={addRole} className="h-7 text-xs gap-1">
            <Plus className="w-3 h-3" /> Add Role
          </Button>
        </div>
        <div className="space-y-2">
          {roles.map((role, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-end p-2 bg-muted/20 rounded-lg">
              <div className="col-span-4">
                <Label className="text-xs text-muted-foreground">Title</Label>
                <Input
                  value={role.title}
                  onChange={e => updateRole(idx, 'title', e.target.value)}
                  className="h-7 text-xs"
                />
              </div>
              <div className="col-span-2">
                <Label className="text-xs text-muted-foreground">Dept</Label>
                <Select value={role.department} onValueChange={v => updateRole(idx, 'department', v)}>
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map(d => (
                      <SelectItem key={d} value={d}>{DEPT_LABELS[d]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-3">
                <Label className="text-xs text-muted-foreground">Monthly Salary ({currency})</Label>
                <Input
                  type="number" min={0} value={role.monthlySalary}
                  onChange={e => updateRole(idx, 'monthlySalary', parseFloat(e.target.value) || 0)}
                  className="h-7 text-xs"
                />
              </div>
              <div className="col-span-2">
                <Label className="text-xs text-muted-foreground">Start Month</Label>
                <Input
                  type="number" min={1} max={yearHorizon * 12} value={role.startMonth}
                  onChange={e => updateRole(idx, 'startMonth', parseInt(e.target.value) || 1)}
                  className="h-7 text-xs"
                />
              </div>
              <div className="col-span-1 flex justify-end">
                <Button size="sm" variant="ghost" onClick={() => removeRole(idx)} className="h-7 w-7 p-0 text-red-400 hover:text-red-600">
                  <Minus className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ── OPEX Inputs ────────────────────────────────────────────────────────────
  const renderOpex = () => {
    const opex = modelInputs.opex;
    const update = (field: keyof OPEXInputs, val: number) => {
      setModelInputs(prev => ({ ...prev, opex: { ...prev.opex, [field]: val } }));
    };
    return (
      <div className="grid grid-cols-2 gap-3">
        <NumInput label="Marketing Budget (Month 1)" value={opex.marketingBudgetM1} onChange={v => update('marketingBudgetM1', v)} prefix={currency} />
        <NumInput label="Marketing Growth MoM %" value={opex.marketingGrowthMoM} onChange={v => update('marketingGrowthMoM', v)} suffix="%" />
        <NumInput label="R&D Budget / Month" value={opex.rdBudgetMonthly} onChange={v => update('rdBudgetMonthly', v)} prefix={currency} />
        <NumInput label="Office / Rent / Month" value={opex.rentMonthly} onChange={v => update('rentMonthly', v)} prefix={currency} />
        <NumInput label="Software & Tools / Month" value={opex.softwareToolsMonthly} onChange={v => update('softwareToolsMonthly', v)} prefix={currency} />
        <NumInput label="Legal & Accounting / Month" value={opex.legalAccountingMonthly} onChange={v => update('legalAccountingMonthly', v)} prefix={currency} />
        <NumInput label="Other G&A / Month" value={opex.otherGAMonthly} onChange={v => update('otherGAMonthly', v)} prefix={currency} />
      </div>
    );
  };

  // ── Capital Inputs ─────────────────────────────────────────────────────────
  const renderCapital = () => {
    const cap = modelInputs.capital;
    const round0 = cap.fundingRounds?.[0] ?? { month: 0, amount: 0 };
    return (
      <div className="grid grid-cols-2 gap-3">
        <NumInput label="Starting Cash" value={cap.startingCash} onChange={v => setModelInputs(prev => ({ ...prev, capital: { ...prev.capital, startingCash: v } }))} prefix={currency} tooltip="Cash on hand at start of projection" />
        <NumInput
          label="Funding Round Month"
          value={round0.month}
          onChange={v => setModelInputs(prev => ({
            ...prev,
            capital: { ...prev.capital, fundingRounds: [{ ...round0, month: v }] }
          }))}
          min={0}
          max={yearHorizon * 12}
          tooltip="Month when funding arrives (0 = no funding round)"
        />
        <NumInput
          label="Funding Amount"
          value={round0.amount}
          onChange={v => setModelInputs(prev => ({
            ...prev,
            capital: { ...prev.capital, fundingRounds: [{ ...round0, amount: v }] }
          }))}
          prefix={currency}
        />
      </div>
    );
  };

  // ── Chart Data ─────────────────────────────────────────────────────────────
  const quarterlyChartData = useMemo(() => {
    const quarters: any[] = [];
    for (let q = 0; q < Math.ceil(output.monthly.length / 3); q++) {
      const months = output.monthly.slice(q * 3, q * 3 + 3);
      if (months.length === 0) break;
      const yr = months[0].year;
      const qNum = Math.floor((months[0].month - 1) / 3) + 1;
      quarters.push({
        label: `Y${yr}Q${qNum}`,
        revenue: months.reduce((s, m) => s + m.revenue, 0),
        grossProfit: months.reduce((s, m) => s + m.grossProfit, 0),
        ebitda: months.reduce((s, m) => s + m.ebitda, 0),
        cashBalance: months[months.length - 1].cashBalance,
      });
    }
    return quarters;
  }, [output]);

  const yearlyChartData = useMemo(() => yearlyWithPayroll.map((y, i) => ({
    label: `Year ${i + 1}`,
    revenue: y.revenue,
    grossProfit: y.grossProfit,
    ebitda: y.ebitda,
    netIncome: y.netIncome,
    payroll: y.payroll,
    marketing: y.marketing,
    rd: y.rd,
    ga: y.ga,
  })), [yearlyWithPayroll]);

  const cashFlowData = useMemo(() => output.monthly.map(m => ({
    label: `M${m.month}`,
    cashBalance: m.cashBalance,
    netIncome: m.netIncome,
  })), [output]);

  const modelColor = BUSINESS_MODELS.find(m => m.id === selectedModel)?.color ?? '#6366F1';

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full overflow-hidden" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="shrink-0 px-5 py-3 border-b border-border bg-card flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: modelColor + '20' }}>
            <TrendingUp className="w-4 h-4" style={{ color: modelColor }} />
          </div>
          <div>
            <Input
              value={projName}
              onChange={e => setProjName(e.target.value)}
              className="h-7 text-sm font-semibold border-0 bg-transparent p-0 focus-visible:ring-0 w-64"
              placeholder="Projection name..."
            />
            <div className="text-xs text-muted-foreground">Financial Projection · {MODEL_META[selectedModel]?.label} · {yearHorizon}Y · {scenario}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {latestCogs && (
            <Badge variant="outline" className="text-xs gap-1 text-emerald-600 border-emerald-200">
              <CheckCircle2 className="w-3 h-3" /> COGS Linked
            </Badge>
          )}
          <Button size="sm" variant="outline" onClick={handleExcelExport} className="h-7 text-xs gap-1">
            <FileSpreadsheet className="w-3 h-3" /> Excel
          </Button>
          <Button size="sm" variant="outline" onClick={handlePdfExport} className="h-7 text-xs gap-1">
            <FileText className="w-3 h-3" /> PDF
          </Button>
          <Button size="sm" variant="outline" onClick={handleAiReview} disabled={aiReviewMutation.isPending} className="h-7 text-xs gap-1">
            {aiReviewMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            AI Review
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saveMutation.isPending} className="h-7 text-xs gap-1">
            {saveMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            Save
          </Button>
        </div>
      </div>

      {/* Scenario / Horizon / Currency Bar */}
      <div className="shrink-0 px-5 py-2 border-b border-border bg-muted/20 flex items-center gap-3 flex-wrap">
        {/* Business Model */}
        <div className="flex items-center gap-1">
          {BUSINESS_MODELS.map(m => (
            <button
              key={m.id}
              onClick={() => handleModelChange(m.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${selectedModel === m.id ? 'text-white shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
              style={selectedModel === m.id ? { background: m.color } : {}}
              title={m.description}
            >
              <m.icon className="w-3 h-3" />
              <span className="hidden xl:inline">{m.label}</span>
            </button>
          ))}
        </div>
        <Separator orientation="vertical" className="h-5" />
        {/* Scenario */}
        <div className="flex items-center gap-1">
          {SCENARIOS.map(s => (
            <button
              key={s.id}
              onClick={() => handleScenarioChange(s.id)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${scenario === s.id ? 'text-white shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
              style={scenario === s.id ? { background: s.color } : {}}
              title={s.description}
            >
              {s.label}
            </button>
          ))}
        </div>
        <Separator orientation="vertical" className="h-5" />
        {/* Year Horizon */}
        <div className="flex items-center gap-1">
          {YEAR_HORIZONS.map(h => (
            <button
              key={h.value}
              onClick={() => handleHorizonChange(h.value)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${yearHorizon === h.value ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
            >
              {h.label}
            </button>
          ))}
        </div>
        <Separator orientation="vertical" className="h-5" />
        {/* Currency */}
        <Select value={currency} onValueChange={setCurrency}>
          <SelectTrigger className="h-7 w-24 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <div className="px-5 pt-3 border-b border-border">
            <TabsList className="h-8">
              <TabsTrigger value="setup" className="text-xs h-7">Setup & Inputs</TabsTrigger>
              <TabsTrigger value="pl" className="text-xs h-7">P&L Statement</TabsTrigger>
              <TabsTrigger value="charts" className="text-xs h-7">Charts & KPIs</TabsTrigger>
              <TabsTrigger value="ai-review" className="text-xs h-7 gap-1">
                <Sparkles className="w-3 h-3" /> AI Review
              </TabsTrigger>
              <TabsTrigger value="history" className="text-xs h-7">Saved</TabsTrigger>
            </TabsList>
          </div>

          {/* ── Setup Tab ── */}
          <TabsContent value="setup" className="p-5 space-y-4">
            {/* Company Info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground">Company Name</Label>
                <Input
                  value={modelInputs.companyName}
                  onChange={e => setModelInputs(prev => ({ ...prev, companyName: e.target.value }))}
                  className="h-8 text-sm"
                  placeholder="My Startup"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground">Start Year</Label>
                <Input
                  type="number"
                  value={modelInputs.startYear}
                  onChange={e => setModelInputs(prev => ({ ...prev, startYear: parseInt(e.target.value) || new Date().getFullYear() }))}
                  className="h-8 text-sm"
                />
              </div>
            </div>

            {latestCogs && (
              <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="text-sm text-emerald-700 dark:text-emerald-400">
                  Unit Economics data linked — gross margin {latestCogs.grossMarginPct?.toFixed(1)}% auto-applied to COGS inputs.
                </div>
              </div>
            )}

            <Section title={`Revenue Drivers — ${MODEL_META[selectedModel]?.label}`}>
              {renderRevenueDrivers()}
            </Section>

            <Section title="Headcount Plan" defaultOpen={false}>
              {renderHeadcount()}
            </Section>

            <Section title="Operating Expenses (OPEX)" defaultOpen={false}>
              {renderOpex()}
            </Section>

            <Section title="Capital & Funding" defaultOpen={false}>
              {renderCapital()}
            </Section>
          </TabsContent>

          {/* ── P&L Tab ── */}
          <TabsContent value="pl" className="p-5 space-y-4">
            {/* Summary KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <KpiCard label="Revenue CAGR" value={output.cagr != null ? fmtPct(output.cagr) : 'N/A'} icon={TrendingUp} color={modelColor} />
              <KpiCard label="Break-even" value={output.breakEvenMonth ? `Month ${output.breakEvenMonth}` : 'Not reached'} icon={Target} color="#F59E0B" />
              <KpiCard label="Total Cash Burned" value={fmtCurrency(output.totalCashBurned3Y, currency)} icon={DollarSign} color="#EF4444" />
              <KpiCard label="Runway" value={`${output.defaultRunwayMonths ?? 0} mo`} icon={Calendar} color="#10B981" />
            </div>

            {/* Annual P&L Table */}
            <div className="rounded-lg border border-border overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left px-3 py-2 font-semibold text-foreground w-52">Line Item</th>
                    {yearlyWithPayroll.map((_, i) => (
                      <th key={i} className="text-right px-3 py-2 font-semibold text-foreground">Year {i + 1}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Revenue', key: 'revenue', bold: false, negate: false, isPct: false },
                    { label: 'Cost of Revenue (COGS)', key: 'cogs', bold: false, negate: true, isPct: false },
                    { label: 'Gross Profit', key: 'grossProfit', bold: true, negate: false, isPct: false },
                    { label: '  Gross Margin %', key: 'grossMarginPct', bold: false, negate: false, isPct: true },
                    { label: 'Marketing & Sales', key: 'marketing', bold: false, negate: true, isPct: false },
                    { label: 'Research & Development', key: 'rd', bold: false, negate: true, isPct: false },
                    { label: 'General & Administrative', key: 'ga', bold: false, negate: true, isPct: false },
                    { label: 'Payroll & Benefits', key: 'payroll', bold: false, negate: true, isPct: false },
                    { label: 'EBITDA', key: 'ebitda', bold: true, negate: false, isPct: false },
                    { label: '  EBITDA Margin %', key: 'ebitdaMarginPct', bold: false, negate: false, isPct: true },
                    { label: 'Net Income', key: 'netIncome', bold: true, negate: false, isPct: false },
                  ].map(row => (
                    <tr key={row.key} className={`border-t border-border/50 ${row.bold ? 'bg-muted/30' : ''}`}>
                      <td className={`px-3 py-1.5 text-foreground ${row.bold ? 'font-semibold' : ''}`}>{row.label}</td>
                      {yearlyWithPayroll.map((y, i) => {
                        const val = (y as any)[row.key] as number;
                        const isNegativeValue = (row.key === 'netIncome' || row.key === 'ebitda') && val < 0;
                        const isPositiveValue = (row.key === 'netIncome' || row.key === 'ebitda') && val >= 0;
                        return (
                          <td key={i} className={`px-3 py-1.5 text-right ${isNegativeValue ? 'text-red-500' : ''} ${isPositiveValue && row.bold ? 'text-emerald-600' : ''} ${row.key.includes('Pct') ? 'text-muted-foreground' : ''}`}>
                            {row.isPct ? `${val.toFixed(1)}%` : row.negate ? `(${fmtCurrency(val, currency)})` : fmtCurrency(val, currency)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Monthly P&L (collapsible) */}
            <Section title="Monthly Detail" defaultOpen={false}>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left px-2 py-1.5 font-semibold">Month</th>
                      <th className="text-right px-2 py-1.5 font-semibold">Revenue</th>
                      <th className="text-right px-2 py-1.5 font-semibold">Gross Profit</th>
                      <th className="text-right px-2 py-1.5 font-semibold">GM%</th>
                      <th className="text-right px-2 py-1.5 font-semibold">EBITDA</th>
                      <th className="text-right px-2 py-1.5 font-semibold">Net Income</th>
                      <th className="text-right px-2 py-1.5 font-semibold">Cash</th>
                      <th className="text-right px-2 py-1.5 font-semibold">Customers</th>
                    </tr>
                  </thead>
                  <tbody>
                    {output.monthly.map((m, i) => (
                      <tr key={i} className={`border-t border-border/30 ${i % 12 === 11 ? 'border-b-2 border-border' : ''}`}>
                        <td className="px-2 py-1 text-muted-foreground">Y{m.year}M{m.monthInYear}</td>
                        <td className="px-2 py-1 text-right">{fmtCurrency(m.revenue, currency)}</td>
                        <td className="px-2 py-1 text-right">{fmtCurrency(m.grossProfit, currency)}</td>
                        <td className="px-2 py-1 text-right text-muted-foreground">{m.grossMarginPct.toFixed(1)}%</td>
                        <td className={`px-2 py-1 text-right ${m.ebitda < 0 ? 'text-red-500' : 'text-emerald-600'}`}>{fmtCurrency(m.ebitda, currency)}</td>
                        <td className={`px-2 py-1 text-right ${m.netIncome < 0 ? 'text-red-500' : 'text-emerald-600'}`}>{fmtCurrency(m.netIncome, currency)}</td>
                        <td className={`px-2 py-1 text-right ${m.cashBalance < 0 ? 'text-red-500' : ''}`}>{fmtCurrency(m.cashBalance, currency)}</td>
                        <td className="px-2 py-1 text-right text-muted-foreground">{m.customers.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          </TabsContent>

          {/* ── Charts Tab ── */}
          <TabsContent value="charts" className="p-5 space-y-6">
            {/* Revenue & Gross Profit — Quarterly */}
            <div>
              <h3 className="text-sm font-semibold mb-3 text-foreground">Revenue & Gross Profit (Quarterly)</h3>
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={quarterlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                    <YAxis tickFormatter={v => fmtCurrency(v, currency)} tick={{ fontSize: 10 }} width={70} />
                    <Tooltip formatter={(v: number) => fmtCurrency(v, currency)} />
                    <Legend />
                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke={modelColor} fill={modelColor + '30'} strokeWidth={2} />
                    <Area type="monotone" dataKey="grossProfit" name="Gross Profit" stroke="#10B981" fill="#10B98130" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* EBITDA — Annual */}
            <div>
              <h3 className="text-sm font-semibold mb-3 text-foreground">EBITDA by Year</h3>
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={yearlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                    <YAxis tickFormatter={v => fmtCurrency(v, currency)} tick={{ fontSize: 10 }} width={70} />
                    <Tooltip formatter={(v: number) => fmtCurrency(v, currency)} />
                    <ReferenceLine y={0} stroke="var(--border)" />
                    <Bar dataKey="ebitda" name="EBITDA" fill={modelColor} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Cash Balance — Monthly */}
            <div>
              <h3 className="text-sm font-semibold mb-3 text-foreground">Cash Balance (Monthly)</h3>
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={cashFlowData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="label" tick={{ fontSize: 9 }} interval={Math.floor(output.monthly.length / 12)} />
                    <YAxis tickFormatter={v => fmtCurrency(v, currency)} tick={{ fontSize: 10 }} width={70} />
                    <Tooltip formatter={(v: number) => fmtCurrency(v, currency)} />
                    <ReferenceLine y={0} stroke="#EF4444" strokeDasharray="4 2" />
                    <Line type="monotone" dataKey="cashBalance" name="Cash Balance" stroke="#6366F1" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Cost Breakdown — Annual Stacked */}
            <div>
              <h3 className="text-sm font-semibold mb-3 text-foreground">Cost Breakdown by Year</h3>
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={yearlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                    <YAxis tickFormatter={v => fmtCurrency(v, currency)} tick={{ fontSize: 10 }} width={70} />
                    <Tooltip formatter={(v: number) => fmtCurrency(v, currency)} />
                    <Legend />
                    <Bar dataKey="payroll" name="Payroll" stackId="a" fill="#6366F1" />
                    <Bar dataKey="marketing" name="Marketing" stackId="a" fill="#F59E0B" />
                    <Bar dataKey="rd" name="R&D" stackId="a" fill="#10B981" />
                    <Bar dataKey="ga" name="G&A" stackId="a" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Unit Economics KPIs */}
            {(output.cac || output.ltv) && (
              <div>
                <h3 className="text-sm font-semibold mb-3 text-foreground">Unit Economics</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <KpiCard label="Peak Customers" value={Math.max(...output.monthly.map(m => m.customers)).toLocaleString()} icon={Users} color={modelColor} />
                  <KpiCard label="CAC" value={output.cac ? fmtCurrency(output.cac, currency) : 'N/A'} icon={Target} color="#F59E0B" />
                  <KpiCard label="LTV" value={output.ltv ? fmtCurrency(output.ltv, currency) : 'N/A'} icon={DollarSign} color="#10B981" />
                  <KpiCard label="LTV/CAC Ratio" value={output.ltvCacRatio ? `${output.ltvCacRatio.toFixed(1)}x` : 'N/A'} icon={BarChart3} color="#8B5CF6" />
                </div>
              </div>
            )}
          </TabsContent>

          {/* ── AI Review Tab ── */}
          <TabsContent value="ai-review" className="p-5">
            {aiReviewMutation.isPending ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <div className="text-sm text-muted-foreground">Analyzing your financial model...</div>
                <div className="text-xs text-muted-foreground/60">This takes 10–20 seconds</div>
              </div>
            ) : aiReview ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">VC Partner Review</span>
                    <Badge variant="outline" className="text-xs">{scenario} scenario · {yearHorizon}Y</Badge>
                  </div>
                  <Button size="sm" variant="outline" onClick={handleAiReview} className="h-7 text-xs gap-1">
                    <RefreshCw className="w-3 h-3" /> Refresh
                  </Button>
                </div>
                <div className="prose prose-sm max-w-none dark:prose-invert bg-muted/20 rounded-lg p-5 border border-border">
                  <Streamdown>{aiReview}</Streamdown>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-semibold mb-1">Get an AI-Powered VC Review</div>
                  <div className="text-xs text-muted-foreground max-w-xs">
                    A senior VC partner will analyze your {yearHorizon}-year projection and provide strengths, risks, benchmarks, and actionable recommendations.
                  </div>
                </div>
                <Button onClick={handleAiReview} className="gap-2">
                  <Sparkles className="w-4 h-4" /> Generate AI Review
                </Button>
              </div>
            )}
          </TabsContent>

          {/* ── History Tab ── */}
          <TabsContent value="history" className="p-5">
            {listQuery.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : (listQuery.data?.length ?? 0) === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">No saved projections yet</div>
            ) : (
              <div className="space-y-2">
                {listQuery.data?.map(proj => (
                  <div key={proj.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                    <div>
                      <div className="text-sm font-medium">{proj.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {proj.businessModel} · {(proj as any).scenario ?? 'base'} · {(proj as any).yearHorizon ?? 3}Y · {proj.currency} · {new Date(proj.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm" variant="ghost"
                        onClick={() => deleteMutation.mutate({ id: proj.id })}
                        className="h-7 w-7 p-0 text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
