/**
 * InvestorCRM — Simple investor outreach tracker
 * Design: "Venture Capital Clarity" — Editorial Finance
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Check, X, Mail, Phone, ExternalLink, Users, Download, Rocket, BookmarkCheck } from 'lucide-react';
import { nanoid } from 'nanoid';
import { useTrackedApplications } from '@/contexts/TrackedApplicationsContext';

type Status = 'target' | 'contacted' | 'intro-requested' | 'meeting-scheduled' | 'due-diligence' | 'term-sheet' | 'passed' | 'invested';

interface Investor {
  id: string;
  name: string;
  firm: string;
  stage: string;
  focus: string;
  status: Status;
  lastContact: string;
  notes: string;
  email: string;
  linkedin: string;
}

const STATUS_CONFIG: Record<Status, { label: string; color: string; bg: string }> = {
  'target':           { label: 'Target',             color: '#6B7280', bg: '#F3F4F6' },
  'contacted':        { label: 'Contacted',           color: '#2D4A6B', bg: '#EFF6FF' },
  'intro-requested':  { label: 'Intro Requested',     color: '#7C3AED', bg: '#F5F3FF' },
  'meeting-scheduled':{ label: 'Meeting Scheduled',   color: '#D97706', bg: '#FFFBEB' },
  'due-diligence':    { label: 'Due Diligence',       color: '#C4614A', bg: '#FFF5F3' },
  'term-sheet':       { label: 'Term Sheet',          color: '#059669', bg: '#ECFDF5' },
  'passed':           { label: 'Passed',              color: '#9CA3AF', bg: '#F9FAFB' },
  'invested':         { label: 'Invested ✓',          color: '#10B981', bg: '#D1FAE5' },
};

const PIPELINE_STAGES: Status[] = ['target', 'contacted', 'intro-requested', 'meeting-scheduled', 'due-diligence', 'term-sheet', 'invested'];

const DEFAULT_INVESTORS: Investor[] = [
  { id: nanoid(), name: 'Sarah Chen', firm: 'Sequoia Capital', stage: 'Seed', focus: 'AI/ML, SaaS', status: 'meeting-scheduled', lastContact: '2026-03-10', notes: 'Warm intro from YC alum. Very interested in AI angle. Follow up with demo.', email: '', linkedin: '' },
  { id: nanoid(), name: 'Marcus Williams', firm: 'a16z', stage: 'Series A', focus: 'Enterprise Software', status: 'contacted', lastContact: '2026-03-05', notes: 'Cold email. Opened 3x. Need warm intro.', email: '', linkedin: '' },
  { id: nanoid(), name: 'Aisha Patel', firm: 'Techstars MENA', stage: 'Pre-Seed/Seed', focus: 'All sectors', status: 'intro-requested', lastContact: '2026-03-12', notes: 'Applied to Techstars batch. Awaiting response.', email: '', linkedin: '' },
];

const EMPTY_INVESTOR: Omit<Investor, 'id'> = {
  name: '', firm: '', stage: 'Seed', focus: '', status: 'target', lastContact: new Date().toISOString().split('T')[0], notes: '', email: '', linkedin: '',
};

function StatusBadge({ status }: { status: Status }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}30` }}>
      {cfg.label}
    </span>
  );
}

export default function InvestorCRM() {
  const [investors, setInvestors] = useState<Investor[]>(DEFAULT_INVESTORS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Omit<Investor, 'id'>>(EMPTY_INVESTOR);
  const [showAdd, setShowAdd] = useState(false);
  const [newData, setNewData] = useState<Omit<Investor, 'id'>>(EMPTY_INVESTOR);
  const [filterStatus, setFilterStatus] = useState<Status | 'all'>('all');
  const { tracked, untrack } = useTrackedApplications();

  const filtered = filterStatus === 'all' ? investors : investors.filter(i => i.status === filterStatus);

  const pipelineCounts = PIPELINE_STAGES.reduce((acc, s) => {
    acc[s] = investors.filter(i => i.status === s).length;
    return acc;
  }, {} as Record<Status, number>);

  const startEdit = (inv: Investor) => {
    setEditingId(inv.id);
    setEditData({ name: inv.name, firm: inv.firm, stage: inv.stage, focus: inv.focus, status: inv.status, lastContact: inv.lastContact, notes: inv.notes, email: inv.email, linkedin: inv.linkedin });
  };

  const saveEdit = () => {
    setInvestors(prev => prev.map(i => i.id === editingId ? { ...i, ...editData } : i));
    setEditingId(null);
  };

  const addInvestor = () => {
    if (!newData.name) return;
    setInvestors(prev => [...prev, { id: nanoid(), ...newData }]);
    setNewData(EMPTY_INVESTOR);
    setShowAdd(false);
  };

  const deleteInvestor = (id: string) => setInvestors(prev => prev.filter(i => i.id !== id));

  const updateStatus = (id: string, status: Status) => {
    setInvestors(prev => prev.map(i => i.id === id ? { ...i, status } : i));
  };

  const exportCSV = () => {
    const headers = ['Name', 'Firm', 'Stage', 'Focus', 'Status', 'Last Contact', 'Email', 'LinkedIn', 'Notes'];
    const rows = investors.map(inv => [
      inv.name, inv.firm, inv.stage, inv.focus,
      STATUS_CONFIG[inv.status].label,
      inv.lastContact, inv.email, inv.linkedin,
      `"${inv.notes.replace(/"/g, '""')}"`
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `investor-pipeline-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
            Investor CRM
          </h2>
          <p className="text-sm text-muted-foreground">Track your investor outreach pipeline. Stay organized during fundraising.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
            style={{ background: 'oklch(0.18 0.05 240)', color: '#FAF6EF', border: '1px solid oklch(0.28 0.04 240)' }}
            title="Export to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
          <button
            onClick={() => setShowAdd(v => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: '#C4614A' }}
          >
            <Plus className="w-4 h-4" />
            Add Investor
          </button>
        </div>
      </div>

      {/* Pipeline funnel */}
      <div className="border border-border rounded-xl p-4 bg-card">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Pipeline Overview</div>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {PIPELINE_STAGES.map((stage, i) => {
            const cfg = STATUS_CONFIG[stage];
            const count = pipelineCounts[stage] || 0;
            return (
              <div key={stage} className="flex-1 min-w-[70px] text-center">
                <div className="text-lg font-black metric-value" style={{ color: cfg.color }}>{count}</div>
                <div className="text-[9px] text-muted-foreground leading-tight mt-0.5">{cfg.label}</div>
                {i < PIPELINE_STAGES.length - 1 && (
                  <div className="text-muted-foreground text-xs mt-1">→</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="border border-border rounded-xl p-4 bg-card space-y-3">
            <div className="text-sm font-semibold text-foreground">Add New Investor</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { key: 'name', label: 'Name', placeholder: 'Sarah Chen' },
                { key: 'firm', label: 'Firm', placeholder: 'Sequoia Capital' },
                { key: 'stage', label: 'Stage Focus', placeholder: 'Seed, Series A' },
                { key: 'focus', label: 'Sector Focus', placeholder: 'AI/ML, SaaS' },
                { key: 'email', label: 'Email', placeholder: 'sarah@sequoia.com' },
                { key: 'linkedin', label: 'LinkedIn URL', placeholder: 'linkedin.com/in/...' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">{f.label}</label>
                  <input value={(newData as any)[f.key]} placeholder={f.placeholder}
                    onChange={e => setNewData(d => ({ ...d, [f.key]: e.target.value }))}
                    className="vc-input w-full px-3 py-2 text-sm" />
                </div>
              ))}
            </div>
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Status</label>
              <select value={newData.status} onChange={e => setNewData(d => ({ ...d, status: e.target.value as Status }))}
                className="vc-input w-full px-3 py-2 text-sm">
                {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Notes</label>
              <textarea value={newData.notes} onChange={e => setNewData(d => ({ ...d, notes: e.target.value }))}
                placeholder="How you met, key interests, next steps..."
                className="vc-input w-full px-3 py-2 text-sm resize-none" rows={2} />
            </div>
            <div className="flex gap-2">
              <button onClick={addInvestor} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: '#C4614A' }}>
                <Check className="w-3.5 h-3.5" /> Add
              </button>
              <button onClick={() => setShowAdd(false)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border border-border text-muted-foreground hover:bg-secondary/40">
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilterStatus('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filterStatus === 'all' ? 'bg-foreground text-background' : 'border border-border text-muted-foreground'}`}>
          All ({investors.length})
        </button>
        {PIPELINE_STAGES.map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filterStatus === s ? 'text-white' : 'border border-border text-muted-foreground'}`}
            style={filterStatus === s ? { background: STATUS_CONFIG[s].color } : {}}>
            {STATUS_CONFIG[s].label} {pipelineCounts[s] > 0 ? `(${pipelineCounts[s]})` : ''}
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="w-8 h-8 mx-auto mb-3 opacity-40" />
          <div className="text-sm">No investors yet. Add your first target investor above.</div>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(inv => (
            <motion.div key={inv.id} layout
              className="border border-border rounded-xl overflow-hidden bg-card">
              {editingId === inv.id ? (
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { key: 'name', label: 'Name' }, { key: 'firm', label: 'Firm' },
                      { key: 'stage', label: 'Stage' }, { key: 'focus', label: 'Focus' },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">{f.label}</label>
                        <input value={(editData as any)[f.key]}
                          onChange={e => setEditData(d => ({ ...d, [f.key]: e.target.value }))}
                          className="vc-input w-full px-3 py-1.5 text-sm" />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Status</label>
                    <select value={editData.status} onChange={e => setEditData(d => ({ ...d, status: e.target.value as Status }))}
                      className="vc-input w-full px-3 py-1.5 text-sm">
                      {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Notes</label>
                    <textarea value={editData.notes} onChange={e => setEditData(d => ({ ...d, notes: e.target.value }))}
                      className="vc-input w-full px-3 py-1.5 text-sm resize-none" rows={2} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={saveEdit} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: '#10B981' }}>
                      <Check className="w-3 h-3" /> Save
                    </button>
                    <button onClick={() => setEditingId(null)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-border text-muted-foreground">
                      <X className="w-3 h-3" /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-foreground">{inv.name}</span>
                        <span className="text-xs text-muted-foreground">@ {inv.firm}</span>
                        <StatusBadge status={inv.status} />
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {inv.stage} · {inv.focus} · Last contact: {inv.lastContact}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => startEdit(inv)} className="text-muted-foreground hover:text-foreground transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteInvestor(inv.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {inv.notes && (
                    <div className="text-xs text-muted-foreground bg-secondary/40 rounded-lg px-3 py-2 mb-2 leading-relaxed">{inv.notes}</div>
                  )}
                  {/* Quick status update */}
                  <div className="flex gap-1.5 flex-wrap">
                    {PIPELINE_STAGES.filter(s => s !== inv.status).slice(0, 3).map(s => (
                      <button key={s} onClick={() => updateStatus(inv.id, s)}
                        className="text-[9px] px-2 py-1 rounded-full border border-border text-muted-foreground hover:border-accent hover:text-accent transition-all">
                        → {STATUS_CONFIG[s].label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Tracked Accelerator Applications */}
      {tracked.length > 0 && (
        <div className="border border-border rounded-xl overflow-hidden bg-card">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-secondary/30">
            <Rocket className="w-4 h-4 text-green-600" />
            <span className="text-sm font-semibold text-foreground">Tracked Accelerator Applications</span>
            <span className="ml-auto text-[10px] font-mono text-muted-foreground border border-border px-2 py-0.5 rounded-full">{tracked.length} tracked</span>
          </div>
          <div className="divide-y divide-border">
            {tracked.map(app => (
              <div key={app.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <BookmarkCheck className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-foreground truncate">{app.acceleratorName}</div>
                    <div className="text-[10px] text-muted-foreground">{app.organization} · Deadline: {app.deadline} · Equity: {app.equity}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={app.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-all hover:opacity-90"
                    style={{ background: 'oklch(0.18 0.05 240)', color: '#FAF6EF', border: '1px solid oklch(0.28 0.04 240)' }}
                  >
                    Apply
                  </a>
                  <button
                    onClick={() => untrack(app.acceleratorName)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    title="Remove from tracker"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
