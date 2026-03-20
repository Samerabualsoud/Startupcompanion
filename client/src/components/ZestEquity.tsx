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
import ToolGuide from '@/components/ToolGuide';
import type {
  CapTableShareholder, CapTableInstrument, EsopPool, EsopGrant, ShareClass, HolderType,
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
      {/* Education panel */}
      <ToolGuide
        toolName="Zest Equity & Cap Table"
        tagline="Your single source of truth for all equity — shareholders, ESOP pool, and convertible instruments."
        steps={[
          { step: 1, title: 'Set company basics', description: 'Go to Settings tab → enter your company name, total authorized shares, and price per share. These numbers anchor all calculations.' },
          { step: 2, title: 'Add shareholders', description: 'In the Cap Table tab, click "Add Shareholder". Enter each founder and investor with their share count, share class (Common or Preferred), and vesting schedule.' },
          { step: 3, title: 'Configure ESOP pool', description: 'In the ESOP Pool tab, set the total pool size, issued shares, strike price, and vesting defaults. Add individual employee grants in the Grants sub-section.' },
          { step: 4, title: 'Add convertible instruments', description: 'In Notes & SAFEs tab, add any SAFE notes, convertible notes, or OQAL notes. Set valuation caps and discount rates to see their dilutive impact.' },
          { step: 5, title: 'Review the pie chart', description: 'The ownership pie chart shows fully-diluted ownership including ESOP and unconverted notes. Use this to verify your cap table is structured correctly before fundraising.' },
        ]}
        concepts={[
          { term: 'Basic shares', definition: 'Shares actually issued to shareholders — excludes ESOP pool and unconverted notes.' },
          { term: 'Fully diluted', definition: 'All shares including ESOP pool and shares that would be issued if all notes converted.' },
          { term: 'Pre-money valuation', definition: 'Company value before new investment. Used to calculate price per share in a round.' },
          { term: 'Authorized shares', definition: 'Maximum shares the company is legally allowed to issue per its articles of incorporation.' },
        ]}
        tip="Saudi startups typically authorize 10 million shares at SAR 0.01 par value. NEOM-registered companies may use USD. Always align your cap table with your articles of association before any fundraising round."
      />

      {/* Save indicator */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground justify-end">
        {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-green-500" />}
        <span>{isSaving ? 'Saving…' : 'All changes saved'}</span>
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
        <EsopPanel esop={s.esop} totalSharesFullyDiluted={totalSharesFullyDiluted} currency={currency} companyName={s.companyName} onUpdate={setEsop} />
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

// ─── Vesting Schedule Helper ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

function calcVestedShares(grant: EsopGrant, asOfDate: Date = new Date()): number {
  const start = new Date(grant.vestingStartDate);
  const monthsElapsed = Math.max(0,
    (asOfDate.getFullYear() - start.getFullYear()) * 12 +
    (asOfDate.getMonth() - start.getMonth())
  );
  if (monthsElapsed < grant.cliffMonths) return 0;
  const vestedFraction = Math.min(1, monthsElapsed / grant.vestingMonths);
  return Math.floor(grant.shares * vestedFraction);
}

function generateEsopContract(grant: EsopGrant, esop: EsopPool, companyName: string): string {
  const planTypeLabel: Record<string, string> = {
    iso: 'Incentive Stock Option (ISO)',
    nso: 'Non-Qualified Stock Option (NSO)',
    rsu: 'Restricted Stock Unit (RSU)',
    sar: 'Stock Appreciation Right (SAR)',
  };
  const jurisdictionLabel: Record<string, string> = {
    saudi_arabia: 'Kingdom of Saudi Arabia',
    delaware: 'State of Delaware, USA',
    cayman: 'Cayman Islands',
    uae: 'UAE (DIFC/ADGM)',
    uk: 'United Kingdom',
  };
  const grantDateFmt = new Date(grant.grantDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const vestStartFmt = new Date(grant.vestingStartDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const cliffDate = new Date(grant.vestingStartDate);
  cliffDate.setMonth(cliffDate.getMonth() + grant.cliffMonths);
  const cliffDateFmt = cliffDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const fullyVestedDate = new Date(grant.vestingStartDate);
  fullyVestedDate.setMonth(fullyVestedDate.getMonth() + grant.vestingMonths);
  const fullyVestedFmt = fullyVestedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const cliffShares = Math.floor(grant.shares * grant.cliffMonths / grant.vestingMonths);
  const remainingShares = grant.shares - cliffShares;
  const monthlyShares = Math.floor(grant.shares / grant.vestingMonths);
  const totalValue = (grant.shares * esop.fmvPerShare).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return `STOCK OPTION GRANT AGREEMENT

${companyName || 'THE COMPANY'}
${planTypeLabel[grant.planType] || grant.planType} Grant

Grant Date: ${grantDateFmt}
Jurisdiction: ${jurisdictionLabel[esop.jurisdiction] || esop.jurisdiction}

──────────────────────────────────────────────────────────────────────

PARTIES

Grantor (Company): ${companyName || '[COMPANY NAME]'}
Grantee (Employee): ${grant.employeeName}
Title: ${grant.employeeTitle}
Email: ${grant.employeeEmail}

──────────────────────────────────────────────────────────────────────

GRANT TERMS

Option Type:          ${planTypeLabel[grant.planType] || grant.planType}
Shares Granted:       ${grant.shares.toLocaleString()} shares
Strike Price:         ${grant.strikePrice.toFixed(4)} per share
Fair Market Value:    ${esop.fmvPerShare.toFixed(4)} per share (at grant date)
Total Grant Value:    ${totalValue}

──────────────────────────────────────────────────────────────────────

VESTING SCHEDULE

Vesting Start Date:   ${vestStartFmt}
Cliff Period:         ${grant.cliffMonths} months (cliff date: ${cliffDateFmt})
Vesting Period:       ${grant.vestingMonths} months total
Fully Vested Date:    ${fullyVestedFmt}
Vesting Frequency:    Monthly (after cliff)

Vesting Breakdown:
  - 0% vests during the ${grant.cliffMonths}-month cliff period
  - After cliff: ${cliffShares.toLocaleString()} shares vest on ${cliffDateFmt}
  - Remaining ${remainingShares.toLocaleString()} shares vest monthly over ${grant.vestingMonths - grant.cliffMonths} months
  - Monthly vesting after cliff: ~${monthlyShares.toLocaleString()} shares/month

──────────────────────────────────────────────────────────────────────

TERMINATION

Upon termination of employment:
  - Vested options may be exercised within 90 days of termination
  - Unvested options are forfeited immediately
  - In case of cause termination, all options (vested and unvested) are forfeited

EXERCISE

The Grantee may exercise vested options by providing written notice to the Company
and paying the aggregate exercise price. Options expire 10 years from grant date.

──────────────────────────────────────────────────────────────────────

ACKNOWLEDGMENT

By accepting this grant, the Grantee acknowledges:
  1. This grant is subject to the Company's Equity Incentive Plan
  2. Options have no value until vested and exercised
  3. Tax treatment depends on jurisdiction and plan type
  4. This document is a summary; the full Plan document governs

NOTE: This is a computer-generated draft. Have it reviewed by a qualified
legal and tax advisor before signing.

──────────────────────────────────────────────────────────────────────

SIGNATURES

For and on behalf of ${companyName || '[COMPANY NAME]'}:

Signature: _______________________    Date: _______________
Name:      _______________________
Title:     _______________________

Grantee Acknowledgment:

Signature: _______________________    Date: _______________
Name:      ${grant.employeeName}
Title:     ${grant.employeeTitle}
`;
}

// ─── Grant Row ────────────────────────────────────────────────────────────────

function GrantRow({
  grant, esop, companyName, currency, onUpdate, onDelete,
}: {
  grant: EsopGrant;
  esop: EsopPool;
  companyName: string;
  currency: 'SAR' | 'USD';
  onUpdate: (patch: Partial<EsopGrant>) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showContract, setShowContract] = useState(false);
  const vestedShares = calcVestedShares(grant);
  const vestedPct = grant.shares > 0 ? (vestedShares / grant.shares) * 100 : 0;
  const contractText = showContract ? generateEsopContract(grant, esop, companyName) : '';

  const statusColor: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    terminated: 'bg-red-100 text-red-700',
    exercised: 'bg-blue-100 text-blue-700',
    expired: 'bg-gray-100 text-gray-600',
  };

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      className="border-b border-border last:border-b-0">
      <div className="p-3.5 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground">{grant.employeeName || 'Unnamed'}</span>
            <span className="text-[10px] text-muted-foreground">{grant.employeeTitle}</span>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${statusColor[grant.status] || 'bg-gray-100 text-gray-600'}`}>{grant.status}</span>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700">{grant.planType.toUpperCase()}</span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
            <span className="font-semibold text-foreground font-mono">{grant.shares.toLocaleString()} shares</span>
            <span>·</span>
            <span>Strike: {grant.strikePrice.toFixed(4)}</span>
            <span>·</span>
            <span className="text-violet-600 font-semibold">{vestedShares.toLocaleString()} vested ({vestedPct.toFixed(0)}%)</span>
            <span>·</span>
            <span>{grant.vestingMonths}mo vest / {grant.cliffMonths}mo cliff</span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden w-full max-w-xs">
            <div className="h-full rounded-full bg-violet-500 transition-all duration-500" style={{ width: `${Math.min(100, vestedPct)}%` }} />
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => { setShowContract(v => !v); if (!expanded) setExpanded(true); }}
            className="p-1.5 rounded-lg hover:bg-violet-50 hover:text-violet-600 transition-colors text-muted-foreground"
            title="Generate grant contract"
          >
            <FileText className="w-4 h-4" />
          </button>
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
            <div className="px-4 pb-4 border-t border-border pt-3 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Employee Name</label>
                  <input className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-violet-400"
                    value={grant.employeeName} onChange={e => onUpdate({ employeeName: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Title / Role</label>
                  <input className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-violet-400"
                    value={grant.employeeTitle} onChange={e => onUpdate({ employeeTitle: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Email</label>
                  <input type="email" className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-violet-400"
                    value={grant.employeeEmail} onChange={e => onUpdate({ employeeEmail: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Grant Date</label>
                  <input type="date" className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-violet-400"
                    value={grant.grantDate} onChange={e => onUpdate({ grantDate: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Shares Granted</label>
                  <input type="number" className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-violet-400"
                    value={grant.shares} onChange={e => onUpdate({ shares: Math.max(0, parseInt(e.target.value) || 0) })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Strike Price ({currency})</label>
                  <input type="number" step="0.0001" className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-violet-400"
                    value={grant.strikePrice} onChange={e => onUpdate({ strikePrice: Math.max(0, parseFloat(e.target.value) || 0) })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Vesting Start Date</label>
                  <input type="date" className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-violet-400"
                    value={grant.vestingStartDate} onChange={e => onUpdate({ vestingStartDate: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Vesting Period (months)</label>
                  <input type="number" className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-violet-400"
                    value={grant.vestingMonths} onChange={e => onUpdate({ vestingMonths: Math.max(1, parseInt(e.target.value) || 48) })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Cliff (months)</label>
                  <input type="number" className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-violet-400"
                    value={grant.cliffMonths} onChange={e => onUpdate({ cliffMonths: Math.max(0, parseInt(e.target.value) || 12) })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Plan Type</label>
                  <select className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-violet-400"
                    value={grant.planType} onChange={e => onUpdate({ planType: e.target.value as EsopGrant['planType'] })}>
                    <option value="iso">ISO (Incentive Stock Options)</option>
                    <option value="nso">NSO (Non-Qualified Stock Options)</option>
                    <option value="rsu">RSU (Restricted Stock Units)</option>
                    <option value="sar">SAR (Stock Appreciation Rights)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Status</label>
                  <select className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-violet-400"
                    value={grant.status} onChange={e => onUpdate({ status: e.target.value as EsopGrant['status'] })}>
                    <option value="active">Active</option>
                    <option value="terminated">Terminated</option>
                    <option value="exercised">Exercised</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
                  <input className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-violet-400"
                    value={grant.notes} onChange={e => onUpdate({ notes: e.target.value })} placeholder="e.g. Performance grant, Board approval date..." />
                </div>
              </div>

              {/* Vesting timeline */}
              <div className="p-3 rounded-lg bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800">
                <div className="text-xs font-semibold text-violet-700 dark:text-violet-400 mb-2">Vesting Timeline</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <div className="text-muted-foreground">Grant Date</div>
                    <div className="font-semibold">{new Date(grant.grantDate).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Cliff Date</div>
                    <div className="font-semibold">
                      {(() => { const d = new Date(grant.vestingStartDate); d.setMonth(d.getMonth() + grant.cliffMonths); return d.toLocaleDateString(); })()}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Fully Vested</div>
                    <div className="font-semibold">
                      {(() => { const d = new Date(grant.vestingStartDate); d.setMonth(d.getMonth() + grant.vestingMonths); return d.toLocaleDateString(); })()}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Vested Today</div>
                    <div className="font-semibold text-violet-700">{vestedShares.toLocaleString()} / {grant.shares.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {/* Contract */}
              {showContract && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-foreground">Grant Agreement Draft</div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const blob = new Blob([contractText], { type: 'text/plain' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `ESOP_Grant_${grant.employeeName.replace(/\s+/g, '_')}.txt`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="text-[10px] px-2 py-1 rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors"
                      >
                        Download .txt
                      </button>
                      <button
                        onClick={() => navigator.clipboard.writeText(contractText)}
                        className="text-[10px] px-2 py-1 rounded-lg border border-border hover:bg-secondary transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <pre className="text-[10px] font-mono bg-secondary/50 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto border border-border">{contractText}</pre>
                  <p className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    ⚠️ This is a computer-generated draft for reference only. Have it reviewed by a qualified legal and tax advisor before use.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── ESOP Panel ────────────────────────────────────────────────────────────────

function EsopPanel({
  esop,
  totalSharesFullyDiluted,
  currency,
  companyName,
  onUpdate,
}: {
  esop: EsopPool;
  totalSharesFullyDiluted: number;
  currency: 'SAR' | 'USD';
  companyName: string;
  onUpdate: (e: EsopPool) => void;
}) {
  const grants = esop.grants ?? [];
  const totalGrantedShares = grants.filter(g => g.status === 'active').reduce((s, g) => s + g.shares, 0);
  const poolPct = totalSharesFullyDiluted > 0 ? (esop.totalPoolShares / totalSharesFullyDiluted) * 100 : 0;
  const issuedPct = esop.totalPoolShares > 0 ? (totalGrantedShares / esop.totalPoolShares) * 100 : 0;
  const availableShares = esop.totalPoolShares - totalGrantedShares;
  const availablePct = 100 - issuedPct;

  function addGrant() {
    const today = new Date().toISOString().split('T')[0];
    const newGrant: EsopGrant = {
      id: nanoid(),
      employeeName: 'New Employee',
      employeeTitle: 'Software Engineer',
      employeeEmail: '',
      grantDate: today,
      shares: 50_000,
      strikePrice: esop.strikePrice,
      vestingMonths: esop.vestingMonths,
      cliffMonths: esop.cliffMonths,
      vestingStartDate: today,
      planType: esop.planType,
      status: 'active',
      notes: '',
    };
    const updatedGrants = [...grants, newGrant];
    const newIssued = updatedGrants.filter(g => g.status === 'active').reduce((s, g) => s + g.shares, 0);
    onUpdate({ ...esop, grants: updatedGrants, issuedShares: newIssued, availableShares: esop.totalPoolShares - newIssued });
  }

  function updateGrant(id: string, patch: Partial<EsopGrant>) {
    const updatedGrants = grants.map(g => g.id === id ? { ...g, ...patch } : g);
    const newIssued = updatedGrants.filter(g => g.status === 'active').reduce((s, g) => s + g.shares, 0);
    onUpdate({ ...esop, grants: updatedGrants, issuedShares: newIssued, availableShares: esop.totalPoolShares - newIssued });
  }

  function deleteGrant(id: string) {
    const updatedGrants = grants.filter(g => g.id !== id);
    const newIssued = updatedGrants.filter(g => g.status === 'active').reduce((s, g) => s + g.shares, 0);
    onUpdate({ ...esop, grants: updatedGrants, issuedShares: newIssued, availableShares: esop.totalPoolShares - newIssued });
  }

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Pool Size', value: esop.totalPoolShares.toLocaleString(), sub: `${poolPct.toFixed(1)}% of cap table`, color: '#8B5CF6' },
          { label: 'Granted (Active)', value: totalGrantedShares.toLocaleString(), sub: `${issuedPct.toFixed(1)}% of pool`, color: '#C4614A' },
          { label: 'Available', value: availableShares.toLocaleString(), sub: `${availablePct.toFixed(1)}% remaining`, color: '#10B981' },
          { label: 'Employees', value: grants.filter(g => g.status === 'active').length.toString(), sub: 'active grants', color: '#F59E0B' },
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
          <span>{issuedPct.toFixed(1)}% granted</span>
        </div>
        <div className="h-3 rounded-full bg-secondary overflow-hidden">
          <div className="h-full rounded-full bg-violet-500 transition-all duration-500" style={{ width: `${Math.min(100, issuedPct)}%` }} />
        </div>
      </div>

      {/* Employee Grants */}
      <div className="border border-border rounded-xl overflow-hidden bg-card">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div>
            <div className="text-sm font-semibold text-foreground">Employee Grants</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {grants.length === 0
                ? 'No grants yet. Click "Add Grant" to issue options to an employee.'
                : `${grants.length} grant${grants.length !== 1 ? 's' : ''} · Click the document icon to generate a contract`}
            </div>
          </div>
          <button
            onClick={addGrant}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Grant
          </button>
        </div>
        <div>
          <AnimatePresence>
            {grants.map(grant => (
              <GrantRow
                key={grant.id}
                grant={grant}
                esop={esop}
                companyName={companyName}
                currency={currency}
                onUpdate={patch => updateGrant(grant.id, patch)}
                onDelete={() => deleteGrant(grant.id)}
              />
            ))}
          </AnimatePresence>
          {grants.length === 0 && (
            <div className="p-8 text-center">
              <Zap className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
              <div className="text-sm font-medium text-muted-foreground">No employee grants yet</div>
              <div className="text-xs text-muted-foreground mt-1">Click "Add Grant" above to issue stock options to your first employee.</div>
            </div>
          )}
        </div>
      </div>

      {/* Pool Configuration */}
      <div className="p-4 rounded-xl border border-border bg-card space-y-3">
        <div className="text-sm font-semibold text-foreground">Pool Configuration</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Total Pool Shares</label>
            <input type="number" className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400"
              value={esop.totalPoolShares}
              onChange={e => {
                const total = Math.max(0, parseInt(e.target.value) || 0);
                onUpdate({ ...esop, totalPoolShares: total, availableShares: Math.max(0, total - totalGrantedShares) });
              }} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Default Strike Price ({currency})</label>
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
            <label className="text-xs text-muted-foreground mb-1 block">Default Plan Type</label>
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
