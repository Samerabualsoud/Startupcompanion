/**
 * ScenarioComparison — Save and compare multiple valuation scenarios side-by-side
 * Design: "Venture Capital Clarity" — Editorial Finance
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, BookmarkPlus, BarChart3 } from 'lucide-react';
import { formatCurrency, type SavedScenario } from '@/lib/valuation';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip,
  ResponsiveContainer, Cell, Legend,
} from 'recharts';

const SCENARIO_COLORS = ['#C4614A', '#0F1B2D', '#8B4A38', '#2D4A6B', '#A0522D', '#1B3A5C'];

interface Props {
  scenarios: SavedScenario[];
  onDelete: (id: string) => void;
}

export default function ScenarioComparison({ scenarios, onDelete }: Props) {
  if (scenarios.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <BookmarkPlus className="w-10 h-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm font-medium text-muted-foreground">No saved scenarios yet</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
          Adjust your inputs and click "Save Scenario" to compare different valuations side-by-side.
        </p>
      </div>
    );
  }

  // Chart data: one entry per method, one bar per scenario
  const methods = scenarios[0].summary.results.map(r => r.method.replace('Discounted Cash Flow', 'DCF').replace('Comparable Transactions', 'Comps').replace('Risk-Factor Summation', 'Risk-Factor').replace('First Chicago Method', 'First Chicago'));

  const chartData = methods.map((method, mi) => {
    const entry: Record<string, any> = { method };
    scenarios.forEach(s => {
      entry[s.name] = Math.round(s.summary.results[mi].value / 1e6 * 100) / 100;
    });
    return entry;
  });

  // Blended comparison
  const blendedData = scenarios.map(s => ({
    name: s.name,
    blended: Math.round(s.summary.blended / 1e6 * 100) / 100,
    low: Math.round(s.summary.weightedLow / 1e6 * 100) / 100,
    high: Math.round(s.summary.weightedHigh / 1e6 * 100) / 100,
  }));

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-foreground" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          Scenario Comparison
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {scenarios.length} saved scenario{scenarios.length !== 1 ? 's' : ''} — comparing blended valuations and method breakdowns
        </p>
      </div>

      {/* Blended Summary Cards */}
      <div className="grid grid-cols-1 gap-3">
        <AnimatePresence>
          {scenarios.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-md border border-border bg-card overflow-hidden"
            >
              <div className="flex items-center justify-between px-3 py-2 border-b border-border" style={{ borderLeftWidth: 3, borderLeftColor: SCENARIO_COLORS[i % SCENARIO_COLORS.length] }}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: SCENARIO_COLORS[i % SCENARIO_COLORS.length] }} />
                  <span className="text-xs font-semibold text-foreground">{s.name}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">{s.savedAt}</span>
                </div>
                <button onClick={() => onDelete(s.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-0 divide-x divide-border">
                <div className="px-3 py-2">
                  <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">Blended</div>
                  <div className="text-sm font-bold metric-value" style={{ color: SCENARIO_COLORS[i % SCENARIO_COLORS.length] }}>
                    {formatCurrency(s.summary.blended, true)}
                  </div>
                </div>
                <div className="px-3 py-2">
                  <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">Stage</div>
                  <div className="text-xs font-semibold text-foreground">{s.summary.stage}</div>
                </div>
                <div className="px-3 py-2">
                  <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">Sector</div>
                  <div className="text-xs font-semibold text-foreground capitalize">{s.inputs.sector}</div>
                </div>
                <div className="px-3 py-2">
                  <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">Confidence</div>
                  <div className="text-xs font-semibold text-foreground">{s.summary.confidenceScore}%</div>
                </div>
              </div>
              <div className="px-3 pb-2 flex items-center gap-4 text-[10px] text-muted-foreground border-t border-border/50 pt-2">
                <span>ARR: <span className="font-mono font-semibold text-foreground">{formatCurrency(s.inputs.currentARR, true)}</span></span>
                <span>Growth: <span className="font-mono font-semibold text-foreground">{s.inputs.revenueGrowthRate}%</span></span>
                <span>Margin: <span className="font-mono font-semibold text-foreground">{s.inputs.grossMargin}%</span></span>
                <span>Range: <span className="font-mono text-foreground">{formatCurrency(s.summary.weightedLow, true)} – {formatCurrency(s.summary.weightedHigh, true)}</span></span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Blended Bar Chart */}
      {scenarios.length > 1 && (
        <div className="rounded-md border border-border bg-card p-4">
          <div className="text-xs font-semibold text-foreground mb-3" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Blended Valuation Comparison
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={blendedData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.88 0.01 80)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fontFamily: 'DM Sans' }} />
              <YAxis tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} tickFormatter={v => `$${v}M`} />
              <RechartTooltip
                formatter={(v: any) => [`$${v}M`, 'Blended']}
                contentStyle={{ fontSize: 11, fontFamily: 'DM Sans', borderRadius: 4 }}
              />
              <Bar dataKey="blended" radius={[3, 3, 0, 0]}>
                {blendedData.map((_, i) => (
                  <Cell key={i} fill={SCENARIO_COLORS[i % SCENARIO_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Method-by-Method Chart */}
      {scenarios.length > 1 && (
        <div className="rounded-md border border-border bg-card p-4">
          <div className="text-xs font-semibold text-foreground mb-3" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Method-by-Method Comparison ($M)
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.88 0.01 80)" vertical={false} />
              <XAxis dataKey="method" tick={{ fontSize: 9, fontFamily: 'DM Sans' }} angle={-35} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} tickFormatter={v => `$${v}M`} />
              <RechartTooltip
                formatter={(v: any, name: string) => [`$${v}M`, name]}
                contentStyle={{ fontSize: 11, fontFamily: 'DM Sans', borderRadius: 4 }}
              />
              <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'DM Sans', paddingTop: 8 }} />
              {scenarios.map((s, i) => (
                <Bar key={s.id} dataKey={s.name} fill={SCENARIO_COLORS[i % SCENARIO_COLORS.length]} radius={[2, 2, 0, 0]} opacity={0.85} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
