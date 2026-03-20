/**
 * AdvancedDilutionSimulator — Round-by-round dilution using unified cap table
 * Founders and ESOP pool are read from the ZestEquity cap table.
 * Funding rounds are local to this tool.
 */
import { useState, useMemo, useEffect } from 'react';
import { Link2, RefreshCw } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { useReport } from '@/contexts/ReportContext';
import { useToolState } from '@/hooks/useToolState';
import { useCapTable } from '@/hooks/useCapTable';
import ToolGuide from '@/components/ToolGuide';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Round {
  id: string;
  name: string;
  enabled: boolean;
  dilutionPct: number;
  investmentAmount: number;
  color: string;
}

interface RoundsState {
  rounds: Round[];
  initialValuation: number;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_ROUNDS: Round[] = [
  { id: 'pre-seed', name: 'Pre-Seed',  enabled: true,  dilutionPct: 10, investmentAmount: 500_000,    color: '#C4614A' },
  { id: 'seed',     name: 'Seed',      enabled: true,  dilutionPct: 15, investmentAmount: 2_000_000,  color: '#8B4A38' },
  { id: 'series-a', name: 'Series A',  enabled: true,  dilutionPct: 20, investmentAmount: 10_000_000, color: '#2D4A6B' },
  { id: 'series-b', name: 'Series B',  enabled: false, dilutionPct: 15, investmentAmount: 30_000_000, color: '#1B3A5C' },
  { id: 'series-c', name: 'Series C',  enabled: false, dilutionPct: 12, investmentAmount: 80_000_000, color: '#0F1B2D' },
  { id: 'series-d', name: 'Series D',  enabled: false, dilutionPct: 10, investmentAmount: 150_000_000,color: '#4A2D1B' },
  { id: 'series-e', name: 'Series E',  enabled: false, dilutionPct: 8,  investmentAmount: 300_000_000,color: '#1B4A2D' },
];

const DEFAULT_ROUNDS_STATE: RoundsState = {
  rounds: DEFAULT_ROUNDS,
  initialValuation: 3_000_000,
};

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
  const { state: capState, isLoading, computed } = useCapTable();
  const { state: roundsState, setState: setRoundsState } = useToolState<RoundsState>('dilution_rounds', DEFAULT_ROUNDS_STATE);
  const { setDilution } = useReport();

  const rounds = roundsState.rounds;
  const initialValuation = roundsState.initialValuation;

  const setRounds = (updater: Round[] | ((prev: Round[]) => Round[])) =>
    setRoundsState(prev => ({ ...prev, rounds: typeof updater === 'function' ? updater(prev.rounds) : updater }));
  const setInitialValuation = (v: number) =>
    setRoundsState(prev => ({ ...prev, initialValuation: v }));

