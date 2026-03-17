/**
 * ValuationReport — Full results view rendered after chat completion
 * Design: "Venture Capital Clarity" — Editorial Finance
 * Shows blended valuation, all 7 methods, charts, dilution, and PDF export
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { FileDown, BookmarkPlus, ChevronDown, ChevronRight, RotateCcw, PieChart, BarChart2, Layers, Cloud, CloudOff } from 'lucide-react';
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
  { id: 'scenarios', label: 'Scenarios', icon: Layers },
  { id: 'dilution', label: 'Dilution', icon: PieChart },
];
const TABS_AR = [
  { id: 'report', label: 'تقرير التقييم', icon: BarChart2 },
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
  const { isAuthenticated } = useAuth();
  const { isRTL } = useLanguage();
  const TABS = isRTL ? TABS_AR : TABS_EN;
  const { refresh: refreshStartupContext } = useStartup();

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
      <div className="shrink-0 p-5" style={{ background: 'oklch(0.18 0.05 240)' }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: 'oklch(0.55 0.13 30)' }}>
              {inputs.companyName}
            </div>
            <div className="text-3xl font-bold metric-value" style={{ color: 'oklch(0.978 0.008 80)', fontFamily: 'JetBrains Mono, monospace' }}>
              {formatCurrency(summary.blended, true)}
            </div>
            <div className="text-xs mt-1" style={{ color: 'oklch(0.62 0.02 240)' }}>
              {isRTL ? 'النطاق' : 'Range'}: {formatCurrency(summary.weightedLow, true)} — {formatCurrency(summary.weightedHigh, true)}
            </div>
            <div className="flex items-center gap-3 mt-2">
              <div className="text-[10px] font-mono" style={{ color: 'oklch(0.62 0.02 240)' }}>
                {isRTL ? 'الثقة' : 'Confidence'}: <span className="font-semibold" style={{ color: 'oklch(0.978 0.008 80)' }}>{summary.confidenceScore}%</span>
              </div>
              <div className="text-[10px] font-mono" style={{ color: 'oklch(0.62 0.02 240)' }}>
                {isRTL ? 'المرحلة' : 'Stage'}: <span className="font-semibold" style={{ color: 'oklch(0.978 0.008 80)' }}>{summary.stage}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button onClick={() => { generatePDFReport(inputs, summary); toast.success('Opening print dialog…'); }}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-md border border-white/20 text-white/80 hover:bg-white/10 transition-all whitespace-nowrap">
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
                  className="flex-1 text-xs px-3 py-2 rounded-md border border-white/20 bg-white/10 text-white placeholder:text-white/40 outline-none focus:border-accent"
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
            <div key={m.label} className="rounded-md p-2 text-center" style={{ background: 'oklch(0.22 0.04 240)' }}>
              <div className="text-[9px] font-mono uppercase tracking-wider mb-0.5" style={{ color: 'oklch(0.45 0.04 240)' }}>{m.label}</div>
              <div className="text-sm font-bold metric-value" style={{ color: m.color || (m.warn ? '#EF4444' : 'oklch(0.978 0.008 80)') }}>{m.value}</div>
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
                <h3 className="text-sm font-semibold text-foreground" style={{ fontFamily: 'Playfair Display, serif' }}>{isRTL ? 'التقييم حسب الطريقة' : 'Valuation by Method'}</h3>
                <span className="text-[10px] text-muted-foreground font-mono">{isRTL ? 'القيم بالمليون $' : 'Values in $M'}</span>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 55 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.88 0.01 80)" vertical={false} />
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
              <h3 className="text-sm font-semibold text-foreground mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>
                {isRTL ? 'تفصيل الطرق' : 'Method Breakdown'} <span className="text-xs font-normal text-muted-foreground ml-1">— {isRTL ? 'اضغط للتوسيع' : 'tap to expand'}</span>
              </h3>
              <div className="space-y-2">
                {summary.results.map((r, i) => <MethodCard key={r.methodCode} result={r} index={i} />)}
              </div>
            </div>

            {/* ── Valuation Rationale ── */}
            <div className="border border-border rounded-xl overflow-hidden bg-card">
              <div className="px-4 py-3 border-b border-border" style={{ background: 'oklch(0.18 0.05 240)' }}>
                <h3 className="text-sm font-semibold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
                  {isRTL ? 'لماذا استخدمنا هذه الطرق' : 'Why These Methods Were Used'}
                </h3>
                <p className="text-[10px] mt-0.5" style={{ color: 'oklch(0.62 0.02 240)' }}>
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
                            <div className="mt-2 text-[10px] rounded-md px-3 py-2 border-l-2 text-muted-foreground italic" style={{ borderColor: color, background: 'oklch(0.97 0.003 80)' }}>
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
              <h3 className="text-sm font-semibold text-foreground mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>{isRTL ? 'بطاقة أداء الفريق والمنتج' : 'Team & Product Scorecard'}</h3>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="oklch(0.88 0.01 80)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fontFamily: 'DM Sans' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8 }} />
                  <Radar name="Score" dataKey="score" stroke="#C4614A" fill="#C4614A" fillOpacity={0.25} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Analyst Summary */}
            <div className="border border-border rounded-lg p-4 bg-card">
              <h3 className="text-sm font-semibold text-foreground mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>{isRTL ? 'ماذا يعني هذا بالنسبة لك' : 'What This Means For You'}</h3>
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

            {/* Disclaimer */}
            <div className="p-3 rounded-md bg-secondary/60 text-[10px] text-muted-foreground leading-relaxed">
              {isRTL ? <><strong>تنبيه:</strong> هذا التقييم لأغراض التخطيط والتعليم فقط. تعتمد التقييمات الفعلية على مفاوضات المستثمرين وظروف السوق والعناية الواجبة. استشر مستشاراً مالياً مؤهلاً قبل اتخاذ قرارات الاستثمار.</> : <><strong>Disclaimer:</strong> This valuation is for planning and educational purposes only. Actual valuations depend on investor negotiations, market conditions, and due diligence. Consult a qualified financial advisor before making investment decisions.</>}
            </div>

            {/* Start Over */}
            <button onClick={onReset} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-accent transition-colors">
              <RotateCcw className="w-3.5 h-3.5" />
              {isRTL ? 'بدء تقييم جديد' : 'Start a new valuation'}
            </button>
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
