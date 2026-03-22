/**
 * Financial Projection Tool — Best-Practice CFO-Grade Model
 * - 15 business models with driver-based revenue inputs
 * - 3 scenarios: Bear / Base / Bull
 * - 3 / 5 / 10 year horizons
 * - Full P&L: Revenue → COGS → Gross Profit → OPEX → EBITDA → Net Income
 * - AI-powered VC review
 * - PDF + Excel export
 * - Help / Education section
 */
import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  TrendingUp, BarChart3, DollarSign, Users, Target,
  Save, Trash2, Loader2, Download, RefreshCw, Sparkles,
  Zap, ShoppingCart, Store, Briefcase, Cpu, Package,
  ChevronDown, ChevronRight, CheckCircle2,
  FileSpreadsheet, FileText, Calendar,
  Plus, Minus, Info, ArrowUpRight, ArrowDownRight,
  Activity, Radio, Tag, Landmark, GraduationCap, Truck, Building2,
  BookOpen, HelpCircle, X, ChevronUp, AlertCircle
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

// ── Business Model Definitions ─────────────────────────────────────────────────
const BUSINESS_MODELS: {
  id: BusinessModel; label: string; shortLabel: string; icon: React.ElementType;
  color: string; description: string; group: string;
}[] = [
  { id: 'saas',         label: 'SaaS',                        shortLabel: 'SaaS',         icon: Zap,          color: '#6366F1', description: 'Recurring subscription software revenue driven by MRR, churn, and expansion.', group: 'Software' },
  { id: 'freemium',     label: 'Freemium',                    shortLabel: 'Freemium',     icon: Users,        color: '#A855F7', description: 'Free-to-paid conversion funnel. Revenue from premium tier upgrades.', group: 'Software' },
  { id: 'usage_based',  label: 'Usage-Based',                 shortLabel: 'Usage',        icon: Activity,     color: '#F97316', description: 'Pay-as-you-go: volume × unit price (API calls, compute, transactions).', group: 'Software' },
  { id: 'ecommerce',    label: 'E-commerce',                  shortLabel: 'E-comm',       icon: ShoppingCart, color: '#F59E0B', description: 'Product sales with repeat purchase rate, AOV, and CAC.', group: 'Commerce' },
  { id: 'd2c',          label: 'D2C / Retail',                shortLabel: 'D2C',          icon: Tag,          color: '#84CC16', description: 'Direct-to-consumer brand: units × ASP, LTV, and repeat rate.', group: 'Commerce' },
  { id: 'marketplace',  label: 'Marketplace',                 shortLabel: 'Mktplace',     icon: Store,        color: '#10B981', description: 'GMV × take rate. Revenue from connecting buyers and sellers.', group: 'Commerce' },
  { id: 'advertising',  label: 'Advertising / Media',         shortLabel: 'Ads',          icon: Radio,        color: '#EF4444', description: 'MAU × CPM / fill rate. Revenue from ad impressions and clicks.', group: 'Media' },
  { id: 'edtech',       label: 'EdTech / Content',            shortLabel: 'EdTech',       icon: GraduationCap, color: '#F59E0B', description: 'Course enrollments × price + subscription tiers.', group: 'Media' },
  { id: 'subscription', label: 'Subscription (Physical)',      shortLabel: 'Sub Box',      icon: RefreshCw,    color: '#14B8A6', description: 'Recurring billing for physical boxes, media, or services.', group: 'Media' },
  { id: 'agency',       label: 'Agency / Services',           shortLabel: 'Agency',       icon: Briefcase,    color: '#8B5CF6', description: 'Retainer + project revenue. Utilization rate × billable rate.', group: 'Services' },
  { id: 'on_demand',    label: 'On-Demand / Gig',             shortLabel: 'On-Demand',    icon: Truck,        color: '#10B981', description: 'Bookings × take rate. Uber/TaskRabbit model.', group: 'Services' },
  { id: 'hardware',     label: 'Hardware / IoT',              shortLabel: 'Hardware',     icon: Cpu,          color: '#EC4899', description: 'Unit sales + recurring software/service subscriptions.', group: 'Deep Tech' },
  { id: 'fintech',      label: 'Fintech / Lending',           shortLabel: 'Fintech',      icon: Landmark,     color: '#06B6D4', description: 'AUM, net interest margin, and transaction fee revenue.', group: 'Finance' },
  { id: 'procurement',  label: 'Procurement-as-a-Service',    shortLabel: 'ProcureTech',  icon: Package,      color: '#0EA5E9', description: 'Purchase volume facilitated (PVF) × take rate model.', group: 'Finance' },
  { id: 'proptech',     label: 'Real Estate / PropTech',      shortLabel: 'PropTech',     icon: Building2,    color: '#6B7280', description: 'Units under management × management fee + transaction commissions.', group: 'Real Estate' },
];

const MODEL_GROUPS = ['Software', 'Commerce', 'Media', 'Services', 'Deep Tech', 'Finance', 'Real Estate'];

