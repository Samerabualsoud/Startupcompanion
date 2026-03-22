/**
 * InvestorCRM — Database-backed investor outreach tracker
 * Design: "Venture Capital Clarity" — Editorial Finance
 * Contacts are persisted per user via tRPC + MySQL.
 */

import { useStartup } from '@/contexts/StartupContext';
import ToolGuide from '@/components/ToolGuide';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Check, X, Users, Download, Rocket, BookmarkCheck, Loader2, RefreshCw } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { useTrackedApplications } from '@/contexts/TrackedApplicationsContext';
import { getLoginUrl } from '@/const';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SECTORS, FUNDING_STAGES } from '@shared/dropdowns';

type Status = 'target' | 'contacted' | 'intro-requested' | 'meeting-scheduled' | 'due-diligence' | 'term-sheet' | 'passed' | 'invested';

interface ContactFormData {
  name: string;
  firm: string;
  stageFocus: string;
  sectorFocus: string;
  status: Status;
  lastContact: string;
  notes: string;
  email: string;
  linkedin: string;
}

const STATUS_CONFIG_EN: Record<Status, { label: string; color: string; bg: string }> = {
  'target':            { label: 'Target',           color: '#6B7280', bg: '#F3F4F6' },
  'contacted':         { label: 'Contacted',         color: '#2D4A6B', bg: '#EFF6FF' },
  'intro-requested':   { label: 'Intro Requested',   color: '#7C3AED', bg: '#F5F3FF' },
  'meeting-scheduled': { label: 'Meeting Scheduled', color: '#D97706', bg: '#FFFBEB' },
  'due-diligence':     { label: 'Due Diligence',     color: '#C4614A', bg: '#FFF5F3' },
  'term-sheet':        { label: 'Term Sheet',        color: '#059669', bg: '#ECFDF5' },
  'passed':            { label: 'Passed',            color: '#9CA3AF', bg: '#F9FAFB' },
  'invested':          { label: 'Invested ✓',        color: '#10B981', bg: '#D1FAE5' },
};
const STATUS_CONFIG_AR: Record<Status, { label: string; color: string; bg: string }> = {
  'target':            { label: 'مستهدف',           color: '#6B7280', bg: '#F3F4F6' },
  'contacted':         { label: 'تم التواصل',         color: '#2D4A6B', bg: '#EFF6FF' },
  'intro-requested':   { label: 'طلب تعريف',   color: '#7C3AED', bg: '#F5F3FF' },
  'meeting-scheduled': { label: 'اجتماع مجدول', color: '#D97706', bg: '#FFFBEB' },
  'due-diligence':     { label: 'عناية واجبة',     color: '#C4614A', bg: '#FFF5F3' },
  'term-sheet':        { label: 'صحيفة الشروط',        color: '#059669', bg: '#ECFDF5' },
  'passed':            { label: 'رفض',            color: '#9CA3AF', bg: '#F9FAFB' },
  'invested':          { label: 'استثمر ✓',        color: '#10B981', bg: '#D1FAE5' },
};

const PIPELINE_STAGES: Status[] = ['target', 'contacted', 'intro-requested', 'meeting-scheduled', 'due-diligence', 'term-sheet', 'invested'];

const EMPTY_FORM: ContactFormData = {
  name: '', firm: '', stageFocus: 'Seed', sectorFocus: '', status: 'target',
  lastContact: new Date().toISOString().split('T')[0], notes: '', email: '', linkedin: '',
};

