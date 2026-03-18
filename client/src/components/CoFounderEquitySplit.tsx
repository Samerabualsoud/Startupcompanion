/**
 * CoFounderEquitySplit — Equity split calculator based on 7 best-practice factors
 * Design: "Venture Capital Clarity" — Editorial Finance
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Users, Info } from 'lucide-react';
import { nanoid } from 'nanoid';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface FounderFactors {
  ideaOrigin: number;       // 0-10: Who came up with the idea?
  commitment: number;       // 0-10: Full-time vs part-time
  domainExpertise: number;  // 0-10: Relevant industry experience
  technicalContrib: number; // 0-10: Technical/product contribution
  networkSales: number;     // 0-10: Network, sales, BD value
  priorExits: number;       // 0-10: Previous startup experience/exits
  riskTolerance: number;    // 0-10: Financial risk taken (savings, salary cut)
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

const FACTOR_LABELS: Record<keyof FounderFactors, { label: string; desc: string }> = {
  ideaOrigin: { label: 'Idea Origin', desc: '10 = sole originator, 5 = co-developed, 0 = joined later' },
  commitment: { label: 'Full-Time Commitment', desc: '10 = full-time, day 1, 5 = transitioning, 0 = advisory only' },
  domainExpertise: { label: 'Domain Expertise', desc: '10 = 10+ years in this exact space, 5 = adjacent, 0 = none' },
  technicalContrib: { label: 'Technical / Product Contribution', desc: '10 = building the core product, 5 = partial, 0 = non-technical' },
  networkSales: { label: 'Network & Sales Value', desc: '10 = direct access to key customers/investors, 5 = moderate, 0 = none' },
  priorExits: { label: 'Startup Experience & Exits', desc: '10 = multiple exits, 5 = one exit or senior role, 0 = first startup' },
  riskTolerance: { label: 'Financial Risk Taken', desc: '10 = quit job + invested savings, 5 = moderate sacrifice, 0 = no financial risk' },
};

const FOUNDER_COLORS = ['#C4614A', '#0F1B2D', '#8B4A38', '#2D4A6B', '#A0522D', '#D4845A'];

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
    return sum + (factors[key as keyof FounderFactors] * weight);
  }, 0);
}

function calcSplits(founders: Founder[]): { id: string; name: string; score: number; pct: number }[] {
  const scores = founders.map(f => ({ id: f.id, name: f.name, score: calcWeightedScore(f.factors) }));
  const total = scores.reduce((s, f) => s + f.score, 0);
  return scores.map(f => ({ ...f, pct: total > 0 ? Math.round((f.score / total) * 1000) / 10 : 0 }));
}

function FactorSlider({ label, desc, value, onChange }: { label: string; desc: string; value: number; onChange: (v: number) => void }) {
  const color = value >= 7 ? '#10B981' : value >= 4 ? '#F59E0B' : '#EF4444';
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-foreground">{label}</span>
          <div className="relative group">
            <Info className="w-3 h-3 text-muted-foreground cursor-help" />
            <div className="absolute left-0 bottom-full mb-1 z-10 hidden group-hover:block bg-foreground text-background text-[10px] rounded px-2 py-1.5 w-48 leading-relaxed shadow-lg">
              {desc}
            </div>
          </div>
        </div>
        <span className="text-xs font-bold metric-value" style={{ color }}>{value}/10</span>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        step={1}
        value={value}
        onChange={e => onChange(parseInt(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${color} ${value * 10}%, oklch(0.88 0.01 80) ${value * 10}%)`,
        }}
      />
    </div>
  );
}

export default function CoFounderEquitySplit() {
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

  const updateFactor = (id: string, factor: keyof FounderFactors, value: number) => {
    setFounders(prev => prev.map(f => f.id === id ? { ...f, factors: { ...f.factors, [factor]: value } } : f));
  };

  const pieData = splits.map((s, i) => ({
    name: founders.find(f => f.id === s.id)?.name || s.name,
    value: s.pct,
    color: FOUNDER_COLORS[i % FOUNDER_COLORS.length],
  }));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          Co-Founder Equity Split
        </h2>
        <p className="text-sm text-muted-foreground">
          Score each founder across 7 factors based on industry best practices. The calculator recommends a fair split weighted by contribution.
        </p>
      </div>

      {/* Pie chart + summary */}
      <div className="border border-border rounded-xl p-4 bg-card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v: any) => [`${v}%`, 'Equity']} contentStyle={{ fontSize: 11, fontFamily: 'DM Sans', borderRadius: 4 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2">
            {splits.map((s, i) => {
              const founder = founders.find(f => f.id === s.id);
              const color = FOUNDER_COLORS[i % FOUNDER_COLORS.length];
              return (
                <div key={s.id} className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                  <div>
                    <div className="text-sm font-semibold text-foreground">{founder?.name}</div>
                    <div className="text-[10px] text-muted-foreground">{founder?.role}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold metric-value" style={{ color }}>{s.pct}%</div>
                    <div className="text-[10px] text-muted-foreground font-mono">score: {s.score.toFixed(1)}/10</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Best practice note */}
        <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
          <div className="text-xs font-semibold text-amber-800 mb-1">💡 Best Practice Note</div>
          <div className="text-xs text-amber-700 leading-relaxed">
            Research shows that equal splits (50/50) often lead to co-founder conflicts. A slight imbalance (e.g., 55/45) with clear role definitions and vesting schedules tends to produce better outcomes. All splits should be subject to a <strong>4-year vesting schedule with a 1-year cliff</strong>.
          </div>
        </div>
      </div>

      {/* Founder cards */}
      <div className="space-y-4">
        {founders.map((founder, fi) => (
          <motion.div
            key={founder.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-border rounded-xl overflow-hidden bg-card"
          >
            {/* Founder header */}
            <div className="flex items-center justify-between p-4 border-b border-border" style={{ background: `${FOUNDER_COLORS[fi % FOUNDER_COLORS.length]}10` }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ background: FOUNDER_COLORS[fi % FOUNDER_COLORS.length] }}>
                  {fi + 1}
                </div>
                <div className="flex gap-2">
                  <input
                    value={founder.name}
                    onChange={e => updateFounder(founder.id, 'name', e.target.value)}
                    className="text-sm font-bold bg-transparent border-b border-dashed border-muted-foreground/40 focus:outline-none focus:border-accent text-foreground w-28"
                    placeholder="Name"
                  />
                  <input
                    value={founder.role}
                    onChange={e => updateFounder(founder.id, 'role', e.target.value)}
                    className="text-xs bg-transparent border-b border-dashed border-muted-foreground/40 focus:outline-none focus:border-accent text-muted-foreground w-32"
                    placeholder="Role (e.g. CEO)"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-lg font-bold metric-value" style={{ color: FOUNDER_COLORS[fi % FOUNDER_COLORS.length] }}>
                    {splits.find(s => s.id === founder.id)?.pct ?? 0}%
                  </div>
                  <div className="text-[9px] text-muted-foreground">recommended</div>
                </div>
                {founders.length > 2 && (
                  <button onClick={() => removeFounder(founder.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Factor sliders */}
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(Object.keys(FACTOR_LABELS) as (keyof FounderFactors)[]).map(key => (
                <FactorSlider
                  key={key}
                  label={FACTOR_LABELS[key].label}
                  desc={FACTOR_LABELS[key].desc}
                  value={founder.factors[key]}
                  onChange={v => updateFactor(founder.id, key, v)}
                />
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add founder */}
      {founders.length < 6 && (
        <button onClick={addFounder}
          className="flex items-center gap-2 w-full py-3 border-2 border-dashed border-border rounded-xl text-sm text-muted-foreground hover:border-accent hover:text-accent transition-all justify-center">
          <Plus className="w-4 h-4" />
          Add Co-Founder
        </button>
      )}

      {/* Vesting recommendation */}
      <div className="border border-border rounded-xl overflow-hidden bg-card">
        <button
          onClick={() => setShowVesting(v => !v)}
          className="w-full flex items-center justify-between p-4 text-sm font-semibold text-foreground hover:bg-secondary/40 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-accent" />
            Recommended Vesting Schedule
          </div>
          <span className="text-xs text-muted-foreground">{showVesting ? 'Hide' : 'Show'}</span>
        </button>
        <AnimatePresence>
          {showVesting && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
              <div className="p-4 border-t border-border space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Vesting Period', value: '4 years', note: 'Industry standard' },
                    { label: 'Cliff', value: '1 year', note: 'Nothing before month 12' },
                    { label: 'After Cliff', value: '25% vests', note: 'Then monthly' },
                    { label: 'Monthly Rate', value: '2.08%', note: '1/48th per month' },
                  ].map(item => (
                    <div key={item.label} className="text-center p-3 rounded-lg bg-secondary/50">
                      <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">{item.label}</div>
                      <div className="text-sm font-bold metric-value text-foreground">{item.value}</div>
                      <div className="text-[9px] text-muted-foreground mt-0.5">{item.note}</div>
                    </div>
                  ))}
                </div>
                <div className="p-3 rounded-lg bg-secondary/40 text-xs text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Double-trigger acceleration:</strong> If the company is acquired AND a founder is involuntarily terminated, all unvested shares should immediately vest. Always include this clause in your founders' agreement.
                </div>
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-700 leading-relaxed">
                  <strong>Reverse vesting for existing founders:</strong> If you're adding a new co-founder after the company already exists, consider giving them a fresh 4-year vest on their shares. Existing founders may want to "re-vest" to show commitment to new investors.
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
