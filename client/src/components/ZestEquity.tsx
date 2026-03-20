/**
 * ZestEquity — Unified Cap Table
 * Primary cap table UI. Single source of truth for all equity tools.
 * Manages shareholders, ESOP pool, and convertible instruments (SAFE / Conv. Note / OQAL Note).
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, TrendingUp, Users, DollarSign, ChevronDown, ChevronUp,
  Zap, FileText, Shield, Settings, Save, RefreshCw, Info,
} from 'lucide-react';
import { nanoid } from 'nanoid';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useCapTable } from '@/hooks/useCapTable';
import { useLanguage } from '@/contexts/LanguageContext';
import type {
  CapTableShareholder, CapTableInstrument, EsopPool, ShareClass, HolderType,
} from '@shared/equity';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number, currency: 'SAR' | 'USD' = 'USD'): string {
  const sym = currency === 'SAR' ? 'SAR ' : '$';
  if (Math.abs(n) >= 1_000_000) return `${sym}${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `${sym}${(n / 1_000).toFixed(0)}K`;
  return `${sym}${n.toFixed(0)}`;
}

function fmtPct(n: number): string { return `${n.toFixed(2)}%`; }

function shareClassLabel(sc: ShareClass): string {
  switch (sc) {
    case 'common': return 'Common';
    case 'preferred_seed': return 'Preferred Seed';
    case 'preferred_a': return 'Preferred A';
    case 'preferred_b': return 'Preferred B';
    case 'option': return 'Option';
    case 'warrant': return 'Warrant';
  }
}

function holderTypeLabel(t: HolderType): string {
  switch (t) {
    case 'founder': return 'Founder';
    case 'investor': return 'Investor';
    case 'employee': return 'Employee';
    case 'advisor': return 'Advisor';
    case 'option_pool': return 'Option Pool';
    case 'other': return 'Other';
  }
}

function instrLabel(t: 'safe' | 'convertible_note' | 'oqal_note'): string {
  switch (t) {
    case 'safe': return 'SAFE Note';
    case 'convertible_note': return 'Convertible Note';
    case 'oqal_note': return 'OQAL Note (Shariah)';
  }
}

function instrColor(t: 'safe' | 'convertible_note' | 'oqal_note'): string {
  switch (t) {
    case 'safe': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    case 'convertible_note': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    case 'oqal_note': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
  }
}

const COLORS = [
  '#4F6EF7', '#C4614A', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16',
];

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type TabId = 'cap-table' | 'esop' | 'instruments' | 'settings';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'cap-table', label: 'Cap Table', icon: Users },
  { id: 'instruments', label: 'Notes & SAFEs', icon: FileText },
  { id: 'esop', label: 'ESOP Pool', icon: Zap },
  { id: 'settings', label: 'Settings', icon: Settings },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ZestEquity() {
  const { t } = useLanguage();
  const { state, isLoading, computed, setShareholders, setInstruments, setEsop, update, isSaving } = useCapTable();
  const [activeTab, setActiveTab] = useState<TabId>('cap-table');
  const [showConversion, setShowConversion] = useState(false);

  if (isLoading || !state) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // After the guard above, state and computed are guaranteed non-null
  const s = state!;
  const { rows, totalSharesBasic, totalSharesFullyDiluted, esopPct } = computed!;
  const currency = s.currency;

  // ── Shareholder actions ────────────────────────────────────────────────────

  function addShareholder() {
    const idx = s.shareholders.length;
    const newHolder: CapTableShareholder = {
      id: nanoid(),
      name: `Holder ${idx + 1}`,
      type: 'founder',
      shareClass: 'common',
      shares: 1_000_000,
      pricePerShare: 0,
      vestingMonths: 48,
      cliffMonths: 12,
      vestingStartDate: new Date().toISOString().split('T')[0],
      color: COLORS[idx % COLORS.length],
    };
    setShareholders([...s.shareholders, newHolder]);
  }

  function updateShareholder(id: string, patch: Partial<CapTableShareholder>) {
    setShareholders(s.shareholders.map(sh => sh.id === id ? { ...sh, ...patch } : sh));
  }

  function deleteShareholder(id: string) {
    setShareholders(s.shareholders.filter(sh => sh.id !== id));
  }

  // ── Instrument actions ─────────────────────────────────────────────────────

  function addInstrument(type: 'safe' | 'convertible_note' | 'oqal_note') {
    const idx = s.instruments.length;
    const newInstr: CapTableInstrument = {
      id: nanoid(),
      investorName: `Investor ${idx + 1}`,
      type,
      investmentAmount: 500_000,
      currency,
      valuationCap: 8_000_000,
      discountRate: type === 'oqal_note' ? 0 : 20,
      interestRate: type === 'convertible_note' ? 8 : 0,
      issueDate: new Date().toISOString().split('T')[0],
      maturityMonths: 24,
      qualifiedRoundThreshold: 1_000_000,
      conversionTrigger: 'qualified_round',
      status: 'active',
      color: COLORS[(idx + 5) % COLORS.length],
    };
    setInstruments([...s.instruments, newInstr]);
  }

  function updateInstrument(id: string, patch: Partial<CapTableInstrument>) {
    setInstruments(s.instruments.map(i => i.id === id ? { ...i, ...patch } : i));
  }

  function deleteInstrument(id: string) {
    setInstruments(s.instruments.filter(i => i.id !== id));
  }

  // ── Pie chart data ─────────────────────────────────────────────────────────
  const pieData = rows
    .filter(r => r.shares > 0)
    .map(r => ({ name: r.name, value: r.ownershipPct, color: r.color }));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: 'Playfair Display, serif' }}>
            Zest Equity — Cap Table
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Unified source of truth for all equity tools · {isSaving ? 'Saving…' : 'Auto-saved'}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-green-500" />}
          <span>{isSaving ? 'Saving…' : 'Saved'}</span>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Shareholders', value: s.shareholders.length.toString(), sub: 'founders + investors', icon: Users, color: '#4F6EF7' },
          { label: 'Basic Shares', value: totalSharesBasic.toLocaleString(), sub: 'issued shares', icon: TrendingUp, color: '#10B981' },
          { label: 'Fully Diluted', value: totalSharesFullyDiluted.toLocaleString(), sub: 'incl. ESOP + notes', icon: Zap, color: '#F59E0B' },
          { label: 'ESOP Pool', value: `${esopPct.toFixed(1)}%`, sub: `${s.esop.totalPoolShares.toLocaleString()} shares`, icon: Shield, color: '#8B5CF6' },
        ].map(kpi => (
          <div key={kpi.label} className="p-3.5 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `${kpi.color}20` }}>
                <kpi.icon className="w-3.5 h-3.5" style={{ color: kpi.color }} />
              </div>
              <span className="text-xs text-muted-foreground">{kpi.label}</span>
            </div>
            <div className="text-lg font-bold text-foreground">{kpi.value}</div>
            <div className="text-[10px] text-muted-foreground">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Cap Table ── */}
      {activeTab === 'cap-table' && (
        <div className="space-y-4">
          {/* Pie + table layout */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Pie chart */}
            <div className="lg:col-span-2 p-4 rounded-xl border border-border bg-card">
              <div className="text-sm font-semibold text-foreground mb-3">Ownership Distribution</div>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="value">
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => [`${v.toFixed(2)}%`, 'Ownership']} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 text-center">
                <div className="text-xs text-muted-foreground">Fully diluted basis</div>
                <div className="text-sm font-semibold text-foreground">{totalSharesFullyDiluted.toLocaleString()} shares</div>
              </div>
            </div>

            {/* Table */}
            <div className="lg:col-span-3 rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary/50">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Holder</th>
                    <th className="text-right px-3 py-2.5 text-xs font-semibold text-muted-foreground">Shares</th>
                    <th className="text-right px-3 py-2.5 text-xs font-semibold text-muted-foreground">Basic %</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground">Diluted %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((row, i) => (
                    <tr key={row.id} className={i % 2 === 0 ? 'bg-background' : 'bg-secondary/10'}>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: row.color }} />
                          <span className="font-medium text-foreground text-xs">{row.name}</span>
                          {row.instrumentType && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground capitalize">
                              {row.instrumentType.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right text-xs text-foreground font-mono">{row.shares.toLocaleString()}</td>
                      <td className="px-3 py-2.5 text-right text-xs text-foreground">{fmtPct(row.ownershipPctBasic)}</td>
                      <td className="px-4 py-2.5 text-right text-xs font-semibold" style={{ color: row.color }}>{fmtPct(row.ownershipPct)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Shareholders list */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-foreground">Shareholders</div>
              <button
                onClick={addShareholder}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Holder
              </button>
            </div>
            <div className="space-y-2">
              <AnimatePresence>
                {s.shareholders.map(holder => (
                  <ShareholderRow
                    key={holder.id}
                    holder={holder}
                    totalSharesBasic={totalSharesBasic}
                    onUpdate={patch => updateShareholder(holder.id, patch)}
                    onDelete={() => deleteShareholder(holder.id)}
                  />
                ))}
              </AnimatePresence>
              {s.shareholders.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No shareholders yet. Add founders to get started.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Notes & SAFEs ── */}
      {activeTab === 'instruments' && (
        <div className="space-y-4">
          {/* Add buttons */}
          <div className="flex flex-wrap gap-2">
            {(['safe', 'convertible_note', 'oqal_note'] as const).map(type => (
              <button
                key={type}
                onClick={() => addInstrument(type)}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                  type === 'oqal_note'
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : type === 'safe'
                    ? 'bg-amber-500 text-white hover:bg-amber-600'
                    : 'bg-orange-500 text-white hover:bg-orange-600'
                }`}
              >
                <Plus className="w-3.5 h-3.5" /> Add {instrLabel(type)}
              </button>
            ))}
          </div>

          {/* Conversion preview toggle */}
          <div className="p-3.5 rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-foreground">Conversion Scenario</div>
              <button onClick={() => setShowConversion(v => !v)} className="text-xs text-indigo-600 flex items-center gap-1">
                {showConversion ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                {showConversion ? 'Hide' : 'Show'} preview
              </button>
            </div>
            {showConversion && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Next Round Pre-Money Valuation ({currency})</label>
                  <input
                    type="number"
                    className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    value={s.nextRoundPreMoneyValuation}
                    onChange={e => update({ nextRoundPreMoneyValuation: Math.max(0, parseInt(e.target.value) || 0) })}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">New Investment ({currency})</label>
                  <input
                    type="number"
                    className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    value={s.nextRoundInvestment}
                    onChange={e => update({ nextRoundInvestment: Math.max(0, parseInt(e.target.value) || 0) })}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Instruments list */}
          <div className="space-y-2">
            <AnimatePresence>
              {s.instruments.map(instr => (
                <InstrumentRow
                  key={instr.id}
                  instrument={instr}
                  currency={currency}
                  totalSharesFullyDiluted={totalSharesFullyDiluted}
                  nextRoundPreMoney={s.nextRoundPreMoneyValuation}
                  totalAuthorizedShares={s.totalAuthorizedShares}
                  onUpdate={patch => updateInstrument(instr.id, patch)}
                  onDelete={() => deleteInstrument(instr.id)}
                />
              ))}
            </AnimatePresence>
            {s.instruments.length === 0 && (
              <div className="text-center py-10 text-muted-foreground text-sm">
                No convertible instruments yet. Add a SAFE, Convertible Note, or OQAL Note above.
              </div>
            )}
          </div>

          {/* Instrument comparison table */}
          <div className="p-4 rounded-xl border border-border bg-card">
            <div className="text-sm font-semibold text-foreground mb-3">Instrument Comparison</div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Feature</th>
                    <th className="text-center py-2 px-3 text-amber-600 font-semibold">SAFE Note</th>
                    <th className="text-center py-2 px-3 text-orange-600 font-semibold">Conv. Note</th>
                    <th className="text-center py-2 px-3 text-emerald-600 font-semibold">OQAL Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    ['Interest / Return', 'None', '6–12% annual', 'None (Qard Hassan)'],
                    ['Shariah Compliant', '✗', '✗', '✓'],
                    ['Maturity Date', 'None', '12–24 months', '18–24 months'],
                    ['Conversion Trigger', 'Next priced round', 'Next round / maturity', 'Qualified round'],
                    ['Valuation Cap', '✓', '✓', '✓'],
                    ['Discount Rate', '✓', '✓', '✓'],
                    ['Saudi Law Compatible', 'Partial', 'Partial', '✓ (full)'],
                    ['Standard Template', 'YC SAFE', 'Various', 'OQAL / KISS-based'],
                  ].map(([feature, safe, conv, oqal], i) => (
                    <tr key={i} className={i % 2 === 0 ? '' : 'bg-secondary/20'}>
                      <td className="py-2 pr-4 text-muted-foreground font-medium">{feature}</td>
                      <td className="py-2 px-3 text-center text-foreground">{safe}</td>
                      <td className="py-2 px-3 text-center text-foreground">{conv}</td>
                      <td className="py-2 px-3 text-center text-foreground">{oqal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: ESOP ── */}
      {activeTab === 'esop' && (
        <EsopPanel esop={s.esop} totalSharesFullyDiluted={totalSharesFullyDiluted} currency={currency} onUpdate={setEsop} />
      )}

      {/* ── Tab: Settings ── */}
      {activeTab === 'settings' && (
        <div className="space-y-4 max-w-lg">
          <div className="p-4 rounded-xl border border-border bg-card space-y-4">
            <div className="text-sm font-semibold text-foreground">Company Settings</div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Company Name</label>
              <input
                className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400"
                value={s.companyName}
                onChange={e => update({ companyName: e.target.value })}
                placeholder="e.g. Polaris Arabia"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Total Authorized Shares</label>
              <input
                type="number"
                className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400"
                value={s.totalAuthorizedShares}
                onChange={e => update({ totalAuthorizedShares: Math.max(1, parseInt(e.target.value) || 10_000_000) })}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Current Price Per Share</label>
              <input
                type="number"
                step="0.01"
                className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400"
                value={s.pricePerShare}
                onChange={e => update({ pricePerShare: Math.max(0.001, parseFloat(e.target.value) || 1) })}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Currency</label>
              <select
                className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400"
                value={s.currency}
                onChange={e => update({ currency: e.target.value as 'SAR' | 'USD' })}
              >
                <option value="SAR">SAR (Saudi Riyal)</option>
                <option value="USD">USD (US Dollar)</option>
              </select>
            </div>
          </div>
          <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900">
            <div className="flex gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-700 dark:text-amber-400">
                <strong>Connected tools:</strong> Co-Founder Equity Split, Dilution Simulator, and OQAL Notes all read from this cap table. Changes here are reflected across all equity tools instantly.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Shareholder Row ──────────────────────────────────────────────────────────

function ShareholderRow({
  holder,
  totalSharesBasic,
  onUpdate,
  onDelete,
}: {
  holder: CapTableShareholder;
  totalSharesBasic: number;
  onUpdate: (patch: Partial<CapTableShareholder>) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const pct = totalSharesBasic > 0 ? (holder.shares / totalSharesBasic) * 100 : 0;

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      className="border border-border rounded-xl overflow-hidden bg-card">
      <div className="p-3.5 flex items-center gap-3">
        <div className="w-3 h-3 rounded-full shrink-0" style={{ background: holder.color }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground truncate">{holder.name || 'Unnamed'}</span>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground">
              {holderTypeLabel(holder.type)}
            </span>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
              {shareClassLabel(holder.shareClass)}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground font-mono">{holder.shares.toLocaleString()} shares</span>
            <span>·</span>
            <span className="font-semibold" style={{ color: holder.color }}>{pct.toFixed(2)}%</span>
            {holder.vestingMonths && holder.vestingMonths > 0 && (
              <><span>·</span><span>{holder.vestingMonths}mo vest / {holder.cliffMonths}mo cliff</span></>
            )}
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 w-28">
          <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, pct)}%`, background: holder.color }} />
          </div>
          <span className="text-xs font-semibold text-foreground w-12 text-right">{pct.toFixed(1)}%</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => setExpanded(v => !v)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors text-muted-foreground">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="px-4 pb-4 border-t border-border pt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Name</label>
                <input className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  value={holder.name} onChange={e => onUpdate({ name: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Email (optional)</label>
                <input type="email" className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  value={holder.email || ''} onChange={e => onUpdate({ email: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Holder Type</label>
                <select className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  value={holder.type} onChange={e => onUpdate({ type: e.target.value as HolderType })}>
                  <option value="founder">Founder</option>
                  <option value="investor">Investor</option>
                  <option value="employee">Employee</option>
                  <option value="advisor">Advisor</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Share Class</label>
                <select className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  value={holder.shareClass} onChange={e => onUpdate({ shareClass: e.target.value as ShareClass })}>
                  <option value="common">Common Stock</option>
                  <option value="preferred_seed">Preferred Seed</option>
                  <option value="preferred_a">Preferred Series A</option>
                  <option value="preferred_b">Preferred Series B</option>
                  <option value="option">Option (ESOP)</option>
                  <option value="warrant">Warrant</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Number of Shares</label>
                <input type="number" className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  value={holder.shares} onChange={e => onUpdate({ shares: Math.max(0, parseInt(e.target.value) || 0) })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Price Paid Per Share</label>
                <input type="number" step="0.001" className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  value={holder.pricePerShare || 0} onChange={e => onUpdate({ pricePerShare: Math.max(0, parseFloat(e.target.value) || 0) })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Vesting Period (months)</label>
                <input type="number" className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  value={holder.vestingMonths || 0} onChange={e => onUpdate({ vestingMonths: Math.max(0, parseInt(e.target.value) || 0) })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Cliff (months)</label>
                <input type="number" className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  value={holder.cliffMonths || 0} onChange={e => onUpdate({ cliffMonths: Math.max(0, parseInt(e.target.value) || 0) })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Vesting Start Date</label>
                <input type="date" className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  value={holder.vestingStartDate || ''} onChange={e => onUpdate({ vestingStartDate: e.target.value })} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Instrument Row ───────────────────────────────────────────────────────────

function InstrumentRow({
  instrument,
  currency,
  totalSharesFullyDiluted,
  nextRoundPreMoney,
  totalAuthorizedShares,
  onUpdate,
  onDelete,
}: {
  instrument: CapTableInstrument;
  currency: 'SAR' | 'USD';
  totalSharesFullyDiluted: number;
  nextRoundPreMoney: number;
  totalAuthorizedShares: number;
  onUpdate: (patch: Partial<CapTableInstrument>) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  // Calculate conversion
  const nextRoundPPS = nextRoundPreMoney > 0 && totalAuthorizedShares > 0
    ? nextRoundPreMoney / totalAuthorizedShares
    : 0;
  const capPrice = instrument.valuationCap > 0 ? instrument.valuationCap / totalAuthorizedShares : Infinity;
  const discountPrice = nextRoundPPS * (1 - instrument.discountRate / 100);
  const convPrice = nextRoundPPS > 0 ? Math.min(capPrice, discountPrice, nextRoundPPS) : 0;
  const convertedShares = convPrice > 0 ? Math.round(instrument.investmentAmount / convPrice) : 0;
  const ownershipPct = totalSharesFullyDiluted > 0 ? (convertedShares / totalSharesFullyDiluted) * 100 : 0;

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      className="border border-border rounded-xl overflow-hidden bg-card">
      <div className="p-3.5 flex items-center gap-3">
        <div className="w-3 h-3 rounded-full shrink-0" style={{ background: instrument.color }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground truncate">{instrument.investorName || 'Unnamed'}</span>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${instrColor(instrument.type)}`}>
              {instrLabel(instrument.type)}
            </span>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
              instrument.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-secondary text-muted-foreground'
            }`}>
              {instrument.status}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
            <span className="font-semibold text-foreground">{fmt(instrument.investmentAmount, currency)}</span>
            {convPrice > 0 && (
              <><span>→</span><span>{convertedShares.toLocaleString()} shares</span><span>·</span><span className="font-semibold" style={{ color: instrument.color }}>{ownershipPct.toFixed(2)}%</span></>
            )}
            {instrument.valuationCap > 0 && <span>Cap: {fmt(instrument.valuationCap, currency)}</span>}
            {instrument.discountRate > 0 && <span>Discount: {instrument.discountRate}%</span>}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => setExpanded(v => !v)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors text-muted-foreground">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="px-4 pb-4 border-t border-border pt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Investor Name</label>
                <input className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  value={instrument.investorName} onChange={e => onUpdate({ investorName: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Instrument Type</label>
                <select className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  value={instrument.type} onChange={e => onUpdate({ type: e.target.value as 'safe' | 'convertible_note' | 'oqal_note' })}>
                  <option value="safe">SAFE Note (YC)</option>
                  <option value="convertible_note">Convertible Note</option>
                  <option value="oqal_note">OQAL Note (Shariah)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Investment Amount ({currency})</label>
                <input type="number" className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  value={instrument.investmentAmount} onChange={e => onUpdate({ investmentAmount: Math.max(0, parseInt(e.target.value) || 0) })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Valuation Cap ({currency})</label>
                <input type="number" className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  value={instrument.valuationCap} onChange={e => onUpdate({ valuationCap: Math.max(0, parseInt(e.target.value) || 0) })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Discount Rate (%)</label>
                <input type="number" min={0} max={50} className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  value={instrument.discountRate} onChange={e => onUpdate({ discountRate: Math.min(50, Math.max(0, parseInt(e.target.value) || 0)) })} />
              </div>
              {instrument.type === 'convertible_note' && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Interest Rate (% annual)</label>
                  <input type="number" min={0} max={30} className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    value={instrument.interestRate} onChange={e => onUpdate({ interestRate: Math.min(30, Math.max(0, parseInt(e.target.value) || 0)) })} />
                </div>
              )}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Issue Date</label>
                <input type="date" className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  value={instrument.issueDate} onChange={e => onUpdate({ issueDate: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Maturity (months)</label>
                <input type="number" min={1} className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  value={instrument.maturityMonths} onChange={e => onUpdate({ maturityMonths: Math.max(1, parseInt(e.target.value) || 24) })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Status</label>
                <select className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  value={instrument.status} onChange={e => onUpdate({ status: e.target.value as CapTableInstrument['status'] })}>
                  <option value="active">Active</option>
                  <option value="converted">Converted</option>
                  <option value="repaid">Repaid</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              {convPrice > 0 && (
                <div className="col-span-2 p-3 rounded-lg bg-secondary/50 text-xs">
                  <div className="font-semibold text-foreground mb-1">Conversion Preview</div>
                  <div className="grid grid-cols-3 gap-2 text-muted-foreground">
                    <div><div className="text-foreground font-semibold">${convPrice.toFixed(4)}</div><div>Conv. Price</div></div>
                    <div><div className="text-foreground font-semibold">{convertedShares.toLocaleString()}</div><div>Shares</div></div>
                    <div><div className="font-semibold" style={{ color: instrument.color }}>{ownershipPct.toFixed(2)}%</div><div>Ownership</div></div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── ESOP Panel ───────────────────────────────────────────────────────────────

function EsopPanel({
  esop,
  totalSharesFullyDiluted,
  currency,
  onUpdate,
}: {
  esop: EsopPool;
  totalSharesFullyDiluted: number;
  currency: 'SAR' | 'USD';
  onUpdate: (e: EsopPool) => void;
}) {
  const poolPct = totalSharesFullyDiluted > 0 ? (esop.totalPoolShares / totalSharesFullyDiluted) * 100 : 0;
  const issuedPct = esop.totalPoolShares > 0 ? (esop.issuedShares / esop.totalPoolShares) * 100 : 0;
  const availablePct = 100 - issuedPct;

  return (
    <div className="space-y-4 max-w-2xl">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Pool Size', value: esop.totalPoolShares.toLocaleString(), sub: `${poolPct.toFixed(1)}% of cap table`, color: '#8B5CF6' },
          { label: 'Issued', value: esop.issuedShares.toLocaleString(), sub: `${issuedPct.toFixed(1)}% of pool`, color: '#C4614A' },
          { label: 'Available', value: esop.availableShares.toLocaleString(), sub: `${availablePct.toFixed(1)}% remaining`, color: '#10B981' },
        ].map(kpi => (
          <div key={kpi.label} className="p-3.5 rounded-xl border border-border bg-card">
            <div className="text-lg font-bold text-foreground">{kpi.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{kpi.label}</div>
            <div className="text-[10px] mt-1" style={{ color: kpi.color }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Pool bar */}
      <div className="p-4 rounded-xl border border-border bg-card">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>Pool utilization</span>
          <span>{issuedPct.toFixed(1)}% issued</span>
        </div>
        <div className="h-3 rounded-full bg-secondary overflow-hidden">
          <div className="h-full rounded-full bg-violet-500 transition-all duration-500" style={{ width: `${Math.min(100, issuedPct)}%` }} />
        </div>
      </div>

      {/* Settings */}
      <div className="p-4 rounded-xl border border-border bg-card space-y-3">
        <div className="text-sm font-semibold text-foreground">ESOP Configuration</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Total Pool Shares</label>
            <input type="number" className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400"
              value={esop.totalPoolShares}
              onChange={e => {
                const total = Math.max(0, parseInt(e.target.value) || 0);
                onUpdate({ ...esop, totalPoolShares: total, availableShares: Math.max(0, total - esop.issuedShares) });
              }} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Issued Shares</label>
            <input type="number" className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400"
              value={esop.issuedShares}
              onChange={e => {
                const issued = Math.min(esop.totalPoolShares, Math.max(0, parseInt(e.target.value) || 0));
                onUpdate({ ...esop, issuedShares: issued, availableShares: esop.totalPoolShares - issued });
              }} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Strike Price ({currency})</label>
            <input type="number" step="0.001" className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400"
              value={esop.strikePrice} onChange={e => onUpdate({ ...esop, strikePrice: Math.max(0, parseFloat(e.target.value) || 0) })} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">409A FMV Per Share ({currency})</label>
            <input type="number" step="0.001" className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400"
              value={esop.fmvPerShare} onChange={e => onUpdate({ ...esop, fmvPerShare: Math.max(0, parseFloat(e.target.value) || 0) })} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Default Vesting (months)</label>
            <input type="number" className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400"
              value={esop.vestingMonths} onChange={e => onUpdate({ ...esop, vestingMonths: Math.max(0, parseInt(e.target.value) || 48) })} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Default Cliff (months)</label>
            <input type="number" className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400"
              value={esop.cliffMonths} onChange={e => onUpdate({ ...esop, cliffMonths: Math.max(0, parseInt(e.target.value) || 12) })} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Plan Type</label>
            <select className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400"
              value={esop.planType} onChange={e => onUpdate({ ...esop, planType: e.target.value as EsopPool['planType'] })}>
              <option value="iso">ISO (Incentive Stock Options)</option>
              <option value="nso">NSO (Non-Qualified Stock Options)</option>
              <option value="rsu">RSU (Restricted Stock Units)</option>
              <option value="sar">SAR (Stock Appreciation Rights)</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Jurisdiction</label>
            <select className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400"
              value={esop.jurisdiction} onChange={e => onUpdate({ ...esop, jurisdiction: e.target.value })}>
              <option value="saudi_arabia">Saudi Arabia</option>
              <option value="delaware">Delaware (USA)</option>
              <option value="cayman">Cayman Islands</option>
              <option value="uae">UAE (DIFC/ADGM)</option>
              <option value="uk">United Kingdom</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