const SCENARIOS: { id: Scenario; label: string; color: string; description: string }[] = [
  { id: 'bear', label: 'Bear',  color: '#EF4444', description: 'Conservative: slower growth, higher costs, higher churn. Use for stress-testing.' },
  { id: 'base', label: 'Base',  color: '#6366F1', description: 'Realistic: your expected trajectory based on current assumptions.' },
  { id: 'bull', label: 'Bull',  color: '#10B981', description: 'Optimistic: strong growth, efficient scaling, lower churn. Use for upside case.' },
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

// ── Field Tooltip Definitions ──────────────────────────────────────────────────
const FIELD_TIPS: Record<string, string> = {
  // SaaS
  startingCustomers: 'Number of paying customers at the start of Month 1.',
  newCustomersM1: 'New paying customers acquired in Month 1 (before growth compounding).',
  newCustomerGrowthMoM: 'Month-over-month growth rate in new customer acquisition. 10% means you add 10% more new customers each month.',
  avgMRR: 'Average Monthly Recurring Revenue per customer. This is your ARPU (Average Revenue Per User) on a monthly basis.',
  monthlyChurnRate: 'Percentage of customers who cancel each month. Best-in-class SaaS: <1%. Typical: 2–5%. High: >7%.',
  annualPriceIncrease: 'Annual price increase applied to existing customers. Helps model NRR (Net Revenue Retention) above 100%.',
  expansionRevenuePct: 'Additional revenue from existing customers (upsells, seat expansion). Expressed as % of current MRR.',
  grossMarginPct: 'Revenue minus direct costs (hosting, support, payment processing) as a % of revenue. SaaS benchmark: 70–85%.',
  cacPerCustomer: 'Customer Acquisition Cost — total sales & marketing spend to acquire one new customer.',
  // Freemium
  freeUsersM1: 'Free tier users at Month 1. These are your top-of-funnel leads.',
  freeUserGrowthMoM: 'Monthly growth rate of free users. Driven by organic, viral, and paid acquisition.',
  paidConversionRate: 'Percentage of free users who upgrade to a paid plan. Industry benchmark: 2–5%.',
  avgPaidMRR: 'Monthly revenue per paid user. This is your premium tier pricing.',
  // Usage-Based
  activeUsersM1: 'Active users or accounts generating usage in Month 1.',
  usageUnitsPerUserM1: 'Average number of billable units (API calls, GB, transactions) per active user in Month 1.',
  usageGrowthMoM: 'Month-over-month growth in total usage volume.',
  pricePerUnit: 'Revenue per billable unit. E.g., $0.001 per API call, $0.10 per GB.',
  // E-commerce
  ordersM1: 'Number of orders in Month 1.',
  orderGrowthMoM: 'Month-over-month growth in order volume.',
  avgOrderValue: 'Average value per order (AOV). Higher AOV reduces CAC payback period.',
  repeatPurchaseRate: 'Percentage of customers who make a repeat purchase within the period.',
  cogsAsPctOfRevenue: 'Cost of Goods Sold as % of revenue. Includes product cost, packaging, fulfillment.',
  // Marketplace
  gmvM1: 'Gross Merchandise Value in Month 1 — total transaction value flowing through the platform.',
  gmvGrowthMoM: 'Month-over-month growth in GMV.',
  takeRate: 'Percentage of GMV you retain as revenue (your commission). Typical: 10–30%.',
  // Agency
  clientsM1: 'Number of active clients at Month 1.',
  avgRetainerMonthly: 'Average monthly retainer per client. Your baseline recurring revenue.',
  projectRevenueMonthly: 'Additional one-time project revenue per month (on top of retainers).',
  utilizationRate: 'Percentage of team capacity that is billable. 70–80% is healthy for agencies.',
  // Advertising
  mauM1: 'Monthly Active Users at Month 1. Your audience size drives ad revenue.',
  mauGrowthMoM: 'Month-over-month growth in MAU.',
  cpm: 'Cost Per Mille — revenue per 1,000 ad impressions. Typical range: $1–$10 depending on niche.',
  adsPerSession: 'Average number of ad impressions per user session.',
  sessionsPerUserMonthly: 'Average sessions per user per month.',
  // Fintech
  aumM1: 'Assets Under Management at Month 1 (for lending/investment models).',
  aumGrowthMoM: 'Monthly growth in AUM.',
  netInterestMargin: 'Net Interest Margin — spread between lending rate and cost of funds. Typical: 2–6%.',
  transactionVolume: 'Monthly transaction volume processed through the platform.',
  transactionFeeRate: 'Fee charged per transaction as a percentage of transaction value.',
  // General
  startingCash: 'Cash on hand at the start of Month 1. Include pre-seed funding or bootstrapped capital.',
  fundingRoundMonth: 'Month when a funding round closes and cash arrives (0 = no round in this projection).',
  fundingAmount: 'Amount raised in the funding round.',
  marketingBudgetM1: 'Total marketing spend in Month 1. This is your initial demand generation budget.',
  marketingGrowthMoM: 'Month-over-month growth in marketing budget. Scales with revenue growth.',
  rdBudgetMonthly: 'Monthly R&D spend (product, engineering tools, research). Separate from headcount.',
  rentMonthly: 'Monthly office rent and facilities cost.',
  softwareToolsMonthly: 'Monthly spend on SaaS tools, cloud infrastructure, and software licenses.',
  legalAccountingMonthly: 'Monthly legal, accounting, and compliance costs.',
  otherGAMonthly: 'Other general & administrative costs not captured above.',
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

// ── Tooltip Component ──────────────────────────────────────────────────────────
function FieldTooltip({ tip }: { tip: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        className="text-muted-foreground/50 hover:text-muted-foreground transition-colors ml-0.5"
        tabIndex={-1}
      >
        <Info className="w-3 h-3" />
      </button>
      {show && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-56 bg-popover border border-border rounded-md shadow-lg p-2.5 text-[11px] text-popover-foreground leading-relaxed pointer-events-none">
          {tip}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-border" />
        </div>
      )}
    </span>
  );
}

// ── Numeric Input Helper ───────────────────────────────────────────────────────
function NumInput({
  label, value, onChange, min = 0, max, step = 1, suffix, prefix, tipKey, className = ''
}: {
  label: string; value: number; onChange: (v: number) => void;
  min?: number; max?: number; step?: number; suffix?: string; prefix?: string; tipKey?: string; className?: string;
}) {
  const tip = tipKey ? FIELD_TIPS[tipKey] : undefined;
  return (
    <div className={`space-y-1 ${className}`}>
      <Label className="text-[11px] font-medium text-muted-foreground flex items-center gap-0.5 leading-tight">
        <span className="truncate">{label}</span>
        {tip && <FieldTooltip tip={tip} />}
      </Label>
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-2 text-[11px] text-muted-foreground font-mono z-10 select-none">{prefix}</span>
        )}
        <Input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          className={`h-7 text-xs ${prefix ? 'pl-10' : ''} ${suffix ? 'pr-8' : ''}`}
        />
        {suffix && (
          <span className="absolute right-2 text-[11px] text-muted-foreground select-none">{suffix}</span>
        )}
      </div>
    </div>
  );
}

