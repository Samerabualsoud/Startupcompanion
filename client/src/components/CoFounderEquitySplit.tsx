/**
 * CoFounderEquitySplit — Equity split calculator based on 7 best-practice factors
 * Redesigned: clearer wording, improved visual hierarchy, enhanced factor sliders
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Users, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { nanoid } from 'nanoid';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useLanguage } from '@/contexts/LanguageContext';

interface FounderFactors {
  ideaOrigin: number;       // 0-10
  commitment: number;       // 0-10
  domainExpertise: number;  // 0-10
  technicalContrib: number; // 0-10
  networkSales: number;     // 0-10
  priorExits: number;       // 0-10
  riskTolerance: number;    // 0-10
}

interface Founder {
  id: string;
  name: string;
  role: string;
  factors: FounderFactors;
}

const FACTOR_WEIGHTS = {
  ideaOrigin: 0.10,
  commitment: 0.25,
  domainExpertise: 0.15,
  technicalContrib: 0.20,
  networkSales: 0.15,
  priorExits: 0.10,
  riskTolerance: 0.05,
};

type FactorKey = keyof FounderFactors;

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
    label: 'Idea Origin',
    labelAr: 'أصل الفكرة',
    weight: '10%',
    desc: 'Who conceived the core business idea?',
    descAr: 'من صاحب الفكرة الأصلية للمشروع؟',
    low: 'Joined later',
    mid: 'Co-developed',
    high: 'Sole originator',
  },
  commitment: {
    label: 'Full-Time Commitment',
    labelAr: 'الالتزام بالدوام الكامل',
    weight: '25%',
    desc: 'How committed is this founder to the company?',
    descAr: 'ما مدى التزام هذا المؤسس بالشركة؟',
    low: 'Advisory only',
    mid: 'Transitioning',
    high: 'Full-time, day 1',
  },
  domainExpertise: {
    label: 'Domain Expertise',
    labelAr: 'الخبرة في المجال',
    weight: '15%',
    desc: 'Relevant industry knowledge and experience.',
    descAr: 'المعرفة والخبرة في هذا القطاع تحديداً.',
    low: 'No experience',
    mid: 'Adjacent field',
    high: '10+ years in space',
  },
  technicalContrib: {
    label: 'Technical / Product Contribution',
    labelAr: 'المساهمة التقنية / المنتج',
    weight: '20%',
    desc: 'Building the core product or technology.',
    descAr: 'بناء المنتج الأساسي أو التقنية.',
    low: 'Non-technical',
    mid: 'Partial build',
    high: 'Core builder',
  },
  networkSales: {
    label: 'Network & Sales Value',
    labelAr: 'قيمة الشبكة والمبيعات',
    weight: '15%',
    desc: 'Access to key customers, investors, or partners.',
    descAr: 'الوصول إلى عملاء أو مستثمرين أو شركاء رئيسيين.',
    low: 'No network',
    mid: 'Moderate reach',
    high: 'Direct access',
  },
  priorExits: {
    label: 'Startup Experience & Exits',
    labelAr: 'خبرة الشركات الناشئة والخروج',
    weight: '10%',
    desc: 'Previous startup experience and successful exits.',
    descAr: 'خبرة سابقة في الشركات الناشئة وعمليات الخروج.',
    low: 'First startup',
    mid: 'One exit / senior role',
    high: 'Multiple exits',
  },
  riskTolerance: {
    label: 'Financial Risk Taken',
    labelAr: 'المخاطرة المالية',
    weight: '5%',
    desc: 'Personal financial sacrifice made for the company.',
    descAr: 'التضحية المالية الشخصية من أجل الشركة.',
    low: 'No financial risk',
    mid: 'Moderate sacrifice',
    high: 'Quit job + savings',
  },
};

const FOUNDER_COLORS = [
  { main: '#6366F1', bg: '#EEF2FF', border: '#C7D2FE' },  // indigo
  { main: '#8B5CF6', bg: '#F5F3FF', border: '#DDD6FE' },  // violet
  { main: '#EC4899', bg: '#FDF2F8', border: '#FBCFE8' },  // pink
  { main: '#10B981', bg: '#ECFDF5', border: '#A7F3D0' },  // emerald
  { main: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },  // amber
  { main: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE' },  // blue
];

const DEFAULT_FOUNDERS: Founder[] = [
  {
    id: nanoid(),
    name: 'Founder 1',
    role: 'CEO / Product',
    factors: { ideaOrigin: 8, commitment: 10, domainExpertise: 7, technicalContrib: 5, networkSales: 7, priorExits: 5, riskTolerance: 8 },
  },
  {
    id: nanoid(),
    name: 'Founder 2',
    role: 'CTO / Engineering',
    factors: { ideaOrigin: 5, commitment: 10, domainExpertise: 8, technicalContrib: 10, networkSales: 4, priorExits: 3, riskTolerance: 7 },
  },
];

function calcWeightedScore(factors: FounderFactors): number {
  return Object.entries(FACTOR_WEIGHTS).reduce((sum, [key, weight]) => {
    return sum + (factors[key as FactorKey] * weight);
  }, 0);
}

function calcSplits(founders: Founder[]): { id: string; name: string; score: number; pct: number }[] {
  const scores = founders.map(f => ({ id: f.id, name: f.name, score: calcWeightedScore(f.factors) }));
  const total = scores.reduce((s, f) => s + f.score, 0);
  return scores.map(f => ({ ...f, pct: total > 0 ? Math.round((f.score / total) * 1000) / 10 : 0 }));
}

function getScoreLabel(value: number, cfg: FactorConfig): string {
  if (value <= 3) return cfg.low;
  if (value <= 7) return cfg.mid;
  return cfg.high;
}

function FactorSlider({
  factorKey,
  value,
  onChange,
  isRTL,
}: {
  factorKey: FactorKey;
  value: number;
  onChange: (v: number) => void;
  isRTL: boolean;
}) {
  const cfg = FACTOR_CONFIG[factorKey];
  const pct = value * 10;
  const color = value >= 7 ? '#10B981' : value >= 4 ? '#F59E0B' : '#EF4444';
  const bgColor = value >= 7 ? '#ECFDF5' : value >= 4 ? '#FFFBEB' : '#FEF2F2';
  const label = isRTL ? cfg.labelAr : cfg.label;
  const desc = isRTL ? cfg.descAr : cfg.desc;
  const scoreLabel = getScoreLabel(value, cfg);

  return (
    <div className="space-y-2">
      {/* Label row */}
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
          <span className="text-[9px] text-muted-foreground/50 font-mono shrink-0">{cfg.weight}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded-md"
            style={{ background: bgColor, color }}
          >
            {scoreLabel}
          </span>
          <span className="text-xs font-bold tabular-nums" style={{ color }}>{value}/10</span>
        </div>
      </div>
      {/* Slider */}
      <div className="relative">
        <input
          type="range"
          min={0}
          max={10}
          step={1}
          value={value}
          onChange={e => onChange(parseInt(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer focus:outline-none"
          style={{
            background: `linear-gradient(to right, ${color} ${pct}%, hsl(var(--muted)) ${pct}%)`,
          }}
        />
        {/* Tick marks */}
        <div className="flex justify-between mt-0.5 px-0.5">
          {[0, 2, 4, 6, 8, 10].map(tick => (
            <div key={tick} className="flex flex-col items-center">
              <div className={`w-0.5 h-1 rounded-full ${value >= tick ? 'opacity-0' : 'bg-muted-foreground/20'}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CoFounderEquitySplit() {
  const { lang } = useLanguage();
  const isRTL = lang === 'ar';
  const [founders, setFounders] = useState<Founder[]>(DEFAULT_FOUNDERS);
  const [showVesting, setShowVesting] = useState(false);

  const splits = useMemo(() => calcSplits(founders), [founders]);

  const addFounder = () => {
    if (founders.length >= 6) return;
    setFounders(prev => [...prev, {
      id: nanoid(),
      name: `Founder ${prev.length + 1}`,
      role: 'Co-Founder',
      factors: { ideaOrigin: 5, commitment: 8, domainExpertise: 5, technicalContrib: 5, networkSales: 5, priorExits: 3, riskTolerance: 5 },
    }]);
  };

  const removeFounder = (id: string) => {
    if (founders.length <= 2) return;
    setFounders(prev => prev.filter(f => f.id !== id));
  };

  const updateFounder = (id: string, field: keyof Founder, value: any) => {
    setFounders(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  const updateFactor = (id: string, factor: FactorKey, value: number) => {
    setFounders(prev => prev.map(f => f.id === id ? { ...f, factors: { ...f.factors, [factor]: value } } : f));
  };

  const pieData = splits.map((s, i) => ({
    name: founders.find(f => f.id === s.id)?.name || s.name,
    value: s.pct,
    color: FOUNDER_COLORS[i % FOUNDER_COLORS.length].main,
  }));

  return (
    <div className={`space-y-5 ${isRTL ? 'rtl' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
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

      {/* Results Summary */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/20">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            {isRTL ? 'التوزيع الموصى به' : 'Recommended Split'}
          </h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            {/* Pie Chart */}
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={2}
                    stroke="hsl(var(--background))"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: any) => [`${v}%`, isRTL ? 'الحصة' : 'Equity']}
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
                return (
                  <div key={s.id}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: colors.main }} />
                        <span className="text-xs font-semibold text-foreground">{founder?.name}</span>
                        <span className="text-[10px] text-muted-foreground">{founder?.role}</span>
                      </div>
                      <span className="text-sm font-bold" style={{ color: colors.main }}>{s.pct}%</span>
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

          {/* Best practice note */}
          <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200/80">
            <div className="text-xs font-bold text-amber-800 mb-1">
              {isRTL ? '💡 نصيحة مهمة' : '💡 Best Practice'}
            </div>
            <div className="text-xs text-amber-700 leading-relaxed">
              {isRTL
                ? 'تُظهر الأبحاث أن التوزيع المتساوي (50/50) كثيراً ما يؤدي إلى نزاعات. فارق بسيط (مثل 55/45) مع تعريف واضح للأدوار وجداول استحقاق يُنتج نتائج أفضل. يجب أن تخضع جميع الحصص لـ <strong>جدول استحقاق 4 سنوات مع فترة انتظار سنة</strong>.'
                : 'Research shows equal splits (50/50) often lead to co-founder conflicts. A slight imbalance (e.g., 55/45) with clear role definitions and vesting schedules tends to produce better outcomes. All splits should be subject to a <strong>4-year vesting schedule with a 1-year cliff</strong>.'}
            </div>
          </div>
        </div>
      </div>

      {/* Founder Cards */}
      <div className="space-y-4">
        {founders.map((founder, fi) => {
          const colors = FOUNDER_COLORS[fi % FOUNDER_COLORS.length];
          const split = splits.find(s => s.id === founder.id);
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
                  {/* Avatar */}
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm"
                    style={{ background: colors.main }}
                  >
                    {fi + 1}
                  </div>
                  {/* Name + Role inputs */}
                  <div className="flex flex-col gap-0.5">
                    <input
                      value={founder.name}
                      onChange={e => updateFounder(founder.id, 'name', e.target.value)}
                      className="text-sm font-bold bg-transparent border-0 border-b border-dashed focus:outline-none focus:border-current text-foreground w-28"
                      style={{ borderColor: `${colors.main}40` }}
                      placeholder="Name"
                    />
                    <input
                      value={founder.role}
                      onChange={e => updateFounder(founder.id, 'role', e.target.value)}
                      className="text-xs bg-transparent border-0 border-b border-dashed focus:outline-none focus:border-current text-muted-foreground w-32"
                      style={{ borderColor: `${colors.main}30` }}
                      placeholder="Role (e.g. CEO)"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Equity badge */}
                  <div className="text-right">
                    <div
                      className="text-2xl font-bold leading-none"
                      style={{ color: colors.main }}
                    >
                      {split?.pct ?? 0}%
                    </div>
                    <div className="text-[9px] text-muted-foreground mt-0.5">
                      {isRTL ? 'الحصة المقترحة' : 'recommended'}
                    </div>
                  </div>
                  {founders.length > 2 && (
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
                      value={founder.factors[key]}
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
          className="flex items-center gap-2 w-full py-3 border-2 border-dashed border-border rounded-xl text-sm text-muted-foreground hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all justify-center"
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
            <div className="w-6 h-6 rounded-md bg-indigo-100 flex items-center justify-center">
              <Users className="w-3.5 h-3.5 text-indigo-600" />
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
                    ? 'إذا تم الاستحواذ على الشركة وأُنهي عقد المؤسس قسراً، يجب أن تستحق جميع الأسهم غير المستحقة فوراً. أدرج هذا البند دائماً في اتفاقية المؤسسين.'
                    : 'If the company is acquired AND a founder is involuntarily terminated, all unvested shares should immediately vest. Always include this clause in your founders\' agreement.'}
                </div>
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-700 leading-relaxed">
                  <strong>
                    {isRTL ? 'الاستحقاق العكسي للمؤسسين الحاليين:' : 'Reverse vesting for existing founders:'}
                  </strong>{' '}
                  {isRTL
                    ? 'إذا أضفت مؤسساً مشاركاً جديداً بعد تأسيس الشركة، فكّر في منحه جدول استحقاق جديد لمدة 4 سنوات. قد يرغب المؤسسون الحاليون في "إعادة الاستحقاق" لإظهار الالتزام للمستثمرين الجدد.'
                    : 'If you\'re adding a new co-founder after the company already exists, consider giving them a fresh 4-year vest on their shares. Existing founders may want to "re-vest" to show commitment to new investors.'}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
