/**
 * CoFounderEquitySplit — Equity split calculator based on 7 best-practice factors
 * Connected to the unified cap table (ZestEquity) as source of truth.
 * Reads founders from cap table, writes recommended shares back.
 */
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Users, Info, ChevronDown, ChevronUp, Link2, RefreshCw } from 'lucide-react';
import { nanoid } from 'nanoid';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCapTable } from '@/hooks/useCapTable';
import ToolGuide from '@/components/ToolGuide';
import type { CapTableShareholder } from '@shared/equity';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FounderFactors {
  ideaOrigin: number;       // 0-10
  commitment: number;       // 0-10
  domainExpertise: number;  // 0-10
  technicalContrib: number; // 0-10
  networkSales: number;     // 0-10
  priorExits: number;       // 0-10
  riskTolerance: number;    // 0-10
}

// Per-founder local factor scores (stored in component state, not DB)
// The actual shares are stored in the cap table
type FactorKey = keyof FounderFactors;

const FACTOR_WEIGHTS: Record<FactorKey, number> = {
  ideaOrigin: 0.10,
  commitment: 0.25,
  domainExpertise: 0.15,
  technicalContrib: 0.20,
  networkSales: 0.15,
  priorExits: 0.10,
  riskTolerance: 0.05,
};

interface FactorConfig {
  label: string;
  labelAr: string;
  weight: string;
  desc: string;
  descAr: string;
  low: string;
  mid: string;
  high: string;
}

const FACTOR_CONFIG: Record<FactorKey, FactorConfig> = {
  ideaOrigin: {
    label: 'Idea Origin', labelAr: 'أصل الفكرة', weight: '10%',
    desc: 'Who conceived the core business idea?', descAr: 'من صاحب الفكرة الأصلية للمشروع؟',
    low: 'Joined later', mid: 'Co-developed', high: 'Sole originator',
  },
  commitment: {
    label: 'Full-Time Commitment', labelAr: 'الالتزام بالدوام الكامل', weight: '25%',
    desc: 'How committed is this founder to the company?', descAr: 'ما مدى التزام هذا المؤسس بالشركة؟',
    low: 'Advisory only', mid: 'Transitioning', high: 'Full-time, day 1',
  },
  domainExpertise: {
    label: 'Domain Expertise', labelAr: 'الخبرة في المجال', weight: '15%',
    desc: 'Relevant industry knowledge and experience.', descAr: 'المعرفة والخبرة في هذا القطاع تحديداً.',
    low: 'No experience', mid: 'Adjacent field', high: '10+ years in space',
  },
  technicalContrib: {
    label: 'Technical / Product Contribution', labelAr: 'المساهمة التقنية / المنتج', weight: '20%',
    desc: 'Building the core product or technology.', descAr: 'بناء المنتج الأساسي أو التقنية.',
    low: 'Non-technical', mid: 'Partial build', high: 'Core builder',
  },
  networkSales: {
    label: 'Network & Sales Value', labelAr: 'قيمة الشبكة والمبيعات', weight: '15%',
    desc: 'Access to key customers, investors, or partners.', descAr: 'الوصول إلى عملاء أو مستثمرين أو شركاء رئيسيين.',
    low: 'No network', mid: 'Moderate reach', high: 'Direct access',
  },
  priorExits: {
    label: 'Startup Experience & Exits', labelAr: 'خبرة الشركات الناشئة والخروج', weight: '10%',
    desc: 'Previous startup experience and successful exits.', descAr: 'خبرة سابقة في الشركات الناشئة وعمليات الخروج.',
    low: 'First startup', mid: 'One exit / senior role', high: 'Multiple exits',
  },
  riskTolerance: {
    label: 'Financial Risk Taken', labelAr: 'المخاطرة المالية', weight: '5%',
    desc: 'Personal financial sacrifice made for the company.', descAr: 'التضحية المالية الشخصية من أجل الشركة.',
    low: 'No financial risk', mid: 'Moderate sacrifice', high: 'Quit job + savings',
  },
};