  const updateRound = (id: string, field: keyof Round, value: unknown) => {
    setRounds(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  // Derive founders from cap table — safe even when capState is null
  const founders = capState?.shareholders.filter(s => s.type === 'founder') ?? [];
  const totalSharesBasic = computed?.totalSharesBasic ?? 1;
  const founderInitialPcts = founders.map(f => (f.shares / totalSharesBasic) * 100);
  const esopInitialPct = computed?.esopPct ?? (capState?.esop.totalPoolShares ?? 0) / totalSharesBasic * 100;

  // ── Simulation — MUST be before any early return ────────────────────────────

  const simulation = useMemo(() => {
    const enabledRounds = rounds.filter(r => r.enabled);

    let founderPcts = [...founderInitialPcts];
    let optPct = esopInitialPct;
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

    path.push({
      stage: 'Founding',
      founders: founders.map((f, i) => ({
        id: f.id, name: f.name,
        pct: founderPcts[i],
        value: (founderPcts[i] / 100) * initialValuation,
        color: f.color,
      })),
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
          id: f.id, name: f.name,
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
  }, [founders, founderInitialPcts, esopInitialPct, rounds, initialValuation]);

  const finalStage = simulation[simulation.length - 1];
  const totalRaised = rounds.filter(r => r.enabled).reduce((s, r) => s + r.investmentAmount, 0);

  // Area chart data
  const areaData = simulation.map(s => {
    const row: Record<string, number | string> = { stage: s.stage };
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

  if (isLoading || !capState) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Education panel */}
      <ToolGuide
        toolName="Dilution Simulator"
        tagline="Model how each funding round dilutes founder and ESOP ownership, round by round."
        steps={[
          { step: 1, title: 'Review your starting cap table', description: 'Founders and ESOP pool are pulled automatically from Zest Equity. If the numbers look wrong, update them in the Cap Table tool first.' },
          { step: 2, title: 'Set starting valuation', description: 'Enter your pre-money valuation before any investment. This is the baseline for calculating post-money values after each round.' },
          { step: 3, title: 'Enable and configure rounds', description: 'Toggle rounds on/off and set the dilution % for each. A typical Seed round dilutes 15–20%, Series A 20–25%. The investment amount is auto-calculated.' },
          { step: 4, title: 'Read the area chart', description: 'The chart shows how each founder\'s ownership % decreases after each round. Hover over any point to see exact percentages at that stage.' },
          { step: 5, title: 'Check the ownership table', description: 'The table shows ownership at each stage for every stakeholder — founders, ESOP pool, and investors combined.' },
        ]}
        concepts={[
          { term: 'Dilution', definition: 'When new shares are issued to investors, existing shareholders own a smaller % of the company — even though their share count doesn\'t change.' },
          { term: 'Pre-money valuation', definition: 'Company value before new investment. Post-money = pre-money + investment amount.' },
          { term: 'ESOP dilution', definition: 'Investors often require the ESOP pool to be set up before the round (pre-money), which dilutes founders more than investors.' },
          { term: 'Anti-dilution', definition: 'A provision that protects investors from dilution in down rounds. Common types: broad-based weighted average and full ratchet.' },
        ]}
        tip="Founders are often surprised by how much a 20% Seed + 20% ESOP pool + 25% Series A leaves them with. Model this before signing any term sheet. A founder with 60% pre-Seed can end up with ~30% post-Series A."
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground mb-1">Dilution Simulator</h2>
          <p className="text-sm text-muted-foreground">
            Founders and ESOP pool are read from the Cap Table. Set dilution per round to see how ownership evolves from Pre-Seed through Series E.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full shrink-0">
          <Link2 className="w-3 h-3" />
          <span>Synced with Cap Table</span>
        </div>
      </div>

      {/* ── Founders from Cap Table ── */}
      <div className="border border-border rounded-xl overflow-hidden bg-card">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div>
            <div className="text-sm font-semibold text-foreground">Founding Team Equity (from Cap Table)</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              Edit founders in the Cap Table tool · ESOP: <span className="font-bold text-foreground">{esopInitialPct.toFixed(1)}%</span>
            </div>
          </div>
        </div>
        <div className="divide-y divide-border">
          {founders.map((founder, idx) => {
            const pct = founderInitialPcts[idx];
            return (
              <div key={founder.id} className="p-3 flex items-center gap-3 flex-wrap">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ background: founder.color }} />
                <span className="text-sm font-semibold text-foreground flex-1">{founder.name}</span>
                <span className="text-xs text-muted-foreground">{founder.shares.toLocaleString()} shares</span>
                <div className="flex items-center gap-2 w-32">
                  <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: founder.color }} />
                  </div>
                  <span className="text-xs font-bold w-10 text-right" style={{ color: founder.color }}>{pct.toFixed(1)}%</span>
                </div>
              </div>
            );
          })}
          {founders.length === 0 && (
            <div className="p-4 text-sm text-muted-foreground text-center">
              No founders in cap table. Add founders in the Cap Table tool.
            </div>
          )}
        </div>
        {/* ESOP row */}
        <div className="px-4 py-3 border-t border-border bg-secondary/20 flex items-center gap-3 flex-wrap">
          <div className="w-3 h-3 rounded-full bg-purple-400 shrink-0" />
          <span className="text-sm font-medium text-foreground flex-1">Employee Option Pool (ESOP)</span>
          <span className="text-xs font-bold text-purple-600">{esopInitialPct.toFixed(1)}%</span>
          <span className="text-[10px] text-muted-foreground">({capState.esop.totalPoolShares.toLocaleString()} shares)</span>
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
            className="w-full pl-7 pr-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400"
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
                <button
                  onClick={() => updateRound(round.id, 'enabled', !round.enabled)}
                  className="w-9 h-5 rounded-full transition-all relative shrink-0"
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
                        className="w-14 px-2 py-1 text-xs text-center border border-border rounded-lg bg-background focus:outline-none"
                      />
                      <span className="text-[10px] text-muted-foreground">%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">Raise: $</span>
                      <input
                        type="number" min={0}
                        value={round.investmentAmount}
                        onChange={e => updateRound(round.id, 'investmentAmount', parseInt(e.target.value) || 0)}
                        className="w-24 px-2 py-1 text-xs border border-border rounded-lg bg-background focus:outline-none"
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
              <div className="text-lg font-bold" style={{ color: f.color }}>{fmtPct(finalFounder?.pct ?? 0)}</div>
              <div className="text-[9px] text-muted-foreground">{fmt(finalFounder?.value ?? 0)}</div>
            </div>
          );
        })}
        <div className="border border-border rounded-xl p-3 bg-card text-center">
          <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">Total Raised</div>
          <div className="text-lg font-bold" style={{ color: '#2D4A6B' }}>{fmt(totalRaised)}</div>
          <div className="text-[9px] text-muted-foreground">across all rounds</div>
        </div>
        <div className="border border-border rounded-xl p-3 bg-card text-center">
          <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">Final Post-Money</div>
          <div className="text-lg font-bold" style={{ color: '#10B981' }}>{fmt(finalStage.postMoney)}</div>
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
            <XAxis dataKey="stage" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} domain={[0, 100]} />
            <RechartTooltip
              formatter={(v: number, name: string) => [`${v}%`, name]}
              contentStyle={{ fontSize: 11, borderRadius: 6 }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
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
