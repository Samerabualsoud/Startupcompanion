/**
 * RunwayOptimizer — Burn rate analysis and runway extension calculator
 * Rebuilt: modern design, cash flow timeline, runway gauge, profile pre-fill
 */

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingDown, AlertTriangle, CheckCircle, Clock, Plus, Trash2,
  Zap, DollarSign, Target, BarChart3, ChevronDown, ChevronUp,
  ArrowRight, Flame, Droplets, Info
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartTooltip, ResponsiveContainer, ReferenceLine, Cell, Legend,
} from 'recharts';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStartup } from '@/contexts/StartupContext';

interface BurnCategory {
  id: string;
  name: string;
  nameAr: string;
  monthly: number;
  cuttable: number;
  icon: string;
  color: string;
}

const DEFAULT_CATEGORIES: BurnCategory[] = [
  { id: 'salaries',  name: 'Salaries & Benefits',    nameAr: 'الرواتب والمزايا',       monthly: 80000, cuttable: 15, icon: '👥', color: '#6366F1' },
  { id: 'cloud',     name: 'Cloud & Infrastructure', nameAr: 'البنية التحتية السحابية', monthly: 12000, cuttable: 30, icon: '☁️', color: '#8B5CF6' },
  { id: 'marketing', name: 'Marketing & Ads',        nameAr: 'التسويق والإعلانات',      monthly: 15000, cuttable: 70, icon: '📣', color: '#EC4899' },
  { id: 'office',    name: 'Office & Facilities',    nameAr: 'المكتب والمرافق',         monthly: 8000,  cuttable: 80, icon: '🏢', color: '#F59E0B' },
  { id: 'tools',     name: 'Software & Tools',       nameAr: 'البرمجيات والأدوات',      monthly: 5000,  cuttable: 50, icon: '🛠️', color: '#10B981' },
  { id: 'legal',     name: 'Legal & Compliance',     nameAr: 'القانونية والامتثال',      monthly: 4000,  cuttable: 40, icon: '⚖️', color: '#14B8A6' },
  { id: 'travel',    name: 'Travel & Entertainment', nameAr: 'السفر والترفيه',           monthly: 6000,  cuttable: 90, icon: '✈️', color: '#F97316' },
  { id: 'other',     name: 'Other Expenses',         nameAr: 'مصاريف أخرى',             monthly: 10000, cuttable: 50, icon: '📦', color: '#94A3B8' },
];

