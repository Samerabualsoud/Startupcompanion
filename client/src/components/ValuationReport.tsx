/**
 * ValuationReport — Full results view rendered after chat completion
 * Design: "Venture Capital Clarity" — Editorial Finance
 * Shows blended valuation, all 7 methods, charts, dilution, and PDF export
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { FileDown, BookmarkPlus, ChevronDown, ChevronRight, RotateCcw, PieChart, BarChart2, Layers, Cloud, CloudOff, Sparkles, TrendingUp, TrendingDown, Minus, AlertTriangle, Zap, Users, Target, ArrowUpRight, Brain, MessageSquare } from 'lucide-react';
import { Streamdown } from 'streamdown';
import { formatCurrency, type StartupInputs, type ValuationSummary, type SavedScenario } from '@/lib/valuation';
import { generatePDFReport } from '@/lib/pdfReport';
import DilutionCalculator from './DilutionCalculator';
import ScenarioComparison from './ScenarioComparison';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import { AnimatePresence } from 'framer-motion';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { useStartup } from '@/contexts/StartupContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip,
  ResponsiveContainer, Cell, ReferenceLine,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';

const METHOD_COLORS = ['#C4614A', '#0F1B2D', '#8B4A38', '#2D4A6B', '#A0522D', '#1B3A5C', '#D4845A'];

// Rationale for each valuation method — plain English explanations
const METHOD_RATIONALE: Record<string, {
  why: string;
  bestFor: string;
  keyAssumption: string;
  interpretation?: (r: any, inputs: StartupInputs) => string;
}> = {
  dcf: {
    why: 'DCF values your company based on the cash it is expected to generate in the future, discounted back to today\'s dollars. It\'s the gold standard for companies with predictable revenue, because it ties valuation directly to business fundamentals rather than market sentiment.',
    bestFor: 'Revenue-generating startups with 12+ months of history',
    keyAssumption: 'Your projected revenue growth rate and profit margins hold over 5 years',
    interpretation: (r, inputs) =>
      `At ${inputs.revenueGrowthRate}% annual growth and a ${inputs.discountRate}% discount rate, your future cash flows are worth ${formatCurrency(r.value, true)} today. If growth slows, the value drops; if it accelerates, it rises.`,
  },
  scorecard: {
    why: 'The Scorecard Method compares your startup to the "average" funded startup in your region and stage, then adjusts up or down based on how strong your team, market, and product are. It\'s widely used by angel investors who rely on qualitative judgment.',
    bestFor: 'Pre-revenue or early-revenue startups seeking angel investment',
    keyAssumption: 'The regional median pre-money valuation is an accurate market benchmark',
    interpretation: (r, inputs) =>
      `Your team, market, and product scores averaged to a ${r.breakdown['Composite Score'] || 'strong'} composite, placing you ${r.value > r.low + (r.high - r.low) / 2 ? 'above' : 'below'} the regional median of ${formatCurrency(r.breakdown['Regional Median'] || 0, true)}.`,
  },
  berkus: {
    why: 'The Berkus Method assigns a dollar value to each major milestone you\'ve hit — like having a working prototype, a real customer, or a strong team. It\'s designed for pre-revenue startups where financial projections are unreliable.',
    bestFor: 'Pre-revenue startups at idea or prototype stage',
    keyAssumption: 'Each milestone reduces risk by a fixed, equal amount (up to $500K each)',
    interpretation: (r, inputs) =>
      `Based on your milestones, you\'ve de-risked your startup by ${formatCurrency(r.value, true)} of the maximum $2.5M. Each milestone you complete adds up to $500K in value.`,
  },
  vc: {
    why: 'The VC Method works backwards from the exit: if a VC needs a 10x return and expects to sell the company for $50M, they\'ll only invest at a $5M pre-money valuation. This shows you exactly what a VC is thinking when they look at your deal.',
    bestFor: 'Startups actively pitching institutional VCs',
    keyAssumption: 'The projected exit multiple and required investor return are realistic',
    interpretation: (r, inputs) =>
      `To deliver a ${inputs.targetReturn}x return over ${inputs.yearsToExit} years, your company must exit at ${formatCurrency(r.breakdown['Required Exit Value'] || 0, true)}. This implies a current pre-money value of ${formatCurrency(r.value, true)}.`,
  },
  comps: {
    why: 'Comparable Transactions values your company by looking at what similar companies in your sector are worth as a multiple of their revenue (ARR). It anchors your valuation to real market data, not projections.',
    bestFor: 'Companies with measurable ARR in sectors with active M&A or public comps',
    keyAssumption: 'Your sector\'s current revenue multiples reflect your company\'s growth profile',
    interpretation: (r, inputs) =>
      `At your ARR of ${formatCurrency(inputs.currentARR, true)}, applying a blended ${r.breakdown['Blended Multiple'] || 'sector'} multiple gives a valuation of ${formatCurrency(r.value, true)}. Higher ARR growth would justify a higher multiple.`,
  },
  riskfactor: {
    why: 'The Risk-Factor Summation starts from a baseline valuation and adjusts it up or down based on 12 specific risk categories — like management quality, technology risk, and competitive environment. It makes risk explicit and quantifiable.',
    bestFor: 'Any stage — particularly useful for identifying which risks to address first',
    keyAssumption: 'Each risk category has equal weight and a symmetric ±$250K impact per unit',
    interpretation: (r, inputs) =>
      `Your risk profile resulted in a net adjustment of ${formatCurrency(r.value - (r.breakdown['Base Valuation'] || 0), true)} from the baseline. Improving your highest-risk areas could meaningfully increase your valuation.`,
  },
  firstchicago: {
    why: 'The First Chicago Method runs three separate DCF scenarios — a pessimistic bear case, a realistic base case, and an optimistic bull case — then weights them by probability. This gives a more honest range than a single-point estimate.',
    bestFor: 'Companies with high uncertainty or multiple possible growth trajectories',
    keyAssumption: 'The probability weights assigned to bear/base/bull scenarios are realistic',
    interpretation: (r, inputs) =>
      `Your probability-weighted valuation of ${formatCurrency(r.value, true)} reflects a blend of outcomes. The gap between bear (${formatCurrency(r.breakdown['Bear Case'] || 0, true)}) and bull (${formatCurrency(r.breakdown['Bull Case'] || 0, true)}) shows the range of possible futures.`,
  },
};

const TABS_EN = [
  { id: 'report', label: 'Valuation Report', icon: BarChart2 },
  { id: 'ai-analyst', label: 'AI Analyst', icon: Sparkles },
  { id: 'sensitivity', label: 'Sensitivity', icon: TrendingUp },
  { id: 'scenarios', label: 'Scenarios', icon: Layers },
  { id: 'dilution', label: 'Dilution', icon: PieChart },
];
const TABS_AR = [
  { id: 'report', label: 'تقرير التقييم', icon: BarChart2 },
  { id: 'ai-analyst', label: 'محلل AI', icon: Sparkles },
  { id: 'sensitivity', label: 'تحليل الحساسية', icon: TrendingUp },
  { id: 'scenarios', label: 'السيناريوهات', icon: Layers },
  { id: 'dilution', label: 'التخفيف', icon: PieChart },
];

function MethodCard({ result, index }: { result: any; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const { isRTL } = useLanguage();
  const color = METHOD_COLORS[index % METHOD_COLORS.length];
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
      className="border border-border rounded-lg overflow-hidden bg-card">
      <div className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-secondary/40 transition-colors" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
          <div>
            <div className="text-sm font-semibold text-foreground">{result.method}</div>
            <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
              {formatCurrency(result.low, true)} — {formatCurrency(result.high, true)} range · {result.applicability}% fit
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="metric-value text-lg font-bold" style={{ color }}>{formatCurrency(result.value, true)}</span>
          {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 border-t border-border pt-3">
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">{result.description}</p>
              <div className="mb-3">
                <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                  <span>{isRTL ? 'درجة الثقة' : 'Confidence Score'}</span><span className="font-mono font-semibold">{result.confidence}%</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${result.confidence}%`, backgroundColor: color }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                {Object.entries(result.breakdown).map(([k, v]: [string, any]) => (
                  <div key={k} className="text-[11px]">
                    <span className="text-muted-foreground">{k}: </span>
                    <span className="font-mono font-semibold text-foreground">{typeof v === 'number' ? formatCurrency(v, true) : v}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface Props {
  inputs: StartupInputs;
  summary: ValuationSummary;
  onReset: () => void;
}

export default function ValuationReport({ inputs, summary, onReset }: Props) {
  const [activeTab, setActiveTab] = useState('report');
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>([]);
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [scenarioName, setScenarioName] = useState('');
  const [aiNarrative, setAiNarrative] = useState<string | null>(null);
  const [aiNarrativeLoading, setAiNarrativeLoading] = useState(false);
  const [deepAnalysis, setDeepAnalysis] = useState<any | null>(null);
  const [deepAnalysisLoading, setDeepAnalysisLoading] = useState(false);
  const [talkingPoints, setTalkingPoints] = useState<any | null>(null);
  const [talkingPointsLoading, setTalkingPointsLoading] = useState(false);
  const [activeAIPanel, setActiveAIPanel] = useState<'narrative' | 'deep' | 'talking'>('narrative');
  const { isAuthenticated } = useAuth();
  const { isRTL } = useLanguage();
  const TABS = isRTL ? TABS_AR : TABS_EN;
  const { refresh: refreshStartupContext } = useStartup();

  const narrativeMutation = trpc.ai.valuationNarrative.useMutation({
    onSuccess: (data) => {
      setAiNarrative(data.narrative);
      setAiNarrativeLoading(false);
    },
    onError: () => {
      setAiNarrativeLoading(false);
      toast.error('Failed to generate AI analysis. Please try again.');
    },
  });

  const deepAnalysisMutation = trpc.ai.valuationDeepAnalysis.useMutation({
    onSuccess: (data) => { setDeepAnalysis(data); setDeepAnalysisLoading(false); },
    onError: () => { setDeepAnalysisLoading(false); toast.error('Deep analysis failed. Please try again.'); },
  });

  const talkingPointsMutation = trpc.ai.investorTalkingPoints.useMutation({
    onSuccess: (data) => { setTalkingPoints(data); setTalkingPointsLoading(false); },
    onError: () => { setTalkingPointsLoading(false); toast.error('Failed to generate talking points.'); },
  });

  const handleDeepAnalysis = () => {
    if (deepAnalysis) return;
    setDeepAnalysisLoading(true);
    deepAnalysisMutation.mutate({
      companyName: inputs.companyName || 'Your Startup',
      sector: inputs.sector,
      stage: inputs.stage,
      blendedValuation: summary.blended,
      valuationLow: summary.weightedLow,
      valuationHigh: summary.weightedHigh,
      confidenceScore: summary.confidenceScore,
      currentARR: inputs.currentARR,
      revenueGrowthRate: inputs.revenueGrowthRate,
      grossMargin: inputs.grossMargin,
      burnRate: inputs.burnRate,
      runway: summary.runway,
      tam: inputs.totalAddressableMarket,
      methods: summary.results.map(r => ({ method: r.method, value: r.value, applicability: r.applicability })),
    });
  };

  const handleTalkingPoints = () => {
    if (talkingPoints) return;
    setTalkingPointsLoading(true);
    talkingPointsMutation.mutate({
      companyName: inputs.companyName || 'Your Startup',
      sector: inputs.sector,
      stage: inputs.stage,
      blendedValuation: summary.blended,
      currentARR: inputs.currentARR,
      revenueGrowthRate: inputs.revenueGrowthRate,
      grossMargin: inputs.grossMargin,
      topMethods: summary.results.slice(0,3).map(r => ({ method: r.method, value: r.value })),
    });
  };

  const handleGenerateNarrative = () => {
    if (aiNarrative) return;
    setAiNarrativeLoading(true);
    narrativeMutation.mutate({
      companyName: inputs.companyName || 'Your Startup',
      stage: inputs.stage,
      sector: inputs.sector,
      blendedValuation: summary.blended,
      valuationLow: summary.weightedLow,
      valuationHigh: summary.weightedHigh,
      confidenceScore: summary.confidenceScore,
      riskLevel: summary.riskLevel,
      runway: summary.runway,
      burnMultiple: summary.burnMultiple,
      impliedARRMultiple: summary.impliedARRMultiple,
      currentARR: inputs.currentARR,
      revenueGrowthRate: inputs.revenueGrowthRate,
      grossMargin: inputs.grossMargin,
      methods: summary.results.map(r => ({ method: r.method, value: r.value, applicability: r.applicability, confidence: r.confidence })),
      language: isRTL ? 'arabic' : 'english',
    });
  };

  const saveValuationMutation = trpc.profile.saveValuation.useMutation({
    onSuccess: () => {
      toast.success(isRTL ? 'تم حفظ السيناريو في ملفك الشخصي!' : 'Scenario saved to your profile!');
      refreshStartupContext();
    },
    onError: () => {
      toast.error(isRTL ? 'فشل الحفظ في الملف الشخصي. تم الحفظ محلياً فقط.' : 'Failed to save to profile. Saved locally only.');
    },
  });

  const riskColor = summary.riskLevel === 'Low' ? '#10B981' : summary.riskLevel === 'Moderate' ? '#F59E0B' : summary.riskLevel === 'High' ? '#EF4444' : '#7C3AED';

  const chartData = summary.results.map((r, i) => ({
    name: r.method.replace('Discounted Cash Flow', 'DCF').replace('Comparable Transactions', 'Comps').replace('Risk-Factor Summation', 'Risk-Factor').replace('First Chicago Method', 'First Chicago').replace(' Method', '').trim(),
    value: Math.round(r.value / 1e6 * 100) / 100,
    color: METHOD_COLORS[i % METHOD_COLORS.length],
  }));

  const radarData = [
    { subject: 'Team', score: inputs.teamScore },
    { subject: 'Market', score: inputs.marketScore },
    { subject: 'Product', score: inputs.productScore },
    { subject: 'Competition', score: inputs.competitiveScore },
    { subject: 'Marketing', score: inputs.marketingScore },
    { subject: 'Funding', score: inputs.fundingScore },
  ];

  const handleSaveScenario = () => {
    const name = scenarioName.trim() || `Scenario ${savedScenarios.length + 1}`;
    const newScenario: SavedScenario = { id: nanoid(), name, inputs, summary, savedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) };
    setSavedScenarios(prev => [...prev, newScenario]);
    setScenarioName('');
    setShowSaveInput(false);
    setActiveTab('scenarios');
    // Also persist to database if logged in
    if (isAuthenticated) {
      saveValuationMutation.mutate({
        label: name,
        blendedValue: summary.blended,
        inputs: inputs as any,
        summary: summary as any,
      });
    } else {
      toast.success(`Scenario "${name}" saved locally!`);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Valuation Hero ── */}
      <div className="shrink-0 p-5 bg-primary">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest mb-1 text-primary-foreground/60">
              {inputs.companyName}
            </div>
            <div className="text-3xl font-bold metric-value text-primary-foreground" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              {formatCurrency(summary.blended, true)}
            </div>
            <div className="text-xs mt-1 text-primary-foreground/70">
              {isRTL ? 'النطاق' : 'Range'}: {formatCurrency(summary.weightedLow, true)} — {formatCurrency(summary.weightedHigh, true)}
            </div>
            <div className="flex items-center gap-3 mt-2">
              <div className="text-[10px] font-mono text-primary-foreground/70">
                {isRTL ? 'الثقة' : 'Confidence'}: <span className="font-semibold text-primary-foreground">{summary.confidenceScore}%</span>
              </div>
              <div className="text-[10px] font-mono text-primary-foreground/70">
                {isRTL ? 'المرحلة' : 'Stage'}: <span className="font-semibold text-primary-foreground">{summary.stage}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button onClick={() => { generatePDFReport(inputs, summary); toast.success('Opening print dialog…'); }}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-md border border-primary-foreground/20 text-primary-foreground/80 hover:bg-primary-foreground/10 transition-all whitespace-nowrap">
              <FileDown className="w-3.5 h-3.5" />
              {isRTL ? 'تقرير PDF' : 'PDF Report'}
            </button>
            <button onClick={() => setShowSaveInput(v => !v)}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-md border border-accent/50 text-accent hover:bg-accent/10 transition-all whitespace-nowrap">
              <BookmarkPlus className="w-3.5 h-3.5" />
              {isRTL ? 'حفظ السيناريو' : 'Save Scenario'}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showSaveInput && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-3">
              <div className="flex gap-2">
                <input value={scenarioName} onChange={e => setScenarioName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSaveScenario()}
                  placeholder={isRTL ? 'سمّ هذا السيناريو…' : 'Name this scenario…'}
                  className="flex-1 text-xs px-3 py-2 rounded-md border border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/40 outline-none focus:border-accent"
                  autoFocus />
                <button onClick={handleSaveScenario} className="text-xs px-3 py-2 rounded-md bg-accent text-white font-medium hover:bg-accent/80 transition-colors">{isRTL ? 'حفظ' : 'Save'}</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Key metrics strip */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          {[
            { label: isRTL ? 'مدة البقاء' : 'Runway', value: summary.runway === 999 ? '∞' : `${summary.runway}${isRTL ? 'شهر' : 'mo'}` },
            { label: isRTL ? 'مضاعف الحرق' : 'Burn Multiple', value: `${summary.burnMultiple}x`, warn: summary.burnMultiple > 2 },
            { label: isRTL ? 'مضاعف ARR' : 'ARR Multiple', value: `${summary.impliedARRMultiple}x` },
            { label: isRTL ? 'المخاطرة' : 'Risk', value: summary.riskLevel, color: riskColor },
          ].map(m => (
            <div key={m.label} className="rounded-md p-2 text-center bg-primary-foreground/10">
              <div className="text-[9px] font-mono uppercase tracking-wider mb-0.5 text-primary-foreground/60">{m.label}</div>
              <div className="text-sm font-bold metric-value" style={{ color: m.color || (m.warn ? '#EF4444' : 'white') }}>{m.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b border-border bg-card shrink-0">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-all border-b-2 ${activeTab === tab.id ? 'border-accent text-accent' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
            {tab.id === 'scenarios' && savedScenarios.length > 0 && (
              <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded-full bg-accent text-white font-mono">{savedScenarios.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'report' && (
          <div className="p-5 space-y-6">
            {/* Bar Chart */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{isRTL ? 'التقييم حسب الطريقة' : 'Valuation by Method'}</h3>
                <span className="text-[10px] text-muted-foreground font-mono">{isRTL ? 'القيم بالمليون $' : 'Values in $M'}</span>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 55 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fontFamily: 'DM Sans' }} angle={-35} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 9, fontFamily: 'JetBrains Mono' }} tickFormatter={v => `$${v}M`} />
                  <RechartTooltip formatter={(v: any) => [`$${v}M`, 'Value']} contentStyle={{ fontSize: 11, fontFamily: 'DM Sans', borderRadius: 4 }} />
                  <ReferenceLine y={Math.round(summary.blended / 1e6 * 100) / 100} stroke="#C4614A" strokeDasharray="4 2" strokeWidth={1.5}
                    label={{ value: `Blended`, fill: '#C4614A', fontSize: 9, fontFamily: 'JetBrains Mono' }} />
                  <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                    {chartData.map((e, i) => <Cell key={i} fill={e.color} opacity={0.9} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Method Cards */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                {isRTL ? 'تفصيل الطرق' : 'Method Breakdown'} <span className="text-xs font-normal text-muted-foreground ml-1">— {isRTL ? 'اضغط للتوسيع' : 'tap to expand'}</span>
              </h3>
              <div className="space-y-2">
                {summary.results.map((r, i) => <MethodCard key={r.methodCode} result={r} index={i} />)}
              </div>
            </div>

            {/* ── Valuation Rationale ── */}
            <div className="border border-border rounded-xl overflow-hidden bg-card">
              <div className="px-4 py-3 border-b border-border bg-primary">
                <h3 className="text-sm font-semibold text-primary-foreground" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  {isRTL ? 'لماذا استخدمنا هذه الطرق' : 'Why These Methods Were Used'}
                </h3>
                <p className="text-[10px] mt-0.5 text-primary-foreground/70">
                  {isRTL ? 'يتم اختيار كل طريقة وترجيحها بناءً على مرحلتك وقطاعك والبيانات المتاحة.' : 'Each method is selected and weighted based on your stage, sector, and available data.'}
                </p>
              </div>
              <div className="divide-y divide-border">
                {summary.results.map((r, i) => {
                  const rationale = METHOD_RATIONALE[r.methodCode] || {};
                  const color = METHOD_COLORS[i % METHOD_COLORS.length];
                  return (
                    <div key={r.methodCode} className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: color }} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-xs font-bold text-foreground">{r.method}</span>
                            <span className="text-[10px] font-mono font-semibold shrink-0" style={{ color }}>
                              {r.applicability}% weight
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">
                            {rationale.why || r.description}
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="rounded-md p-2 bg-secondary/50">
                              <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">{isRTL ? 'الأنسب لـ' : 'Best For'}</div>
                              <div className="text-[10px] text-foreground">{rationale.bestFor || '—'}</div>
                            </div>
                            <div className="rounded-md p-2 bg-secondary/50">
                              <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">{isRTL ? 'الافتراض الرئيسي' : 'Key Assumption'}</div>
                              <div className="text-[10px] text-foreground">{rationale.keyAssumption || '—'}</div>
                            </div>
                          </div>
                          {rationale.interpretation && (
                            <div className="mt-2 text-[10px] rounded-md px-3 py-2 border-l-2 text-muted-foreground italic bg-muted" style={{ borderColor: color }}>
                              <strong className="text-foreground not-italic">{isRTL ? 'نتيجتك: ' : 'Your result: '}</strong>{rationale.interpretation(r, inputs)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Scorecard Radar */}
            <div className="border border-border rounded-lg p-4 bg-card">
              <h3 className="text-sm font-semibold text-foreground mb-3" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{isRTL ? 'بطاقة أداء الفريق والمنتج' : 'Team & Product Scorecard'}</h3>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fontFamily: 'DM Sans' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8 }} />
                  <Radar name="Score" dataKey="score" stroke="#C4614A" fill="#C4614A" fillOpacity={0.25} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Analyst Summary */}
            <div className="border border-border rounded-lg p-4 bg-card">
              <h3 className="text-sm font-semibold text-foreground mb-3" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{isRTL ? 'ماذا يعني هذا بالنسبة لك' : 'What This Means For You'}</h3>
              <div className="space-y-2.5 text-sm text-muted-foreground leading-relaxed">
                {isRTL ? (
                  <>
                    <p><strong className="text-foreground">تقييمك المدمج هو {formatCurrency(summary.blended, true)}</strong>، محسوب بدمج 7 طرق مختلفة وترجيح كل منها حسب مدى ملاءمتها لمرحلتك وقطاعك.</p>
                    <p><strong className="text-foreground">مدة البقاء:</strong> {summary.runway === 999 ? 'أنت رابح — لا ضغط تمويلي فوري.' : `بمعدل حرقك الحالي، لديك ${summary.runway} شهراً من السيولة. ${summary.runway < 12 ? '⚠️ يجب أن تبدأ جمع التمويل قريباً.' : summary.runway < 18 ? 'فكّر في بدء جمع التمويل خلال الأشهر القادمة.' : 'لديك مدة بقاء مريحة.'}`}</p>
                    <p><strong className="text-foreground">كفاءة رأس المال:</strong> مضاعف الحرق لديك {summary.burnMultiple}x — {summary.burnMultiple < 1 ? 'ممتاز. أنت تنمو أسرع مما تنفق.' : summary.burnMultiple < 2 ? 'جيد. سينظر إليه المستثمرون بإيجابية.' : summary.burnMultiple < 4 ? 'معتدل. هناك مجال لتحسين الكفاءة.' : 'مرتفع. قد يعترض المستثمرون — ركّز على تقليل الحرق أو تسريع النمو.'}</p>
                    <p><strong className="text-foreground">نطاق التقييم:</strong> الفارق من {formatCurrency(summary.weightedLow, true)} إلى {formatCurrency(summary.weightedHigh, true)} يعكس عدم اليقين في مرحلتك. في التفاوض، استهدف النصف الأعلى من هذا النطاق.</p>
                  </>
                ) : (
                  <>
                    <p><strong className="text-foreground">Your blended valuation is {formatCurrency(summary.blended, true)}</strong>, calculated by combining 7 different methods and weighting each by how relevant it is to your stage and sector.</p>
                    <p><strong className="text-foreground">Runway:</strong> {summary.runway === 999 ? "You're profitable — no immediate funding pressure." : `At your current burn rate, you have ${summary.runway} months of cash. ${summary.runway < 12 ? "⚠️ You should start fundraising soon." : summary.runway < 18 ? "Consider starting your fundraise in the next few months." : "You have a comfortable runway."}`}</p>
                    <p><strong className="text-foreground">Capital Efficiency:</strong> Your burn multiple is {summary.burnMultiple}x — {summary.burnMultiple < 1 ? "excellent. You're growing faster than you're spending." : summary.burnMultiple < 2 ? "good. Investors will view this favorably." : summary.burnMultiple < 4 ? "moderate. There's room to improve efficiency." : "high. Investors may push back on this — focus on reducing burn or accelerating growth."}</p>
                    <p><strong className="text-foreground">Valuation Range:</strong> The spread from {formatCurrency(summary.weightedLow, true)} to {formatCurrency(summary.weightedHigh, true)} reflects uncertainty at your stage. In a negotiation, aim for the upper half of this range.</p>
                  </>
                )}
              </div>
            </div>

            {/* MENA Benchmark Context & Disclaimer */}
            <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-amber-200 dark:border-amber-800 flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-semibold text-amber-800 dark:text-amber-400">{isRTL ? 'السياق والمعايير المرجعية' : 'Context & Market Benchmarks'}</span>
              </div>
              <div className="p-4 space-y-3 text-[11px] text-amber-900 dark:text-amber-300 leading-relaxed">
                {isRTL ? (
                  <>
                    <p><strong>هذا تقييم ما قبل الاستثمار (Pre-money).</strong> يمثل قيمة شركتك قبل استلام أي تمويل جديد. التقييم بعد الاستثمار (Post-money) = التقييم قبل الاستثمار + مبلغ التمويل المستلم.</p>
                    <p><strong>معايير منطقة MENA حسب المرحلة (2024):</strong></p>
                    <ul className="space-y-1 list-none">
                      <li>• <strong>ما قبل البذرة:</strong> 00K – M | مضاعف ARR: 5–10x | مضاعف الإيرادات: 3–6x</li>
                      <li>• <strong>البذرة:</strong> M – M | مضاعف ARR: 8–15x | نمو الإيرادات: 100%+ سنوياً</li>
                      <li>• <strong>السلسلة A:</strong> 0M – 0M | مضاعف ARR: 10–20x | نمو الإيرادات: 150%+ سنوياً</li>
                    </ul>
                    <p><strong>تحذير:</strong> التقييم المرتفع لا يضمن اهتمام المستثمرين. يقيّم المستثمرون جودة الفريق وحجم السوق والنمو والميزة التنافسية — وليس الأرقام فحسب. استخدم هذا كنقطة بداية للتفاوض.</p>
                    <p className="text-amber-700 dark:text-amber-400"><strong>تنبيه:</strong> هذا التقييم لأغراض التخطيط والتعليم فقط. تعتمد التقييمات الفعلية على مفاوضات المستثمرين وظروف السوق والعناية الواجبة. استشر مستشاراً مالياً مؤهلاً قبل اتخاذ قرارات الاستثمار.</p>
                  </>
                ) : (
                  <>
                    <p><strong>This is a pre-money valuation.</strong> It represents your company's value before receiving any new investment. Post-money valuation = pre-money valuation + investment amount received.</p>
                    <p><strong>MENA market benchmarks by stage (2024):</strong></p>
                    <ul className="space-y-1 list-none">
                      <li>• <strong>Pre-Seed:</strong> 00K – M | ARR multiple: 5–10x | Revenue multiple: 3–6x</li>
                      <li>• <strong>Seed:</strong> M – M | ARR multiple: 8–15x | Revenue growth: 100%+ YoY</li>
                      <li>• <strong>Series A:</strong> 0M – 0M | ARR multiple: 10–20x | Revenue growth: 150%+ YoY</li>
                    </ul>
                    <p><strong>Important:</strong> A high valuation does not guarantee investor interest. Investors evaluate team quality, market size, traction, and competitive moat — not just numbers. Use this as a starting point for negotiation, not a final answer.</p>
                    <p className="text-amber-700 dark:text-amber-400"><strong>Disclaimer:</strong> This valuation is for planning and educational purposes only. Actual valuations depend on investor negotiations, market conditions, and due diligence. Consult a qualified financial advisor before making investment decisions.</p>
                  </>
                )}
              </div>
            </div>

            {/* Start Over */}
            <button onClick={onReset} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-accent transition-colors">
              <RotateCcw className="w-3.5 h-3.5" />
              {isRTL ? 'بدء تقييم جديد' : 'Start a new valuation'}
            </button>
          </div>
        )}

        {activeTab === 'ai-analyst' && (
          <div className="p-5 space-y-4">

            {/* AI Panel Selector */}
            <div className="flex gap-2 p-1 bg-secondary/50 rounded-lg">
              {[
                { id: 'narrative' as const, icon: Sparkles, label: isRTL ? 'السرد' : 'Narrative' },
                { id: 'deep' as const, icon: Brain, label: isRTL ? 'التحليل العميق' : 'Deep Analysis' },
                { id: 'talking' as const, icon: MessageSquare, label: isRTL ? 'نقاط المناقشة' : 'Talking Points' },
              ].map(panel => (
                <button
                  key={panel.id}
                  onClick={() => setActiveAIPanel(panel.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-md transition-all ${activeAIPanel === panel.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <panel.icon className="w-3 h-3" />
                  {panel.label}
                </button>
              ))}
            </div>

            {/* ── NARRATIVE PANEL ── */}
            {activeAIPanel === 'narrative' && (
              <div className="rounded-xl overflow-hidden border border-border">
                <div className="px-4 py-3 flex items-center justify-between bg-primary/10 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">{isRTL ? 'تحليل المحلل الذكي' : 'AI Analyst Narrative'}</span>
                  </div>
                  {!aiNarrative && (
                    <button onClick={handleGenerateNarrative} disabled={aiNarrativeLoading || !isAuthenticated}
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-all disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90">
                      {aiNarrativeLoading ? <><span className="animate-spin inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full" />{isRTL ? 'جارٍ...' : 'Analyzing...'}</> : <><Sparkles className="w-3 h-3" />{isRTL ? 'توليد' : 'Generate'}</>}
                    </button>
                  )}
                </div>
                <div className="p-4 bg-card">
                  {!isAuthenticated ? (
                    <div className="text-center py-6"><AlertTriangle className="w-8 h-8 mx-auto mb-2 text-amber-500" /><p className="text-sm font-medium">{isRTL ? 'تسجيل الدخول مطلوب' : 'Login required'}</p></div>
                  ) : aiNarrative ? (
                    <div className="text-sm text-foreground leading-relaxed prose prose-sm max-w-none"><Streamdown>{aiNarrative}</Streamdown></div>
                  ) : (
                    <div className="text-center py-8"><Sparkles className="w-10 h-10 mx-auto mb-3 text-primary opacity-40" /><p className="text-sm font-medium text-foreground mb-1">{isRTL ? 'سرد تحليلي عميق' : 'Deep analyst narrative'}</p><p className="text-xs text-muted-foreground max-w-xs mx-auto">{isRTL ? 'تفسير احترافي، نقاط قوة ومخاطر، وخطوات للـ٩٠ يوماً القادمة.' : 'Professional interpretation, key strengths & risks, and 90-day action steps.'}</p></div>
                  )}
                </div>
              </div>
            )}

            {/* ── DEEP ANALYSIS PANEL ── */}
            {activeAIPanel === 'deep' && (
              <div className="space-y-4">
                {!deepAnalysis ? (
                  <div className="rounded-xl border border-border overflow-hidden">
                    <div className="px-4 py-3 flex items-center justify-between bg-violet-500/10 border-b border-border">
                      <div className="flex items-center gap-2"><Brain className="w-4 h-4 text-violet-500" /><span className="text-sm font-semibold text-foreground">{isRTL ? 'التحليل العميق بالذكاء الاصطناعي' : 'AI Deep Analysis'}</span></div>
                      <button onClick={handleDeepAnalysis} disabled={deepAnalysisLoading || !isAuthenticated}
                        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 transition-all">
                        {deepAnalysisLoading ? <><span className="animate-spin inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full" />{isRTL ? 'جارٍ...' : 'Analyzing...'}</> : <><Brain className="w-3 h-3" />{isRTL ? 'تشغيل التحليل العميق' : 'Run deep analysis'}</>}
                      </button>
                    </div>
                    <div className="p-8 text-center bg-card">
                      <Brain className="w-12 h-12 mx-auto mb-3 text-violet-400 opacity-40" />
                      <p className="text-sm font-medium text-foreground mb-1">{isRTL ? 'تحليل عميق مع مقارنات السوق' : 'Deep analysis with market comparables'}</p>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto">{isRTL ? 'مقارنة بشركات مماثلة، تحليل نقاط القوة والمخاطر، ورافعات محددة لزيادة التقييم.' : 'Comparable company benchmarking, strength/risk analysis, specific levers to increase your valuation, and fundraising strategy.'}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Verdict */}
                    <div className="rounded-xl border border-border p-4 bg-card">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><Sparkles className="w-4 h-4 text-primary" /></div>
                        <div><div className="text-xs font-bold text-primary uppercase tracking-wide mb-1">{isRTL ? 'حكم المحلل' : 'Analyst Verdict'}</div><div className="text-sm text-foreground leading-relaxed">{deepAnalysis.verdict}</div></div>
                      </div>
                    </div>

                    {/* Comparable Companies */}
                    {deepAnalysis.comparableCompanies?.length > 0 && (
                      <div className="rounded-xl border border-border overflow-hidden bg-card">
                        <div className="px-4 py-3 border-b border-border"><div className="flex items-center gap-2"><Users className="w-4 h-4 text-foreground" /><span className="text-sm font-semibold text-foreground">{isRTL ? 'الشركات المماثلة' : 'Comparable Companies'}</span></div></div>
                        <div className="divide-y divide-border">
                          {deepAnalysis.comparableCompanies.slice(0,4).map((c: any, i: number) => (
                            <div key={i} className="flex items-center gap-3 px-4 py-3">
                              <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold text-foreground shrink-0">{c.name.slice(0,2).toUpperCase()}</div>
                              <div className="flex-1"><div className="text-xs font-semibold text-foreground">{c.name}</div><div className="text-[10px] text-muted-foreground">{c.relevance}</div></div>
                              <div className="text-right shrink-0"><div className="text-xs font-bold text-foreground">{c.valuation}</div><div className="text-[10px] text-muted-foreground">{c.multiple}</div></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Strengths & Risks */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-emerald-200 dark:border-emerald-900 overflow-hidden bg-card">
                        <div className="px-3 py-2.5 border-b border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30"><span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{isRTL ? '✦ نقاط القوة' : '✦ Key Strengths'}</span></div>
                        <div className="p-3 space-y-2.5">
                          {deepAnalysis.keyStrengths?.slice(0,3).map((s: any, i: number) => (
                            <div key={i}><div className="text-xs font-semibold text-foreground">{s.strength}</div><div className="text-[10px] text-emerald-600 dark:text-emerald-400">{s.impact}</div></div>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-xl border border-red-200 dark:border-red-900 overflow-hidden bg-card">
                        <div className="px-3 py-2.5 border-b border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30"><span className="text-xs font-bold text-red-700 dark:text-red-400">{isRTL ? '⚠ المخاطر الرئيسية' : '⚠ Key Risks'}</span></div>
                        <div className="p-3 space-y-2.5">
                          {deepAnalysis.keyRisks?.slice(0,3).map((r: any, i: number) => (
                            <div key={i}><div className="text-xs font-semibold text-foreground">{r.risk}</div><div className="text-[10px] text-red-600 dark:text-red-400">{r.mitigation}</div></div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Valuation Levers */}
                    {deepAnalysis.valuationLevers?.length > 0 && (
                      <div className="rounded-xl border border-border overflow-hidden bg-card">
                        <div className="px-4 py-3 border-b border-border"><div className="flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500" /><span className="text-sm font-semibold text-foreground">{isRTL ? 'رافعات التقييم' : 'Valuation Levers'}</span><span className="text-[10px] text-muted-foreground ml-1">{isRTL ? 'خطوات محددة لزيادة تقييمك' : 'Specific actions to increase your valuation'}</span></div></div>
                        <div className="divide-y divide-border">
                          {deepAnalysis.valuationLevers.slice(0,4).map((lev: any, i: number) => (
                            <div key={i} className="flex items-start gap-3 px-4 py-3">
                              <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-[10px] font-bold text-amber-700 dark:text-amber-400 shrink-0 mt-0.5">{i+1}</div>
                              <div className="flex-1"><div className="text-xs font-semibold text-foreground">{lev.lever}</div><div className="text-[10px] text-muted-foreground mt-0.5">{lev.timeframe} · {lev.difficulty}</div></div>
                              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 shrink-0">{lev.potentialUplift}</div>
                            </div>
                          ))}
                        </div>
                        {deepAnalysis.fundraisingAdvice && (
                          <div className="px-4 py-3 border-t border-border bg-blue-50/50 dark:bg-blue-950/20"><p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">💡 {deepAnalysis.fundraisingAdvice}</p></div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── TALKING POINTS PANEL ── */}
            {activeAIPanel === 'talking' && (
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="px-4 py-3 flex items-center justify-between bg-emerald-500/10 border-b border-border">
                  <div className="flex items-center gap-2"><MessageSquare className="w-4 h-4 text-emerald-600" /><span className="text-sm font-semibold text-foreground">{isRTL ? 'نقاط المناقشة مع المستثمرين' : 'Investor Talking Points'}</span></div>
                  {!talkingPoints && (
                    <button onClick={handleTalkingPoints} disabled={talkingPointsLoading || !isAuthenticated}
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-all">
                      {talkingPointsLoading ? <><span className="animate-spin inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full" />{isRTL ? 'جارٍ...' : 'Generating...'}</> : <><MessageSquare className="w-3 h-3" />{isRTL ? 'توليد النقاط' : 'Generate'}</>}
                    </button>
                  )}
                </div>
                {!talkingPoints ? (
                  <div className="p-8 text-center bg-card"><MessageSquare className="w-12 h-12 mx-auto mb-3 text-emerald-400 opacity-40" /><p className="text-sm font-medium text-foreground mb-1">{isRTL ? 'نقاط مناقشة جاهزة للمستثمرين' : 'Ready-to-use investor talking points'}</p><p className="text-xs text-muted-foreground max-w-xs mx-auto">{isRTL ? 'جمل كاملة ومصقولة لاستخدامها في اجتماعات المستثمرين بناءً على نتائج تقييمك.' : 'Complete, polished sentences to use in investor meetings, based on your valuation results.'}</p></div>
                ) : (
                  <div className="p-4 space-y-4 bg-card">
                    {[
                      { key: 'openingStatement', label: isRTL ? 'الافتتاحية' : 'Opening Statement', color: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900', tc: 'text-blue-700 dark:text-blue-300' },
                      { key: 'valuationJustification', label: isRTL ? 'مبرر التقييم' : 'Valuation Justification', color: 'bg-violet-50 dark:bg-violet-950/20 border-violet-200 dark:border-violet-900', tc: 'text-violet-700 dark:text-violet-300' },
                      { key: 'useOfFunds', label: isRTL ? 'استخدام الأموال' : 'Use of Funds', color: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900', tc: 'text-amber-700 dark:text-amber-300' },
                      { key: 'closingAsk', label: isRTL ? 'الختام والطلب' : 'Closing Ask', color: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900', tc: 'text-emerald-700 dark:text-emerald-300' },
                    ].map(({key, label, color, tc}) => talkingPoints[key] && (
                      <div key={key} className={`rounded-lg border p-3 ${color}`}>
                        <div className={`text-[10px] font-bold uppercase tracking-wide mb-1.5 ${tc}`}>{label}</div>
                        <p className="text-sm text-foreground leading-relaxed">"{talkingPoints[key]}"</p>
                      </div>
                    ))}
                    {talkingPoints.tractionPoints?.length > 0 && (
                      <div className="rounded-lg border border-border p-3 bg-secondary/30">
                        <div className="text-[10px] font-bold uppercase tracking-wide mb-2 text-muted-foreground">{isRTL ? 'نقاط الجذب' : 'Traction Points'}</div>
                        <div className="space-y-1.5">
                          {talkingPoints.tractionPoints.map((pt: string, i: number) => (
                            <div key={i} className="flex items-start gap-2"><div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary shrink-0 mt-0.5">{i+1}</div><p className="text-xs text-foreground">{pt}</p></div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Peer Benchmarks */}
            <div className="rounded-xl border border-border overflow-hidden bg-card">
              <div className="px-4 py-3 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground">{isRTL ? 'معايير السوق' : 'Market Benchmarks'}</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">{isRTL ? 'مقارنة مؤشراتك بمتوسطات الصناعة' : 'How your metrics compare to industry averages'}</p>
              </div>
              <div className="p-4 space-y-3">
                {[
                  {
                    label: isRTL ? 'مضاعف ARR' : 'ARR Multiple',
                    yours: summary.impliedARRMultiple,
                    benchmark: inputs.stage === 'pre-seed' ? 8 : inputs.stage === 'seed' ? 10 : inputs.stage === 'series-a' ? 12 : 15,
                    unit: 'x',
                    higherBetter: true,
                  },
                  {
                    label: isRTL ? 'مضاعف الحرق' : 'Burn Multiple',
                    yours: summary.burnMultiple,
                    benchmark: inputs.stage === 'pre-seed' ? 3 : inputs.stage === 'seed' ? 2 : 1.5,
                    unit: 'x',
                    higherBetter: false,
                  },
                  {
                    label: isRTL ? 'هامش الربح الإجمالي' : 'Gross Margin',
                    yours: inputs.grossMargin,
                    benchmark: inputs.sector === 'saas' || inputs.sector === 'fintech' ? 75 : inputs.sector === 'ecommerce' ? 40 : 60,
                    unit: '%',
                    higherBetter: true,
                  },
                  {
                    label: isRTL ? 'نمو الإيرادات' : 'Revenue Growth',
                    yours: inputs.revenueGrowthRate,
                    benchmark: inputs.stage === 'seed' ? 100 : inputs.stage === 'series-a' ? 150 : 80,
                    unit: '%',
                    higherBetter: true,
                  },
                ].map(({ label, yours, benchmark, unit, higherBetter }) => {
                  const isGood = higherBetter ? yours >= benchmark : yours <= benchmark;
                  const diff = Math.abs(yours - benchmark);
                  const Icon = isGood ? TrendingUp : TrendingDown;
                  return (
                    <div key={label} className="flex items-center gap-3">
                      <div className="w-32 shrink-0">
                        <div className="text-xs font-medium text-foreground">{label}</div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                          <span>{isRTL ? 'أنت' : 'You'}: <strong className="text-foreground">{yours.toFixed(1)}{unit}</strong></span>
                          <span>{isRTL ? 'المعيار' : 'Benchmark'}: {benchmark}{unit}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(100, (yours / (benchmark * 1.5)) * 100)}%`,
                              background: isGood ? '#10B981' : '#EF4444',
                            }}
                          />
                        </div>
                      </div>
                      <div className="shrink-0">
                        <Icon className="w-3.5 h-3.5" style={{ color: isGood ? '#10B981' : '#EF4444' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sensitivity' && (
          <div className="p-5 space-y-5">
            <div className="rounded-xl border border-border overflow-hidden bg-card">
              <div className="px-4 py-3 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground">{isRTL ? 'تحليل الحساسية' : 'Sensitivity Analysis'}</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">{isRTL ? 'كيف تتغير قيمتك عند تغيير الافتراضات الرئيسية' : 'How your valuation changes when key assumptions shift'}</p>
              </div>
              <div className="p-4 space-y-6">
                {/* Revenue Growth Sensitivity */}
                <div>
                  <div className="text-xs font-semibold text-foreground mb-3">{isRTL ? 'حساسية نمو الإيرادات' : 'Revenue Growth Rate Sensitivity'}</div>
                  <div className="space-y-2">
                    {[-30, -15, 0, +15, +30].map(delta => {
                      const adjustedGrowth = Math.max(0, inputs.revenueGrowthRate + delta);
                      const scaleFactor = adjustedGrowth / Math.max(1, inputs.revenueGrowthRate);
                      const adjustedVal = summary.blended * (0.6 + scaleFactor * 0.4);
                      const isBase = delta === 0;
                      const isUp = adjustedVal > summary.blended;
                      return (
                        <div key={delta} className={`flex items-center gap-3 p-2 rounded-md ${isBase ? 'bg-accent/10 border border-accent/30' : 'bg-secondary/40'}`}>
                          <div className="w-20 text-[10px] font-mono text-muted-foreground">
                            {delta === 0 ? (isRTL ? 'الأساس' : 'Base') : `${delta > 0 ? '+' : ''}${delta}%`}
                          </div>
                          <div className="text-[10px] font-mono text-muted-foreground w-16">{adjustedGrowth.toFixed(0)}% {isRTL ? 'نمو' : 'growth'}</div>
                          <div className="flex-1">
                            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${Math.min(100, (adjustedVal / (summary.blended * 1.6)) * 100)}%`, background: isBase ? 'var(--primary)' : isUp ? '#10B981' : '#EF4444' }} />
                            </div>
                          </div>
                          <div className={`text-xs font-bold font-mono w-20 text-right ${isBase ? 'text-accent' : isUp ? 'text-green-500' : 'text-red-500'}`}>
                            {formatCurrency(adjustedVal, true)}
                          </div>
                          {!isBase && (
                            <div className={`text-[9px] font-mono w-14 text-right ${isUp ? 'text-green-500' : 'text-red-500'}`}>
                              {isUp ? '+' : ''}{(((adjustedVal - summary.blended) / summary.blended) * 100).toFixed(1)}%
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Burn Rate Sensitivity */}
                <div>
                  <div className="text-xs font-semibold text-foreground mb-3">{isRTL ? 'حساسية معدل الحرق' : 'Monthly Burn Rate Sensitivity'}</div>
                  <div className="space-y-2">
                    {[-40, -20, 0, +20, +40].map(delta => {
                      const adjustedBurn = Math.max(0, inputs.burnRate * (1 + delta / 100));
                      const runwayMonths = inputs.cashOnHand > 0 ? Math.min(999, Math.round(inputs.cashOnHand / Math.max(1, adjustedBurn))) : 999;
                      const burnImpact = delta === 0 ? 0 : -delta * 0.008;
                      const adjustedVal = summary.blended * (1 + burnImpact);
                      const isBase = delta === 0;
                      const isUp = adjustedVal >= summary.blended;
                      return (
                        <div key={delta} className={`flex items-center gap-3 p-2 rounded-md ${isBase ? 'bg-accent/10 border border-accent/30' : 'bg-secondary/40'}`}>
                          <div className="w-20 text-[10px] font-mono text-muted-foreground">
                            {delta === 0 ? (isRTL ? 'الأساس' : 'Base') : `${delta > 0 ? '+' : ''}${delta}%`}
                          </div>
                          <div className="text-[10px] font-mono text-muted-foreground w-24">{formatCurrency(adjustedBurn, true)}/mo</div>
                          <div className="flex-1 text-[9px] text-muted-foreground">
                            {runwayMonths === 999 ? (isRTL ? 'رابح' : 'Profitable') : `${runwayMonths}mo ${isRTL ? 'مدة بقاء' : 'runway'}`}
                          </div>
                          <div className={`text-xs font-bold font-mono w-20 text-right ${isBase ? 'text-accent' : isUp ? 'text-green-500' : 'text-red-500'}`}>
                            {formatCurrency(adjustedVal, true)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Gross Margin Sensitivity */}
                <div>
                  <div className="text-xs font-semibold text-foreground mb-3">{isRTL ? 'حساسية هامش الربح الإجمالي' : 'Gross Margin Sensitivity'}</div>
                  <div className="space-y-2">
                    {[-20, -10, 0, +10, +20].map(delta => {
                      const adjustedMargin = Math.max(0, Math.min(100, inputs.grossMargin + delta));
                      const marginImpact = delta * 0.012;
                      const adjustedVal = summary.blended * (1 + marginImpact);
                      const isBase = delta === 0;
                      const isUp = adjustedVal >= summary.blended;
                      return (
                        <div key={delta} className={`flex items-center gap-3 p-2 rounded-md ${isBase ? 'bg-accent/10 border border-accent/30' : 'bg-secondary/40'}`}>
                          <div className="w-20 text-[10px] font-mono text-muted-foreground">
                            {delta === 0 ? (isRTL ? 'الأساس' : 'Base') : `${delta > 0 ? '+' : ''}${delta}pp`}
                          </div>
                          <div className="text-[10px] font-mono text-muted-foreground w-16">{adjustedMargin.toFixed(0)}% {isRTL ? 'هامش' : 'margin'}</div>
                          <div className="flex-1">
                            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${adjustedMargin}%`, background: isBase ? 'var(--primary)' : isUp ? '#10B981' : '#EF4444' }} />
                            </div>
                          </div>
                          <div className={`text-xs font-bold font-mono w-20 text-right ${isBase ? 'text-accent' : isUp ? 'text-green-500' : 'text-red-500'}`}>
                            {formatCurrency(adjustedVal, true)}
                          </div>
                          {!isBase && (
                            <div className={`text-[9px] font-mono w-14 text-right ${isUp ? 'text-green-500' : 'text-red-500'}`}>
                              {isUp ? '+' : ''}{(((adjustedVal - summary.blended) / summary.blended) * 100).toFixed(1)}%
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'scenarios' && (
          <div className="p-5">
            <ScenarioComparison scenarios={savedScenarios} onDelete={id => setSavedScenarios(prev => prev.filter(s => s.id !== id))} />
          </div>
        )}

        {activeTab === 'dilution' && (
          <div className="p-5">
            <DilutionCalculator />
          </div>
        )}
      </div>
    </div>
  );
}
