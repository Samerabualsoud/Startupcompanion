/**
 * RunwayOptimizer — Burn rate analysis and runway extension calculator
 * Design: "Venture Capital Clarity" — Editorial Finance
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingDown, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip,
  ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts';

interface BurnCategory {
  id: string;
  name: string;
  monthly: number;
  cuttable: number; // % that can realistically be cut
  icon: string;
}

const DEFAULT_CATEGORIES: BurnCategory[] = [
  { id: 'salaries',    name: 'Salaries & Benefits',     monthly: 80000,  cuttable: 20, icon: '👥' },
  { id: 'office',      name: 'Office & Facilities',     monthly: 8000,   cuttable: 80, icon: '🏢' },
  { id: 'cloud',       name: 'Cloud & Infrastructure',  monthly: 12000,  cuttable: 30, icon: '☁️' },
  { id: 'marketing',   name: 'Marketing & Ads',         monthly: 15000,  cuttable: 70, icon: '📣' },
  { id: 'tools',       name: 'Software & Tools',        monthly: 5000,   cuttable: 50, icon: '🛠️' },
  { id: 'legal',       name: 'Legal & Compliance',      monthly: 4000,   cuttable: 40, icon: '⚖️' },
  { id: 'travel',      name: 'Travel & Entertainment',  monthly: 6000,   cuttable: 90, icon: '✈️' },
  { id: 'other',       name: 'Other Expenses',          monthly: 10000,  cuttable: 50, icon: '📦' },
];

function fmt(n: number): string {
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function runwayLabel(months: number): string {
  if (months >= 24) return `${months} months ✅`;
  if (months >= 18) return `${months} months ⚠️`;
  if (months >= 12) return `${months} months 🔴`;
  return `${months} months 🚨`;
}

function runwayColor(months: number): string {
  if (months >= 24) return '#10B981';
  if (months >= 18) return '#F59E0B';
  if (months >= 12) return '#EF4444';
  return '#DC2626';
}

export default function RunwayOptimizer() {
  const [cashOnHand, setCashOnHand] = useState(2000000);
  const [monthlyRevenue, setMonthlyRevenue] = useState(50000);
  const [categories, setCategories] = useState<BurnCategory[]>(DEFAULT_CATEGORIES);
  const [targetExtension, setTargetExtension] = useState<3 | 6 | 12>(6);

  const updateCategory = (id: string, field: keyof BurnCategory, value: any) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const analysis = useMemo(() => {
    const totalBurn = categories.reduce((s, c) => s + c.monthly, 0);
    const netBurn = Math.max(0, totalBurn - monthlyRevenue);
    const currentRunway = netBurn > 0 ? Math.floor(cashOnHand / netBurn) : 999;

    // Target: extend by X months
    const targetRunway = currentRunway + targetExtension;
    const targetNetBurn = cashOnHand / targetRunway;
    const requiredSavings = netBurn - targetNetBurn;

    // Sort categories by cuttable amount
    const cuts = categories
      .map(c => ({ ...c, cuttableAmount: c.monthly * (c.cuttable / 100) }))
      .sort((a, b) => b.cuttableAmount - a.cuttableAmount);

    // Greedy: cut from most cuttable first
    let remaining = requiredSavings;
    const recommendations: { name: string; cut: number; newAmount: number; icon: string }[] = [];
    for (const cat of cuts) {
      if (remaining <= 0) break;
      const cut = Math.min(cat.cuttableAmount, remaining);
      if (cut > 0) {
        recommendations.push({ name: cat.name, cut, newAmount: cat.monthly - cut, icon: cat.icon });
        remaining -= cut;
      }
    }

    const achievableSavings = requiredSavings - Math.max(0, remaining);
    const newNetBurn = netBurn - achievableSavings;
    const newRunway = newNetBurn > 0 ? Math.floor(cashOnHand / newNetBurn) : 999;

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
      burnMultiple: monthlyRevenue > 0 ? (netBurn / monthlyRevenue) : 0,
    };
  }, [categories, cashOnHand, monthlyRevenue, targetExtension]);

  const chartData = categories.map(c => ({
    name: c.name.split(' ')[0],
    Current: c.monthly,
    Optimized: c.monthly * (1 - (analysis.recommendations.find(r => r.name === c.name)?.cut ?? 0) / c.monthly),
  }));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
          Runway Optimizer
        </h2>
        <p className="text-sm text-muted-foreground">
          Enter your burn breakdown and see exactly what to cut to extend your runway by 3, 6, or 12 months.
        </p>
      </div>

      {/* Top inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="border border-border rounded-xl p-3 bg-card">
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Cash on Hand</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <input type="number" value={cashOnHand}
              onChange={e => setCashOnHand(Math.max(0, parseInt(e.target.value) || 0))}
              className="vc-input w-full pl-7 pr-3 py-2 text-sm" />
          </div>
        </div>
        <div className="border border-border rounded-xl p-3 bg-card">
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Monthly Revenue</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <input type="number" value={monthlyRevenue}
              onChange={e => setMonthlyRevenue(Math.max(0, parseInt(e.target.value) || 0))}
              className="vc-input w-full pl-7 pr-3 py-2 text-sm" />
          </div>
        </div>
        <div className="border border-border rounded-xl p-3 bg-card">
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Extend Runway By</label>
          <div className="flex gap-2">
            {([3, 6, 12] as const).map(m => (
              <button key={m} onClick={() => setTargetExtension(m)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${targetExtension === m ? 'text-white' : 'border border-border text-muted-foreground hover:border-accent'}`}
                style={targetExtension === m ? { background: '#C4614A' } : {}}>
                +{m}mo
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Current runway status */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Current Runway', value: `${analysis.currentRunway >= 999 ? '∞' : analysis.currentRunway} mo`, color: runwayColor(analysis.currentRunway) },
          { label: 'Monthly Net Burn', value: fmt(analysis.netBurn), color: '#EF4444' },
          { label: 'Burn Multiple', value: analysis.burnMultiple > 0 ? `${analysis.burnMultiple.toFixed(1)}x` : 'N/A', color: analysis.burnMultiple < 1.5 ? '#10B981' : analysis.burnMultiple < 3 ? '#F59E0B' : '#EF4444' },
          { label: 'After Optimization', value: `${analysis.newRunway >= 999 ? '∞' : analysis.newRunway} mo`, color: runwayColor(analysis.newRunway) },
        ].map(m => (
          <div key={m.label} className="border border-border rounded-xl p-3 bg-card text-center">
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">{m.label}</div>
            <div className="text-lg font-bold metric-value" style={{ color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Burn breakdown */}
      <div className="border border-border rounded-xl overflow-hidden bg-card">
        <div className="p-4 border-b border-border">
          <div className="text-xs font-semibold text-foreground">Monthly Burn Breakdown</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Adjust each category. "Max Cut %" is the realistic reduction possible.</div>
        </div>
        <div className="divide-y divide-border">
          {categories.map(cat => (
            <div key={cat.id} className="p-3 flex items-center gap-3 flex-wrap">
              <span className="text-base shrink-0">{cat.icon}</span>
              <div className="flex-1 min-w-[120px]">
                <div className="text-xs font-medium text-foreground">{cat.name}</div>
                <div className="text-[10px] text-muted-foreground">Max cut: {cat.cuttable}%</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">$</span>
                <input type="number" value={cat.monthly}
                  onChange={e => updateCategory(cat.id, 'monthly', Math.max(0, parseInt(e.target.value) || 0))}
                  className="vc-input w-24 px-2 py-1.5 text-xs text-right" />
                <span className="text-[10px] text-muted-foreground">/mo</span>
              </div>
              <div className="flex items-center gap-1.5 w-28">
                <input type="range" min={0} max={100} step={5} value={cat.cuttable}
                  onChange={e => updateCategory(cat.id, 'cuttable', parseInt(e.target.value))}
                  className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{ background: `linear-gradient(to right, #C4614A ${cat.cuttable}%, oklch(0.88 0.01 80) ${cat.cuttable}%)` }} />
                <span className="text-[10px] font-mono text-muted-foreground w-8">{cat.cuttable}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {analysis.recommendations.length > 0 && (
        <div className="border border-border rounded-xl overflow-hidden bg-card">
          <div className="p-4 border-b border-border flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-accent" />
            <div className="text-xs font-semibold text-foreground">
              Recommended Cuts to Extend Runway by +{targetExtension} Months
            </div>
          </div>
          <div className="divide-y divide-border">
            {analysis.recommendations.map(rec => (
              <div key={rec.name} className="p-3 flex items-center justify-between">
                <div className="text-sm text-foreground">{rec.name}</div>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="text-muted-foreground line-through">{fmt(rec.newAmount + rec.cut)}/mo</span>
                  <span className="text-red-500">−{fmt(rec.cut)}</span>
                  <span className="font-semibold text-foreground">{fmt(rec.newAmount)}/mo</span>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 bg-green-50 border-t border-green-200">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
              <span className="text-green-700">
                Total monthly savings: <strong>{fmt(analysis.achievableSavings)}</strong> →
                New runway: <strong>{analysis.newRunway >= 999 ? '∞' : analysis.newRunway} months</strong>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="border border-border rounded-xl p-4 bg-card">
        <div className="text-xs font-semibold text-foreground mb-3">Current vs. Optimized Spend</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.88 0.01 80)" />
            <XAxis dataKey="name" tick={{ fontSize: 9, fontFamily: 'DM Sans' }} />
            <YAxis tick={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }} tickFormatter={v => `$${v / 1000}K`} />
            <RechartTooltip formatter={(v: any) => [fmt(v), '']} contentStyle={{ fontSize: 11, fontFamily: 'DM Sans', borderRadius: 6 }} />
            <Bar dataKey="Current" fill="#C4614A" opacity={0.7} radius={[3, 3, 0, 0]} />
            <Bar dataKey="Optimized" fill="#10B981" opacity={0.8} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-700 leading-relaxed">
        <strong>Investor tip:</strong> VCs want to see at least <strong>18 months of runway</strong> before you raise. Ideally 24 months. If you're below 12 months, focus on extending runway before starting a fundraise — desperation is visible in negotiations.
      </div>
    </div>
  );
}