type StatusConfigMap = Record<Status, { label: string; color: string; bg: string }>;
function StatusBadge({ status, config }: { status: Status; config: StatusConfigMap }) {
  const cfg = config[status];
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}30` }}>
      {cfg.label}
    </span>
  );
}

export default function InvestorCRM() {
  const { snapshot } = useStartup();
  const { lang, isRTL } = useLanguage();
  const STATUS_CONFIG = lang === 'ar' ? STATUS_CONFIG_AR : STATUS_CONFIG_EN;
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const { tracked, untrack } = useTrackedApplications();

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: contacts = [], isLoading, error } = trpc.crm.getContacts.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  // ── Mutations ─────────────────────────────────────────────────────────────
  const addMutation = trpc.crm.addContact.useMutation({
    onSuccess: () => utils.crm.getContacts.invalidate(),
  });

  const updateMutation = trpc.crm.updateContact.useMutation({
    onMutate: async ({ id, data }) => {
      await utils.crm.getContacts.cancel();
      const prev = utils.crm.getContacts.getData();
      utils.crm.getContacts.setData(undefined, old =>
        old?.map(c => c.id === id ? { ...c, ...data } : c) ?? []
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) utils.crm.getContacts.setData(undefined, ctx.prev);
    },
    onSettled: () => utils.crm.getContacts.invalidate(),
  });

  const statusMutation = trpc.crm.updateStatus.useMutation({
    onMutate: async ({ id, status }) => {
      await utils.crm.getContacts.cancel();
      const prev = utils.crm.getContacts.getData();
      utils.crm.getContacts.setData(undefined, old =>
        old?.map(c => c.id === id ? { ...c, status } : c) ?? []
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) utils.crm.getContacts.setData(undefined, ctx.prev);
    },
    onSettled: () => utils.crm.getContacts.invalidate(),
  });

  const deleteMutation = trpc.crm.deleteContact.useMutation({
    onMutate: async ({ id }) => {
      await utils.crm.getContacts.cancel();
      const prev = utils.crm.getContacts.getData();
      utils.crm.getContacts.setData(undefined, old => old?.filter(c => c.id !== id) ?? []);
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) utils.crm.getContacts.setData(undefined, ctx.prev);
    },
    onSettled: () => utils.crm.getContacts.invalidate(),
  });

  // ── Local UI state ────────────────────────────────────────────────────────
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<ContactFormData>(EMPTY_FORM);
  const [showAdd, setShowAdd] = useState(false);
  const [newData, setNewData] = useState<ContactFormData>(EMPTY_FORM);
  const [filterStatus, setFilterStatus] = useState<Status | 'all'>('all');

  const filtered = filterStatus === 'all' ? contacts : contacts.filter(c => c.status === filterStatus);

  const pipelineCounts = PIPELINE_STAGES.reduce((acc, s) => {
    acc[s] = contacts.filter(c => c.status === s).length;
    return acc;
  }, {} as Record<Status, number>);

  const startEdit = (c: typeof contacts[0]) => {
    setEditingId(c.id);
    setEditData({
      name: c.name, firm: c.firm, stageFocus: c.stageFocus, sectorFocus: c.sectorFocus,
      status: c.status as Status, lastContact: c.lastContact, notes: c.notes,
      email: c.email, linkedin: c.linkedin,
    });
  };

  const saveEdit = () => {
    if (!editingId) return;
    updateMutation.mutate({
      id: editingId,
      data: {
        name: editData.name, firm: editData.firm, stageFocus: editData.stageFocus,
        sectorFocus: editData.sectorFocus, status: editData.status,
        lastContact: editData.lastContact, notes: editData.notes,
        email: editData.email, linkedin: editData.linkedin,
      },
    });
    setEditingId(null);
  };

  const addContact = () => {
    if (!newData.name.trim()) return;
    addMutation.mutate({
      name: newData.name, firm: newData.firm, stageFocus: newData.stageFocus,
      sectorFocus: newData.sectorFocus, status: newData.status,
      lastContact: newData.lastContact, notes: newData.notes,
      email: newData.email, linkedin: newData.linkedin,
    }, {
      onSuccess: () => {
        setNewData(EMPTY_FORM);
        setShowAdd(false);
      },
    });
  };

  const exportCSV = () => {
    const headers = ['Name', 'Firm', 'Stage Focus', 'Sector Focus', 'Status', 'Last Contact', 'Email', 'LinkedIn', 'Notes'];
    const rows = contacts.map(c => [
      c.name, c.firm, c.stageFocus, c.sectorFocus,
      STATUS_CONFIG[c.status as Status]?.label ?? c.status,
      c.lastContact, c.email, c.linkedin,
      `"${c.notes.replace(/"/g, '""')}"`,
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

  // ── Auth gate ─────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
      <ToolGuide
        toolName={lang === 'ar' ? 'خط أنابيب المستثمرين' : 'Investor Pipeline'}
        tagline={lang === 'ar' ? 'تتبع علاقاتك مع المستثمرين — سياق الشركة متاح طوال الوقت.' : 'Track your investor relationships — company context available throughout.'}
        steps={lang === 'ar' ? [
          { step: 1, title: 'أضف مستثمرين', description: 'أضف المستثمرين المستهدفين مع صندوقهم ومرحلة التركيز وبيانات التواصل.' },
          { step: 2, title: 'تتبع الحالة', description: 'حدّث حالة كل مستثمر: مستهدف → تواصل → اجتماع → صحيفة شروط → إغلاق.' },
          { step: 3, title: 'سجّل التفاعلات', description: 'أضف ملاحظات بعد كل اجتماع أو بريد إلكتروني.' },
          { step: 4, title: 'راقب خط الأنابيب', description: 'استخدم عرض خط الأنابيب لرؤية مكان كل مستثمر في عمليتك.' },
        ] : [
          { step: 1, title: 'Add investors', description: 'Add investors you are targeting with their fund, stage focus, and contact details.' },
          { step: 2, title: 'Track status', description: "Update each investor's status: Identified → Contacted → Meeting → Term Sheet → Closed." },
          { step: 3, title: 'Log interactions', description: 'Add notes after each meeting or email exchange.' },
          { step: 4, title: 'Monitor pipeline', description: 'Use the pipeline view to see where each investor is in your process.' },
        ]}
        connections={lang === 'ar' ? [
          { from: 'ملف الشركة الناشئة', to: 'اسم الشركة ومرحلتها يُستخدم كسياق لمطابقة المستثمرين' },
        ] : [
          { from: 'Startup Profile', to: 'company name and stage used as context for investor matching' },
        ]}
        tip={lang === 'ar' ? 'شغّل عملية متوازية مع 20-30 مستثمراً. معظمهم سيرفضون — الحجم هو مفتاح إغلاق الجولة.' : 'Run a parallel process with 20-30 investors. Most will say no — volume is key to closing a round.'}
      />

        <Users className="w-12 h-12 text-muted-foreground opacity-40" />
        <div>
          <div className="text-lg font-bold text-foreground mb-1">{lang === 'ar' ? 'سجّل الدخول لاستخدام إدارة المستثمرين' : 'Sign in to use Investor CRM'}</div>
          <div className="text-sm text-muted-foreground mb-4">{lang === 'ar' ? 'جهات الاتصال محفوظة بأمان لكل حساب عبر جميع الجلسات.' : 'Your contacts are saved securely per account across all sessions.'}</div>
          <a href={getLoginUrl()} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white"
            style={{ background: '#C4614A' }}>
            {lang === 'ar' ? 'تسجيل الدخول للمتابعة' : 'Sign In to Continue'}
          </a>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">{lang === 'ar' ? 'جاري تحميل جهات الاتصال...' : 'Loading your contacts...'}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
        <div className="text-sm text-destructive">{lang === 'ar' ? 'فشل تحميل جهات الاتصال. حاول مرة أخرى.' : 'Failed to load contacts. Please try again.'}</div>
        <button onClick={() => utils.crm.getContacts.invalidate()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border border-border text-muted-foreground hover:bg-secondary/40">
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground mb-1" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            {lang === 'ar' ? 'إدارة علاقات المستثمرين' : 'Investor CRM'}
          </h2>
          <p className="text-sm text-muted-foreground">{lang === 'ar' ? 'تتبع خط أنابيب التواصل مع المستثمرين. جهات الاتصال محفوظة في حسابك.' : 'Track your investor outreach pipeline. Contacts are saved to your account.'}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
            style={{ background: 'var(--primary)', color: '#FAF6EF', border: '1.5px solid var(--border)' }}
            title="Export to CSV">
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{lang === 'ar' ? 'تصدير CSV' : 'Export CSV'}</span>
          </button>
          <button onClick={() => setShowAdd(v => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: '#C4614A' }}>
            <Plus className="w-4 h-4" />
            {lang === 'ar' ? 'إضافة مستثمر' : 'Add Investor'}
          </button>
        </div>
      </div>

      {/* Pipeline funnel */}
      <div className="border border-border rounded-xl p-4 bg-card">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{lang === 'ar' ? 'نظرة عامة على خط الأنابيب' : 'Pipeline Overview'}</div>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {PIPELINE_STAGES.map((stage, i) => {
            const cfg = STATUS_CONFIG[stage];
            const count = pipelineCounts[stage] || 0;
            return (
              <div key={stage} className="flex-1 min-w-[70px] text-center">
                <div className="text-lg font-black" style={{ color: cfg.color }}>{count}</div>
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
            <div className="text-sm font-semibold text-foreground">{lang === 'ar' ? 'إضافة مستثمر جديد' : 'Add New Investor'}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { key: 'name', label: 'Name', placeholder: 'Sarah Chen' },
                { key: 'firm', label: 'Firm', placeholder: 'Sequoia Capital' },
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
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Stage Focus</label>
                <Select value={newData.stageFocus} onValueChange={v => setNewData(d => ({ ...d, stageFocus: v }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select stage…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any-stage">Any stage</SelectItem>
                    {FUNDING_STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Sector Focus</label>
                <Select value={newData.sectorFocus} onValueChange={v => setNewData(d => ({ ...d, sectorFocus: v }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select sector…" /></SelectTrigger>
                  <SelectContent className="max-h-64 overflow-y-auto">
                    <SelectItem value="any-sector">Any sector</SelectItem>
                    {SECTORS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
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
              <button onClick={addContact} disabled={addMutation.isPending || !newData.name.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
                style={{ background: '#C4614A' }}>
                {addMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                {addMutation.isPending ? (lang === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (lang === 'ar' ? 'إضافة' : 'Add')}
              </button>
              <button onClick={() => { setShowAdd(false); setNewData(EMPTY_FORM); }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border border-border text-muted-foreground hover:bg-secondary/40">
                <X className="w-3.5 h-3.5" /> {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilterStatus('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filterStatus === 'all' ? 'bg-foreground text-background' : 'border border-border text-muted-foreground'}`}>
          {lang === 'ar' ? `الكل (${contacts.length})` : `All (${contacts.length})`}
        </button>
        {PIPELINE_STAGES.map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filterStatus === s ? 'text-white' : 'border border-border text-muted-foreground'}`}
            style={filterStatus === s ? { background: STATUS_CONFIG[s].color } : {}}>
            {STATUS_CONFIG[s].label} {pipelineCounts[s] > 0 ? `(${pipelineCounts[s]})` : ''}
          </button>
        ))}
      </div>

      {/* Contact list */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="w-8 h-8 mx-auto mb-3 opacity-40" />
          <div className="text-sm">
            {contacts.length === 0
              ? (lang === 'ar' ? 'لا يوجد مستثمرون بعد. أضف أول مستثمر مستهدف أعلاه.' : 'No investors yet. Add your first target investor above.')
              : (lang === 'ar' ? 'لا يوجد مستثمرون يطابقون هذا الفلتر.' : 'No investors match this filter.')}
          </div>
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
                      { key: 'stageFocus', label: 'Stage Focus' }, { key: 'sectorFocus', label: 'Sector Focus' },
                      { key: 'email', label: 'Email' }, { key: 'linkedin', label: 'LinkedIn' },
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
                    <button onClick={saveEdit} disabled={updateMutation.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-60"
                      style={{ background: '#10B981' }}>
                      {updateMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                      Save
                    </button>
                    <button onClick={() => setEditingId(null)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-border text-muted-foreground">
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
                        <StatusBadge status={inv.status as Status} config={STATUS_CONFIG} />
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {inv.stageFocus} · {inv.sectorFocus} · Last contact: {inv.lastContact}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => startEdit(inv)} className="text-muted-foreground hover:text-foreground transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteMutation.mutate({ id: inv.id })}
                        disabled={deleteMutation.isPending}
                        className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40">
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
                      <button key={s} onClick={() => statusMutation.mutate({ id: inv.id, status: s })}
                        disabled={statusMutation.isPending}
                        className="text-[9px] px-2 py-1 rounded-full border border-border text-muted-foreground hover:border-accent hover:text-accent transition-all disabled:opacity-40">
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
            <Rocket className="w-4 h-4 text-green-600 dark:text-green-400" />
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
                  <a href={app.website} target="_blank" rel="noopener noreferrer"
                    className="text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-all hover:opacity-90"
                    style={{ background: 'var(--primary)', color: '#FAF6EF', border: '1.5px solid var(--border)' }}>
                    Apply
                  </a>
                  <button onClick={() => untrack(app.acceleratorName)}
                    className="text-muted-foreground hover:text-destructive transition-colors" title="Remove from tracker">
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
