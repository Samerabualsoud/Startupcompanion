/**
 * AdvancedDilutionSimulator — User-defined dilution % per round through Series E
 * Design: "Venture Capital Clarity" — Editorial Finance
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Info, TrendingDown, DollarSign } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip,
  ResponsiveContainer, ReferenceLine, BarChart, Bar, Cell, Legend,
} from 'recharts';

interface Round {
  id: string;
  name: string;
  enabled: boolean;
  dilutionPct: number;       // % dilution this round causes to existing holders
  investmentAmount: number;  // $ raised
  color: string;
}

const DEFAULT_ROUNDS: Round[] = [
  { id: 'pre-seed', name: 'Pre-Seed', enabled: true,  dilutionPct: 10, investmentAmount: 500000,    color: '#C4614A' },
  { id: 'seed',     name: 'Seed',     enabled: true,  dilutionPct: 15, investmentAmount: 2000000,   color: '#8B4A38' },
  { id: 'series-a', name: 'Series A', enabled: true,  dilutionPct: 20, investmentAmount: 10000000,  color: '#2D4A6B' },
  { id: 'series-b', name: 'Series B', enabled: false, dilutionPct: 15, investmentAmount: 30000000,  color: '#1B3A5C' },
  { id: 'series-c', name: 'Series C', enabled: false, dilutionPct: 12, investmentAmount: 80000000,  color: '#0F1B2D' },
  { id: 'series-d', name: 'Series D', enabled: false, dilutionPct: 10, investmentAmount: 150000000, color: '#4A2D1B' },
  { id: 'series-e', name: 'Series E', enabled: false, dilutionPct: 8,  investmentAmount: 300000000, color: '#1B4A2D' },
];

const OPTION_POOL_DEFAULT = 10; // %

function fmt(n: number): string {
  if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function fmtPct(n: number) { return `${n.toFixed(1)}%`; }

export default function AdvancedDilutionSimulator() {
  const [rounds, setRounds] = useState<Round[]>(DEFAULT_ROUNDS);
  const [optionPool, setOptionPool] = useState(OPTION_POOL_DEFAULT);
  const [initialValuation, setInitialValuation] = useState(3000000); // pre-seed pre-money

  const updateRound = (id: string, field: keyof Round, value: any) => {
    setRounds(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  // Compute dilution path
  const simulation = useMemo(() => {
    const enabledRounds = rounds.filter(r => r.enabled);
    let founderPct = 100 - optionPool; // after option pool
    let currentPostMoney = initialValuation;
    const path: {
      stage: string;
      founderPct: number;
      investorPct: number;
      optionPoolPct: number;
      postMoney: number;
      raised: number;
      impliedFounderValue: number;
      color: string;
    }[] = [];

    // Starting point
    path.push({
      stage: 'Founding',
      founderPct,
      investorPct: 0,
      optionPoolPct: optionPool,
      postMoney: initialValuation,
      raised: 0,
      impliedFounderValue: (founderPct / 100) * initialValuation,
      color: '#6B7280',
    });

    let totalInvestorPct = 0;

    for (const round of enabledRounds) {
      // Dilution applies to ALL existing holders (founders + option pool + previous investors)
      const dilFrac = round.dilutionPct / 100;
      founderPct = founderPct * (1 - dilFrac);
      totalInvestorPct = totalInvestorPct * (1 - dilFrac) + round.dilutionPct;
      const optPct = optionPool * (1 - dilFrac);

      // Post-money = investment / dilution fraction
      const postMoney = round.investmentAmount / dilFrac;
      currentPostMoney = postMoney;

      path.push({
        stage: round.name,
        founderPct: Math.round(founderPct * 10) / 10,
        investorPct: Math.round(totalInvestorPct * 10) / 10,
        optionPoolPct: Math.round(optPct * 10) / 10,
        postMoney,
        raised: round.investmentAmount,
        impliedFounderValue: (founderPct / 100) * postMoney,
        color: round.color,
      });
    }

    return path;
  }, [rounds, optionPool, initialValuation]);

  const finalStage = simulation[simulation.length - 1];
  const totalRaised = rounds.filter(r => r.enabled).reduce((s, r) => s + r.investmentAmount, 0);

  const areaData = simulation.map(s => ({
    stage: s.stage,
    Founders: parseFloat(s.founderPct.toFixed(1)),
    Investors: parseFloat(s.investorPct.toFixed(1)),
    'Option Pool': parseFloat(s.optionPoolPct.toFixed(1)),
  }));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
          Dilution Simulator
        </h2>
        <p className="text-sm text-muted-foreground">
          Set your dilution % per round and see how founder ownership evolves from Pre-Seed through Series E.
        </p>
      </div>

      {/* Config */}
      <div className="border border-border rounded-xl p-4 bg-card">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
              Starting Pre-Money Valuation
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <input
                type="number"
                value={initialValuation}
                onChange={e => setInitialValuation(Math.max(0, parseInt(e.target.value) || 0))}
                className="vc-input w-full pl-7 pr-3 py-2 text-sm"
              />
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">Your company's value before any investment</div>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
              Employee Option Pool
              <span className="ml-1 text-accent font-bold">{optionPool}%</span>
            </label>
            <input
              type="range" min={5} max={25} step={1} value={optionPool}
              onChange={e => setOptionPool(parseInt(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
              style={{ background: `linear-gradient(to right, #C4614A ${optionPool * 4}%, oklch(0.88 0.01 80) ${optionPool * 4}%)` }}
            />
            <div className="text-[10px] text-muted-foreground mt-1">Reserved for employee stock options (created at founding)</div>
          </div>
        </div>

        {/* Round controls */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Funding Rounds</div>
          {rounds.map(round => (
            <div key={round.id}
              className={`rounded-lg border transition-all ${round.enabled ? 'border-border bg-card' : 'border-dashed border-border/50 bg-secondary/20 opacity-60'}`}>
              <div className="p-3">
                <div className="flex items-center gap-3 mb-2">
                  {/* Toggle */}
                  <button
                    onClick={() => updateRound(round.id, 'enabled', !round.enabled)}
                    className={`w-9 h-5 rounded-full transition-all relative shrink-0 ${round.enabled ? 'bg-accent' : 'bg-border'}`}
                    style={round.enabled ? { background: round.color } : {}}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-all ${round.enabled ? 'left-4.5' : 'left-0.5'}`}
                      style={{ left: round.enabled ? '18px' : '2px' }} />
                  </button>
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ background: round.color }} />
                  <span className="text-sm font-semibold text-foreground w-20 shrink-0">{round.name}</span>

                  {round.enabled && (
                    <div className="flex gap-3 flex-1 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-1 min-w-[120px]">
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">Dilution:</span>
                        <input
                          type="number" min={1} max={50} step={0.5}
                          value={round.dilutionPct}
                          onChange={e => updateRound(round.id, 'dilutionPct', parseFloat(e.target.value) || 0)}
                          className="vc-input w-16 px-2 py-1 text-xs text-center"
                        />
                        <span className="text-[10px] text-muted-foreground">%</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-1 min-w-[140px]">
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">Raise:</span>
                        <span className="text-[10px] text-muted-foreground">$</span>
                        <input
                          type="number" min={0}
                          value={round.investmentAmount}
                          onChange={e => updateRound(round.id, 'investmentAmount', parseInt(e.target.value) || 0)}
                          className="vc-input w-24 px-2 py-1 text-xs"
                        />
                      </div>
                      <div className="text-xs text-muted-foreground self-center font-mono">
                        → Post-money: <span className="text-foreground font-semibold">{fmt(round.investmentAmount / (round.dilutionPct / 100))}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Final Founder Ownership', value: fmtPct(finalStage.founderPct), sub: 'after all rounds', color: '#C4614A' },
          { label: 'Implied Founder Value', value: fmt(finalStage.impliedFounderValue), sub: 'at last post-money', color: '#10B981' },
          { label: 'Total Capital Raised', value: fmt(totalRaised), sub: 'across all rounds', color: '#2D4A6B' },
          { label: 'Final Post-Money', value: fmt(finalStage.postMoney), sub: 'company valuation', color: '#8B4A38' },
        ].map(m => (
          <div key={m.label} className="border border-border rounded-xl p-3 bg-card text-center">
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">{m.label}</div>
            <div className="text-lg font-bold metric-value" style={{ color: m.color }}>{m.value}</div>
            <div className="text-[9px] text-muted-foreground">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Stacked area chart */}
      <div className="border border-border rounded-xl p-4 bg-card">
        <div className="text-xs font-semibold text-foreground mb-3">Ownership Distribution Over Time</div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={areaData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gFounders" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#C4614A" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#C4614A" stopOpacity={0.2} />
              </linearGradient>
              <linearGradient id="gInvestors" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2D4A6B" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#2D4A6B" stopOpacity={0.2} />
              </linearGradient>
              <linearGradient id="gPool" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8B4A38" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#8B4A38" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.88 0.01 80)" />
            <XAxis dataKey="stage" tick={{ fontSize: 10, fontFamily: 'DM Sans' }} />
            <YAxis tick={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }} tickFormatter={v => `${v}%`} domain={[0, 100]} />
            <RechartTooltip
              formatter={(v: any, name: string) => [`${v}%`, name]}
              contentStyle={{ fontSize: 11, fontFamily: 'DM Sans', borderRadius: 6 }}
            />
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'DM Sans' }} />
            <Area type="monotone" dataKey="Founders" stackId="1" stroke="#C4614A" fill="url(#gFounders)" strokeWidth={2} />
            <Area type="monotone" dataKey="Investors" stackId="1" stroke="#2D4A6B" fill="url(#gInvestors)" strokeWidth={2} />
            <Area type="monotone" dataKey="Option Pool" stackId="1" stroke="#8B4A38" fill="url(#gPool)" strokeWidth={1.5} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Per-round table */}
      <div className="border border-border rounded-xl overflow-hidden bg-card">
        <div className="p-4 border-b border-border">
          <div className="text-xs font-semibold text-foreground">Round-by-Round Breakdown</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Stage</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Dilution</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Capital Raised</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Post-Money</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Founder %</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Founder Value</th>
              </tr>
            </thead>
            <tbody>
              {simulation.map((s, i) => (
                <tr key={s.stage} className={`border-b border-border/50 ${i % 2 === 0 ? '' : 'bg-secondary/20'}`}>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                      <span className="font-medium text-foreground">{s.stage}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-muted-foreground">
                    {i === 0 ? '—' : `${rounds.find(r => r.name === s.stage)?.dilutionPct ?? 0}%`}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-muted-foreground">
                    {i === 0 ? '—' : fmt(s.raised)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-foreground font-semibold">{fmt(s.postMoney)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <span className="font-bold metric-value" style={{ color: s.founderPct > 30 ? '#10B981' : s.founderPct > 15 ? '#F59E0B' : '#EF4444' }}>
                      {fmtPct(s.founderPct)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-semibold" style={{ color: '#C4614A' }}>
                    {fmt(s.impliedFounderValue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700 leading-relaxed">
        <strong>Note:</strong> This simulator shows economic dilution only. Actual ownership depends on option pool refreshes, convertible notes, SAFEs, and pro-rata rights. Always model with a cap table tool before signing term sheets.
      </div>
    </div>
  );
}
