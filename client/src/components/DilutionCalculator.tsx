/**
 * DilutionCalculator — Founder equity dilution across funding rounds
 * Design: "Venture Capital Clarity" — Editorial Finance
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, TrendingDown } from 'lucide-react';
import { calcDilution, formatCurrency, type DilutionRound } from '@/lib/valuation';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { nanoid } from 'nanoid';

const DEFAULT_ROUNDS: DilutionRound[] = [
  { id: nanoid(), name: 'Pre-Seed', investment: 500000, preMoneyValuation: 2000000 },
  { id: nanoid(), name: 'Seed', investment: 2000000, preMoneyValuation: 8000000 },
  { id: nanoid(), name: 'Series A', investment: 10000000, preMoneyValuation: 30000000 },
];

export default function DilutionCalculator() {
  const [rounds, setRounds] = useState<DilutionRound[]>(DEFAULT_ROUNDS);

  const addRound = () => {
    setRounds(prev => [...prev, {
      id: nanoid(),
      name: `Round ${prev.length + 1}`,
      investment: 5000000,
      preMoneyValuation: 20000000,
    }]);
  };

  const removeRound = (id: string) => setRounds(prev => prev.filter(r => r.id !== id));

  const updateRound = (id: string, key: keyof DilutionRound, value: any) => {
    setRounds(prev => prev.map(r => r.id === id ? { ...r, [key]: value } : r));
  };

  const result = calcDilution(rounds);

  // Chart data
  const chartData = [
    { name: 'Founding', ownership: 100, founderValue: 0 },
    ...result.rounds.map(r => ({
      name: r.name,
      ownership: Math.round(r.founderOwnership * 1000) / 10,
      founderValue: Math.round(r.impliedFounderValue / 1e6 * 100) / 100,
    })),
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Dilution Calculator
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Model founder equity across multiple funding rounds
          </p>
        </div>
        <button
          onClick={addRound}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-accent text-accent hover:bg-accent hover:text-white transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Round
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-md p-3 border border-border bg-card">
          <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1">Final Founder %</div>
          <div className="metric-value text-xl font-bold text-foreground">
            {(result.finalFounderOwnership * 100).toFixed(1)}%
          </div>
        </div>
        <div className="rounded-md p-3 border border-border bg-card">
          <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1">Total Raised</div>
          <div className="metric-value text-xl font-bold text-foreground">
            {formatCurrency(result.totalRaised, true)}
          </div>
        </div>
        <div className="rounded-md p-3 border border-accent/30 bg-accent/5">
          <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1">Final Post-Money</div>
          <div className="metric-value text-xl font-bold text-accent">
            {formatCurrency(result.finalPostMoney, true)}
          </div>
        </div>
      </div>

      {/* Ownership Chart */}
      <div className="rounded-md border border-border bg-card p-4">
        <div className="text-xs font-semibold text-foreground mb-3" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          Founder Ownership Over Time
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="ownershipGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#C4614A" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#C4614A" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.88 0.01 80)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fontFamily: 'DM Sans' }} />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }}
              tickFormatter={v => `${v}%`}
            />
            <RechartTooltip
              formatter={(v: any) => [`${v}%`, 'Founder Ownership']}
              contentStyle={{ fontSize: 11, fontFamily: 'DM Sans', borderRadius: 4 }}
            />
            <Area
              type="monotone"
              dataKey="ownership"
              stroke="#C4614A"
              strokeWidth={2}
              fill="url(#ownershipGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Round Inputs */}
      <div className="space-y-3">
        <AnimatePresence>
          {rounds.map((round, i) => {
            const res = result.rounds[i];
            return (
              <motion.div
                key={round.id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-md border border-border bg-card overflow-hidden"
              >
                <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-secondary/30">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-accent font-semibold">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <input
                      value={round.name}
                      onChange={e => updateRound(round.id, 'name', e.target.value)}
                      className="text-xs font-semibold bg-transparent border-none outline-none text-foreground w-32"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    {res && (
                      <span className="text-[10px] font-mono text-muted-foreground">
                        Founder: <span className="font-semibold text-foreground">{(res.founderOwnership * 100).toFixed(1)}%</span>
                        {' '}→ <span className="text-accent">{formatCurrency(res.impliedFounderValue, true)}</span>
                      </span>
                    )}
                    <button
                      onClick={() => removeRound(round.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 p-3">
                  <div>
                    <label className="block text-[10px] font-medium text-muted-foreground mb-1">
                      Investment ($)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">$</span>
                      <input
                        type="number"
                        value={round.investment}
                        step={100000}
                        onChange={e => updateRound(round.id, 'investment', parseFloat(e.target.value) || 0)}
                        className="vc-input w-full text-xs py-1.5 pl-6 pr-2 font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-muted-foreground mb-1">
                      Pre-Money Valuation ($)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">$</span>
                      <input
                        type="number"
                        value={round.preMoneyValuation}
                        step={500000}
                        onChange={e => updateRound(round.id, 'preMoneyValuation', parseFloat(e.target.value) || 0)}
                        className="vc-input w-full text-xs py-1.5 pl-6 pr-2 font-mono"
                      />
                    </div>
                  </div>
                </div>
                {res && (
                  <div className="px-3 pb-2 flex items-center gap-4 text-[10px] text-muted-foreground">
                    <span>Post-Money: <span className="font-mono font-semibold text-foreground">{formatCurrency(res.postMoneyValuation, true)}</span></span>
                    <span>New Equity Issued: <span className="font-mono font-semibold text-foreground">{(res.newSharesFraction * 100).toFixed(1)}%</span></span>
                    <span>Dilution: <span className="font-mono font-semibold text-destructive">−{(res.newSharesFraction * 100).toFixed(1)}%</span></span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Table Summary */}
      {result.rounds.length > 0 && (
        <div className="rounded-md border border-border overflow-hidden">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="bg-secondary/50">
                <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Round</th>
                <th className="text-right px-3 py-2 font-semibold text-muted-foreground">Investment</th>
                <th className="text-right px-3 py-2 font-semibold text-muted-foreground">Post-Money</th>
                <th className="text-right px-3 py-2 font-semibold text-muted-foreground">Founder %</th>
                <th className="text-right px-3 py-2 font-semibold text-muted-foreground">Founder Value</th>
              </tr>
            </thead>
            <tbody>
              {result.rounds.map((r, i) => (
                <tr key={i} className="border-t border-border hover:bg-secondary/20 transition-colors">
                  <td className="px-3 py-2 font-medium text-foreground">{r.name}</td>
                  <td className="px-3 py-2 text-right font-mono">{formatCurrency(r.investment, true)}</td>
                  <td className="px-3 py-2 text-right font-mono">{formatCurrency(r.postMoneyValuation, true)}</td>
                  <td className="px-3 py-2 text-right font-mono font-semibold" style={{ color: r.founderOwnership > 0.5 ? '#10B981' : r.founderOwnership > 0.25 ? '#F59E0B' : '#EF4444' }}>
                    {(r.founderOwnership * 100).toFixed(1)}%
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-accent font-semibold">{formatCurrency(r.impliedFounderValue, true)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
