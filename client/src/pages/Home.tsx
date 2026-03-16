/**
 * Home Page — AI Startup Valuation Calculator
 * Design: "Venture Capital Clarity" — Editorial Finance
 * Colors: Deep Navy (#0F1B2D) sidebar, Warm Cream (#FAF6EF) bg, Terracotta (#C4614A) accent
 * Typography: Playfair Display (headings), DM Sans (body), JetBrains Mono (numbers)
 *
 * Features:
 * - 7 valuation methods with live blended output
 * - PDF report generation
 * - Scenario save & comparison
 * - Dilution calculator
 * - 35+ sector verticals
 */

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  runValuation, defaultInputs, formatCurrency,
  SECTOR_MULTIPLES, SECTOR_OPTIONS, STAGE_MEDIAN_VALUATIONS,
  type StartupInputs, type ValuationSummary, type SavedScenario,
} from '@/lib/valuation';
import { generatePDFReport } from '@/lib/pdfReport';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import DilutionCalculator from '@/components/DilutionCalculator';
import ScenarioComparison from '@/components/ScenarioComparison';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';
import {
  Info, ChevronDown, ChevronRight, RefreshCw,
  TrendingUp, CheckCircle, Activity, DollarSign,
  BarChart2, Target, Layers, Zap, Shield, Globe,
  FileDown, BookmarkPlus, PieChart,
} from 'lucide-react';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';

// ─── Section Config ────────────────────────────────────────────────────────────

const INPUT_SECTIONS = [
  { id: 'company', label: 'Company Profile', icon: Globe, stamp: '01' },
  { id: 'financials', label: 'Financials', icon: DollarSign, stamp: '02' },
  { id: 'dcf', label: 'DCF Inputs', icon: TrendingUp, stamp: '03' },
  { id: 'scorecard', label: 'Scorecard', icon: Target, stamp: '04' },
  { id: 'berkus', label: 'Berkus Milestones', icon: CheckCircle, stamp: '05' },
  { id: 'vcmethod', label: 'VC Method', icon: Zap, stamp: '06' },
  { id: 'comps', label: 'Comparables', icon: BarChart2, stamp: '07' },
  { id: 'risk', label: 'Risk Factors', icon: Shield, stamp: '08' },
  { id: 'scenarios', label: 'Scenarios', icon: Layers, stamp: '09' },
];

const RESULT_TABS = [
  { id: 'results', label: 'Results', icon: BarChart2 },
  { id: 'scenarios', label: 'Scenarios', icon: BookmarkPlus },
  { id: 'dilution', label: 'Dilution', icon: PieChart },
];

const METHOD_COLORS = ['#C4614A', '#0F1B2D', '#8B4A38', '#2D4A6B', '#A0522D', '#1B3A5C', '#D4845A'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }

function InfoTip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help inline ml-1 opacity-60 hover:opacity-100 transition-opacity" />
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs leading-relaxed">{text}</TooltipContent>
    </Tooltip>
  );
}

function SectionHeader({ stamp, title, icon: Icon }: { stamp: string; title: string; icon: any }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="section-stamp">{stamp}</span>
      <div className="h-px flex-1 bg-border" />
      <Icon className="w-4 h-4 text-accent" />
      <span className="text-sm font-semibold text-foreground tracking-wide">{title}</span>
    </div>
  );
}

function InputField({ label, value, onChange, min = 0, max, step = 1, prefix = '', suffix = '', tooltip, type = 'number' }: {
  label: string; value: number | string; onChange: (v: any) => void;
  min?: number; max?: number; step?: number; prefix?: string; suffix?: string; tooltip?: string; type?: string;
}) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">
        {label}{tooltip && <InfoTip text={tooltip} />}
      </label>
      <div className="relative flex items-center">
        {prefix && <span className="absolute left-2.5 text-xs text-muted-foreground font-mono">{prefix}</span>}
        <input
          type={type}
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={e => onChange(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
          className={`vc-input w-full text-sm py-2 px-3 ${prefix ? 'pl-6' : ''} ${suffix ? 'pr-10' : ''} font-mono`}
        />
        {suffix && <span className="absolute right-2.5 text-xs text-muted-foreground font-mono">{suffix}</span>}
      </div>
    </div>
  );
}