// ── KPI Card ───────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, trend, color = '#6366F1', icon: Icon }: {
  label: string; value: string; sub?: string; trend?: number; color?: string; icon?: React.ElementType;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide leading-tight">{label}</span>
        {Icon && <Icon className="w-3.5 h-3.5 shrink-0" style={{ color }} />}
      </div>
      <div className="text-lg font-bold text-foreground leading-tight">{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
      {trend !== undefined && (
        <div className={`flex items-center gap-0.5 text-[10px] font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {Math.abs(trend).toFixed(1)}% YoY
        </div>
      )}
    </div>
  );
}

// ── Collapsible Section ────────────────────────────────────────────────────────
function Section({ title, children, defaultOpen = true, badge }: {
  title: string; children: React.ReactNode; defaultOpen?: boolean; badge?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-muted/30 hover:bg-muted/50 transition-colors text-xs font-semibold text-foreground"
      >
        <div className="flex items-center gap-2">
          {title}
          {badge && <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{badge}</Badge>}
        </div>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
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
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);

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

  // ── Model / Horizon / Scenario change ─────────────────────────────────────
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
    setModelSelectorOpen(false);
  }, [yearHorizon]);

  const handleHorizonChange = useCallback((h: YearHorizon) => {
    setYearHorizon(h);
    setModelInputs(prev => ({ ...prev, yearHorizon: h }));
  }, []);

  const handleScenarioChange = useCallback((s: Scenario) => {
    setScenario(s);
    setModelInputs(prev => ({ ...prev, scenario: s }));
  }, []);

  // ── Compute projection ─────────────────────────────────────────────────────
  const output: FinancialModelOutput = useMemo(() => {
    return computeFinancialModel({ ...modelInputs, currency, scenario, yearHorizon });
  }, [modelInputs, currency, scenario, yearHorizon]);

  const yearlyWithPayroll = useMemo(() => {
    return output.yearly.map((y) => {
      const slice = output.monthly.filter(m => m.year === y.year);
      return {
        ...y,
        payroll: slice.reduce((s, m) => s + m.headcountCost, 0),
        marketing: slice.reduce((s, m) => s + m.marketingSpend, 0),
        rd: slice.reduce((s, m) => s + m.rdSpend, 0),
        ga: slice.reduce((s, m) => s + m.gaSpend, 0),
      };
    });
  }, [output]);

  // ── tRPC ───────────────────────────────────────────────────────────────────
  const saveMutation = trpc.projection.save.useMutation({
    onSuccess: (data) => { setSavedId(data.id); toast.success('Projection saved'); },
    onError: () => toast.error('Failed to save projection'),
  });
  const listQuery = trpc.projection.list.useQuery();
  const deleteMutation = trpc.projection.delete.useMutation({
    onSuccess: () => { listQuery.refetch(); toast.success('Deleted'); },
  });
  const aiReviewMutation = trpc.ai.reviewProjection.useMutation({
    onSuccess: (data) => { setAiReview(data.review); setActiveTab('ai-review'); },
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
      totalPayroll: output.monthly.reduce((s, m) => s + m.headcountCost, 0) / yearHorizon,
    });
  };

  // ── Excel Export ───────────────────────────────────────────────────────────
  const handleExcelExport = useCallback(() => {
    const wb = XLSX.utils.book_new();
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
    const headcountHeaders = ['Title', 'Department', 'Monthly Salary', 'Start Month', 'Annual Cost'];
    const headcountRows = modelInputs.headcount.map(r => [
      r.title, DEPT_LABELS[r.department], r.monthlySalary.toFixed(0), r.startMonth, (r.monthlySalary * 12).toFixed(0),
    ]);
    const ws3 = XLSX.utils.aoa_to_sheet([headcountHeaders, ...headcountRows]);
    XLSX.utils.book_append_sheet(wb, ws3, 'Headcount');
    XLSX.writeFile(wb, `${projName.replace(/\s+/g, '_')}_${yearHorizon}Y_${scenario}.xlsx`);
    toast.success('Excel downloaded');
  }, [output, yearlyWithPayroll, modelInputs, selectedModel, scenario, yearHorizon, currency, projName]);

  // ── PDF Export ─────────────────────────────────────────────────────────────
  const handlePdfExport = useCallback(() => {
    const y = yearlyWithPayroll;
    const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>${projName}</title>
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
tr.bold td { font-weight: 700; background: #f8fafc; }
tr.section td { background: #1e293b; color: white; font-weight: 700; padding: 6px 10px; }
.negative { color: #ef4444; }
.positive { color: #10b981; }
</style></head><body>
<div class="cover">
  <h1>${projName}</h1>
  <div class="meta">
    <span class="badge">${MODEL_META[selectedModel].label}</span>
    <span class="badge">${scenario.toUpperCase()} Scenario</span>
    <span class="badge">${yearHorizon}-Year Horizon</span>
    <span class="badge">${currency}</span>
    <span class="badge">Generated ${new Date().toLocaleDateString()}</span>
  </div>
</div>
<div class="content">
  <h2>Key Metrics</h2>
  <div class="kpi-grid">
    <div class="kpi"><div class="label">Revenue CAGR</div><div class="value">${output.cagr != null ? fmtPct(output.cagr) : 'N/A'}</div></div>
    <div class="kpi"><div class="label">Break-even</div><div class="value">${output.breakEvenMonth ? `Month ${output.breakEvenMonth}` : 'Not reached'}</div></div>
    <div class="kpi"><div class="label">Total Cash Burned</div><div class="value">${fmtCurrency(output.totalCashBurned3Y, currency)}</div></div>
    <div class="kpi"><div class="label">Runway</div><div class="value">${output.defaultRunwayMonths ?? 0} months</div></div>
  </div>
  <h2>Income Statement (Annual)</h2>
  <table>
    <thead><tr><th>Line Item</th>${y.map((_, i) => `<th>Year ${i + 1}</th>`).join('')}</tr></thead>
    <tbody>
      <tr><td>Revenue</td>${y.map(r => `<td>${fmtCurrency(r.revenue, currency)}</td>`).join('')}</tr>
      <tr><td>Cost of Revenue (COGS)</td>${y.map(r => `<td class="negative">(${fmtCurrency(r.cogs, currency)})</td>`).join('')}</tr>
      <tr class="bold"><td>Gross Profit</td>${y.map(r => `<td>${fmtCurrency(r.grossProfit, currency)}</td>`).join('')}</tr>
      <tr><td>  Gross Margin %</td>${y.map(r => `<td>${r.grossMarginPct.toFixed(1)}%</td>`).join('')}</tr>
      <tr><td>Marketing & Sales</td>${y.map(r => `<td class="negative">(${fmtCurrency(r.marketing, currency)})</td>`).join('')}</tr>
      <tr><td>R&D</td>${y.map(r => `<td class="negative">(${fmtCurrency(r.rd, currency)})</td>`).join('')}</tr>
      <tr><td>G&A</td>${y.map(r => `<td class="negative">(${fmtCurrency(r.ga, currency)})</td>`).join('')}</tr>
      <tr><td>Payroll</td>${y.map(r => `<td class="negative">(${fmtCurrency(r.payroll, currency)})</td>`).join('')}</tr>
      <tr class="bold"><td>EBITDA</td>${y.map(r => `<td class="${r.ebitda < 0 ? 'negative' : 'positive'}">${fmtCurrency(r.ebitda, currency)}</td>`).join('')}</tr>
      <tr><td>  EBITDA Margin %</td>${y.map(r => `<td>${r.ebitdaMarginPct.toFixed(1)}%</td>`).join('')}</tr>
      <tr class="bold"><td>Net Income</td>${y.map(r => `<td class="${r.netIncome < 0 ? 'negative' : 'positive'}">${fmtCurrency(r.netIncome, currency)}</td>`).join('')}</tr>
    </tbody>
  </table>
</div></body></html>`;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      setTimeout(() => win.print(), 500);
    }
    toast.success('PDF report opened for printing');
  }, [yearlyWithPayroll, output, modelInputs, selectedModel, scenario, yearHorizon, currency, projName]);

  // ── Revenue Driver Inputs ──────────────────────────────────────────────────
  const renderRevenueDrivers = () => {
    const rd = modelInputs.revenueDrivers as any;
    const update = (field: string, val: number) => {
      setModelInputs(prev => ({ ...prev, revenueDrivers: { ...prev.revenueDrivers, [field]: val } as any }));
    };
    const grid = 'grid grid-cols-3 gap-3';
    switch (selectedModel) {
      case 'saas': return (
        <div className={grid}>
          <NumInput label="Starting Customers" value={rd.startingCustomers} onChange={v => update('startingCustomers', v)} tipKey="startingCustomers" />
          <NumInput label="New Customers / Mo (M1)" value={rd.newCustomersM1} onChange={v => update('newCustomersM1', v)} tipKey="newCustomersM1" />
          <NumInput label="New Customer Growth MoM" value={rd.newCustomerGrowthMoM} onChange={v => update('newCustomerGrowthMoM', v)} suffix="%" tipKey="newCustomerGrowthMoM" />
          <NumInput label="Avg MRR / Customer" value={rd.avgMRR} onChange={v => update('avgMRR', v)} prefix={currency} tipKey="avgMRR" />
          <NumInput label="Monthly Churn Rate" value={rd.monthlyChurnRate} onChange={v => update('monthlyChurnRate', v)} suffix="%" tipKey="monthlyChurnRate" />
          <NumInput label="Annual Price Increase" value={rd.annualPriceIncrease} onChange={v => update('annualPriceIncrease', v)} suffix="%" tipKey="annualPriceIncrease" />
          <NumInput label="Expansion Revenue" value={rd.expansionRevenuePct} onChange={v => update('expansionRevenuePct', v)} suffix="%" tipKey="expansionRevenuePct" />
          <NumInput label="Gross Margin" value={rd.grossMarginPct} onChange={v => update('grossMarginPct', v)} suffix="%" tipKey="grossMarginPct" />
          <NumInput label="CAC / Customer" value={rd.cacPerCustomer} onChange={v => update('cacPerCustomer', v)} prefix={currency} tipKey="cacPerCustomer" />
        </div>
      );
      case 'freemium': return (
        <div className={grid}>
          <NumInput label="Free Users (M1)" value={rd.freeUsersM1} onChange={v => update('freeUsersM1', v)} tipKey="freeUsersM1" />
          <NumInput label="Free User Growth MoM" value={rd.freeUserGrowthMoM} onChange={v => update('freeUserGrowthMoM', v)} suffix="%" tipKey="freeUserGrowthMoM" />
          <NumInput label="Paid Conversion Rate" value={rd.paidConversionRate} onChange={v => update('paidConversionRate', v)} suffix="%" tipKey="paidConversionRate" />
          <NumInput label="Avg Paid MRR" value={rd.avgPaidMRR} onChange={v => update('avgPaidMRR', v)} prefix={currency} tipKey="avgPaidMRR" />
          <NumInput label="Monthly Churn Rate" value={rd.monthlyChurnRate} onChange={v => update('monthlyChurnRate', v)} suffix="%" tipKey="monthlyChurnRate" />
          <NumInput label="Gross Margin" value={rd.grossMarginPct} onChange={v => update('grossMarginPct', v)} suffix="%" tipKey="grossMarginPct" />
        </div>
      );
      case 'usage_based': return (
        <div className={grid}>
          <NumInput label="Active Users (M1)" value={rd.activeUsersM1} onChange={v => update('activeUsersM1', v)} tipKey="activeUsersM1" />
          <NumInput label="Usage Units / User (M1)" value={rd.usageUnitsPerUserM1} onChange={v => update('usageUnitsPerUserM1', v)} tipKey="usageUnitsPerUserM1" />
          <NumInput label="Usage Growth MoM" value={rd.usageGrowthMoM} onChange={v => update('usageGrowthMoM', v)} suffix="%" tipKey="usageGrowthMoM" />
          <NumInput label="Price / Unit" value={rd.pricePerUnit} onChange={v => update('pricePerUnit', v)} prefix={currency} step={0.001} tipKey="pricePerUnit" />
          <NumInput label="Gross Margin" value={rd.grossMarginPct} onChange={v => update('grossMarginPct', v)} suffix="%" tipKey="grossMarginPct" />
          <NumInput label="Monthly Churn Rate" value={rd.monthlyChurnRate} onChange={v => update('monthlyChurnRate', v)} suffix="%" tipKey="monthlyChurnRate" />
        </div>
      );
      case 'ecommerce': return (
        <div className={grid}>
          <NumInput label="Orders (M1)" value={rd.ordersM1} onChange={v => update('ordersM1', v)} tipKey="ordersM1" />
          <NumInput label="Order Growth MoM" value={rd.orderGrowthMoM} onChange={v => update('orderGrowthMoM', v)} suffix="%" tipKey="orderGrowthMoM" />
          <NumInput label="Avg Order Value" value={rd.avgOrderValue} onChange={v => update('avgOrderValue', v)} prefix={currency} tipKey="avgOrderValue" />
          <NumInput label="Repeat Purchase Rate" value={rd.repeatPurchaseRate} onChange={v => update('repeatPurchaseRate', v)} suffix="%" tipKey="repeatPurchaseRate" />
          <NumInput label="COGS % of Revenue" value={rd.cogsAsPctOfRevenue} onChange={v => update('cogsAsPctOfRevenue', v)} suffix="%" tipKey="cogsAsPctOfRevenue" />
          <NumInput label="CAC / Customer" value={rd.cacPerCustomer ?? 0} onChange={v => update('cacPerCustomer', v)} prefix={currency} tipKey="cacPerCustomer" />
        </div>
      );
      case 'd2c': return (
        <div className={grid}>
          <NumInput label="Units Sold (M1)" value={rd.unitsSoldM1} onChange={v => update('unitsSoldM1', v)} />
          <NumInput label="Unit Growth MoM" value={rd.unitGrowthMoM} onChange={v => update('unitGrowthMoM', v)} suffix="%" />
          <NumInput label="Avg Selling Price" value={rd.avgSellingPrice} onChange={v => update('avgSellingPrice', v)} prefix={currency} />
          <NumInput label="COGS % of Revenue" value={rd.cogsAsPctOfRevenue} onChange={v => update('cogsAsPctOfRevenue', v)} suffix="%" tipKey="cogsAsPctOfRevenue" />
          <NumInput label="Repeat Purchase Rate" value={rd.repeatPurchaseRate} onChange={v => update('repeatPurchaseRate', v)} suffix="%" tipKey="repeatPurchaseRate" />
          <NumInput label="CAC / Customer" value={rd.cacPerCustomer ?? 0} onChange={v => update('cacPerCustomer', v)} prefix={currency} tipKey="cacPerCustomer" />
        </div>
      );
      case 'marketplace': return (
        <div className={grid}>
          <NumInput label="GMV (M1)" value={rd.gmvM1} onChange={v => update('gmvM1', v)} prefix={currency} tipKey="gmvM1" />
          <NumInput label="GMV Growth MoM" value={rd.gmvGrowthMoM} onChange={v => update('gmvGrowthMoM', v)} suffix="%" tipKey="gmvGrowthMoM" />
          <NumInput label="Take Rate" value={rd.takeRate} onChange={v => update('takeRate', v)} suffix="%" tipKey="takeRate" />
          <NumInput label="Payment Processing Cost" value={rd.paymentProcessingCost} onChange={v => update('paymentProcessingCost', v)} suffix="%" />
          <NumInput label="Gross Margin" value={rd.grossMarginPct ?? 70} onChange={v => update('grossMarginPct', v)} suffix="%" tipKey="grossMarginPct" />
        </div>
      );
      case 'advertising': return (
        <div className={grid}>
          <NumInput label="MAU (M1)" value={rd.mauM1} onChange={v => update('mauM1', v)} tipKey="mauM1" />
          <NumInput label="MAU Growth MoM" value={rd.mauGrowthMoM} onChange={v => update('mauGrowthMoM', v)} suffix="%" tipKey="mauGrowthMoM" />
          <NumInput label="CPM (per 1K impressions)" value={rd.cpm} onChange={v => update('cpm', v)} prefix={currency} tipKey="cpm" />
          <NumInput label="Ads / Session" value={rd.adsPerSession} onChange={v => update('adsPerSession', v)} step={0.1} tipKey="adsPerSession" />
          <NumInput label="Sessions / User / Month" value={rd.sessionsPerUserMonthly} onChange={v => update('sessionsPerUserMonthly', v)} tipKey="sessionsPerUserMonthly" />
          <NumInput label="Gross Margin" value={rd.grossMarginPct ?? 70} onChange={v => update('grossMarginPct', v)} suffix="%" tipKey="grossMarginPct" />
        </div>
      );
      case 'edtech': return (
        <div className={grid}>
          <NumInput label="Students Enrolled (M1)" value={rd.studentsM1} onChange={v => update('studentsM1', v)} />
          <NumInput label="Student Growth MoM" value={rd.studentGrowthMoM} onChange={v => update('studentGrowthMoM', v)} suffix="%" />
          <NumInput label="Avg Course Price" value={rd.avgCoursePrice} onChange={v => update('avgCoursePrice', v)} prefix={currency} />
          <NumInput label="Subscription % of Students" value={rd.subscriptionPct} onChange={v => update('subscriptionPct', v)} suffix="%" />
          <NumInput label="Monthly Subscription Fee" value={rd.monthlySubscriptionFee} onChange={v => update('monthlySubscriptionFee', v)} prefix={currency} />
          <NumInput label="Gross Margin" value={rd.grossMarginPct ?? 70} onChange={v => update('grossMarginPct', v)} suffix="%" tipKey="grossMarginPct" />
        </div>
      );
      case 'subscription': return (
        <div className={grid}>
          <NumInput label="Starting Subscribers" value={rd.startingSubscribers} onChange={v => update('startingSubscribers', v)} tipKey="startingCustomers" />
          <NumInput label="New Subscribers / Mo" value={rd.newSubscribersM1} onChange={v => update('newSubscribersM1', v)} />
          <NumInput label="Subscriber Growth MoM" value={rd.subscriberGrowthMoM} onChange={v => update('subscriberGrowthMoM', v)} suffix="%" />
          <NumInput label="Monthly Subscription Fee" value={rd.monthlyFee} onChange={v => update('monthlyFee', v)} prefix={currency} />
          <NumInput label="Monthly Churn Rate" value={rd.monthlyChurnRate} onChange={v => update('monthlyChurnRate', v)} suffix="%" tipKey="monthlyChurnRate" />
          <NumInput label="COGS % of Revenue" value={rd.cogsAsPctOfRevenue} onChange={v => update('cogsAsPctOfRevenue', v)} suffix="%" tipKey="cogsAsPctOfRevenue" />
        </div>
      );
      case 'agency': return (
        <div className={grid}>
          <NumInput label="Clients (M1)" value={rd.clientsM1} onChange={v => update('clientsM1', v)} tipKey="clientsM1" />
          <NumInput label="Avg Monthly Retainer" value={rd.avgRetainerMonthly} onChange={v => update('avgRetainerMonthly', v)} prefix={currency} tipKey="avgRetainerMonthly" />
          <NumInput label="Project Revenue / Mo" value={rd.projectRevenueMonthly} onChange={v => update('projectRevenueMonthly', v)} prefix={currency} tipKey="projectRevenueMonthly" />
          <NumInput label="Client Growth MoM" value={rd.clientGrowthMoM} onChange={v => update('clientGrowthMoM', v)} suffix="%" />
          <NumInput label="Delivery Cost %" value={rd.deliveryCostPct} onChange={v => update('deliveryCostPct', v)} suffix="%" />
          <NumInput label="Utilization Rate" value={rd.utilizationRate ?? 75} onChange={v => update('utilizationRate', v)} suffix="%" tipKey="utilizationRate" />
        </div>
      );
      case 'on_demand': return (
        <div className={grid}>
          <NumInput label="Bookings / Mo (M1)" value={rd.bookingsM1} onChange={v => update('bookingsM1', v)} />
          <NumInput label="Booking Growth MoM" value={rd.bookingGrowthMoM} onChange={v => update('bookingGrowthMoM', v)} suffix="%" />
          <NumInput label="Avg Booking Value" value={rd.avgBookingValue} onChange={v => update('avgBookingValue', v)} prefix={currency} />
          <NumInput label="Take Rate" value={rd.takeRate} onChange={v => update('takeRate', v)} suffix="%" tipKey="takeRate" />
          <NumInput label="Gross Margin" value={rd.grossMarginPct ?? 60} onChange={v => update('grossMarginPct', v)} suffix="%" tipKey="grossMarginPct" />
        </div>
      );
      case 'hardware': return (
        <div className={grid}>
          <NumInput label="Units Sold (M1)" value={rd.unitsSoldM1} onChange={v => update('unitsSoldM1', v)} />
          <NumInput label="Unit Growth MoM" value={rd.unitGrowthMoM} onChange={v => update('unitGrowthMoM', v)} suffix="%" />
          <NumInput label="Hardware ASP" value={rd.hardwareASP} onChange={v => update('hardwareASP', v)} prefix={currency} />
          <NumInput label="Hardware COGS %" value={rd.hardwareCOGSPct} onChange={v => update('hardwareCOGSPct', v)} suffix="%" />
          <NumInput label="Monthly SaaS Fee / Unit" value={rd.monthlyServiceFee} onChange={v => update('monthlyServiceFee', v)} prefix={currency} />
          <NumInput label="Service Gross Margin" value={rd.serviceGrossMarginPct} onChange={v => update('serviceGrossMarginPct', v)} suffix="%" />
        </div>
      );
      case 'fintech': return (
        <div className={grid}>
          <NumInput label="AUM (M1)" value={rd.aumM1} onChange={v => update('aumM1', v)} prefix={currency} tipKey="aumM1" />
          <NumInput label="AUM Growth MoM" value={rd.aumGrowthMoM} onChange={v => update('aumGrowthMoM', v)} suffix="%" tipKey="aumGrowthMoM" />
          <NumInput label="Net Interest Margin" value={rd.netInterestMargin} onChange={v => update('netInterestMargin', v)} suffix="%" tipKey="netInterestMargin" />
          <NumInput label="Transaction Volume / Mo" value={rd.transactionVolume} onChange={v => update('transactionVolume', v)} prefix={currency} tipKey="transactionVolume" />
          <NumInput label="Transaction Fee Rate" value={rd.transactionFeeRate} onChange={v => update('transactionFeeRate', v)} suffix="%" tipKey="transactionFeeRate" />
          <NumInput label="Operating Cost %" value={rd.operatingCostPct ?? 40} onChange={v => update('operatingCostPct', v)} suffix="%" />
        </div>
      );
      case 'procurement': return (
        <div className={grid}>
          <NumInput label="Purchase Volume (M1)" value={rd.pvfM1} onChange={v => update('pvfM1', v)} prefix={currency} />
          <NumInput label="PVF Growth MoM" value={rd.pvfGrowthMoM} onChange={v => update('pvfGrowthMoM', v)} suffix="%" />
          <NumInput label="Take Rate" value={rd.takeRate} onChange={v => update('takeRate', v)} suffix="%" tipKey="takeRate" />
          <NumInput label="Operational Cost %" value={rd.operationalCostPct} onChange={v => update('operationalCostPct', v)} suffix="%" />
          <NumInput label="Gross Margin" value={rd.grossMarginPct ?? 60} onChange={v => update('grossMarginPct', v)} suffix="%" tipKey="grossMarginPct" />
        </div>
      );
      case 'proptech': return (
        <div className={grid}>
          <NumInput label="Units Under Mgmt (M1)" value={rd.unitsM1} onChange={v => update('unitsM1', v)} />
          <NumInput label="Unit Growth MoM" value={rd.unitGrowthMoM} onChange={v => update('unitGrowthMoM', v)} suffix="%" />
          <NumInput label="Mgmt Fee / Unit / Mo" value={rd.mgmtFeePerUnit} onChange={v => update('mgmtFeePerUnit', v)} prefix={currency} />
          <NumInput label="Transaction Volume / Mo" value={rd.transactionVolume} onChange={v => update('transactionVolume', v)} prefix={currency} />
          <NumInput label="Transaction Commission %" value={rd.transactionCommissionPct} onChange={v => update('transactionCommissionPct', v)} suffix="%" />
          <NumInput label="Gross Margin" value={rd.grossMarginPct ?? 65} onChange={v => update('grossMarginPct', v)} suffix="%" tipKey="grossMarginPct" />
        </div>
      );
      default: return null;
    }
  };

  // ── Headcount ──────────────────────────────────────────────────────────────
  const addRole = () => {
    setModelInputs(prev => ({
      ...prev,
      headcount: [...prev.headcount, { title: 'New Hire', department: 'engineering', monthlySalary: 5000, startMonth: 1 }],
    }));
  };
  const removeRole = (idx: number) => {
    setModelInputs(prev => ({ ...prev, headcount: prev.headcount.filter((_, i) => i !== idx) }));
  };
  const updateRole = (idx: number, field: keyof HeadcountRole, val: any) => {
    setModelInputs(prev => ({
      ...prev,
      headcount: prev.headcount.map((r, i) => i === idx ? { ...r, [field]: val } : r),
    }));
  };

  const renderHeadcount = () => (
    <div className="space-y-2">
      <div className="grid grid-cols-12 gap-2 text-[10px] font-medium text-muted-foreground px-1">
        <div className="col-span-4">Title</div>
        <div className="col-span-2">Dept</div>
        <div className="col-span-3">Monthly Salary</div>
        <div className="col-span-2">Start Mo.</div>
        <div className="col-span-1" />
      </div>
      {modelInputs.headcount.map((role, idx) => (
        <div key={idx} className="grid grid-cols-12 gap-2 items-end">
          <div className="col-span-4">
            <Input value={role.title} onChange={e => updateRole(idx, 'title', e.target.value)} className="h-7 text-xs" placeholder="Title" />
          </div>
          <div className="col-span-2">
            <Select value={role.department} onValueChange={v => updateRole(idx, 'department', v)}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{DEPT_LABELS[d]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-3">
            <Input type="number" min={0} value={role.monthlySalary} onChange={e => updateRole(idx, 'monthlySalary', parseFloat(e.target.value) || 0)} className="h-7 text-xs" />
          </div>
          <div className="col-span-2">
            <Input type="number" min={1} max={yearHorizon * 12} value={role.startMonth} onChange={e => updateRole(idx, 'startMonth', parseInt(e.target.value) || 1)} className="h-7 text-xs" />
          </div>
          <div className="col-span-1 flex justify-end">
            <Button size="sm" variant="ghost" onClick={() => removeRole(idx)} className="h-7 w-7 p-0 text-red-400 hover:text-red-600">
              <Minus className="w-3 h-3" />
            </Button>
          </div>
        </div>
      ))}
      <Button size="sm" variant="outline" onClick={addRole} className="h-7 text-xs gap-1 mt-1">
        <Plus className="w-3 h-3" /> Add Role
      </Button>
    </div>
  );

  const renderOpex = () => {
    const opex = modelInputs.opex;
    const update = (field: keyof OPEXInputs, val: number) => {
      setModelInputs(prev => ({ ...prev, opex: { ...prev.opex, [field]: val } }));
    };
    return (
      <div className="grid grid-cols-3 gap-3">
        <NumInput label="Marketing Budget (M1)" value={opex.marketingBudgetM1} onChange={v => update('marketingBudgetM1', v)} prefix={currency} tipKey="marketingBudgetM1" />
        <NumInput label="Marketing Growth MoM" value={opex.marketingGrowthMoM} onChange={v => update('marketingGrowthMoM', v)} suffix="%" tipKey="marketingGrowthMoM" />
        <NumInput label="R&D Budget / Month" value={opex.rdBudgetMonthly} onChange={v => update('rdBudgetMonthly', v)} prefix={currency} tipKey="rdBudgetMonthly" />
        <NumInput label="Office / Rent / Month" value={opex.rentMonthly} onChange={v => update('rentMonthly', v)} prefix={currency} tipKey="rentMonthly" />
        <NumInput label="Software & Tools / Month" value={opex.softwareToolsMonthly} onChange={v => update('softwareToolsMonthly', v)} prefix={currency} tipKey="softwareToolsMonthly" />
        <NumInput label="Legal & Accounting / Month" value={opex.legalAccountingMonthly} onChange={v => update('legalAccountingMonthly', v)} prefix={currency} tipKey="legalAccountingMonthly" />
        <NumInput label="Other G&A / Month" value={opex.otherGAMonthly} onChange={v => update('otherGAMonthly', v)} prefix={currency} tipKey="otherGAMonthly" />
      </div>
    );
  };

  const renderCapital = () => {
    const cap = modelInputs.capital;
    const round0 = cap.fundingRounds?.[0] ?? { month: 0, amount: 0 };
    return (
      <div className="grid grid-cols-3 gap-3">
        <NumInput label="Starting Cash" value={cap.startingCash} onChange={v => setModelInputs(prev => ({ ...prev, capital: { ...prev.capital, startingCash: v } }))} prefix={currency} tipKey="startingCash" />
        <NumInput label="Funding Round Month" value={round0.month} onChange={v => setModelInputs(prev => ({ ...prev, capital: { ...prev.capital, fundingRounds: [{ ...round0, month: v }] } }))} min={0} max={yearHorizon * 12} tipKey="fundingRoundMonth" />
        <NumInput label="Funding Amount" value={round0.amount} onChange={v => setModelInputs(prev => ({ ...prev, capital: { ...prev.capital, fundingRounds: [{ ...round0, amount: v }] } }))} prefix={currency} tipKey="fundingAmount" />
      </div>
    );
  };

  // ── Chart Data ─────────────────────────────────────────────────────────────
  const quarterlyChartData = useMemo(() => {
    const quarters: any[] = [];
    for (let q = 0; q < Math.ceil(output.monthly.length / 3); q++) {
      const months = output.monthly.slice(q * 3, q * 3 + 3);
      if (months.length === 0) break;
      quarters.push({
        label: `Y${months[0].year}Q${Math.floor((months[0].month - 1) / 3) + 1}`,
        revenue: months.reduce((s, m) => s + m.revenue, 0),
        grossProfit: months.reduce((s, m) => s + m.grossProfit, 0),
        ebitda: months.reduce((s, m) => s + m.ebitda, 0),
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
  })), [output]);

  const modelColor = BUSINESS_MODELS.find(m => m.id === selectedModel)?.color ?? '#6366F1';
  const selectedModelMeta = BUSINESS_MODELS.find(m => m.id === selectedModel)!;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full overflow-hidden" dir={isAr ? 'rtl' : 'ltr'}>

      {/* ── Header ── */}
      <div className="shrink-0 px-4 py-2.5 border-b border-border bg-card flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0" style={{ background: modelColor + '20' }}>
            <TrendingUp className="w-3.5 h-3.5" style={{ color: modelColor }} />
          </div>
          <div className="min-w-0">
            <Input
              value={projName}
              onChange={e => setProjName(e.target.value)}
              className="h-6 text-sm font-semibold border-0 bg-transparent p-0 focus-visible:ring-0 w-56"
              placeholder="Projection name..."
            />
            <div className="text-[10px] text-muted-foreground truncate">
              {selectedModelMeta.label} · {yearHorizon}Y · {scenario} · {currency}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {latestCogs && (
            <Badge variant="outline" className="text-[10px] gap-1 text-emerald-600 border-emerald-200 h-6">
              <CheckCircle2 className="w-2.5 h-2.5" /> COGS Linked
            </Badge>
          )}
          <Button size="sm" variant="outline" onClick={handleExcelExport} className="h-7 text-xs gap-1 px-2.5">
            <FileSpreadsheet className="w-3 h-3" /> Excel
          </Button>
          <Button size="sm" variant="outline" onClick={handlePdfExport} className="h-7 text-xs gap-1 px-2.5">
            <FileText className="w-3 h-3" /> PDF
          </Button>
          <Button size="sm" variant="outline" onClick={handleAiReview} disabled={aiReviewMutation.isPending} className="h-7 text-xs gap-1 px-2.5">
            {aiReviewMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            AI Review
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saveMutation.isPending} className="h-7 text-xs gap-1 px-2.5">
            {saveMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            Save
          </Button>
        </div>
      </div>

      {/* ── Controls Bar ── */}
      <div className="shrink-0 px-4 py-2 border-b border-border bg-muted/10 flex items-center gap-2 flex-wrap">
        {/* Business Model Selector — Dropdown */}
        <div className="relative">
          <button
            onClick={() => setModelSelectorOpen(v => !v)}
            className="flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-border bg-card text-xs font-medium hover:bg-muted/50 transition-colors"
            style={{ borderColor: modelColor + '60', color: modelColor }}
          >
            <selectedModelMeta.icon className="w-3 h-3" />
            <span>{selectedModelMeta.shortLabel}</span>
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </button>
          {modelSelectorOpen && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-popover border border-border rounded-lg shadow-xl p-2 w-72">
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">Select Business Model</div>
              {MODEL_GROUPS.map(group => {
                const items = BUSINESS_MODELS.filter(m => m.group === group);
                return (
                  <div key={group} className="mb-2">
                    <div className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest px-1 mb-1">{group}</div>
                    <div className="space-y-0.5">
                      {items.map(m => (
                        <button
                          key={m.id}
                          onClick={() => handleModelChange(m.id)}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors text-left ${selectedModel === m.id ? 'text-white' : 'text-foreground hover:bg-muted/50'}`}
                          style={selectedModel === m.id ? { background: m.color } : {}}
                        >
                          <m.icon className="w-3 h-3 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{m.label}</div>
                            <div className={`text-[9px] truncate ${selectedModel === m.id ? 'opacity-70' : 'text-muted-foreground'}`}>{m.description}</div>
                          </div>
                          {selectedModel === m.id && <CheckCircle2 className="w-3 h-3 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <Separator orientation="vertical" className="h-5" />

        {/* Scenario */}
        <div className="flex items-center gap-1">
          {SCENARIOS.map(s => (
            <button
              key={s.id}
              onClick={() => handleScenarioChange(s.id)}
              title={s.description}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all h-7 ${scenario === s.id ? 'text-white shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
              style={scenario === s.id ? { background: s.color } : {}}
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
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all h-7 ${yearHorizon === h.value ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
            >
              {h.label}
            </button>
          ))}
        </div>

        <Separator orientation="vertical" className="h-5" />

        {/* Currency */}
        <Select value={currency} onValueChange={setCurrency}>
          <SelectTrigger className="h-7 w-20 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 overflow-y-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="px-4 pt-2.5 border-b border-border sticky top-0 bg-background z-10">
            <TabsList className="h-8 gap-0.5">
              <TabsTrigger value="setup" className="text-xs h-7 px-3">Setup & Inputs</TabsTrigger>
              <TabsTrigger value="pl" className="text-xs h-7 px-3">P&L Statement</TabsTrigger>
              <TabsTrigger value="charts" className="text-xs h-7 px-3">Charts & KPIs</TabsTrigger>
              <TabsTrigger value="ai-review" className="text-xs h-7 px-3 gap-1">
                <Sparkles className="w-3 h-3" /> AI Review
              </TabsTrigger>
              <TabsTrigger value="help" className="text-xs h-7 px-3 gap-1">
                <BookOpen className="w-3 h-3" /> Help
              </TabsTrigger>
              <TabsTrigger value="history" className="text-xs h-7 px-3">Saved</TabsTrigger>
            </TabsList>
          </div>

          {/* ── Setup Tab ── */}
          <TabsContent value="setup" className="p-4 space-y-3">
            {/* Company Info */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1">
                <Label className="text-[11px] font-medium text-muted-foreground">Company Name</Label>
                <Input value={modelInputs.companyName} onChange={e => setModelInputs(prev => ({ ...prev, companyName: e.target.value }))} className="h-7 text-xs" placeholder="My Startup" />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-medium text-muted-foreground">Start Year</Label>
                <Input type="number" value={modelInputs.startYear} onChange={e => setModelInputs(prev => ({ ...prev, startYear: parseInt(e.target.value) || new Date().getFullYear() }))} className="h-7 text-xs" />
              </div>
            </div>

            {latestCogs && (
              <div className="flex items-center gap-2.5 p-2.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <div className="text-xs text-emerald-700 dark:text-emerald-400">
                  Unit Economics linked — gross margin {latestCogs.grossMarginPct?.toFixed(1)}% auto-applied.
                </div>
              </div>
            )}

            <Section title={`Revenue Drivers — ${selectedModelMeta.label}`} badge={selectedModelMeta.group}>
              {renderRevenueDrivers()}
            </Section>

            <Section title="Headcount Plan" defaultOpen={false} badge={`${modelInputs.headcount.length} roles`}>
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
          <TabsContent value="pl" className="p-4 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <KpiCard label="Revenue CAGR" value={output.cagr != null ? fmtPct(output.cagr) : 'N/A'} icon={TrendingUp} color={modelColor} />
              <KpiCard label="Break-even" value={output.breakEvenMonth ? `Month ${output.breakEvenMonth}` : 'Not reached'} icon={Target} color="#F59E0B" />
              <KpiCard label="Total Cash Burned" value={fmtCurrency(output.totalCashBurned3Y, currency)} icon={DollarSign} color="#EF4444" />
              <KpiCard label="Runway" value={`${output.defaultRunwayMonths ?? 0} mo`} icon={Calendar} color="#10B981" />
            </div>

            <div className="rounded-lg border border-border overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left px-3 py-2 font-semibold text-foreground w-52 text-xs">Line Item</th>
                    {yearlyWithPayroll.map((_, i) => (
                      <th key={i} className="text-right px-3 py-2 font-semibold text-foreground text-xs">Year {i + 1}</th>
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
                        return (
                          <td key={i} className={`px-3 py-1.5 text-right font-mono ${(row.key === 'netIncome' || row.key === 'ebitda') && val < 0 ? 'text-red-500' : ''} ${(row.key === 'netIncome' || row.key === 'ebitda') && val >= 0 && row.bold ? 'text-emerald-600' : ''} ${row.key.includes('Pct') ? 'text-muted-foreground' : ''}`}>
                            {row.isPct ? `${val.toFixed(1)}%` : row.negate ? `(${fmtCurrency(val, currency)})` : fmtCurrency(val, currency)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Section title="Monthly Detail" defaultOpen={false}>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left px-2 py-1.5 font-semibold text-xs">Month</th>
                      <th className="text-right px-2 py-1.5 font-semibold text-xs">Revenue</th>
                      <th className="text-right px-2 py-1.5 font-semibold text-xs">Gross Profit</th>
                      <th className="text-right px-2 py-1.5 font-semibold text-xs">GM%</th>
                      <th className="text-right px-2 py-1.5 font-semibold text-xs">EBITDA</th>
                      <th className="text-right px-2 py-1.5 font-semibold text-xs">Net Income</th>
                      <th className="text-right px-2 py-1.5 font-semibold text-xs">Cash</th>
                      <th className="text-right px-2 py-1.5 font-semibold text-xs">Customers</th>
                    </tr>
                  </thead>
                  <tbody>
                    {output.monthly.map((m, i) => (
                      <tr key={i} className={`border-t border-border/30 ${i % 12 === 11 ? 'border-b-2 border-border' : ''}`}>
                        <td className="px-2 py-1 text-muted-foreground font-mono">Y{m.year}M{m.monthInYear}</td>
                        <td className="px-2 py-1 text-right font-mono">{fmtCurrency(m.revenue, currency)}</td>
                        <td className="px-2 py-1 text-right font-mono">{fmtCurrency(m.grossProfit, currency)}</td>
                        <td className="px-2 py-1 text-right text-muted-foreground">{m.grossMarginPct.toFixed(1)}%</td>
                        <td className={`px-2 py-1 text-right font-mono ${m.ebitda < 0 ? 'text-red-500' : 'text-emerald-600'}`}>{fmtCurrency(m.ebitda, currency)}</td>
                        <td className={`px-2 py-1 text-right font-mono ${m.netIncome < 0 ? 'text-red-500' : 'text-emerald-600'}`}>{fmtCurrency(m.netIncome, currency)}</td>
                        <td className={`px-2 py-1 text-right font-mono ${m.cashBalance < 0 ? 'text-red-500' : ''}`}>{fmtCurrency(m.cashBalance, currency)}</td>
                        <td className="px-2 py-1 text-right text-muted-foreground">{m.customers.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          </TabsContent>

          {/* ── Charts Tab ── */}
          <TabsContent value="charts" className="p-4 space-y-5">
            <div>
              <h3 className="text-xs font-semibold mb-3 text-foreground">Revenue & Gross Profit (Quarterly)</h3>
              <div style={{ height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={quarterlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                    <YAxis tickFormatter={v => fmtCurrency(v, currency)} tick={{ fontSize: 10 }} width={70} />
                    <Tooltip formatter={(v: number) => fmtCurrency(v, currency)} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke={modelColor} fill={modelColor + '30'} strokeWidth={2} />
                    <Area type="monotone" dataKey="grossProfit" name="Gross Profit" stroke="#10B981" fill="#10B98130" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold mb-3 text-foreground">EBITDA by Year</h3>
              <div style={{ height: 200 }}>
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

            <div>
              <h3 className="text-xs font-semibold mb-3 text-foreground">Cash Balance (Monthly)</h3>
              <div style={{ height: 200 }}>
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

            <div>
              <h3 className="text-xs font-semibold mb-3 text-foreground">Cost Breakdown by Year (Stacked)</h3>
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={yearlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                    <YAxis tickFormatter={v => fmtCurrency(v, currency)} tick={{ fontSize: 10 }} width={70} />
                    <Tooltip formatter={(v: number) => fmtCurrency(v, currency)} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="payroll" name="Payroll" stackId="a" fill="#6366F1" />
                    <Bar dataKey="marketing" name="Marketing" stackId="a" fill="#F59E0B" />
                    <Bar dataKey="rd" name="R&D" stackId="a" fill="#10B981" />
                    <Bar dataKey="ga" name="G&A" stackId="a" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {(output.cac || output.ltv) && (
              <div>
                <h3 className="text-xs font-semibold mb-3 text-foreground">Unit Economics</h3>
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
          <TabsContent value="ai-review" className="p-4">
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
                    <Badge variant="outline" className="text-xs">{scenario} · {yearHorizon}Y</Badge>
                  </div>
                  <Button size="sm" variant="outline" onClick={handleAiReview} className="h-7 text-xs gap-1">
                    <RefreshCw className="w-3 h-3" /> Regenerate
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
                    A senior VC partner will analyze your {yearHorizon}-year {selectedModelMeta.label} projection and provide strengths, risks, benchmarks, and actionable recommendations.
                  </div>
                </div>
                <Button onClick={handleAiReview} className="gap-2">
                  <Sparkles className="w-4 h-4" /> Generate AI Review
                </Button>
              </div>
            )}
          </TabsContent>

          {/* ── Help / Education Tab ── */}
          <TabsContent value="help" className="p-4 space-y-5">
            {/* Quick-start guide */}
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="px-4 py-3 bg-primary/5 border-b border-border flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">How to Use This Tool</span>
              </div>
              <div className="p-4 space-y-3">
                {[
                  { step: '1', title: 'Choose your business model', desc: 'Click the model selector in the toolbar. Each model has its own revenue drivers tailored to how that business actually makes money.' },
                  { step: '2', title: 'Pick a scenario and horizon', desc: 'Bear = conservative, Base = realistic, Bull = optimistic. The scenario adjusts growth rates and costs automatically. Choose 3Y for early-stage, 5Y for Series A, 10Y for long-range planning.' },
                  { step: '3', title: 'Fill in Revenue Drivers', desc: 'These are the key inputs that drive your top-line revenue. Focus on getting these right — they have the biggest impact on your projection.' },
                  { step: '4', title: 'Add your Headcount Plan', desc: 'Add each planned hire with their title, department, salary, and the month they join. This feeds directly into your payroll cost line.' },
                  { step: '5', title: 'Set OPEX and Capital', desc: 'Enter your monthly operating expenses and starting cash. Add a funding round if you plan to raise.' },
                  { step: '6', title: 'Review P&L and Charts', desc: 'Switch to the P&L Statement tab to see your full income statement. Use Charts & KPIs for visual analysis.' },
                  { step: '7', title: 'Get AI Review', desc: 'Click "AI Review" to get a VC-partner-level analysis of your projection — strengths, risks, and recommendations.' },
                  { step: '8', title: 'Export', desc: 'Download as Excel (full monthly P&L + headcount sheet) or PDF (investor-ready report).' },
                ].map(item => (
                  <div key={item.step} className="flex gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{item.step}</div>
                    <div>
                      <div className="text-xs font-semibold text-foreground">{item.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Financial Concepts */}
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="px-4 py-3 bg-muted/30 border-b border-border flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-semibold">Key Financial Concepts</span>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { term: 'Revenue', def: 'Total income generated from your core business activity before any deductions.' },
                  { term: 'COGS (Cost of Revenue)', def: 'Direct costs to deliver your product/service: hosting, payment processing, raw materials, fulfillment.' },
                  { term: 'Gross Profit', def: 'Revenue minus COGS. This is the money available to pay for operating expenses.' },
                  { term: 'Gross Margin %', def: 'Gross Profit ÷ Revenue × 100. SaaS benchmark: 70–85%. E-commerce: 30–50%. Marketplace: 60–80%.' },
                  { term: 'OPEX', def: 'Operating Expenses: marketing, R&D, G&A, and payroll. These are costs not directly tied to delivering the product.' },
                  { term: 'EBITDA', def: 'Earnings Before Interest, Taxes, Depreciation & Amortization. The most common profitability metric used by investors.' },
                  { term: 'EBITDA Margin %', def: 'EBITDA ÷ Revenue × 100. Positive = profitable operations. Negative = still burning cash to grow.' },
                  { term: 'Net Income', def: 'The bottom line: Revenue minus all costs. Negative in early stages is normal — investors focus on the trajectory.' },
                  { term: 'CAC', def: 'Customer Acquisition Cost: total sales & marketing spend ÷ new customers acquired in a period.' },
                  { term: 'LTV', def: 'Lifetime Value: total revenue expected from a customer over their lifetime. LTV/CAC > 3x is healthy.' },
                  { term: 'Churn Rate', def: 'Percentage of customers who cancel per month. Lower is better. 2% monthly = ~22% annual churn.' },
                  { term: 'MRR', def: 'Monthly Recurring Revenue: predictable monthly subscription revenue. The core metric for SaaS businesses.' },
                  { term: 'ARR', def: 'Annual Recurring Revenue: MRR × 12. The standard metric VCs use to value SaaS companies.' },
                  { term: 'Runway', def: 'Months of cash remaining at current burn rate. 18+ months is the recommended minimum before fundraising.' },
                  { term: 'Burn Rate', def: 'Monthly net cash outflow (expenses minus revenue). Gross burn = total expenses. Net burn = expenses minus revenue.' },
                  { term: 'CAGR', def: 'Compound Annual Growth Rate: the steady annual growth rate that would take you from Year 1 to Year N revenue.' },
                ].map(item => (
                  <div key={item.term} className="p-3 rounded-lg bg-muted/20 border border-border/50">
                    <div className="text-xs font-semibold text-foreground mb-1">{item.term}</div>
                    <div className="text-[11px] text-muted-foreground leading-relaxed">{item.def}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Business Model Guide */}
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="px-4 py-3 bg-muted/30 border-b border-border flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-semibold">Business Model Revenue Drivers</span>
              </div>
              <div className="p-4 space-y-2">
                {BUSINESS_MODELS.map(m => (
                  <div key={m.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/20 transition-colors">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5" style={{ background: m.color + '20' }}>
                      <m.icon className="w-3 h-3" style={{ color: m.color }} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-foreground">{m.label}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{m.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* VC Benchmarks */}
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="px-4 py-3 bg-muted/30 border-b border-border flex items-center gap-2">
                <Target className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-semibold">VC Benchmark Ranges by Model</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left px-3 py-2 font-semibold">Model</th>
                      <th className="text-right px-3 py-2 font-semibold">Gross Margin</th>
                      <th className="text-right px-3 py-2 font-semibold">Monthly Churn</th>
                      <th className="text-right px-3 py-2 font-semibold">LTV/CAC</th>
                      <th className="text-right px-3 py-2 font-semibold">YoY Growth (Seed)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { model: 'SaaS', gm: '70–85%', churn: '<2%', ltvcac: '>3x', growth: '100–300%' },
                      { model: 'Freemium', gm: '65–80%', churn: '<3%', ltvcac: '>3x', growth: '150–400%' },
                      { model: 'Usage-Based', gm: '60–75%', churn: 'N/A', ltvcac: '>2x', growth: '100–250%' },
                      { model: 'E-commerce', gm: '30–50%', churn: 'N/A', ltvcac: '>2x', growth: '50–150%' },
                      { model: 'Marketplace', gm: '60–80%', churn: 'N/A', ltvcac: '>3x', growth: '80–200%' },
                      { model: 'Agency', gm: '40–60%', churn: '<5%', ltvcac: '>2x', growth: '30–80%' },
                      { model: 'Advertising', gm: '60–80%', churn: 'N/A', ltvcac: 'N/A', growth: '50–200%' },
                      { model: 'Fintech', gm: '50–70%', churn: '<2%', ltvcac: '>3x', growth: '80–200%' },
                    ].map(row => (
                      <tr key={row.model} className="border-t border-border/50 hover:bg-muted/20">
                        <td className="px-3 py-2 font-medium">{row.model}</td>
                        <td className="px-3 py-2 text-right text-muted-foreground">{row.gm}</td>
                        <td className="px-3 py-2 text-right text-muted-foreground">{row.churn}</td>
                        <td className="px-3 py-2 text-right text-muted-foreground">{row.ltvcac}</td>
                        <td className="px-3 py-2 text-right text-muted-foreground">{row.growth}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="flex items-start gap-2.5 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                <strong>Disclaimer:</strong> These projections are estimates based on the inputs you provide. They are for planning and fundraising preparation purposes only, not financial advice. Actual results will vary. Always validate key assumptions with industry data and consult a qualified financial advisor before making investment decisions.
              </div>
            </div>
          </TabsContent>

          {/* ── History Tab ── */}
          <TabsContent value="history" className="p-4">
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
                    <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate({ id: proj.id })} className="h-7 w-7 p-0 text-red-400 hover:text-red-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
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
