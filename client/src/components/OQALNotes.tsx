/**
 * OQALNotes — Shariah-compliant OQAL Note calculator and tracker
 * Connected to the unified cap table (ZestEquity) as source of truth.
 * OQAL notes are stored as CapTableInstrument with type='oqal_note'.
 */
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, FileText, Info, ChevronDown, ChevronUp, Shield, TrendingUp, DollarSign, Users, Link2, RefreshCw } from 'lucide-react';
import { nanoid } from 'nanoid';
import { useCapTable } from '@/hooks/useCapTable';
import { useLanguage } from '@/contexts/LanguageContext';
import type { CapTableInstrument } from '@shared/equity';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number, currency: 'SAR' | 'USD'): string {
  const symbol = currency === 'SAR' ? 'SAR ' : '$';
  if (Math.abs(n) >= 1_000_000) return `${symbol}${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `${symbol}${(n / 1_000).toFixed(0)}K`;
  return `${symbol}${n.toFixed(0)}`;
}

function calcConversionPrice(note: CapTableInstrument, nextRoundPricePerShare: number, totalShares: number): number {
  const capPrice = note.valuationCap > 0 && totalShares > 0
    ? note.valuationCap / totalShares
    : Infinity;
  const discountPrice = nextRoundPricePerShare * (1 - note.discountRate / 100);
  return Math.min(capPrice, discountPrice, nextRoundPricePerShare);
}

function calcSharesReceived(note: CapTableInstrument, nextRoundPricePerShare: number, totalShares: number): number {
  const convPrice = calcConversionPrice(note, nextRoundPricePerShare, totalShares);
  if (convPrice <= 0) return 0;
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
  totalShares,
}: {
  note: CapTableInstrument;
  currency: 'SAR' | 'USD';
  onDelete: () => void;
  onUpdate: (patch: Partial<CapTableInstrument>) => void;
  nextRoundPrice: number;
  totalShares: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const daysLeft = daysUntilMaturity(note.issueDate, note.maturityMonths);
  const convPrice = calcConversionPrice(note, nextRoundPrice, totalShares);
  const sharesReceived = calcSharesReceived(note, nextRoundPrice, totalShares);
  const effectiveDiscount = nextRoundPrice > 0 ? ((nextRoundPrice - convPrice) / nextRoundPrice * 100) : 0;

  const statusColors: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    converted: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    repaid: 'bg-slate-100 text-slate-600 border-slate-200',
    cancelled: 'bg-red-100 text-red-600 border-red-200',
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
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${statusColors[note.status] ?? statusColors.active}`}>
              {note.status.charAt(0).toUpperCase() + note.status.slice(1)}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{fmt(note.investmentAmount, note.currency)}</span>
            <span>·</span>
            <span>Cap: {fmt(note.valuationCap, note.currency)}</span>
            <span>·</span>
            <span className={daysLeft < 0 ? 'text-red-500 font-semibold' : daysLeft < 90 ? 'text-amber-600 font-semibold' : ''}>
              {daysLeft < 0 ? `Matured ${Math.abs(daysLeft)}d ago` : `${daysLeft}d to maturity`}
            </span>
          </div>
        </div>

        {/* Conversion preview */}
        {nextRoundPrice > 0 && note.status === 'active' && (
          <div className="hidden sm:flex flex-col items-end shrink-0 text-right">
            <div className="text-xs font-bold text-indigo-600">{sharesReceived.toLocaleString()} shares</div>
            <div className="text-[10px] text-muted-foreground">{effectiveDiscount.toFixed(1)}% eff. discount</div>
          </div>
        )}

        <div className="flex items-center gap-1 shrink-0">
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
            <div className="px-4 pb-4 border-t border-border pt-3">
              {/* Conversion summary */}
              {nextRoundPrice > 0 && (
                <div className="mb-4 grid grid-cols-3 gap-3">
                  <div className="p-2.5 rounded-lg bg-indigo-50 border border-indigo-100 text-center">
                    <div className="text-[10px] text-indigo-600 font-semibold mb-0.5">Conversion Price</div>
                    <div className="text-sm font-bold text-indigo-700">{fmt(convPrice, note.currency)}/share</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-100 text-center">
                    <div className="text-[10px] text-emerald-600 font-semibold mb-0.5">Shares Received</div>
                    <div className="text-sm font-bold text-emerald-700">{sharesReceived.toLocaleString()}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-100 text-center">
                    <div className="text-[10px] text-amber-600 font-semibold mb-0.5">Effective Discount</div>
                    <div className="text-sm font-bold text-amber-700">{effectiveDiscount.toFixed(1)}%</div>
                  </div>
                </div>
              )}

              {/* Edit fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Investor Name</label>
                  <input
                    className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    value={note.investorName}
                    onChange={e => onUpdate({ investorName: e.target.value })}
                    placeholder="e.g. OQAL Angel Fund"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Investment Amount ({note.currency})</label>
                  <input
                    type="number"
                    className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    value={note.investmentAmount}
                    onChange={e => onUpdate({ investmentAmount: Math.max(0, parseInt(e.target.value) || 0) })}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Valuation Cap ({note.currency})</label>
                  <input
                    type="number"
                    className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    value={note.valuationCap}
                    onChange={e => onUpdate({ valuationCap: Math.max(0, parseInt(e.target.value) || 0) })}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Discount Rate (%)</label>
                  <input
                    type="number" min={0} max={50}
                    className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    value={note.discountRate}
                    onChange={e => onUpdate({ discountRate: Math.min(50, Math.max(0, parseInt(e.target.value) || 0)) })}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Issue Date</label>
                  <input
                    type="date"
                    className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    value={note.issueDate}
                    onChange={e => onUpdate({ issueDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Maturity (months)</label>
                  <input
                    type="number" min={6} max={60}
                    className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    value={note.maturityMonths}
                    onChange={e => onUpdate({ maturityMonths: Math.min(60, Math.max(6, parseInt(e.target.value) || 18)) })}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Qualified Round Threshold ({note.currency})</label>
                  <input
                    type="number"
                    className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    value={note.qualifiedRoundThreshold}
                    onChange={e => onUpdate({ qualifiedRoundThreshold: Math.max(0, parseInt(e.target.value) || 0) })}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Status</label>
                  <select
                    className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    value={note.status}
                    onChange={e => onUpdate({ status: e.target.value as CapTableInstrument['status'] })}
                  >
                    <option value="active">Active</option>
                    <option value="converted">Converted</option>
                    <option value="repaid">Repaid</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div className="mt-3">
                <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
                <textarea
                  rows={2}
                  className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-400 resize-none"
                  value={note.notes || ''}
                  placeholder="Additional terms, conditions, or investor notes..."
                  onChange={e => onUpdate({ notes: e.target.value })}
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

  const { state, isLoading, computed, setInstruments } = useCapTable();
  const [nextRoundPrice, setNextRoundPrice] = useState(0.5);
  const [nextRoundSize, setNextRoundSize] = useState(2_000_000);

  if (isLoading || !state) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const cs = state!;
  const currency = cs.currency;
  const totalSharesBasic = computed?.totalSharesBasic ?? 1;

  // Only show OQAL notes from the instruments array
  const oqalNotes = cs.instruments.filter(i => i.type === 'oqal_note');
  const allInstruments = cs.instruments;

  const totalRaised = useMemo(
    () => oqalNotes.filter(n => n.status === 'active').reduce((s, n) => s + n.investmentAmount, 0),
    [oqalNotes]
  );
  const activeCount = oqalNotes.filter(n => n.status === 'active').length;
  const convertedCount = oqalNotes.filter(n => n.status === 'converted').length;

  const COLORS = ['#4F6EF7', '#C4614A', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

  function addNote() {
    const idx = allInstruments.length;
    const newNote: CapTableInstrument = {
      id: nanoid(),
      investorName: '',
      type: 'oqal_note',
      investmentAmount: 500_000,
      currency,
      valuationCap: cs.nextRoundPreMoneyValuation > 0 ? cs.nextRoundPreMoneyValuation * 2 : 10_000_000,
      discountRate: 20,
      interestRate: 0,
      issueDate: new Date().toISOString().split('T')[0],
      maturityMonths: 18,
      conversionTrigger: 'qualified_round',
      qualifiedRoundThreshold: 2_000_000,
      status: 'active',
      color: COLORS[idx % COLORS.length],
    };
    setInstruments([...allInstruments, newNote]);
  }

  function deleteNote(id: string) {
    setInstruments(allInstruments.filter(i => i.id !== id));
  }

  function updateNote(id: string, patch: Partial<CapTableInstrument>) {
    setInstruments(allInstruments.map(i => i.id === id ? { ...i, ...patch } : i));
  }

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
            Track Shariah-compliant OQAL Notes — the Saudi angel network's standardized financing instrument based on <strong>Qard Hassan</strong> (interest-free loan) + <strong>Promise to Sell Shares</strong>. Notes are stored in the unified cap table and appear in dilution calculations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full shrink-0">
            <Link2 className="w-3 h-3" />
            <span>Synced with Cap Table</span>
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
      </div>

      {/* How it works */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          {
            icon: <DollarSign className="w-4 h-4 text-emerald-600" />, bg: 'bg-emerald-50',
            title: 'Qard Hassan',
            desc: 'Investor provides an interest-free loan (no riba). The principal is repayable if conversion does not occur.',
          },
          {
            icon: <FileText className="w-4 h-4 text-indigo-600" />, bg: 'bg-indigo-50',
            title: 'Promise to Sell Shares',
            desc: 'A binding promise to convert the loan into equity at a discounted price upon a qualifying event (next round, maturity, or exit).',
          },
          {
            icon: <TrendingUp className="w-4 h-4 text-amber-600" />, bg: 'bg-amber-50',
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
          { label: 'Total Shares (Fully Diluted)', value: (computed?.totalSharesFullyDiluted ?? 0).toLocaleString(), icon: <Users className="w-4 h-4" />, color: 'text-slate-600', bg: 'bg-slate-50' },
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

      {/* Conversion scenario settings */}
      <div className="flex flex-wrap gap-4 items-end p-4 rounded-xl border border-border bg-card">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Next Round Price/Share ({currency})</label>
          <input
            type="number" step={0.01}
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
        <div className="text-xs text-muted-foreground">
          <div>Total shares (basic): <span className="font-semibold text-foreground">{totalSharesBasic.toLocaleString()}</span></div>
          <div>Implied post-money: <span className="font-semibold text-foreground">{fmt(nextRoundPrice * totalSharesBasic, currency)}</span></div>
        </div>
      </div>

      {/* Notes list */}
      {oqalNotes.length === 0 ? (
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
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
            style={{ background: 'linear-gradient(135deg, oklch(0.55 0.18 150), oklch(0.45 0.2 160))' }}
          >
            <Plus className="w-4 h-4" />
            Add First OQAL Note
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">{oqalNotes.length} Note{oqalNotes.length !== 1 ? 's' : ''}</h3>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Info className="w-3.5 h-3.5" />
              <span>Click a note to expand and edit details</span>
            </div>
          </div>
          <AnimatePresence>
            {oqalNotes.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                currency={currency}
                onDelete={() => deleteNote(note.id)}
                onUpdate={(patch) => updateNote(note.id, patch)}
                nextRoundPrice={nextRoundPrice}
                totalShares={totalSharesBasic}
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