function RiskSlider({ label, value, onChange, tooltip }: { label: string; value: number; onChange: (v: number) => void; tooltip?: string }) {
  const color = value > 0 ? '#10B981' : value < 0 ? '#C4614A' : '#6B7280';
  const labels = ['Very Negative', 'Negative', 'Neutral', 'Positive', 'Very Positive'];
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-medium text-muted-foreground">{label}{tooltip && <InfoTip text={tooltip} />}</label>
        <span className="text-xs font-mono font-semibold" style={{ color }}>
          {value > 0 ? '+' : ''}{value} ({labels[value + 2]})
        </span>
      </div>
      <Slider min={-2} max={2} step={1} value={[value]} onValueChange={([v]) => onChange(v)} className="w-full" />
      <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
        <span>−2</span><span>−1</span><span>0</span><span>+1</span><span>+2</span>
      </div>
    </div>
  );
}

function MetricCard({ label, value, sub, accent = false }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`rounded-md p-3 border ${accent ? 'bg-accent/10 border-accent/30' : 'bg-card border-border'}`}>
      <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1">{label}</div>
      <div className={`metric-value text-lg font-bold ${accent ? 'text-accent' : 'text-foreground'}`}>{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

function ValuationChart({ summary }: { summary: ValuationSummary }) {
  const data = summary.results.map((r, i) => ({
    name: r.method.replace('Discounted Cash Flow', 'DCF').replace('Comparable Transactions', 'Comps').replace('Risk-Factor Summation', 'Risk-Factor').replace('First Chicago Method', 'First Chicago').replace(' Method', '').trim(),
    value: Math.round(r.value / 1e6 * 100) / 100,
    applicability: r.applicability,
    color: METHOD_COLORS[i % METHOD_COLORS.length],
  }));
  const blendedM = Math.round(summary.blended / 1e6 * 100) / 100;
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground" style={{ fontFamily: 'Playfair Display, serif' }}>Valuation by Method</h3>
        <span className="text-[10px] text-muted-foreground font-mono">Values in $M</span>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.88 0.01 80)" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 10, fontFamily: 'DM Sans', fill: 'oklch(0.45 0.02 240)' }} angle={-35} textAnchor="end" interval={0} />
          <YAxis tick={{ fontSize: 10, fontFamily: 'JetBrains Mono', fill: 'oklch(0.45 0.02 240)' }} tickFormatter={v => `$${v}M`} />
          <RechartTooltip formatter={(v: any) => [`$${v}M`, 'Value']} contentStyle={{ fontSize: 11, fontFamily: 'DM Sans', borderRadius: 4, border: '1px solid oklch(0.88 0.01 80)' }} />
          <ReferenceLine y={blendedM} stroke="#C4614A" strokeDasharray="4 2" strokeWidth={1.5}
            label={{ value: `Blended $${blendedM}M`, fill: '#C4614A', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
          <Bar dataKey="value" radius={[3, 3, 0, 0]}>
            {data.map((entry, i) => <Cell key={i} fill={entry.color} opacity={0.85 + entry.applicability / 1000} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ScorecardRadar({ inputs }: { inputs: StartupInputs }) {
  const data = [
    { subject: 'Team', score: inputs.teamScore, fullMark: 100 },
    { subject: 'Market', score: inputs.marketScore, fullMark: 100 },
    { subject: 'Product', score: inputs.productScore, fullMark: 100 },
    { subject: 'Competition', score: inputs.competitiveScore, fullMark: 100 },
    { subject: 'Marketing', score: inputs.marketingScore, fullMark: 100 },
    { subject: 'Funding', score: inputs.fundingScore, fullMark: 100 },
  ];
  return (
    <div>
      <div className="text-xs font-semibold text-foreground mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>Scorecard Radar</div>
      <ResponsiveContainer width="100%" height={190}>
        <RadarChart data={data}>
          <PolarGrid stroke="oklch(0.88 0.01 80)" />
          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fontFamily: 'DM Sans', fill: 'oklch(0.45 0.02 240)' }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8 }} />
          <Radar name="Score" dataKey="score" stroke="#C4614A" fill="#C4614A" fillOpacity={0.25} strokeWidth={2} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

function MethodCard({ result, index }: { result: any; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const color = METHOD_COLORS[index % METHOD_COLORS.length];
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}
      className="border border-border rounded-md overflow-hidden bg-card">
      <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-secondary/50 transition-colors" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-sm font-semibold text-foreground">{result.method}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground font-mono">{result.applicability}% fit</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="metric-value text-base font-bold" style={{ color }}>{formatCurrency(result.value, true)}</span>
          {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="px-3 pb-3 border-t border-border">
              <p className="text-xs text-muted-foreground mt-2 mb-3 leading-relaxed">{result.description}</p>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] text-muted-foreground font-mono">Range:</span>
                <span className="text-xs font-mono text-foreground">{formatCurrency(result.low, true)} — {formatCurrency(result.high, true)}</span>
              </div>
              <div className="mb-3">
                <div className="flex justify-between text-[10px] text-muted-foreground mb-1"><span>Confidence</span><span className="font-mono">{result.confidence}%</span></div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${result.confidence}%`, backgroundColor: color }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1">
                {Object.entries(result.breakdown).map(([k, v]: [string, any]) => (
                  <div key={k} className="text-[10px]">
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

// ─── Grouped Sector Select ────────────────────────────────────────────────────

function SectorSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const groups = SECTOR_OPTIONS.reduce((acc, opt) => {
    if (!acc[opt.group]) acc[opt.group] = [];
    acc[opt.group].push(opt);
    return acc;
  }, {} as Record<string, typeof SECTOR_OPTIONS>);

  return (
    <div className="mb-3">
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">
        Sector
        <InfoTip text="Sector auto-populates comparable revenue multiples. 35+ verticals available." />
      </label>
      <select value={value} onChange={e => onChange(e.target.value)} className="vc-input w-full text-sm py-2 px-3">
        {Object.entries(groups).map(([group, opts]) => (
          <optgroup key={group} label={group}>
            {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </optgroup>
        ))}
      </select>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function Home() {
  const [inputs, setInputs] = useState<StartupInputs>(defaultInputs);
  const [activeSection, setActiveSection] = useState('company');
  const [activeResultTab, setActiveResultTab] = useState('results');
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>([]);
  const [scenarioName, setScenarioName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);

  const summary = useMemo(() => runValuation(inputs), [inputs]);

  const update = useCallback(<K extends keyof StartupInputs>(key: K, value: StartupInputs[K]) => {
    setInputs(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'sector') {
        const m = SECTOR_MULTIPLES[value as string] || SECTOR_MULTIPLES.saas;
        next.sectorMedianMultiple = m.median;
        next.publicCompsMultiple = m.public;
        next.privateCompsMultiple = m.private;
      }
      if (key === 'stage') {
        next.medianPreMoneyValuation = STAGE_MEDIAN_VALUATIONS[value as string] || 4000000;
      }
      return next;
    });
  }, []);

  const updateCF = (index: number, value: number) => {
    const cfs = [...inputs.projectedCashFlows];
    cfs[index] = value;
    setInputs(prev => ({ ...prev, projectedCashFlows: cfs }));
  };

  const handleSaveScenario = () => {
    const name = scenarioName.trim() || `Scenario ${savedScenarios.length + 1}`;
    const scenario: SavedScenario = {
      id: nanoid(),
      name,
      inputs: { ...inputs },
      summary,
      savedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };
    setSavedScenarios(prev => [...prev, scenario]);
    setScenarioName('');
    setShowNameInput(false);
    setActiveResultTab('scenarios');
    toast.success(`Scenario "${name}" saved!`);
  };

  const handleDeleteScenario = (id: string) => {
    setSavedScenarios(prev => prev.filter(s => s.id !== id));
    toast.success('Scenario removed');
  };

  const handleDownloadPDF = () => {
    generatePDFReport(inputs, summary);
    toast.success('Opening print dialog for PDF export…');
  };

  const riskLevel = summary.riskLevel;
  const riskColor = riskLevel === 'Low' ? '#10B981' : riskLevel === 'Moderate' ? '#F59E0B' : riskLevel === 'High' ? '#EF4444' : '#7C3AED';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'oklch(0.978 0.008 80)' }}>
      {/* ── Hero Header ── */}
      <header className="relative overflow-hidden" style={{ background: 'oklch(0.18 0.05 240)', minHeight: 180 }}>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `url(https://d2xsxph8kpxj0f.cloudfront.net/105753932/M2SxUioygz4pYLdarmBijQ/hero-bg-6NSfALEUoBoxyRfotDh8fm.webp)`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="relative container py-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <div className="section-stamp text-xs mb-2" style={{ color: 'oklch(0.55 0.13 30)' }}>Multi-Method Analysis Tool</div>
              <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
                AI Startup Valuation
              </h1>
              <p className="text-sm mt-2" style={{ color: 'oklch(0.72 0.02 240)' }}>
                7 industry-standard methods · 35+ sector verticals · Scenario comparison · Dilution modeling
              </p>
            </div>

            {/* Live Valuation Badge */}
            <motion.div key={Math.round(summary.blended / 1000)} initial={{ scale: 0.97, opacity: 0.8 }} animate={{ scale: 1, opacity: 1 }}
              className="rounded-lg p-4 border" style={{ background: 'oklch(0.22 0.05 240)', borderColor: 'oklch(0.55 0.13 30)', minWidth: 220 }}>
              <div className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: 'oklch(0.55 0.13 30)' }}>Blended Valuation</div>
              <div className="text-3xl font-bold metric-value" style={{ color: 'oklch(0.978 0.008 80)', fontFamily: 'JetBrains Mono, monospace' }}>
                {formatCurrency(summary.blended, true)}
              </div>
              <div className="text-[10px] font-mono mt-1" style={{ color: 'oklch(0.72 0.02 240)' }}>
                {formatCurrency(summary.weightedLow, true)} — {formatCurrency(summary.weightedHigh, true)}
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-[10px] mb-1" style={{ color: 'oklch(0.72 0.02 240)' }}>
                  <span>Confidence</span><span className="font-mono">{summary.confidenceScore}%</span>
                </div>
                <div className="h-1 rounded-full" style={{ background: 'oklch(0.28 0.04 240)' }}>
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${summary.confidenceScore}%`, background: 'oklch(0.55 0.13 30)' }} />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1.5 rounded border border-white/20 text-white/80 hover:bg-white/10 transition-all"
                >
                  <FileDown className="w-3 h-3" />
                  PDF Report
                </button>
                <button
                  onClick={() => setShowNameInput(v => !v)}
                  className="flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1.5 rounded border border-accent/50 text-accent hover:bg-accent/10 transition-all"
                >
                  <BookmarkPlus className="w-3 h-3" />
                  Save Scenario
                </button>
              </div>
              <AnimatePresence>
                {showNameInput && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-2">
                    <div className="flex gap-2">
                      <input
                        value={scenarioName}
                        onChange={e => setScenarioName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSaveScenario()}
                        placeholder="Scenario name…"
                        className="flex-1 text-[10px] px-2 py-1.5 rounded border border-white/20 bg-white/10 text-white placeholder:text-white/40 outline-none focus:border-accent"
                        autoFocus
                      />
                      <button onClick={handleSaveScenario} className="text-[10px] px-2.5 py-1.5 rounded bg-accent text-white font-medium hover:bg-accent/80 transition-colors">
                        Save
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </header>

      {/* ── Operational Metrics Strip ── */}
      <div className="border-b border-border bg-card">
        <div className="container py-3">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <MetricCard label="Stage" value={summary.stage} />
            <MetricCard label="Runway" value={`${summary.runway === 999 ? '∞' : summary.runway} mo`} sub="months of cash" />
            <MetricCard label="Burn Multiple" value={`${summary.burnMultiple}x`} sub="efficiency ratio" accent={summary.burnMultiple > 2} />
            <MetricCard label="ARR Multiple" value={`${summary.impliedARRMultiple}x`} sub="implied by blended" />
            <MetricCard label="Risk Level" value={riskLevel} sub="burn-based assessment" accent />
          </div>
        </div>
      </div>

      {/* ── Main Layout ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Left Sidebar ── */}
        <aside className="hidden lg:flex flex-col w-52 shrink-0 border-r border-border/30 py-4" style={{ background: 'oklch(0.18 0.05 240)' }}>
          <div className="px-4 mb-4">
            <div className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'oklch(0.45 0.04 240)' }}>Input Sections</div>
          </div>
          {INPUT_SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => { setActiveSection(s.id); document.getElementById(`section-${s.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
              className={`flex items-center gap-2.5 px-4 py-2.5 text-left text-xs transition-all ${activeSection === s.id ? 'border-l-2 border-accent text-white bg-white/5' : 'border-l-2 border-transparent hover:border-white/20 hover:bg-white/5'}`}
              style={{ color: activeSection === s.id ? 'oklch(0.978 0.008 80)' : 'oklch(0.62 0.02 240)' }}
            >
              <span className="font-mono text-[10px]" style={{ color: 'oklch(0.55 0.13 30)' }}>{s.stamp}</span>
              <s.icon className="w-3.5 h-3.5 shrink-0" />
              <span>{s.label}</span>
            </button>
          ))}
        </aside>

        {/* ── Input Panel ── */}
        <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 240px)' }}>
          <div className="container py-6 max-w-2xl">

            {/* 01 — Company Profile */}
            <div id="section-company" className="mb-6">
              <SectionHeader stamp="01" title="Company Profile" icon={Globe} />
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <InputField label="Company Name" value={inputs.companyName} onChange={v => update('companyName', v)} type="text" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Stage <InfoTip text="Funding stage affects method applicability weights and median valuations." />
                  </label>
                  <select value={inputs.stage} onChange={e => update('stage', e.target.value as any)} className="vc-input w-full text-sm py-2 px-3">
                    <option value="pre-seed">Pre-Seed</option>
                    <option value="seed">Seed</option>
                    <option value="series-a">Series A</option>
                    <option value="series-b">Series B</option>
                    <option value="growth">Growth</option>
                  </select>
                </div>
                <SectorSelect value={inputs.sector} onChange={v => update('sector', v)} />
              </div>
            </div>

            {/* 02 — Financials */}
            <div id="section-financials" className="mb-6">
              <SectionHeader stamp="02" title="Financials" icon={DollarSign} />
              <div className="grid grid-cols-2 gap-3">
                <InputField label="Current ARR" value={inputs.currentARR} onChange={v => update('currentARR', v)} prefix="$" step={10000} tooltip="Annual Recurring Revenue." />
                <InputField label="Revenue Growth Rate" value={inputs.revenueGrowthRate} onChange={v => update('revenueGrowthRate', v)} suffix="%" tooltip="Year-over-year ARR growth rate." />
                <InputField label="Gross Margin" value={inputs.grossMargin} onChange={v => update('grossMargin', v)} suffix="%" max={100} tooltip="Revenue minus COGS as % of revenue." />
                <InputField label="Monthly Burn Rate" value={inputs.burnRate} onChange={v => update('burnRate', v)} prefix="$" step={5000} tooltip="Net monthly cash outflow." />
                <InputField label="Cash on Hand" value={inputs.cashOnHand} onChange={v => update('cashOnHand', v)} prefix="$" step={100000} tooltip="Current cash and equivalents." />
                <InputField label="TAM ($)" value={inputs.totalAddressableMarket} onChange={v => update('totalAddressableMarket', v)} prefix="$" step={100000000} tooltip="Total Addressable Market." />
                <div className="col-span-2">
                  <InputField label="Projected Revenue (5Y)" value={inputs.projectedRevenue5Y} onChange={v => update('projectedRevenue5Y', v)} prefix="$" step={500000} tooltip="Annual revenue estimate in 5 years." />
                </div>
              </div>
            </div>

            {/* 03 — DCF */}
            <div id="section-dcf" className="mb-6">
              <SectionHeader stamp="03" title="DCF Inputs" icon={TrendingUp} />
              <div className="grid grid-cols-2 gap-3">
                <InputField label="Discount Rate (WACC)" value={inputs.discountRate} onChange={v => update('discountRate', v)} suffix="%" tooltip="Early-stage startups typically use 30–50%." />
                <InputField label="Terminal Growth Rate" value={inputs.terminalGrowthRate} onChange={v => update('terminalGrowthRate', v)} suffix="%" tooltip="Long-term sustainable growth rate (2–4%)." />
              </div>
              <div className="mt-2">
                <label className="block text-xs font-medium text-muted-foreground mb-2">
                  5-Year Projected Free Cash Flows
                  <InfoTip text="Projected FCF for each of the next 5 years. Negative values are fine." />
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {inputs.projectedCashFlows.map((cf, i) => (
                    <div key={i}>
                      <div className="text-[10px] text-muted-foreground font-mono mb-1 text-center">Y{i + 1}</div>
                      <input type="number" value={cf} step={50000} onChange={e => updateCF(i, parseFloat(e.target.value) || 0)} className="vc-input w-full text-xs py-1.5 px-2 font-mono text-center" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 04 — Scorecard */}
            <div id="section-scorecard" className="mb-6">
              <SectionHeader stamp="04" title="Scorecard Method" icon={Target} />
              <div className="mb-3 p-3 rounded-md bg-secondary/50 text-xs text-muted-foreground leading-relaxed">
                Rate each dimension 0–100 vs. a comparable startup. 100 = exceptional, 50 = average.
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <InputField label="Team Quality (30%)" value={inputs.teamScore} onChange={v => update('teamScore', clamp(v, 0, 100))} max={100} tooltip="Founder experience, domain expertise, execution track record." />
                <InputField label="Market Opportunity (25%)" value={inputs.marketScore} onChange={v => update('marketScore', clamp(v, 0, 100))} max={100} tooltip="Market size, growth rate, and timing." />
                <InputField label="Product / Technology (15%)" value={inputs.productScore} onChange={v => update('productScore', clamp(v, 0, 100))} max={100} tooltip="Product differentiation, IP, technical moat." />
                <InputField label="Competitive Environment (10%)" value={inputs.competitiveScore} onChange={v => update('competitiveScore', clamp(v, 0, 100))} max={100} tooltip="Number and strength of competitors." />
                <InputField label="Marketing & Sales (10%)" value={inputs.marketingScore} onChange={v => update('marketingScore', clamp(v, 0, 100))} max={100} tooltip="Go-to-market strategy and sales channel strength." />
                <InputField label="Funding Need (5%)" value={inputs.fundingScore} onChange={v => update('fundingScore', clamp(v, 0, 100))} max={100} tooltip="Efficiency of capital deployment." />
              </div>
              <InputField label="Median Pre-Money Valuation ($)" value={inputs.medianPreMoneyValuation} onChange={v => update('medianPreMoneyValuation', v)} prefix="$" step={100000} tooltip="Regional/sector median pre-money for comparable startups." />
              <ScorecardRadar inputs={inputs} />
            </div>

            {/* 05 — Berkus */}
            <div id="section-berkus" className="mb-6">
              <SectionHeader stamp="05" title="Berkus Milestones" icon={CheckCircle} />
              <div className="mb-3 p-3 rounded-md bg-secondary/50 text-xs text-muted-foreground leading-relaxed">
                Assign up to $500K per milestone achieved. Best for pre-revenue startups. Max: $2.5M.
              </div>
              <InputField label="Sound Idea (Reduces Basic Risk)" value={inputs.berkusSoundIdea} onChange={v => update('berkusSoundIdea', clamp(v, 0, 500000))} prefix="$" max={500000} step={25000} tooltip="Is the core idea validated?" />
              <InputField label="Prototype (Reduces Technology Risk)" value={inputs.berkusPrototype} onChange={v => update('berkusPrototype', clamp(v, 0, 500000))} prefix="$" max={500000} step={25000} tooltip="Is there a working prototype or MVP?" />
              <InputField label="Quality Management Team (Reduces Execution Risk)" value={inputs.berkusQualityTeam} onChange={v => update('berkusQualityTeam', clamp(v, 0, 500000))} prefix="$" max={500000} step={25000} tooltip="Does the team have the skills to execute?" />
              <InputField label="Strategic Relationships (Reduces Market Risk)" value={inputs.berkusStrategicRelationships} onChange={v => update('berkusStrategicRelationships', clamp(v, 0, 500000))} prefix="$" max={500000} step={25000} tooltip="Key partnerships, LOIs, or distribution agreements?" />
              <InputField label="Product Rollout / Sales (Reduces Production Risk)" value={inputs.berkusProductRollout} onChange={v => update('berkusProductRollout', clamp(v, 0, 500000))} prefix="$" max={500000} step={25000} tooltip="Is the product in market with paying customers?" />
            </div>

            {/* 06 — VC Method */}
            <div id="section-vcmethod" className="mb-6">
              <SectionHeader stamp="06" title="VC Method" icon={Zap} />
              <div className="grid grid-cols-2 gap-3">
                <InputField label="Target Return Multiple" value={inputs.targetReturn} onChange={v => update('targetReturn', v)} suffix="x" tooltip="The return multiple the VC expects (e.g., 10x)." />
                <InputField label="Exit Revenue Multiple" value={inputs.exitMultiple} onChange={v => update('exitMultiple', v)} suffix="x" tooltip="Expected revenue multiple at exit (e.g., 8x ARR)." />
                <InputField label="Years to Exit" value={inputs.yearsToExit} onChange={v => update('yearsToExit', v)} tooltip="Expected years until liquidity event." />
                <InputField label="Discount Rate" value={inputs.discountRate} onChange={v => update('discountRate', v)} suffix="%" tooltip="Same as WACC used in DCF." />
              </div>
            </div>

            {/* 07 — Comparables */}
            <div id="section-comps" className="mb-6">
              <SectionHeader stamp="07" title="Comparable Transactions" icon={BarChart2} />
              <div className="mb-2 text-xs text-muted-foreground">Sector auto-populates these values. Adjust based on your specific comparables.</div>
              <div className="grid grid-cols-3 gap-3">
                <InputField label="Sector Median Multiple" value={inputs.sectorMedianMultiple} onChange={v => update('sectorMedianMultiple', v)} suffix="x" tooltip="Median ARR multiple for your sector (40% weight)." />
                <InputField label="Public Comps Multiple" value={inputs.publicCompsMultiple} onChange={v => update('publicCompsMultiple', v)} suffix="x" tooltip="Public company revenue multiple (30% weight)." />
                <InputField label="Private Deal Multiple" value={inputs.privateCompsMultiple} onChange={v => update('privateCompsMultiple', v)} suffix="x" tooltip="Recent private transaction multiple (30% weight)." />
              </div>
            </div>

            {/* 08 — Risk Factors */}
            <div id="section-risk" className="mb-6">
              <SectionHeader stamp="08" title="Risk-Factor Summation" icon={Shield} />
              <div className="mb-3 p-3 rounded-md bg-secondary/50 text-xs text-muted-foreground leading-relaxed">
                Rate each factor: −2 (very negative) to +2 (very positive). Each unit = ±$250K adjustment.
              </div>
              <RiskSlider label="Management Team" value={inputs.riskManagement} onChange={v => update('riskManagement', v)} />
              <RiskSlider label="Stage of Business" value={inputs.riskStage} onChange={v => update('riskStage', v)} />
              <RiskSlider label="Legislation / Political Risk" value={inputs.riskLegislation} onChange={v => update('riskLegislation', v)} />
              <RiskSlider label="Manufacturing Risk" value={inputs.riskManufacturing} onChange={v => update('riskManufacturing', v)} />
              <RiskSlider label="Sales & Marketing Risk" value={inputs.riskSalesMarketing} onChange={v => update('riskSalesMarketing', v)} />
              <RiskSlider label="Funding / Capital Risk" value={inputs.riskFunding} onChange={v => update('riskFunding', v)} />
              <RiskSlider label="Competition Risk" value={inputs.riskCompetition} onChange={v => update('riskCompetition', v)} />
              <RiskSlider label="Technology Risk" value={inputs.riskTechnology} onChange={v => update('riskTechnology', v)} />
              <RiskSlider label="Litigation Risk" value={inputs.riskLitigation} onChange={v => update('riskLitigation', v)} />
              <RiskSlider label="International Risk" value={inputs.riskInternational} onChange={v => update('riskInternational', v)} />
              <RiskSlider label="Reputation Risk" value={inputs.riskReputation} onChange={v => update('riskReputation', v)} />
              <RiskSlider label="Lucrative Exit Potential" value={inputs.riskPotentialLucrative} onChange={v => update('riskPotentialLucrative', v)} />
            </div>

            {/* 09 — Scenarios */}
            <div id="section-scenarios" className="mb-6">
              <SectionHeader stamp="09" title="First Chicago Scenarios" icon={Layers} />
              <div className="mb-3 p-3 rounded-md bg-secondary/50 text-xs text-muted-foreground leading-relaxed">
                Define three exit scenarios. Probabilities are normalized automatically.
              </div>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="p-3 rounded-md border border-border bg-card">
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Bear Case</div>
                  <InputField label="Revenue ($)" value={inputs.bearCaseRevenue} onChange={v => update('bearCaseRevenue', v)} prefix="$" step={500000} />
                  <InputField label="Probability (%)" value={inputs.bearCaseProbability} onChange={v => update('bearCaseProbability', v)} suffix="%" max={100} />
                </div>
                <div className="p-3 rounded-md border border-accent/30 bg-accent/5">
                  <div className="text-[10px] font-semibold text-accent uppercase tracking-wider mb-2">Base Case</div>
                  <InputField label="Revenue ($)" value={inputs.baseCaseRevenue} onChange={v => update('baseCaseRevenue', v)} prefix="$" step={500000} />
                  <InputField label="Probability (%)" value={inputs.baseCaseProbability} onChange={v => update('baseCaseProbability', v)} suffix="%" max={100} />
                </div>
                <div className="p-3 rounded-md border border-border bg-card">
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Bull Case</div>
                  <InputField label="Revenue ($)" value={inputs.bullCaseRevenue} onChange={v => update('bullCaseRevenue', v)} prefix="$" step={500000} />
                  <InputField label="Probability (%)" value={inputs.bullCaseProbability} onChange={v => update('bullCaseProbability', v)} suffix="%" max={100} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <InputField label="Exit Multiple" value={inputs.scenarioExitMultiple} onChange={v => update('scenarioExitMultiple', v)} suffix="x" />
                <InputField label="Discount Rate" value={inputs.scenarioDiscountRate} onChange={v => update('scenarioDiscountRate', v)} suffix="%" />
                <InputField label="Years to Exit" value={inputs.scenarioYearsToExit} onChange={v => update('scenarioYearsToExit', v)} />
              </div>
            </div>

            {/* Reset */}
            <button onClick={() => setInputs(defaultInputs)} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-accent transition-colors mb-8">
              <RefreshCw className="w-3.5 h-3.5" />
              Reset to defaults
            </button>
          </div>
        </div>

        {/* ── Results Panel ── */}
        <div className="hidden xl:flex flex-col w-[500px] shrink-0 border-l border-border overflow-hidden" style={{ maxHeight: 'calc(100vh - 240px)', background: 'oklch(0.993 0.003 80)' }}>
          {/* Result Tab Bar */}
          <div className="flex border-b border-border bg-card shrink-0">
            {RESULT_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveResultTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium transition-all border-b-2 ${activeResultTab === tab.id ? 'border-accent text-accent' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
                {tab.id === 'scenarios' && savedScenarios.length > 0 && (
                  <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded-full bg-accent text-white font-mono">{savedScenarios.length}</span>
                )}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {activeResultTab === 'results' && (
              <div className="space-y-5">
                <ValuationChart summary={summary} />
                <div className="h-px bg-border" />
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold" style={{ fontFamily: 'Playfair Display, serif' }}>Method Breakdown</h3>
                    <span className="text-[10px] text-muted-foreground">Click to expand</span>
                  </div>
                  <div className="space-y-2">
                    {summary.results.map((r, i) => <MethodCard key={r.methodCode} result={r} index={i} />)}
                  </div>
                </div>
                {/* Analyst Notes */}
                <div className="p-4 rounded-md border border-border bg-card">
                  <h3 className="text-sm font-semibold mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>Analyst Notes</h3>
                  <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
                    <p><strong className="text-foreground">Blended Valuation:</strong> {formatCurrency(summary.blended, true)} — weighted by method applicability to {summary.stage} stage.</p>
                    <p><strong className="text-foreground">Runway:</strong> {summary.runway === 999 ? 'Profitable / no burn' : `${summary.runway} months`} at current burn rate.</p>
                    <p><strong className="text-foreground">Burn Multiple:</strong> {summary.burnMultiple}x — {summary.burnMultiple < 1 ? 'excellent capital efficiency' : summary.burnMultiple < 2 ? 'good efficiency' : summary.burnMultiple < 4 ? 'moderate — room for improvement' : 'high burn relative to growth'}.</p>
                    <p><strong className="text-foreground">Implied ARR Multiple:</strong> {summary.impliedARRMultiple}x — {summary.impliedARRMultiple > 20 ? 'premium growth-stage multiple' : summary.impliedARRMultiple > 10 ? 'strong SaaS multiple' : 'conservative / early-stage discount applied'}.</p>
                    <p><strong className="text-foreground">Risk Level:</strong> <span style={{ color: riskColor }}>{riskLevel}</span> — based on burn multiple and stage.</p>
                  </div>
                </div>
                <div className="p-3 rounded-md bg-secondary/50 text-[10px] text-muted-foreground leading-relaxed">
                  <strong>Disclaimer:</strong> Estimates for educational and planning purposes only. Consult a qualified financial advisor before making investment decisions.
                </div>
              </div>
            )}

            {activeResultTab === 'scenarios' && (
              <ScenarioComparison scenarios={savedScenarios} onDelete={handleDeleteScenario} />
            )}

            {activeResultTab === 'dilution' && (
              <DilutionCalculator />
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile Results ── */}
      <div className="xl:hidden border-t border-border bg-card p-4">
        <div className="flex gap-2 mb-4">
          {RESULT_TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveResultTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeResultTab === tab.id ? 'bg-accent text-white' : 'bg-secondary text-muted-foreground'}`}>
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
        {activeResultTab === 'results' && (
          <>
            <ValuationChart summary={summary} />
            <div className="mt-4 space-y-2">
              {summary.results.map((r, i) => <MethodCard key={r.methodCode} result={r} index={i} />)}
            </div>
          </>
        )}
        {activeResultTab === 'scenarios' && <ScenarioComparison scenarios={savedScenarios} onDelete={handleDeleteScenario} />}
        {activeResultTab === 'dilution' && <DilutionCalculator />}
        <div className="mt-4 p-3 rounded-md bg-secondary/50 text-[10px] text-muted-foreground leading-relaxed">
          <strong>Disclaimer:</strong> Estimates for planning purposes only. Consult a qualified financial advisor.
        </div>
      </div>
    </div>
  );
}