const FOUNDER_COLORS = [
  { main: '#6366F1', bg: '#EEF2FF', border: '#C7D2FE' },
  { main: '#8B5CF6', bg: '#F5F3FF', border: '#DDD6FE' },
  { main: '#EC4899', bg: '#FDF2F8', border: '#FBCFE8' },
  { main: '#10B981', bg: '#ECFDF5', border: '#A7F3D0' },
  { main: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
  { main: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE' },
];

const DEFAULT_FACTORS: FounderFactors = {
  ideaOrigin: 5, commitment: 8, domainExpertise: 5,
  technicalContrib: 5, networkSales: 5, priorExits: 3, riskTolerance: 5,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcWeightedScore(factors: FounderFactors): number {
  return Object.entries(FACTOR_WEIGHTS).reduce((sum, [key, weight]) => {
    return sum + (factors[key as FactorKey] * weight);
  }, 0);
}

function getScoreLabel(value: number, cfg: FactorConfig): string {
  if (value <= 3) return cfg.low;
  if (value <= 7) return cfg.mid;
  return cfg.high;
}

// ─── Factor Slider ────────────────────────────────────────────────────────────

function FactorSlider({
  factorKey, value, onChange, isRTL,
}: { factorKey: FactorKey; value: number; onChange: (v: number) => void; isRTL: boolean }) {
  const cfg = FACTOR_CONFIG[factorKey];
  const pct = value * 10;
  const color = value >= 7 ? '#10B981' : value >= 4 ? '#F59E0B' : '#EF4444';
  const label = isRTL ? cfg.labelAr : cfg.label;
  const desc = isRTL ? cfg.descAr : cfg.desc;
  const scoreLabel = getScoreLabel(value, cfg);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs font-semibold text-foreground truncate">{label}</span>
          <div className="relative group shrink-0">
            <Info className="w-3 h-3 text-muted-foreground/60 cursor-help" />
            <div className="absolute left-0 bottom-full mb-1.5 z-20 hidden group-hover:block bg-foreground text-background text-[10px] rounded-lg px-2.5 py-2 w-52 leading-relaxed shadow-xl">
              <p className="font-semibold mb-0.5">{label}</p>
              <p>{desc}</p>
              <p className="mt-1 opacity-60">Weight: {cfg.weight}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-muted-foreground italic">{scoreLabel}</span>
          <span className="text-xs font-bold tabular-nums" style={{ color }}>{value}/10</span>
        </div>
      </div>
      <div className="relative h-2 rounded-full bg-muted overflow-hidden">
        <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-200" style={{ width: `${pct}%`, background: color }} />
      </div>
      <input
        type="range" min={0} max={10} step={1} value={value}
        onChange={e => onChange(parseInt(e.target.value))}
        className="w-full h-1 opacity-0 absolute"
        style={{ marginTop: -12 }}
      />
      <input
        type="range" min={0} max={10} step={1} value={value}
        onChange={e => onChange(parseInt(e.target.value))}
        className="w-full accent-indigo-500"
      />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CoFounderEquitySplit() {
  const { lang } = useLanguage();
  const isRTL = lang === 'ar';
  const { state, isLoading, computed, setShareholders } = useCapTable();
  const [showVesting, setShowVesting] = useState(false);

  // Local factor scores per founder (keyed by founder ID)
  // These are scoring inputs only — actual shares live in the cap table
  const [factorMap, setFactorMap] = useState<Record<string, FounderFactors>>({});

  // Derive cap table data (safe even when state is null)
  const capState = state ?? null;
  const founders = capState?.shareholders.filter(s => s.type === 'founder') ?? [];
  const totalFounderShares = founders.reduce((sum, f) => sum + f.shares, 0);
  const totalSharesBasic = computed?.totalSharesBasic ?? 0;
  // Use fully-diluted shares for % display (includes ESOP pool)
  const totalSharesFullyDiluted = computed?.totalSharesFullyDiluted ?? totalSharesBasic;
  const esopPoolShares = capState?.esop.totalPoolShares ?? 0;
  const esopIssuedShares = capState?.esop.issuedShares ?? 0;
  const esopPct = totalSharesFullyDiluted > 0 ? (esopPoolShares / totalSharesFullyDiluted * 100).toFixed(1) : '0';

  // Get or initialize factor scores for a founder
  function getFactors(id: string): FounderFactors {
    return factorMap[id] ?? { ...DEFAULT_FACTORS };
  }

  // Compute recommended splits from factor scores — MUST be before any early return
  const splits = useMemo(() => {
    const scores = founders.map(f => ({
      id: f.id,
      name: f.name,
      score: calcWeightedScore(getFactors(f.id)),
    }));
    const total = scores.reduce((s, f) => s + f.score, 0);
    return scores.map(f => ({
      ...f,
      pct: total > 0 ? Math.round((f.score / total) * 1000) / 10 : 0,
    }));
  }, [founders, factorMap]);

  if (isLoading || !state) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  function updateFactor(id: string, factor: FactorKey, value: number) {
    setFactorMap(prev => ({
      ...prev,
      [id]: { ...(prev[id] ?? DEFAULT_FACTORS), [factor]: value },
    }));
  }

  // After early return guard above, state is guaranteed non-null
  const cs = state!;

  // Apply recommended split to cap table shares
  function applyRecommendedSplit() {
    const totalShares = totalFounderShares > 0 ? totalFounderShares : 9_000_000;
    const updated = cs.shareholders.map(sh => {
      if (sh.type !== 'founder') return sh;
      const split = splits.find(s => s.id === sh.id);
      if (!split) return sh;
      return { ...sh, shares: Math.round(totalShares * split.pct / 100) };
    });
    setShareholders(updated);
  }

  // Add a new founder to the cap table
  function addFounder() {
    if (founders.length >= 6) return;
    const COLORS = ['#4F6EF7', '#C4614A', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
    const newHolder: CapTableShareholder = {
      id: nanoid(),
      name: `Founder ${founders.length + 1}`,
      type: 'founder',
      shareClass: 'common',
      shares: 1_000_000,
      pricePerShare: 0,
      vestingMonths: 48,
      cliffMonths: 12,
      vestingStartDate: new Date().toISOString().split('T')[0],
      color: COLORS[founders.length % COLORS.length],
    };
    setShareholders([...cs.shareholders, newHolder]);
  }

  function removeFounder(id: string) {
    if (founders.length <= 1) return;
    setShareholders(cs.shareholders.filter(s => s.id !== id));
  }

  function updateFounderName(id: string, name: string) {
    setShareholders(cs.shareholders.map(s => s.id === id ? { ...s, name } : s));
  }

  const pieData = splits.map((s, i) => ({
    name: founders.find(f => f.id === s.id)?.name || s.name,
    value: s.pct,
    color: FOUNDER_COLORS[i % FOUNDER_COLORS.length].main,
  }));

  return (
    <div className={`space-y-5 ${isRTL ? 'rtl' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Education panel */}
      <ToolGuide
        toolName="Co-Founder Equity Split"
        tagline="Use a 7-factor weighted scoring model to recommend a fair equity split among co-founders."
        steps={[
          { step: 1, title: 'Add your founders', description: 'Click "Add Founder" to add each co-founder. Names sync with the cap table — any changes here update Zest Equity automatically.' },
          { step: 2, title: 'Score each factor', description: 'For each founder, rate them 0–10 on 7 factors: Idea Origin, Full-Time Commitment, Domain Expertise, Technical Contribution, Network/Sales, Prior Exits, and Financial Risk. Hover the info icon to understand each factor.' },
          { step: 3, title: 'Review the recommended split', description: 'The calculator weights your scores (Commitment carries 25%, Technical 20%, etc.) and shows a recommended equity % for each founder in the pie chart.' },
          { step: 4, title: 'Apply to cap table', description: 'Click "Apply Recommended Split to Cap Table" to update each founder\'s share count in Zest Equity proportionally. The total founder shares remain the same — only the distribution changes.' },
          { step: 5, title: 'Discuss with your co-founders', description: 'Use this as a structured conversation tool, not a final answer. The best splits come from open discussion using these scores as a starting point.' },
        ]}
        concepts={[
          { term: 'Weighted score', definition: 'Each factor has a preset weight (e.g. Commitment = 25%). Your 0–10 rating is multiplied by the weight to produce a contribution score.' },
          { term: 'Proportional split', definition: 'Each founder\'s recommended % = their score / total team score. A score of 7 out of a team total of 20 = 35%.' },
          { term: 'Dynamic equity', definition: 'Some teams use a dynamic model where equity is re-calculated quarterly based on ongoing contribution. This tool supports that by letting you re-score at any time.' },
        ]}
        tip="The biggest predictor of co-founder disputes is unequal commitment, not unequal ideas. Weight the Commitment factor honestly. A founder who joins full-time on day 1 and takes no salary is contributing far more than one who keeps their job."
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground mb-1">
            {isRTL ? 'توزيع حصص المؤسسين' : 'Co-Founder Equity Split'}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {isRTL
              ? 'قيّم كل مؤسس عبر 7 عوامل أساسية. تحسب الأداة توزيعاً عادلاً مرجّحاً بناءً على مساهمة كل شخص.'
              : 'Rate each founder across 7 key factors. The calculator recommends a fair, weighted split based on each person\'s actual contribution.'}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-2 py-1 rounded-full shrink-0">
          <Link2 className="w-3 h-3" />
          <span>Synced with Cap Table</span>
        </div>
      </div>

      {/* Results Summary */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/20 flex items-center justify-between">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            {isRTL ? 'التوزيع الموصى به' : 'Recommended Split'}
          </h3>
          <button
            onClick={applyRecommendedSplit}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            Apply to Cap Table
          </button>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            {/* Pie Chart */}
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%" cy="50%"
                    innerRadius={50} outerRadius={85}
                    paddingAngle={3} dataKey="value"
                    strokeWidth={2} stroke="hsl(var(--background))"
                  >
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => [`${v}%`, isRTL ? 'الحصة' : 'Equity']}
                    contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid hsl(var(--border))' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Split Bars */}
            <div className="space-y-3">
              {splits.map((s, i) => {
                const founder = founders.find(f => f.id === s.id);
                const colors = FOUNDER_COLORS[i % FOUNDER_COLORS.length];
                const currentSharePct = totalSharesFullyDiluted > 0 && founder
                  ? ((founder.shares / totalSharesFullyDiluted) * 100).toFixed(1)
                  : '0';
                return (
                  <div key={s.id}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: colors.main }} />
                        <span className="text-xs font-semibold text-foreground">{founder?.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground">Current: {currentSharePct}%</span>
                        <span className="text-sm font-bold" style={{ color: colors.main }}>→ {s.pct}%</span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: colors.main }}
                        initial={{ width: 0 }}
                        animate={{ width: `${s.pct}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                      />
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {isRTL ? `النقاط: ${s.score.toFixed(1)}/10` : `Score: ${s.score.toFixed(1)}/10`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ESOP Pool row in split summary */}
          {esopPoolShares > 0 && (
            <div className="mt-3 flex items-center justify-between px-3 py-2 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
                <span className="text-xs font-semibold text-purple-800 dark:text-purple-300">ESOP Pool</span>
                <span className="text-[10px] text-purple-600 dark:text-purple-400">{esopIssuedShares.toLocaleString()} / {esopPoolShares.toLocaleString()} shares issued</span>
              </div>
              <span className="text-sm font-bold text-purple-700 dark:text-purple-400">{esopPct}% (fully diluted)</span>
            </div>
          )}

          {/* Best practice note */}
          <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80">
            <div className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-1">
              {isRTL ? '💡 نصيحة مهمة' : '💡 Best Practice'}
            </div>
            <div className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
              {isRTL
                ? 'تُظهر الأبحاث أن التوزيع المتساوي (50/50) كثيراً ما يؤدي إلى نزاعات. فارق بسيط (مثل 55/45) مع تعريف واضح للأدوار وجداول استحقاق يُنتج نتائج أفضل. يجب أن تخضع جميع الحصص لـ جدول استحقاق 4 سنوات مع فترة انتظار سنة.'
                : 'Research shows equal splits (50/50) often lead to co-founder conflicts. A slight imbalance (e.g., 55/45) with clear role definitions and vesting schedules tends to produce better outcomes. All splits should be subject to a 4-year vesting schedule with a 1-year cliff.'}
            </div>
          </div>
        </div>
      </div>

      {/* Founder Cards */}
      <div className="space-y-4">
        {founders.map((founder, fi) => {
          const colors = FOUNDER_COLORS[fi % FOUNDER_COLORS.length];
          const split = splits.find(s => s.id === founder.id);
          const factors = getFactors(founder.id);
          return (
            <motion.div
              key={founder.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: fi * 0.05 }}
              className="rounded-xl border border-border bg-card overflow-hidden"
            >
              {/* Founder Header */}
              <div
                className="flex items-center justify-between px-4 py-3 border-b border-border"
                style={{ background: colors.bg, borderBottomColor: colors.border }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm"
                    style={{ background: colors.main }}
                  >
                    {fi + 1}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <input
                      value={founder.name}
                      onChange={e => updateFounderName(founder.id, e.target.value)}
                      className="text-sm font-bold bg-transparent border-0 border-b border-dashed focus:outline-none focus:border-current text-foreground w-32"
                      style={{ borderColor: `${colors.main}40` }}
                      placeholder="Name"
                    />
                    <div className="text-xs text-muted-foreground">{founder.shares.toLocaleString()} shares</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-2xl font-bold leading-none" style={{ color: colors.main }}>
                      {split?.pct ?? 0}%
                    </div>
                    <div className="text-[9px] text-muted-foreground mt-0.5">
                      {isRTL ? 'الحصة المقترحة' : 'recommended'}
                    </div>
                  </div>
                  {founders.length > 1 && (
                    <button
                      onClick={() => removeFounder(founder.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Factor Sliders */}
              <div className="p-4">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
                  {isRTL ? 'عوامل التقييم' : 'Contribution Factors'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                  {(Object.keys(FACTOR_CONFIG) as FactorKey[]).map(key => (
                    <FactorSlider
                      key={key}
                      factorKey={key}
                      value={factors[key]}
                      onChange={v => updateFactor(founder.id, key, v)}
                      isRTL={isRTL}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Add Founder Button */}
      {founders.length < 6 && (
        <button
          onClick={addFounder}
          className="flex items-center gap-2 w-full py-3 border-2 border-dashed border-border rounded-xl text-sm text-muted-foreground hover:border-indigo-400 hover:text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:bg-indigo-950/30/50 transition-all justify-center"
        >
          <Plus className="w-4 h-4" />
          {isRTL ? 'إضافة مؤسس مشارك' : 'Add Co-Founder'}
        </button>
      )}

      {/* Vesting Schedule */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <button
          onClick={() => setShowVesting(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-foreground hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            </div>
            {isRTL ? 'جدول الاستحقاق الموصى به' : 'Recommended Vesting Schedule'}
          </div>
          {showVesting ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
        <AnimatePresence>
          {showVesting && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-4 border-t border-border space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: isRTL ? 'مدة الاستحقاق' : 'Vesting Period', value: isRTL ? '4 سنوات' : '4 years', note: isRTL ? 'المعيار الصناعي' : 'Industry standard' },
                    { label: isRTL ? 'فترة الانتظار' : 'Cliff Period', value: isRTL ? 'سنة واحدة' : '1 year', note: isRTL ? 'لا شيء قبل الشهر 12' : 'Nothing before month 12' },
                    { label: isRTL ? 'بعد الانتظار' : 'After Cliff', value: isRTL ? '25% تستحق' : '25% vests', note: isRTL ? 'ثم شهرياً' : 'Then monthly' },
                    { label: isRTL ? 'المعدل الشهري' : 'Monthly Rate', value: '2.08%', note: isRTL ? '1/48 شهرياً' : '1/48th per month' },
                  ].map(item => (
                    <div key={item.label} className="text-center p-3 rounded-lg bg-muted/40 border border-border">
                      <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">{item.label}</div>
                      <div className="text-sm font-bold text-foreground">{item.value}</div>
                      <div className="text-[9px] text-muted-foreground mt-0.5">{item.note}</div>
                    </div>
                  ))}
                </div>
                <div className="p-3 rounded-lg bg-muted/30 text-xs text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">
                    {isRTL ? 'التسريع المزدوج:' : 'Double-trigger acceleration:'}
                  </strong>{' '}
                  {isRTL
                    ? 'إذا تم الاستحواذ على الشركة وأُنهي عقد المؤسس قسراً، يجب أن تستحق جميع الأسهم غير المستحقة فوراً.'
                    : 'If the company is acquired AND a founder is involuntarily terminated, all unvested shares should immediately vest. Always include this clause in your founders\' agreement.'}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
