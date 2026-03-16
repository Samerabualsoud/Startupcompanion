/**
 * AdvancedDilutionSimulator — Named founders + pre-investment equity + round-by-round dilution
 * Design: "Venture Capital Clarity" — Editorial Finance
 */

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, UserPlus, Info } from 'lucide-react';
import { nanoid } from 'nanoid';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip,
  ResponsiveContainer, Legend, BarChart, Bar, Cell,
} from 'recharts';
import { useReport } from '@/contexts/ReportContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Founder {
  id: string;
  name: string;
  role: string;
  initialPct: number; // % before any investment
  color: string;
}

interface Round {
  id: string;
  name: string;
  enabled: boolean;
  dilutionPct: number;
  investmentAmount: number;
  color: string;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const FOUNDER_COLORS = ['#C4614A', '#2D4A6B', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

const DEFAULT_FOUNDERS: Founder[] = [
  { id: nanoid(), name: 'Founder 1', role: 'CEO', initialPct: 50, color: FOUNDER_COLORS[0] },
  { id: nanoid(), name: 'Founder 2', role: 'CTO', initialPct: 40, color: FOUNDER_COLORS[1] },
];

const DEFAULT_ROUNDS: Round[] = [
  { id: 'pre-seed', name: 'Pre-Seed',  enabled: true,  dilutionPct: 10, investmentAmount: 500_000,    color: '#C4614A' },
  { id: 'seed',     name: 'Seed',      enabled: true,  dilutionPct: 15, investmentAmount: 2_000_000,  color: '#8B4A38' },
  { id: 'series-a', name: 'Series A',  enabled: true,  dilutionPct: 20, investmentAmount: 10_000_000, color: '#2D4A6B' },
  { id: 'series-b', name: 'Series B',  enabled: false, dilutionPct: 15, investmentAmount: 30_000_000, color: '#1B3A5C' },
  { id: 'series-c', name: 'Series C',  enabled: false, dilutionPct: 12, investmentAmount: 80_000_000, color: '#0F1B2D' },
  { id: 'series-d', name: 'Series D',  enabled: false, dilutionPct: 10, investmentAmount: 150_000_000,color: '#4A2D1B' },
  { id: 'series-e', name: 'Series E',  enabled: false, dilutionPct: 8,  investmentAmount: 300_000_000,color: '#1B4A2D' },
];

const OPTION_POOL_DEFAULT = 10;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}
function fmtPct(n: number) { return `${n.toFixed(1)}%`; }

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdvancedDilutionSimulator() {
  const [founders, setFounders] = useState<Founder[]>(DEFAULT_FOUNDERS);
  const [rounds, setRounds] = useState<Round[]>(DEFAULT_ROUNDS);
  const [optionPool, setOptionPool] = useState(OPTION_POOL_DEFAULT);
  const [initialValuation, setInitialValuation] = useState(3_000_000);
  const { setDilution } = useReport();

  // ── Founder management ──────────────────────────────────────────────────────

  const totalFounderPct = founders.reduce((s, f) => s + f.initialPct, 0);
  const remainingPct = Math.max(0, 100 - optionPool - totalFounderPct);

  const addFounder = () => {
    if (founders.length >= 6) return;
    setFounders(prev => [...prev, {
      id: nanoid(),
      name: `Founder ${prev.length + 1}`,
      role: 'Co-Founder',
      initialPct: 0,
      color: FOUNDER_COLORS[prev.length % FOUNDER_COLORS.length],
    }]);
  };

  const updateFounder = (id: string, field: keyof Founder, value: any) => {
    setFounders(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  const removeFounder = (id: string) => {
    if (founders.length <= 1) return;
    setFounders(prev => prev.filter(f => f.id !== id));
  };

  const updateRound = (id: string, field: keyof Round, value: any) => {
    setRounds(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  // ── Simulation ──────────────────────────────────────────────────────────────

  const simulation = useMemo(() => {
    const enabledRounds = rounds.filter(r => r.enabled);

    // Starting ownership per founder (fraction of total)
    let founderPcts = founders.map(f => f.initialPct);
    let optPct = optionPool;
    let investorPct = 0;
    let currentPostMoney = initialValuation;

    type StageRow = {
      stage: string;
      founders: { id: string; name: string; pct: number; value: number; color: string }[];
      optionPoolPct: number;
      investorPct: number;
      postMoney: number;
      raised: number;
    };

    const path: StageRow[] = [];

    // Founding stage
    path.push({
      stage: 'Founding',
      founders: founders.map((f, i) => ({ id: f.id, name: f.name, pct: founderPcts[i], value: (founderPcts[i] / 100) * initialValuation, color: f.color })),
      optionPoolPct: optPct,
      investorPct: 0,
      postMoney: initialValuation,
      raised: 0,
    });

    for (const round of enabledRounds) {
      const dilFrac = round.dilutionPct / 100;
      founderPcts = founderPcts.map(p => p * (1 - dilFrac));
      optPct = optPct * (1 - dilFrac);
      investorPct = investorPct * (1 - dilFrac) + round.dilutionPct;
      const postMoney = round.investmentAmount / dilFrac;
      currentPostMoney = postMoney;

      path.push({
        stage: round.name,
        founders: founders.map((f, i) => ({
          id: f.id,
          name: f.name,
          pct: Math.round(founderPcts[i] * 10) / 10,
          value: (founderPcts[i] / 100) * postMoney,
          color: f.color,
        })),
        optionPoolPct: Math.round(optPct * 10) / 10,
        investorPct: Math.round(investorPct * 10) / 10,
        postMoney,
        raised: round.investmentAmount,
      });
    }

    return path;
  }, [founders, rounds, optionPool, initialValuation]);

  const finalStage = simulation[simulation.length - 1];
  const totalRaised = rounds.filter(r => r.enabled).reduce((s, r) => s + r.investmentAmount, 0);

  // Area chart data
  const areaData = simulation.map(s => {
    const row: Record<string, any> = { stage: s.stage };
    s.founders.forEach(f => { row[f.name] = parseFloat(f.pct.toFixed(1)); });
    row['Investors'] = parseFloat(s.investorPct.toFixed(1));
    row['Option Pool'] = parseFloat(s.optionPoolPct.toFixed(1));
    return row;
  });

  const areaKeys = [...founders.map(f => f.name), 'Investors', 'Option Pool'];
  const areaColors = [...founders.map(f => f.color), '#6B7280', '#D1D5DB'];

  // Publish dilution data to report context
  useEffect(() => {
    const reportData = simulation.map(s => ({
      stage: s.stage,
      founders: s.founders.map(f => ({ name: f.name, pct: f.pct, value: f.value })),
      investorPct: s.investorPct,
      postMoney: s.postMoney,
      raised: s.raised,
    }));
    setDilution(reportData);
  }, [simulation, setDilution]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
          Dilution Simulator
        </h2>
        <p className="text-sm text-muted-foreground">
          Add your founders with their current equity, set dilution per round, and see exactly how ownership evolves from Pre-Seed through Series E.
        </p>
      </div>

      {/* ── Founders Section ── */}
      <div className="border border-border rounded-xl overflow-hidden bg-card">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div>
            <div className="text-sm font-semibold text-foreground">Founding Team Equity</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              Total assigned: <span className={`font-bold ${totalFounderPct + optionPool > 100 ? 'text-red-500' : 'text-foreground'}`}>{totalFounderPct + optionPool}%</span>
              {' '}· Unallocated: <span className="font-bold text-muted-foreground">{remainingPct.toFixed(1)}%</span>
            </div>
          </div>
          <button
            onClick={addFounder}
            disabled={founders.length >= 6}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40"
            style={{ background: '#C4614A' }}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Add Founder
          </button>
        </div>

        <div className="divide-y divide-border">
          {founders.map((founder, idx) => (
            <div key={founder.id} className="p-3 flex items-center gap-3 flex-wrap">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ background: founder.color }} />
              <div className="flex gap-2 flex-1 flex-wrap min-w-0">
                <input
                  value={founder.name}
                  onChange={e => updateFounder(founder.id, 'name', e.target.value)}
                  placeholder="Founder name"
                  className="vc-input px-2.5 py-1.5 text-sm font-medium w-32"
                />
                <input
                  value={founder.role}
                  onChange={e => updateFounder(founder.id, 'role', e.target.value)}
                  placeholder="Role (CEO, CTO...)"
                  className="vc-input px-2.5 py-1.5 text-xs text-muted-foreground w-28"
                />
                <div className="flex items-center gap-1.5">
                  <input
                    type="number" min={0} max={100} step={0.5}
                    value={founder.initialPct}
                    onChange={e => updateFounder(founder.id, 'initialPct', parseFloat(e.target.value) || 0)}
                    className="vc-input w-16 px-2 py-1.5 text-sm text-center font-bold"
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
                {/* Mini bar */}
                <div className="flex-1 min-w-[80px] flex items-center">
                  <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(founder.initialPct, 100)}%`, background: founder.color }} />
                  </div>
                </div>
              </div>
              {founders.length > 1 && (
                <button onClick={() => removeFounder(founder.id)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Option pool */}
        <div className="px-4 py-3 border-t border-border bg-secondary/20 flex items-center gap-3 flex-wrap">
          <div className="w-3 h-3 rounded-full bg-gray-300 shrink-0" />
          <span className="text-sm font-medium text-foreground flex-1">Employee Option Pool (ESOP)</span>
          <div className="flex items-center gap-1.5">
            <input
              type="number" min={0} max={30} step={1}
              value={optionPool}
              onChange={e => setOptionPool(Math.max(0, parseInt(e.target.value) || 0))}
              className="vc-input w-16 px-2 py-1.5 text-sm text-center font-bold"
            />
            <span className="text-xs text-muted-foreground">%</span>
          </div>
          {totalFounderPct + optionPool > 100 && (
            <span className="text-[10px] text-red-500 font-semibold">⚠ Total exceeds 100%</span>
          )}
        </div>
      </div>

      {/* ── Company Valuation ── */}
      <div className="border border-border rounded-xl p-4 bg-card">
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
          Starting Pre-Money Valuation (before any investment)
        </label>
        <div className="relative max-w-xs">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
          <input
            type="number" value={initialValuation}
            onChange={e => setInitialValuation(Math.max(0, parseInt(e.target.value) || 0))}
            className="vc-input w-full pl-7 pr-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* ── Rounds ── */}
      <div className="border border-border rounded-xl overflow-hidden bg-card">
        <div className="px-4 py-3 border-b border-border">
          <div className="text-sm font-semibold text-foreground">Funding Rounds</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Toggle rounds on/off and set the dilution % and amount raised per round.</div>
        </div>
        <div className="divide-y divide-border">
          {rounds.map(round => (
            <div key={round.id} className={`p-3 transition-all ${!round.enabled ? 'opacity-50' : ''}`}>
              <div className="flex items-center gap-3 flex-wrap">
                {/* Toggle */}
                <button
                  onClick={() => updateRound(round.id, 'enabled', !round.enabled)}
                  className={`w-9 h-5 rounded-full transition-all relative shrink-0`}
                  style={{ background: round.enabled ? round.color : 'oklch(0.88 0.01 80)' }}
                >
                  <div className="w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-all"
                    style={{ left: round.enabled ? '18px' : '2px' }} />
                </button>
                <div className="w-3 h-3 rounded-full shrink-0" style={{ background: round.color }} />
                <span className="text-sm font-semibold text-foreground w-20 shrink-0">{round.name}</span>

                {round.enabled && (
                  <div className="flex gap-3 flex-1 flex-wrap items-center">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">Dilution:</span>
                      <input
                        type="number" min={1} max={50} step={0.5}
                        value={round.dilutionPct}
                        onChange={e => updateRound(round.id, 'dilutionPct', parseFloat(e.target.value) || 0)}
                        className="vc-input w-14 px-2 py-1 text-xs text-center"
                      />
                      <span className="text-[10px] text-muted-foreground">%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">Raise: $</span>
                      <input
                        type="number" min={0}
                        value={round.investmentAmount}
                        onChange={e => updateRound(round.id, 'investmentAmount', parseInt(e.target.value) || 0)}
                        className="vc-input w-24 px-2 py-1 text-xs"
                      />
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono">
                      Post-money: <span className="text-foreground font-semibold">{fmt(round.investmentAmount / (round.dilutionPct / 100))}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Summary Metrics ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {founders.map(f => {
          const finalFounder = finalStage.founders.find(ff => ff.id === f.id);
          return (
            <div key={f.id} className="border border-border rounded-xl p-3 bg-card text-center">
              <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">{f.name}</div>
              <div className="text-[10px] text-muted-foreground mb-1">{f.role}</div>
              <div className="text-lg font-bold metric-value" style={{ color: f.color }}>{fmtPct(finalFounder?.pct ?? 0)}</div>
              <div className="text-[9px] text-muted-foreground">{fmt(finalFounder?.value ?? 0)}</div>
            </div>
          );
        })}
        <div className="border border-border rounded-xl p-3 bg-card text-center">
          <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">Total Raised</div>
          <div className="text-lg font-bold metric-value" style={{ color: '#2D4A6B' }}>{fmt(totalRaised)}</div>
          <div className="text-[9px] text-muted-foreground">across all rounds</div>
        </div>
        <div className="border border-border rounded-xl p-3 bg-card text-center">
          <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">Final Post-Money</div>
          <div className="text-lg font-bold metric-value" style={{ color: '#10B981' }}>{fmt(finalStage.postMoney)}</div>
          <div className="text-[9px] text-muted-foreground">company valuation</div>
        </div>
      </div>

      {/* ── Stacked Area Chart ── */}
      <div className="border border-border rounded-xl p-4 bg-card">
        <div className="text-xs font-semibold text-foreground mb-3">Ownership Distribution Over Time</div>
        <ResponsiveContainer width="100%" height={230}>
          <AreaChart data={areaData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              {areaKeys.map((key, i) => (
                <linearGradient key={key} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={areaColors[i]} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={areaColors[i]} stopOpacity={0.15} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.88 0.01 80)" />
            <XAxis dataKey="stage" tick={{ fontSize: 10, fontFamily: 'DM Sans' }} />
            <YAxis tick={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }} tickFormatter={v => `${v}%`} domain={[0, 100]} />
            <RechartTooltip
              formatter={(v: any, name: string) => [`${v}%`, name]}
              contentStyle={{ fontSize: 11, fontFamily: 'DM Sans', borderRadius: 6 }}
            />
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'DM Sans' }} />
            {areaKeys.map((key, i) => (
              <Area key={key} type="monotone" dataKey={key} stackId="1"
                stroke={areaColors[i]} fill={`url(#grad-${i})`} strokeWidth={2} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Per-Round Table ── */}
      <div className="border border-border rounded-xl overflow-hidden bg-card">
        <div className="p-4 border-b border-border">
          <div className="text-xs font-semibold text-foreground">Round-by-Round Breakdown</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Stage</th>
                {founders.map(f => (
                  <th key={f.id} className="text-right px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: f.color }}>{f.name}</th>
                ))}
                <th className="text-right px-3 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Investors</th>
                <th className="text-right px-3 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Post-Money</th>
                <th className="text-right px-3 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Raised</th>
              </tr>
            </thead>
            <tbody>
              {simulation.map((s, i) => (
                <tr key={s.stage} className={`border-b border-border/50 ${i % 2 === 0 ? '' : 'bg-secondary/20'}`}>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: i === 0 ? '#6B7280' : rounds.find(r => r.name === s.stage)?.color ?? '#6B7280' }} />
                      <span className="font-medium text-foreground whitespace-nowrap">{s.stage}</span>
                    </div>
                  </td>
                  {s.founders.map(f => (
                    <td key={f.id} className="px-3 py-2.5 text-right">
                      <span className="font-bold" style={{ color: f.color }}>{fmtPct(f.pct)}</span>
                      <div className="text-[9px] text-muted-foreground font-mono">{fmt(f.value)}</div>
                    </td>
                  ))}
                  <td className="px-3 py-2.5 text-right font-mono text-muted-foreground">{fmtPct(s.investorPct)}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-foreground font-semibold">{fmt(s.postMoney)}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-muted-foreground">{i === 0 ? '—' : fmt(s.raised)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700 leading-relaxed">
        <strong>Note:</strong> This models economic dilution only. Actual ownership depends on option pool refreshes, convertible notes, SAFEs, and pro-rata rights. Always model with a cap table tool (e.g., Carta, Pulley) before signing term sheets.
      </div>
    </div>
  );
}
