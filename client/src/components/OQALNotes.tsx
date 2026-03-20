/**
 * OQALNotes — Shariah-compliant OQAL Note calculator and tracker
 * Based on the OQAL Note structure: Qard Hassan + Promise to Sell Shares
 * Modeled on KISS (500 Startups) adapted for Saudi/Islamic law
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, FileText, Info, ChevronDown, ChevronUp, Shield, TrendingUp, DollarSign, Calendar, Users } from 'lucide-react';
import { nanoid } from 'nanoid';
import { useToolState } from '@/hooks/useToolState';
import { useLanguage } from '@/contexts/LanguageContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OQALNote {
  id: string;
  investorName: string;
  investmentAmount: number;         // SAR or USD
  currency: 'SAR' | 'USD';
  valuationCap: number;             // pre-money valuation cap
  discountRate: number;             // % discount on next round price
  issueDate: string;                // ISO date string
  maturityMonths: number;           // months until maturity (typically 18-24)
  conversionTrigger: 'qualified_round' | 'maturity' | 'change_of_control';
  qualifiedRoundThreshold: number;  // minimum round size to trigger conversion
  status: 'active' | 'converted' | 'repaid';
  notes: string;
}

interface OQALState {
  notes: OQALNote[];
  companyValuation: number;
  currency: 'SAR' | 'USD';
}

const DEFAULT_STATE: OQALState = {
  notes: [],
  companyValuation: 5_000_000,
  currency: 'SAR',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number, currency: 'SAR' | 'USD'): string {
  const symbol = currency === 'SAR' ? 'SAR ' : '$';
  if (Math.abs(n) >= 1_000_000) return `${symbol}${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `${symbol}${(n / 1_000).toFixed(0)}K`;
  return `${symbol}${n.toFixed(0)}`;
}

function calcConversionPrice(note: OQALNote, nextRoundPrice: number): number {
  const capPrice = note.valuationCap > 0 ? note.valuationCap / 10_000_000 : Infinity; // assume 10M shares
  const discountPrice = nextRoundPrice * (1 - note.discountRate / 100);
  return Math.min(capPrice, discountPrice, nextRoundPrice);
}

function calcSharesReceived(note: OQALNote, nextRoundPricePerShare: number): number {
  const convPrice = calcConversionPrice(note, nextRoundPricePerShare);
  return Math.round(note.investmentAmount / convPrice);
}

function daysUntilMaturity(issueDate: string, maturityMonths: number): number {
  const issue = new Date(issueDate);
  const maturity = new Date(issue);
  maturity.setMonth(maturity.getMonth() + maturityMonths);
  const now = new Date();
  return Math.ceil((maturity.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// ─── Note Card ────────────────────────────────────────────────────────────────

function NoteCard({
  note,
  currency,
  onDelete,
  onUpdate,
  nextRoundPrice,
}: {
  note: OQALNote;
  currency: 'SAR' | 'USD';
  onDelete: () => void;
  onUpdate: (updated: OQALNote) => void;
  nextRoundPrice: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const daysLeft = daysUntilMaturity(note.issueDate, note.maturityMonths);
  const convPrice = calcConversionPrice(note, nextRoundPrice);
  const sharesReceived = calcSharesReceived(note, nextRoundPrice);
  const effectiveDiscount = nextRoundPrice > 0 ? ((nextRoundPrice - convPrice) / nextRoundPrice * 100) : 0;

  const statusColors: Record<OQALNote['status'], string> = {
    active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    converted: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    repaid: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="border border-border rounded-xl overflow-hidden bg-card"
    >
      {/* Header */}
      <div className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
          <FileText className="w-5 h-5 text-indigo-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-foreground text-sm truncate">{note.investorName || 'Unnamed Investor'}</span>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${statusColors[note.status]}`}>
              {note.status === 'active' ? 'Active' : note.status === 'converted' ? 'Converted' : 'Repaid'}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{fmt(note.investmentAmount, note.currency)}</span>
            <span>·</span>
            <span>Cap: {fmt(note.valuationCap, note.currency)}</span>
            <span>·</span>
            <span>{note.discountRate}% discount</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {daysLeft > 0 && note.status === 'active' && (
            <div className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${daysLeft < 60 ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
              {daysLeft}d left
            </div>
          )}
          <button onClick={() => setExpanded(v => !v)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors text-muted-foreground">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pt-0 pb-4 border-t border-border">
              {/* Conversion preview */}
              {nextRoundPrice > 0 && note.status === 'active' && (
                <div className="mt-3 p-3 rounded-lg bg-indigo-50 border border-indigo-100 mb-4">
                  <div className="text-xs font-semibold text-indigo-700 mb-2">Conversion Preview (at next round price {fmt(nextRoundPrice, note.currency)}/share)</div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <div className="text-[10px] text-indigo-500 mb-0.5">Conversion Price</div>
                      <div className="text-sm font-bold text-indigo-800">{fmt(convPrice, note.currency)}/share</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-indigo-500 mb-0.5">Shares Received</div>
                      <div className="text-sm font-bold text-indigo-800">{sharesReceived.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-indigo-500 mb-0.5">Effective Discount</div>
                      <div className="text-sm font-bold text-indigo-800">{effectiveDiscount.toFixed(1)}%</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Edit fields */}
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Investor Name</label>
                  <input
                    className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    value={note.investorName}
                    onChange={e => onUpdate({ ...note, investorName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Investment Amount ({note.currency})</label>
                  <input
                    type="number"
                    className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    value={note.investmentAmount}
                    onChange={e => onUpdate({ ...note, investmentAmount: Math.max(0, parseInt(e.target.value) || 0) })}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Valuation Cap ({note.currency})</label>
                  <input
                    type="number"
                    className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    value={note.valuationCap}
                    onChange={e => onUpdate({ ...note, valuationCap: Math.max(0, parseInt(e.target.value) || 0) })}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Discount Rate (%)</label>
                  <input
                    type="number"
                    min={0} max={50}
                    className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    value={note.discountRate}
                    onChange={e => onUpdate({ ...note, discountRate: Math.min(50, Math.max(0, parseInt(e.target.value) || 0)) })}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Issue Date</label>
                  <input
                    type="date"
                    className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    value={note.issueDate}
                    onChange={e => onUpdate({ ...note, issueDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Maturity (months)</label>
                  <input
                    type="number"
                    min={6} max={60}
                    className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    value={note.maturityMonths}
                    onChange={e => onUpdate({ ...note, maturityMonths: Math.min(60, Math.max(6, parseInt(e.target.value) || 18)) })}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Qualified Round Threshold ({note.currency})</label>
                  <input
                    type="number"
                    className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    value={note.qualifiedRoundThreshold}
                    onChange={e => onUpdate({ ...note, qualifiedRoundThreshold: Math.max(0, parseInt(e.target.value) || 0) })}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Status</label>
                  <select
                    className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    value={note.status}
                    onChange={e => onUpdate({ ...note, status: e.target.value as OQALNote['status'] })}
                  >
                    <option value="active">Active</option>
                    <option value="converted">Converted</option>
                    <option value="repaid">Repaid</option>
                  </select>
                </div>
              </div>
              <div className="mt-3">
                <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
                <textarea
                  rows={2}
                  className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400 resize-none"
                  value={note.notes}
                  placeholder="Additional terms, conditions, or investor notes..."
                  onChange={e => onUpdate({ ...note, notes: e.target.value })}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function OQALNotes() {
  const { lang } = useLanguage();
  const isRTL = lang === 'ar';

  const { state, setState } = useToolState<OQALState>('oqal_notes', DEFAULT_STATE);
  const { notes, companyValuation, currency } = state;

  const [nextRoundPrice, setNextRoundPrice] = useState(0.5); // price per share in next round
  const [nextRoundSize, setNextRoundSize] = useState(2_000_000);

  const totalRaised = useMemo(() => notes.filter(n => n.status === 'active').reduce((s, n) => s + n.investmentAmount, 0), [notes]);
  const activeCount = notes.filter(n => n.status === 'active').length;
  const convertedCount = notes.filter(n => n.status === 'converted').length;

  const addNote = () => {
    const newNote: OQALNote = {
      id: nanoid(),
      investorName: '',
      investmentAmount: 500_000,
      currency,
      valuationCap: companyValuation * 2,
      discountRate: 20,
      issueDate: new Date().toISOString().split('T')[0],
      maturityMonths: 18,
      conversionTrigger: 'qualified_round',
      qualifiedRoundThreshold: 2_000_000,
      status: 'active',
      notes: '',
    };
    setState(prev => ({ ...prev, notes: [...prev.notes, newNote] }));
  };

  const deleteNote = (id: string) => {
    setState(prev => ({ ...prev, notes: prev.notes.filter(n => n.id !== id) }));
  };

  const updateNote = (id: string, updated: OQALNote) => {
    setState(prev => ({ ...prev, notes: prev.notes.map(n => n.id === id ? updated : n) }));
  };

  return (
    <div className={`flex flex-col gap-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Shield className="w-4 h-4 text-emerald-600" />
            </div>
            <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: 'Playfair Display, serif' }}>
              OQAL Notes
            </h2>
          </div>
          <p className="text-sm text-muted-foreground max-w-xl">
            Track Shariah-compliant OQAL Notes — the Saudi angel network's standardized financing instrument based on <strong>Qard Hassan</strong> (interest-free loan) + <strong>Promise to Sell Shares</strong>. Modeled on the KISS, adapted for Saudi &amp; Islamic law.
          </p>
        </div>
        <button
          onClick={addNote}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 shrink-0"
          style={{ background: 'linear-gradient(135deg, oklch(0.55 0.18 150), oklch(0.45 0.2 160))' }}
        >
          <Plus className="w-4 h-4" />
          Add OQAL Note
        </button>
      </div>

      {/* How it works */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          {
            icon: <DollarSign className="w-4 h-4 text-emerald-600" />,
            bg: 'bg-emerald-50',
            title: 'Qard Hassan',
            desc: 'Investor provides an interest-free loan (no riba). The principal is repayable if conversion does not occur.',
          },
          {
            icon: <FileText className="w-4 h-4 text-indigo-600" />,
            bg: 'bg-indigo-50',
            title: 'Promise to Sell Shares',
            desc: 'A binding promise to convert the loan into equity at a discounted price upon a qualifying event (next round, maturity, or exit).',
          },
          {
            icon: <TrendingUp className="w-4 h-4 text-amber-600" />,
            bg: 'bg-amber-50',
            title: 'Conversion Mechanics',
            desc: 'Investor receives shares at the lower of: (a) valuation cap price, or (b) next-round price minus discount rate.',
          },
        ].map((item, i) => (
          <div key={i} className="p-3.5 rounded-xl border border-border bg-card">
            <div className={`w-7 h-7 rounded-lg ${item.bg} flex items-center justify-center mb-2`}>
              {item.icon}
            </div>
            <div className="text-sm font-semibold text-foreground mb-1">{item.title}</div>
            <div className="text-xs text-muted-foreground leading-relaxed">{item.desc}</div>
          </div>
        ))}
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Raised via Notes', value: fmt(totalRaised, currency), icon: <DollarSign className="w-4 h-4" />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Active Notes', value: activeCount.toString(), icon: <FileText className="w-4 h-4" />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Converted', value: convertedCount.toString(), icon: <TrendingUp className="w-4 h-4" />, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Company Valuation', value: fmt(companyValuation, currency), icon: <Users className="w-4 h-4" />, color: 'text-slate-600', bg: 'bg-slate-50' },
        ].map((kpi, i) => (
          <div key={i} className="p-3.5 rounded-xl border border-border bg-card">
            <div className={`w-7 h-7 rounded-lg ${kpi.bg} ${kpi.color} flex items-center justify-center mb-2`}>
              {kpi.icon}
            </div>
            <div className="text-xl font-bold text-foreground">{kpi.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Settings row */}
      <div className="flex flex-wrap gap-4 items-end p-4 rounded-xl border border-border bg-card">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Currency</label>
          <select
            className="text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400"
            value={currency}
            onChange={e => setState(prev => ({ ...prev, currency: e.target.value as 'SAR' | 'USD' }))}
          >
            <option value="SAR">SAR (Saudi Riyal)</option>
            <option value="USD">USD (US Dollar)</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Current Company Valuation ({currency})</label>
          <input
            type="number"
            className="text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400 w-40"
            value={companyValuation}
            onChange={e => setState(prev => ({ ...prev, companyValuation: Math.max(0, parseInt(e.target.value) || 0) }))}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Next Round Price/Share ({currency})</label>
          <input
            type="number"
            step={0.01}
            className="text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400 w-36"
            value={nextRoundPrice}
            onChange={e => setNextRoundPrice(Math.max(0.001, parseFloat(e.target.value) || 0.5))}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Next Round Size ({currency})</label>
          <input
            type="number"
            className="text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400 w-40"
            value={nextRoundSize}
            onChange={e => setNextRoundSize(Math.max(0, parseInt(e.target.value) || 0))}
          />
        </div>
      </div>

      {/* Notes list */}
      {notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-emerald-400" />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-2">No OQAL Notes yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-4">
            Add your first OQAL Note to track Shariah-compliant angel investments. Each note is structured as a Qard Hassan with a promise to sell shares.
          </p>
          <button
            onClick={addNote}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, oklch(0.55 0.18 150), oklch(0.45 0.2 160))' }}
          >
            <Plus className="w-4 h-4" />
            Add First OQAL Note
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">{notes.length} Note{notes.length !== 1 ? 's' : ''}</h3>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Info className="w-3.5 h-3.5" />
              <span>Click a note to expand and edit details</span>
            </div>
          </div>
          <AnimatePresence>
            {notes.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                currency={currency}
                onDelete={() => deleteNote(note.id)}
                onUpdate={(updated) => updateNote(note.id, updated)}
                nextRoundPrice={nextRoundPrice}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Shariah compliance note */}
      <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50">
        <div className="flex items-start gap-2.5">
          <Shield className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
          <div>
            <div className="text-sm font-semibold text-emerald-800 mb-1">Shariah Compliance Note</div>
            <p className="text-xs text-emerald-700 leading-relaxed">
              The OQAL Note is structured to comply with Islamic Shariah principles by using <strong>Qard Hassan</strong> (interest-free loan) instead of interest-bearing debt. The "conversion" is implemented as a <strong>Promise to Sell Shares (Wa'd Bi Al-Bay')</strong> — a binding unilateral promise by the startup to sell shares to the investor at a future date. This structure was developed by OQAL (Saudi Angel Investors Network) in 2021 and is compliant with both Saudi Arabian law and English law. Always consult a qualified Shariah advisor before issuing notes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
