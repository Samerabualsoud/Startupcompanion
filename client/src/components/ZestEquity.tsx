/**
 * ZestEquity — Cap table management with SAFE & convertible note conversion modeling
 * Shows how SAFE notes and convertible notes convert into equity at a priced round
 * Links with OQAL Notes for Shariah-compliant instruments
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, TrendingUp, Users, DollarSign, Info, ChevronDown, ChevronUp, Zap, FileText, Shield } from 'lucide-react';
import { nanoid } from 'nanoid';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useToolState } from '@/hooks/useToolState';
import { useLanguage } from '@/contexts/LanguageContext';

// ─── Types ────────────────────────────────────────────────────────────────────

type HolderType = 'founder' | 'employee' | 'investor' | 'option_pool';
type InstrumentType = 'common' | 'preferred' | 'safe' | 'convertible_note' | 'oqal_note';

interface Holder {
  id: string;
  name: string;
  type: HolderType;
  instrumentType: InstrumentType;
  shares: number;              // for common/preferred
  investmentAmount: number;    // for SAFE/notes
  valuationCap: number;        // for SAFE/notes
  discountRate: number;        // % for SAFE/notes
  interestRate: number;        // % annual for convertible notes (0 for SAFE/OQAL)
  issueDate: string;           // for notes
  color: string;
}

interface ZestState {
  holders: Holder[];
  pricePerShare: number;       // current / next round price per share
  preMoneyValuation: number;
  newInvestment: number;       // new money coming in at this round
  totalShares: number;         // total authorized shares before round
  optionPoolPct: number;       // % to set aside for ESOP
}

const HOLDER_COLORS = [
  '#4F6EF7', '#C4614A', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16',
];

const DEFAULT_STATE: ZestState = {
  holders: [
    {
      id: nanoid(), name: 'Founder 1', type: 'founder', instrumentType: 'common',
      shares: 4_000_000, investmentAmount: 0, valuationCap: 0, discountRate: 0,
      interestRate: 0, issueDate: '', color: HOLDER_COLORS[0],
    },
    {
      id: nanoid(), name: 'Founder 2', type: 'founder', instrumentType: 'common',
      shares: 3_000_000, investmentAmount: 0, valuationCap: 0, discountRate: 0,
      interestRate: 0, issueDate: '', color: HOLDER_COLORS[1],
    },
    {
      id: nanoid(), name: 'Option Pool (ESOP)', type: 'option_pool', instrumentType: 'common',
      shares: 1_000_000, investmentAmount: 0, valuationCap: 0, discountRate: 0,
      interestRate: 0, issueDate: '', color: HOLDER_COLORS[2],
    },
  ],
  pricePerShare: 1.0,
  preMoneyValuation: 8_000_000,
  newInvestment: 2_000_000,
  totalShares: 8_000_000,
  optionPoolPct: 10,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function fmtPct(n: number): string { return `${n.toFixed(1)}%`; }

function calcConvertedShares(holder: Holder, pricePerShare: number): number {
  if (holder.instrumentType === 'common' || holder.instrumentType === 'preferred') {
    return holder.shares;
  }
  // For SAFE, convertible note, OQAL note
  const capPrice = holder.valuationCap > 0 ? holder.valuationCap / 10_000_000 : Infinity;
  const discountPrice = pricePerShare * (1 - holder.discountRate / 100);
  const convPrice = Math.min(capPrice, discountPrice, pricePerShare);
  return Math.round(holder.investmentAmount / convPrice);
}

function getInstrumentLabel(type: InstrumentType): string {
  switch (type) {
    case 'common': return 'Common Stock';
    case 'preferred': return 'Preferred Stock';
    case 'safe': return 'SAFE Note';
    case 'convertible_note': return 'Convertible Note';
    case 'oqal_note': return 'OQAL Note (Shariah)';
  }
}

function getInstrumentColor(type: InstrumentType): string {
  switch (type) {
    case 'common': return 'bg-slate-100 text-slate-700';
    case 'preferred': return 'bg-indigo-100 text-indigo-700';
    case 'safe': return 'bg-amber-100 text-amber-700';
    case 'convertible_note': return 'bg-orange-100 text-orange-700';
    case 'oqal_note': return 'bg-emerald-100 text-emerald-700';
  }
}

// ─── Holder Row ───────────────────────────────────────────────────────────────

function HolderRow({
  holder,
  totalConvertedShares,
  pricePerShare,
  onDelete,
  onUpdate,
}: {
  holder: Holder;
  totalConvertedShares: number;
  pricePerShare: number;
  onDelete: () => void;
  onUpdate: (h: Holder) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const convertedShares = calcConvertedShares(holder, pricePerShare);
  const ownershipPct = totalConvertedShares > 0 ? (convertedShares / totalConvertedShares) * 100 : 0;
  const isNote = ['safe', 'convertible_note', 'oqal_note'].includes(holder.instrumentType);

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      className="border border-border rounded-xl overflow-hidden bg-card">
      <div className="p-3.5 flex items-center gap-3">
        <div className="w-3 h-3 rounded-full shrink-0" style={{ background: holder.color }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground truncate">{holder.name || 'Unnamed'}</span>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${getInstrumentColor(holder.instrumentType)}`}>
              {getInstrumentLabel(holder.instrumentType)}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
            {isNote ? (
              <>
                <span className="font-semibold text-foreground">{fmt(holder.investmentAmount)}</span>
                <span>→ {convertedShares.toLocaleString()} shares</span>
              </>
            ) : (
              <span className="font-semibold text-foreground">{convertedShares.toLocaleString()} shares</span>
            )}
            <span>·</span>
            <span className="font-semibold" style={{ color: holder.color }}>{fmtPct(ownershipPct)}</span>
          </div>
        </div>
        {/* Ownership bar */}
        <div className="hidden sm:flex items-center gap-2 w-28">
          <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, ownershipPct)}%`, background: holder.color }} />
          </div>
          <span className="text-xs font-semibold text-foreground w-10 text-right">{fmtPct(ownershipPct)}</span>
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
            <div className="px-4 pb-4 border-t border-border pt-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Name</label>
                  <input className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    value={holder.name} onChange={e => onUpdate({ ...holder, name: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Instrument Type</label>
                  <select className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    value={holder.instrumentType} onChange={e => onUpdate({ ...holder, instrumentType: e.target.value as InstrumentType })}>
                    <option value="common">Common Stock</option>
                    <option value="preferred">Preferred Stock</option>
                    <option value="safe">SAFE Note (YC)</option>
                    <option value="convertible_note">Convertible Note</option>
                    <option value="oqal_note">OQAL Note (Shariah)</option>
                  </select>
                </div>

                {isNote ? (
                  <>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Investment Amount ($)</label>
                      <input type="number" className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        value={holder.investmentAmount} onChange={e => onUpdate({ ...holder, investmentAmount: Math.max(0, parseInt(e.target.value) || 0) })} />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Valuation Cap ($)</label>
                      <input type="number" className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        value={holder.valuationCap} onChange={e => onUpdate({ ...holder, valuationCap: Math.max(0, parseInt(e.target.value) || 0) })} />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Discount Rate (%)</label>
                      <input type="number" min={0} max={50} className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        value={holder.discountRate} onChange={e => onUpdate({ ...holder, discountRate: Math.min(50, Math.max(0, parseInt(e.target.value) || 0)) })} />
                    </div>
                    {holder.instrumentType === 'convertible_note' && (
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Interest Rate (% annual)</label>
                        <input type="number" min={0} max={30} className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400"
                          value={holder.interestRate} onChange={e => onUpdate({ ...holder, interestRate: Math.min(30, Math.max(0, parseInt(e.target.value) || 0)) })} />
                      </div>
                    )}
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Issue Date</label>
                      <input type="date" className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        value={holder.issueDate} onChange={e => onUpdate({ ...holder, issueDate: e.target.value })} />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Shares</label>
                    <input type="number" className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      value={holder.shares} onChange={e => onUpdate({ ...holder, shares: Math.max(0, parseInt(e.target.value) || 0) })} />
                  </div>
                )}

                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Holder Type</label>
                  <select className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    value={holder.type} onChange={e => onUpdate({ ...holder, type: e.target.value as HolderType })}>
                    <option value="founder">Founder</option>
                    <option value="employee">Employee</option>
                    <option value="investor">Investor</option>
                    <option value="option_pool">Option Pool</option>
                  </select>
                </div>
              </div>

              {/* Conversion preview for notes */}
              {isNote && pricePerShare > 0 && (
                <div className="mt-3 p-3 rounded-lg bg-indigo-50 border border-indigo-100">
                  <div className="text-xs font-semibold text-indigo-700 mb-2">Conversion at ${pricePerShare.toFixed(4)}/share</div>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <div className="text-indigo-500 mb-0.5">Conv. Price</div>
                      <div className="font-bold text-indigo-800">${calcConvertedShares(holder, pricePerShare) > 0 ? (holder.investmentAmount / calcConvertedShares(holder, pricePerShare)).toFixed(4) : '—'}</div>
                    </div>
                    <div>
                      <div className="text-indigo-500 mb-0.5">Shares Received</div>
                      <div className="font-bold text-indigo-800">{calcConvertedShares(holder, pricePerShare).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-indigo-500 mb-0.5">Ownership</div>
                      <div className="font-bold text-indigo-800">{fmtPct(ownershipPct)}</div>
                    </div>
                  </div>
                  {holder.instrumentType === 'oqal_note' && (
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] text-emerald-700">
                      <Shield className="w-3 h-3" />
                      <span>Shariah-compliant: Qard Hassan + Promise to Sell Shares (Wa'd Bi Al-Bay')</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function ZestEquity() {
  const { lang } = useLanguage();
  const isRTL = lang === 'ar';

  const { state, setState } = useToolState<ZestState>('zest_equity', DEFAULT_STATE);
  const { holders, pricePerShare, preMoneyValuation, newInvestment, totalShares } = state;

  const [showConversionTable, setShowConversionTable] = useState(false);

  // Derived calculations
  const totalConvertedShares = useMemo(() =>
    holders.reduce((s, h) => s + calcConvertedShares(h, pricePerShare), 0),
    [holders, pricePerShare]
  );

  const newSharesIssued = useMemo(() =>
    pricePerShare > 0 ? Math.round(newInvestment / pricePerShare) : 0,
    [newInvestment, pricePerShare]
  );

  const postMoneyValuation = preMoneyValuation + newInvestment;
  const postMoneyShares = totalConvertedShares + newSharesIssued;

  const chartData = useMemo(() => {
    return holders.map(h => ({
      name: h.name || 'Unnamed',
      value: totalConvertedShares > 0 ? parseFloat(((calcConvertedShares(h, pricePerShare) / totalConvertedShares) * 100).toFixed(2)) : 0,
      color: h.color,
    })).filter(d => d.value > 0);
  }, [holders, totalConvertedShares, pricePerShare]);

  const addHolder = (type: InstrumentType = 'common') => {
    const colorIdx = holders.length % HOLDER_COLORS.length;
    const isNote = ['safe', 'convertible_note', 'oqal_note'].includes(type);
    setState(prev => ({
      ...prev,
      holders: [...prev.holders, {
        id: nanoid(),
        name: type === 'safe' ? 'SAFE Investor' : type === 'convertible_note' ? 'Note Investor' : type === 'oqal_note' ? 'OQAL Investor' : `Holder ${prev.holders.length + 1}`,
        type: isNote ? 'investor' : 'founder',
        instrumentType: type,
        shares: isNote ? 0 : 1_000_000,
        investmentAmount: isNote ? 500_000 : 0,
        valuationCap: isNote ? preMoneyValuation * 1.5 : 0,
        discountRate: isNote ? 20 : 0,
        interestRate: type === 'convertible_note' ? 8 : 0,
        issueDate: new Date().toISOString().split('T')[0],
        color: HOLDER_COLORS[colorIdx],
      }],
    }));
  };

  const deleteHolder = (id: string) => {
    setState(prev => ({ ...prev, holders: prev.holders.filter(h => h.id !== id) }));
  };

  const updateHolder = (id: string, updated: Holder) => {
    setState(prev => ({ ...prev, holders: prev.holders.map(h => h.id === id ? updated : h) }));
  };

  const noteHolders = holders.filter(h => ['safe', 'convertible_note', 'oqal_note'].includes(h.instrumentType));
  const equityHolders = holders.filter(h => ['common', 'preferred'].includes(h.instrumentType));

  return (
    <div className={`flex flex-col gap-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
            </div>
            <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: 'Playfair Display, serif' }}>
              Zest Equity
            </h2>
          </div>
          <p className="text-sm text-muted-foreground max-w-xl">
            Model your cap table with full support for <strong>SAFE notes</strong>, <strong>convertible notes</strong>, and <strong>OQAL Notes</strong> (Shariah-compliant). See exactly how each instrument converts into equity at your next priced round.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => addHolder('safe')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors">
            <Zap className="w-3.5 h-3.5" /> Add SAFE
          </button>
          <button onClick={() => addHolder('convertible_note')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors">
            <FileText className="w-3.5 h-3.5" /> Add Conv. Note
          </button>
          <button onClick={() => addHolder('oqal_note')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors">
            <Shield className="w-3.5 h-3.5" /> Add OQAL Note
          </button>
          <button onClick={() => addHolder('common')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Equity Holder
          </button>
        </div>
      </div>

      {/* Round settings */}
      <div className="p-4 rounded-xl border border-border bg-card">
        <div className="text-sm font-semibold text-foreground mb-3">Round Parameters</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Pre-Money Valuation ($)</label>
            <input type="number" className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400"
              value={preMoneyValuation} onChange={e => setState(prev => ({ ...prev, preMoneyValuation: Math.max(0, parseInt(e.target.value) || 0) }))} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">New Investment ($)</label>
            <input type="number" className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400"
              value={newInvestment} onChange={e => setState(prev => ({ ...prev, newInvestment: Math.max(0, parseInt(e.target.value) || 0) }))} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Price Per Share ($)</label>
            <input type="number" step={0.001} className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400"
              value={pricePerShare} onChange={e => setState(prev => ({ ...prev, pricePerShare: Math.max(0.001, parseFloat(e.target.value) || 1) }))} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Total Shares (pre-round)</label>
            <input type="number" className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400"
              value={totalShares} onChange={e => setState(prev => ({ ...prev, totalShares: Math.max(0, parseInt(e.target.value) || 0) }))} />
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Post-Money Valuation', value: fmt(postMoneyValuation), color: 'text-indigo-600', bg: 'bg-indigo-50', icon: <TrendingUp className="w-4 h-4" /> },
          { label: 'New Shares Issued', value: newSharesIssued.toLocaleString(), color: 'text-amber-600', bg: 'bg-amber-50', icon: <Plus className="w-4 h-4" /> },
          { label: 'Total Converted Shares', value: totalConvertedShares.toLocaleString(), color: 'text-emerald-600', bg: 'bg-emerald-50', icon: <Users className="w-4 h-4" /> },
          { label: 'Notes → Equity', value: noteHolders.length.toString(), color: 'text-slate-600', bg: 'bg-slate-50', icon: <FileText className="w-4 h-4" /> },
        ].map((kpi, i) => (
          <div key={i} className="p-3.5 rounded-xl border border-border bg-card">
            <div className={`w-7 h-7 rounded-lg ${kpi.bg} ${kpi.color} flex items-center justify-center mb-2`}>{kpi.icon}</div>
            <div className="text-xl font-bold text-foreground">{kpi.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Main content: chart + holders */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Pie chart */}
        <div className="lg:col-span-2 p-4 rounded-xl border border-border bg-card flex flex-col">
          <div className="text-sm font-semibold text-foreground mb-3">Ownership Distribution</div>
          {chartData.length > 0 ? (
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2} dataKey="value">
                    {chartData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => [`${v.toFixed(1)}%`, 'Ownership']} />
                  <Legend iconType="circle" iconSize={8} formatter={(value) => <span className="text-xs text-foreground">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">Add holders to see chart</div>
          )}
        </div>

        {/* Holders list */}
        <div className="lg:col-span-3 flex flex-col gap-3">
          {/* Equity holders */}
          {equityHolders.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Equity Holders</div>
              <div className="flex flex-col gap-2">
                <AnimatePresence>
                  {equityHolders.map(h => (
                    <HolderRow key={h.id} holder={h} totalConvertedShares={totalConvertedShares} pricePerShare={pricePerShare}
                      onDelete={() => deleteHolder(h.id)} onUpdate={(updated) => updateHolder(h.id, updated)} />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Note holders */}
          {noteHolders.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Convertible Instruments</div>
              <div className="flex flex-col gap-2">
                <AnimatePresence>
                  {noteHolders.map(h => (
                    <HolderRow key={h.id} holder={h} totalConvertedShares={totalConvertedShares} pricePerShare={pricePerShare}
                      onDelete={() => deleteHolder(h.id)} onUpdate={(updated) => updateHolder(h.id, updated)} />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {holders.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-border rounded-xl">
              <Users className="w-8 h-8 text-muted-foreground mb-3" />
              <div className="text-sm font-semibold text-foreground mb-1">No holders yet</div>
              <div className="text-xs text-muted-foreground">Add equity holders or convertible instruments above</div>
            </div>
          )}
        </div>
      </div>

      {/* Conversion table toggle */}
      {noteHolders.length > 0 && (
        <div>
          <button
            onClick={() => setShowConversionTable(v => !v)}
            className="flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            <Info className="w-4 h-4" />
            {showConversionTable ? 'Hide' : 'Show'} Conversion Summary Table
          </button>
          <AnimatePresence>
            {showConversionTable && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-3">
                <div className="rounded-xl border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-secondary/50">
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Investor</th>
                        <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground">Amount</th>
                        <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground">Cap</th>
                        <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground">Discount</th>
                        <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground">Conv. Price</th>
                        <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground">Shares</th>
                        <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground">Ownership</th>
                      </tr>
                    </thead>
                    <tbody>
                      {noteHolders.map((h, i) => {
                        const converted = calcConvertedShares(h, pricePerShare);
                        const convPrice = pricePerShare > 0 && converted > 0 ? h.investmentAmount / converted : 0;
                        const pct = totalConvertedShares > 0 ? (converted / totalConvertedShares) * 100 : 0;
                        return (
                          <tr key={h.id} className={i % 2 === 0 ? 'bg-background' : 'bg-secondary/20'}>
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ background: h.color }} />
                                <span className="font-medium text-foreground">{h.name}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${getInstrumentColor(h.instrumentType)}`}>{getInstrumentLabel(h.instrumentType)}</span>
                              </div>
                            </td>
                            <td className="px-4 py-2.5 text-right text-foreground">{fmt(h.investmentAmount)}</td>
                            <td className="px-4 py-2.5 text-right text-foreground">{h.valuationCap > 0 ? fmt(h.valuationCap) : '—'}</td>
                            <td className="px-4 py-2.5 text-right text-foreground">{h.discountRate > 0 ? `${h.discountRate}%` : '—'}</td>
                            <td className="px-4 py-2.5 text-right text-foreground">{convPrice > 0 ? `$${convPrice.toFixed(4)}` : '—'}</td>
                            <td className="px-4 py-2.5 text-right font-semibold text-foreground">{converted.toLocaleString()}</td>
                            <td className="px-4 py-2.5 text-right font-semibold" style={{ color: h.color }}>{fmtPct(pct)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Instrument comparison */}
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
                ['Conversion Trigger', 'Next priced round', 'Next round / maturity', 'Qualified round / maturity'],
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
  );
}