function fmt(n: number): string {
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function getRunwayStatus(months: number): { label: string; color: string; bg: string; border: string; emoji: string } {
  if (months >= 24) return { label: 'Healthy', color: '#10B981', bg: 'bg-emerald-50', border: 'border-emerald-200', emoji: '✅' };
  if (months >= 18) return { label: 'Comfortable', color: '#F59E0B', bg: 'bg-amber-50', border: 'border-amber-200', emoji: '🟡' };
  if (months >= 12) return { label: 'Tight', color: '#EF4444', bg: 'bg-red-50', border: 'border-red-200', emoji: '🔴' };
  return { label: 'Critical', color: '#DC2626', bg: 'bg-red-100', border: 'border-red-300', emoji: '🚨' };
}

// Runway gauge arc SVG
function RunwayGauge({ months, maxMonths = 36 }: { months: number; maxMonths?: number }) {
  const pct = Math.min(1, months / maxMonths);
  const angle = pct * 180;
  const r = 60;
  const cx = 80;
  const cy = 80;
  const toRad = (deg: number) => (deg - 180) * (Math.PI / 180);
  const x = cx + r * Math.cos(toRad(angle));
  const y = cy + r * Math.sin(toRad(angle));
  const color = months >= 24 ? '#10B981' : months >= 18 ? '#F59E0B' : months >= 12 ? '#EF4444' : '#DC2626';

  return (
    <svg width="160" height="90" viewBox="0 0 160 90">
      {/* Track */}
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="oklch(0.92 0.01 270)" strokeWidth="10" strokeLinecap="round" />
      {/* Fill */}
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 ${pct > 0.5 ? 1 : 0} 1 ${x} ${y}`}
        fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
      />
      {/* Needle dot */}
      <circle cx={x} cy={y} r="6" fill={color} />
      {/* Labels */}
      <text x={cx - r - 4} y={cy + 16} fontSize="9" fill="#94A3B8" textAnchor="middle">0</text>
      <text x={cx} y={cy - r - 6} fontSize="9" fill="#94A3B8" textAnchor="middle">18</text>
      <text x={cx + r + 4} y={cy + 16} fontSize="9" fill="#94A3B8" textAnchor="middle">36</text>
    </svg>
  );
}

export default function RunwayOptimizer() {
  const { snapshot } = useStartup();
  const { isRTL, lang } = useLanguage();

  const [cashOnHand, setCashOnHand] = useState(2000000);
  const [monthlyRevenue, setMonthlyRevenue] = useState(50000);
  const [categories, setCategories] = useState<BurnCategory[]>(DEFAULT_CATEGORIES);
  const [targetExtension, setTargetExtension] = useState<3 | 6 | 12>(6);
  const [showCategories, setShowCategories] = useState(true);
  const [newCatName, setNewCatName] = useState('');
  const [addingCat, setAddingCat] = useState(false);
  const [profileSynced, setProfileSynced] = useState(false);

  // Pre-fill from startup profile
  useEffect(() => {
    if (!profileSynced) {
      if (snapshot.cashOnHand && snapshot.cashOnHand > 0) {
        setCashOnHand(snapshot.cashOnHand);
      }
      if (snapshot.monthlyBurnRate && snapshot.monthlyBurnRate > 0) {
        // Distribute burn rate proportionally across categories
        const totalDefault = DEFAULT_CATEGORIES.reduce((s, c) => s + c.monthly, 0);
        const ratio = snapshot.monthlyBurnRate / totalDefault;
        setCategories(prev => prev.map(c => ({ ...c, monthly: Math.round(c.monthly * ratio) })));
      }
      if (snapshot.mrr && snapshot.mrr > 0) {
        setMonthlyRevenue(snapshot.mrr);
      } else if (snapshot.currentARR && snapshot.currentARR > 0) {
        setMonthlyRevenue(Math.round(snapshot.currentARR / 12));
      }
      setProfileSynced(true);
    }
  }, [snapshot, profileSynced]);

  const updateCategory = (id: string, field: keyof BurnCategory, value: any) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const removeCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const addCategory = () => {
    if (!newCatName.trim()) return;
    setCategories(prev => [...prev, {
      id: `custom-${Date.now()}`,
      name: newCatName.trim(),
      nameAr: newCatName.trim(),
      monthly: 5000,
      cuttable: 50,
      icon: '💼',
      color: '#6366F1',
    }]);
    setNewCatName('');
    setAddingCat(false);
  };

  const analysis = useMemo(() => {
    const totalBurn = categories.reduce((s, c) => s + c.monthly, 0);
    const netBurn = Math.max(0, totalBurn - monthlyRevenue);
    const currentRunway = netBurn > 0 ? Math.floor(cashOnHand / netBurn) : 999;

    const targetRunway = currentRunway === 999 ? 999 : currentRunway + targetExtension;
    const targetNetBurn = targetRunway === 999 ? 0 : cashOnHand / targetRunway;
    const requiredSavings = Math.max(0, netBurn - targetNetBurn);

    const cuts = categories
      .map(c => ({ ...c, cuttableAmount: c.monthly * (c.cuttable / 100) }))
      .sort((a, b) => b.cuttableAmount - a.cuttableAmount);

    let remaining = requiredSavings;
    const recommendations: { id: string; name: string; nameAr: string; cut: number; newAmount: number; icon: string; color: string }[] = [];
    for (const cat of cuts) {
      if (remaining <= 0) break;
      const cut = Math.min(cat.cuttableAmount, remaining);
      if (cut > 100) {
        recommendations.push({ id: cat.id, name: cat.name, nameAr: cat.nameAr, cut, newAmount: cat.monthly - cut, icon: cat.icon, color: cat.color });
        remaining -= cut;
      }
    }

    const achievableSavings = requiredSavings - Math.max(0, remaining);
    const newNetBurn = Math.max(0, netBurn - achievableSavings);
    const newRunway = newNetBurn > 0 ? Math.floor(cashOnHand / newNetBurn) : 999;

    const burnMultiple = monthlyRevenue > 0 ? netBurn / monthlyRevenue : 0;

    // Cash flow timeline (18 months)
    const timeline = Array.from({ length: 19 }, (_, i) => {
      const cashCurrent = Math.max(0, cashOnHand - netBurn * i);
      const cashOptimized = Math.max(0, cashOnHand - newNetBurn * i);
      return {
        month: i === 0 ? 'Now' : `M${i}`,
        Current: Math.round(cashCurrent / 1000),
        Optimized: Math.round(cashOptimized / 1000),
        zero: 0,
      };
    });

    return {
      totalBurn,
      netBurn,
      currentRunway,
      targetRunway,
      requiredSavings,
      achievableSavings,
      newNetBurn,
      newRunway,
      recommendations,
      burnMultiple,
      timeline,
    };
  }, [categories, cashOnHand, monthlyRevenue, targetExtension]);

  const currentStatus = getRunwayStatus(analysis.currentRunway === 999 ? 36 : analysis.currentRunway);
  const newStatus = getRunwayStatus(analysis.newRunway === 999 ? 36 : analysis.newRunway);

  const t = {
    title: isRTL ? 'مخطط مدة البقاء' : 'Runway Planner',
    subtitle: isRTL ? 'حلل معدل الحرق وامتد مدة بقائك بذكاء' : 'Analyze your burn rate and intelligently extend your runway',
    cashOnHand: isRTL ? 'السيولة المتاحة' : 'Cash on Hand',
    monthlyRevenue: isRTL ? 'الإيرادات الشهرية' : 'Monthly Revenue',
    extendBy: isRTL ? 'تمديد المدة بـ' : 'Extend Runway By',
    currentRunway: isRTL ? 'مدة البقاء الحالية' : 'Current Runway',
    netBurn: isRTL ? 'الحرق الصافي الشهري' : 'Monthly Net Burn',
    burnMultiple: isRTL ? 'مضاعف الحرق' : 'Burn Multiple',
    afterOpt: isRTL ? 'بعد التحسين' : 'After Optimization',
    burnBreakdown: isRTL ? 'تفاصيل الإنفاق الشهري' : 'Monthly Burn Breakdown',
    maxCut: isRTL ? 'الحد الأقصى للتخفيض' : 'Max Cut',
    addExpense: isRTL ? 'إضافة بند' : 'Add Expense',
    recommendations: isRTL ? 'التوصيات لتمديد المدة' : 'Recommended Cuts',
    totalSavings: isRTL ? 'إجمالي التوفير الشهري' : 'Total Monthly Savings',
    newRunway: isRTL ? 'مدة البقاء الجديدة' : 'New Runway',
    cashTimeline: isRTL ? 'مسار السيولة (18 شهراً)' : 'Cash Flow Timeline (18 months)',
    months: isRTL ? 'شهر' : 'months',
    investorTip: isRTL ? 'نصيحة للمستثمرين' : 'Investor Tip',
    investorTipText: isRTL
      ? 'يريد المستثمرون رؤية 18 شهراً على الأقل من السيولة قبل الاستثمار. 24 شهراً هو المثالي. إذا كنت دون 12 شهراً، ركّز على تمديد مدة البقاء قبل بدء جمع التمويل — اليأس واضح في المفاوضات.'
      : 'VCs want to see at least 18 months of runway before you raise. 24 months is ideal. If you\'re below 12 months, focus on extending runway before fundraising — desperation is visible in negotiations.',
    profileSyncBanner: isRTL ? 'تم ملء البيانات من ملف شركتك' : 'Pre-filled from your startup profile',
    showBreakdown: isRTL ? 'عرض التفاصيل' : 'Show Breakdown',
    hideBreakdown: isRTL ? 'إخفاء التفاصيل' : 'Hide Breakdown',
    expenseName: isRTL ? 'اسم البند' : 'Expense name',
    add: isRTL ? 'إضافة' : 'Add',
    cancel: isRTL ? 'إلغاء' : 'Cancel',
    noRecommendations: isRTL ? 'مدة بقائك كافية — لا حاجة لتخفيضات' : 'Your runway is sufficient — no cuts needed',
    months_label: isRTL ? 'شهراً' : 'mo',
    infinite: isRTL ? '∞ (مربح)' : '∞ (Profitable)',
  };

  return (
    <div className={`space-y-5 ${isRTL ? 'text-right' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, oklch(0.35 0.2 270) 0%, oklch(0.45 0.22 300) 100%)' }}>
        <div className="px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              {t.title}
            </h2>
            <p className="text-sm text-white/70 mt-0.5">{t.subtitle}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <RunwayGauge months={analysis.currentRunway === 999 ? 36 : analysis.currentRunway} />
              <div className="text-white font-bold text-lg -mt-2">
                {analysis.currentRunway >= 999 ? t.infinite : `${analysis.currentRunway} ${t.months_label}`}
              </div>
              <div className="text-white/60 text-[10px]">{t.currentRunway}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile sync banner */}
      {profileSynced && (snapshot.cashOnHand || snapshot.monthlyBurnRate || snapshot.mrr) && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-50 border border-indigo-200 text-xs text-indigo-700">
          <Zap className="w-3.5 h-3.5 shrink-0" />
          <span>{t.profileSyncBanner}</span>
        </div>
      )}

      {/* Top inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Cash on Hand */}
        <div className="rounded-xl border border-border bg-card p-4">
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2 flex items-center gap-1">
            <DollarSign className="w-3 h-3" />{t.cashOnHand}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-mono">$</span>
            <input
              type="number" value={cashOnHand}
              onChange={e => setCashOnHand(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full pl-7 pr-3 py-2.5 text-sm font-mono rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div className="text-[10px] text-muted-foreground mt-1.5 font-mono">{fmt(cashOnHand)}</div>
        </div>

        {/* Monthly Revenue */}
        <div className="rounded-xl border border-border bg-card p-4">
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2 flex items-center gap-1">
            <TrendingDown className="w-3 h-3 text-emerald-500" />{t.monthlyRevenue}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-mono">$</span>
            <input
              type="number" value={monthlyRevenue}
              onChange={e => setMonthlyRevenue(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full pl-7 pr-3 py-2.5 text-sm font-mono rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div className="text-[10px] text-muted-foreground mt-1.5 font-mono">{fmt(monthlyRevenue)}/mo</div>
        </div>

        {/* Extend by */}
        <div className="rounded-xl border border-border bg-card p-4">
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2 flex items-center gap-1">
            <Target className="w-3 h-3 text-violet-500" />{t.extendBy}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {([3, 6, 12] as const).map(m => (
              <button
                key={m}
                onClick={() => setTargetExtension(m)}
                className={`py-2.5 rounded-lg text-xs font-bold transition-all ${
                  targetExtension === m
                    ? 'text-white shadow-md'
                    : 'border border-border text-muted-foreground hover:border-indigo-400 hover:text-indigo-600'
                }`}
                style={targetExtension === m ? { background: 'oklch(0.45 0.2 270)' } : {}}
              >
                +{m}{t.months_label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: t.currentRunway,
            value: analysis.currentRunway >= 999 ? '∞' : `${analysis.currentRunway}`,
            unit: analysis.currentRunway < 999 ? t.months_label : '',
            color: currentStatus.color,
            bg: currentStatus.bg,
            border: currentStatus.border,
            icon: Clock,
          },
          {
            label: t.netBurn,
            value: fmt(analysis.netBurn),
            unit: '/mo',
            color: '#EF4444',
            bg: 'bg-red-50',
            border: 'border-red-200',
            icon: Flame,
          },
          {
            label: t.burnMultiple,
            value: analysis.burnMultiple > 0 ? `${analysis.burnMultiple.toFixed(1)}x` : 'N/A',
            unit: '',
            color: analysis.burnMultiple < 1.5 ? '#10B981' : analysis.burnMultiple < 3 ? '#F59E0B' : '#EF4444',
            bg: analysis.burnMultiple < 1.5 ? 'bg-emerald-50' : analysis.burnMultiple < 3 ? 'bg-amber-50' : 'bg-red-50',
            border: analysis.burnMultiple < 1.5 ? 'border-emerald-200' : analysis.burnMultiple < 3 ? 'border-amber-200' : 'border-red-200',
            icon: BarChart3,
          },
          {
            label: t.afterOpt,
            value: analysis.newRunway >= 999 ? '∞' : `${analysis.newRunway}`,
            unit: analysis.newRunway < 999 ? t.months_label : '',
            color: newStatus.color,
            bg: newStatus.bg,
            border: newStatus.border,
            icon: CheckCircle,
          },
        ].map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className={`rounded-xl border p-3.5 ${m.bg} ${m.border}`}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <m.icon className="w-3.5 h-3.5" style={{ color: m.color }} />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{m.label}</span>
            </div>
            <div className="text-2xl font-bold font-mono" style={{ color: m.color }}>
              {m.value}<span className="text-sm font-normal ml-0.5">{m.unit}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Cash Flow Timeline Chart */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-semibold text-foreground">{t.cashTimeline}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {isRTL ? 'الخط الأزرق = الحالي، الخط الأخضر = بعد التحسين' : 'Blue = current trajectory · Green = after optimization'}
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={analysis.timeline} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="gradCurrent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradOptimized" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 270)" />
            <XAxis dataKey="month" tick={{ fontSize: 9, fontFamily: 'Plus Jakarta Sans' }} />
            <YAxis tick={{ fontSize: 9, fontFamily: 'monospace' }} tickFormatter={v => `$${v}K`} />
            <RechartTooltip
              formatter={(v: any, name: string) => [`$${v}K`, name]}
              contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid oklch(0.88 0.02 270)' }}
            />
            <Area type="monotone" dataKey="Current" stroke="#6366F1" strokeWidth={2} fill="url(#gradCurrent)" dot={false} />
            <Area type="monotone" dataKey="Optimized" stroke="#10B981" strokeWidth={2} fill="url(#gradOptimized)" dot={false} strokeDasharray="5 3" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Burn Breakdown */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <button
          className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
          onClick={() => setShowCategories(v => !v)}
        >
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-indigo-500" />
            <span className="text-sm font-semibold text-foreground">{t.burnBreakdown}</span>
            <span className="text-xs text-muted-foreground font-mono">({fmt(analysis.totalBurn)}/mo total)</span>
          </div>
          {showCategories ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>

        <AnimatePresence>
          {showCategories && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              <div className="border-t border-border divide-y divide-border">
                {categories.map(cat => (
                  <div key={cat.id} className="px-4 py-3 flex items-center gap-3 flex-wrap group">
                    <span className="text-lg shrink-0">{cat.icon}</span>
                    <div className="flex-1 min-w-[120px]">
                      <div className="text-xs font-medium text-foreground">{isRTL ? cat.nameAr : cat.name}</div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${cat.cuttable}%`, backgroundColor: cat.color }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground w-8 shrink-0">{cat.cuttable}%</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                        <input
                          type="number" value={cat.monthly}
                          onChange={e => updateCategory(cat.id, 'monthly', Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-24 pl-5 pr-2 py-1.5 text-xs font-mono text-right rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        />
                      </div>
                      <input
                        type="range" min={0} max={100} step={5} value={cat.cuttable}
                        onChange={e => updateCategory(cat.id, 'cuttable', parseInt(e.target.value))}
                        className="w-20 h-1.5 rounded-full appearance-none cursor-pointer accent-indigo-500"
                        title={`${t.maxCut}: ${cat.cuttable}%`}
                      />
                      <button
                        onClick={() => removeCategory(cat.id)}
                        className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add expense row */}
                <div className="px-4 py-3">
                  {addingCat ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newCatName}
                        onChange={e => setNewCatName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addCategory()}
                        placeholder={t.expenseName}
                        className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-indigo-300 bg-background focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        autoFocus
                      />
                      <button onClick={addCategory} className="px-3 py-1.5 text-xs font-semibold rounded-lg text-white" style={{ background: 'oklch(0.45 0.2 270)' }}>
                        {t.add}
                      </button>
                      <button onClick={() => { setAddingCat(false); setNewCatName(''); }} className="px-3 py-1.5 text-xs rounded-lg border border-border text-muted-foreground">
                        {t.cancel}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingCat(true)}
                      className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {t.addExpense}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Spend breakdown bar chart */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="text-sm font-semibold text-foreground mb-3">
          {isRTL ? 'الإنفاق الحالي مقابل المحسّن' : 'Current vs. Optimized Spend'}
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart
            data={categories.map(c => {
              const rec = analysis.recommendations.find(r => r.id === c.id);
              return {
                name: (isRTL ? c.nameAr : c.name).split(' ')[0],
                Current: c.monthly,
                Optimized: rec ? Math.round(rec.newAmount) : c.monthly,
              };
            })}
            margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 270)" />
            <XAxis dataKey="name" tick={{ fontSize: 9 }} />
            <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `$${v / 1000}K`} />
            <RechartTooltip formatter={(v: any) => [fmt(v), '']} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
            <Bar dataKey="Current" fill="#6366F1" opacity={0.7} radius={[4, 4, 0, 0]} />
            <Bar dataKey="Optimized" fill="#10B981" opacity={0.85} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recommendations */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2" style={{ background: 'oklch(0.97 0.01 270)' }}>
          <TrendingDown className="w-4 h-4 text-indigo-600" />
          <span className="text-sm font-semibold text-foreground">
            {t.recommendations} (+{targetExtension} {t.months})
          </span>
        </div>

        {analysis.recommendations.length === 0 ? (
          <div className="p-5 flex items-center gap-3 text-sm text-emerald-700">
            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
            {t.noRecommendations}
          </div>
        ) : (
          <>
            <div className="divide-y divide-border">
              {analysis.recommendations.map((rec, i) => (
                <motion.div
                  key={rec.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="px-4 py-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{rec.icon}</span>
                    <div>
                      <div className="text-sm font-medium text-foreground">{isRTL ? rec.nameAr : rec.name}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {isRTL ? `تخفيض ${Math.round((rec.cut / (rec.newAmount + rec.cut)) * 100)}%` : `${Math.round((rec.cut / (rec.newAmount + rec.cut)) * 100)}% reduction`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-muted-foreground line-through">{fmt(rec.newAmount + rec.cut)}</span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                    <span className="font-bold text-emerald-600">{fmt(rec.newAmount)}</span>
                    <span className="text-red-500 text-[10px]">−{fmt(rec.cut)}</span>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="px-4 py-3 bg-emerald-50 border-t border-emerald-200 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-sm text-emerald-700">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>
                  {t.totalSavings}: <strong>{fmt(analysis.achievableSavings)}/mo</strong>
                </span>
              </div>
              <div className="text-sm font-bold text-emerald-700">
                {t.newRunway}: {analysis.newRunway >= 999 ? t.infinite : `${analysis.newRunway} ${t.months_label}`}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Investor tip */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 flex gap-3">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-700 leading-relaxed">
          <strong>{t.investorTip}: </strong>{t.investorTipText}
        </div>
      </div>
    </div>
  );
}
