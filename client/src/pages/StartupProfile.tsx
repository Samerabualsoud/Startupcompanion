/**
 * Startup Profile Page
 * Founders can build and manage their startup's full profile
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Users, TrendingUp, Target, Plus, Trash2, Edit3, Check, X,
  Globe, Linkedin, Twitter, Upload, ChevronDown, ChevronUp, Loader2,
  DollarSign, BarChart3, Calendar, Flag, Rocket, BookOpen, Save, Eye, EyeOff
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { getLoginUrl } from '@/const';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { SECTORS, COUNTRIES } from '@shared/dropdowns';

const STAGE_OPTIONS = [
  { value: 'idea', label: 'Idea / Pre-launch' },
  { value: 'pre-seed', label: 'Pre-Seed' },
  { value: 'seed', label: 'Seed' },
  { value: 'series-a', label: 'Series A' },
  { value: 'series-b', label: 'Series B' },
  { value: 'growth', label: 'Growth' },
];

const MILESTONE_CATEGORIES = [
  { value: 'product', label: 'Product', color: '#6366F1' },
  { value: 'revenue', label: 'Revenue', color: '#10B981' },
  { value: 'team', label: 'Team', color: '#F59E0B' },
  { value: 'funding', label: 'Funding', color: '#C4614A' },
  { value: 'legal', label: 'Legal', color: '#8B5CF6' },
  { value: 'other', label: 'Other', color: '#6B7280' },
];

const fmt = (n?: number | null) => n != null ? `$${n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(0) + 'K' : n.toFixed(0)}` : '—';

// ── Section Wrapper ──────────────────────────────────────────────────────────
function Section({ title, icon: Icon, color, children, defaultOpen = true }: {
  title: string; icon: any; color: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden mb-4">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-secondary/30 transition-colors"
      >
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: color }}>
          <Icon className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="font-semibold text-sm text-foreground flex-1" style={{ fontFamily: 'Playfair Display, serif' }}>{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Field ────────────────────────────────────────────────────────────────────
function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function StartupProfile() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const utils = trpc.useUtils();

  const { data: profile, isLoading: profileLoading } = trpc.profile.get.useQuery(undefined, { enabled: isAuthenticated });
  const { data: team = [], isLoading: teamLoading } = trpc.profile.getTeam.useQuery(undefined, { enabled: isAuthenticated });
  const { data: milestoneList = [] } = trpc.profile.getMilestones.useQuery(undefined, { enabled: isAuthenticated });
  const { data: savedVals = [] } = trpc.profile.getSavedValuations.useQuery(undefined, { enabled: isAuthenticated });

  const saveProfile = trpc.profile.save.useMutation({
    onSuccess: () => { utils.profile.get.invalidate(); toast.success('Profile saved!'); setSaving(false); },
    onError: (e) => { toast.error(e.message); setSaving(false); },
  });

  const addMember = trpc.profile.addTeamMember.useMutation({
    onSuccess: (data) => { utils.profile.getTeam.invalidate(); setAddingMember(false); setNewMember({ name: '', role: '', bio: '', equityPercent: 0, isFounder: false, esopShares: 0, esopVestingMonths: 48, esopCliffMonths: 12 }); toast.success('Team member added'); },
    onError: (e) => toast.error(e.message),
  });

  const deleteMember = trpc.profile.deleteTeamMember.useMutation({
    onSuccess: () => utils.profile.getTeam.invalidate(),
    onError: (e) => toast.error(e.message),
  });

  const addMilestoneM = trpc.profile.addMilestone.useMutation({
    onSuccess: () => { utils.profile.getMilestones.invalidate(); setAddingMilestone(false); setNewMilestone({ title: '', category: 'product', description: '' }); toast.success('Milestone added'); },
    onError: (e) => toast.error(e.message),
  });

  const updateMilestoneM = trpc.profile.updateMilestone.useMutation({
    onSuccess: () => utils.profile.getMilestones.invalidate(),
  });

  const deleteMilestoneM = trpc.profile.deleteMilestone.useMutation({
    onSuccess: () => utils.profile.getMilestones.invalidate(),
  });

  const deleteValM = trpc.profile.deleteSavedValuation.useMutation({
    onSuccess: () => utils.profile.getSavedValuations.invalidate(),
  });

  // Form state
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', tagline: '', description: '', logoUrl: '', websiteUrl: '', pitchDeckUrl: '',
    sector: '', stage: '' as any, country: '', city: '', foundedYear: new Date().getFullYear(),
    currentARR: 0, monthlyBurnRate: 0, cashOnHand: 0, totalRaised: 0,
    totalSharesOutstanding: 0, authorizedShares: 0, parValuePerShare: 0, esopPoolPercent: 0,
    revenueGrowthRate: 0, grossMargin: 0, totalAddressableMarket: 0,
    targetRaise: 0, useOfFunds: '', investorType: '',
    linkedinUrl: '', twitterUrl: '', isPublic: false,
  });

  const [addingMember, setAddingMember] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '', role: '', bio: '', equityPercent: 0, isFounder: false,
    esopShares: 0, esopVestingMonths: 48, esopCliffMonths: 12,
  });
  const [addingMilestone, setAddingMilestone] = useState(false);
  const [newMilestone, setNewMilestone] = useState({ title: '', category: 'product' as any, description: '' });

  // Populate form from profile
  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || '',
        tagline: profile.tagline || '',
        description: profile.description || '',
        logoUrl: profile.logoUrl || '',
      websiteUrl: profile.websiteUrl || '',
      pitchDeckUrl: profile.pitchDeckUrl || '',
      sector: profile.sector || '',
        stage: profile.stage || '',
        country: profile.country || '',
        city: profile.city || '',
        foundedYear: profile.foundedYear || new Date().getFullYear(),
        currentARR: profile.currentARR || 0,
        monthlyBurnRate: profile.monthlyBurnRate || 0,
        cashOnHand: profile.cashOnHand || 0,
        totalRaised: profile.totalRaised || 0,
        totalSharesOutstanding: profile.totalSharesOutstanding || 0,
        authorizedShares: profile.authorizedShares || 0,
        parValuePerShare: profile.parValuePerShare || 0,
        esopPoolPercent: profile.esopPoolPercent || 0,
        revenueGrowthRate: profile.revenueGrowthRate || 0,
        grossMargin: profile.grossMargin || 0,
        totalAddressableMarket: profile.totalAddressableMarket || 0,
        targetRaise: profile.targetRaise || 0,
        useOfFunds: profile.useOfFunds || '',
        investorType: profile.investorType || '',
        linkedinUrl: profile.linkedinUrl || '',
        twitterUrl: profile.twitterUrl || '',
        isPublic: profile.isPublic || false,
      });
    }
  }, [profile]);

  const handleSave = () => {
    if (!form.name.trim()) { toast.error('Startup name is required'); return; }
    setSaving(true);
    saveProfile.mutate({ ...form, stage: form.stage || undefined });
  };

  const set = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }));
  const setNum = (key: string, val: string) => {
    const n = parseFloat(val);
    set(key, isNaN(n) ? 0 : n);
  };

  if (authLoading || profileLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'oklch(0.18 0.05 240)' }}>
          <Building2 className="w-7 h-7" style={{ color: 'oklch(0.55 0.13 30)' }} />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>Sign in to Build Your Profile</h2>
        <p className="text-sm text-muted-foreground mb-5 max-w-xs">Create a startup profile to save your data, track milestones, and auto-fill your valuation reports.</p>
        <Button onClick={() => window.location.href = getLoginUrl()} style={{ background: 'oklch(0.55 0.13 30)', color: 'white' }}>
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-5 lg:p-6 max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          {form.logoUrl ? (
            <img src={form.logoUrl} alt="logo" className="w-12 h-12 rounded-xl object-cover border border-border" />
          ) : (
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg" style={{ background: 'oklch(0.18 0.05 240)' }}>
              {form.name ? form.name[0].toUpperCase() : '?'}
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: 'Playfair Display, serif' }}>
              {form.name || 'Your Startup'}
            </h1>
            <p className="text-xs text-muted-foreground">{form.tagline || 'Add a tagline below'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => set('isPublic', !form.isPublic)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-secondary/40 transition-colors text-muted-foreground"
          >
            {form.isPublic ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            {form.isPublic ? 'Public' : 'Private'}
          </button>
          <Button
            onClick={handleSave}
            disabled={saving}
            size="sm"
            className="flex items-center gap-1.5 text-white"
            style={{ background: 'oklch(0.55 0.13 30)' }}
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Profile
          </Button>
        </div>
      </div>

      {/* ── Identity ── */}
      <Section title="Identity & Overview" icon={Building2} color="oklch(0.18 0.05 240)">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Startup Name *">
            <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Acme AI" />
          </Field>
          <Field label="Tagline">
            <Input value={form.tagline} onChange={e => set('tagline', e.target.value)} placeholder="One-liner description" />
          </Field>
          <Field label="Website">
            <Input value={form.websiteUrl} onChange={e => set('websiteUrl', e.target.value)} placeholder="https://..." />
          </Field>
          <Field label="Logo URL" hint="Paste a direct image URL or upload to Imgur/Cloudinary">
            <Input value={form.logoUrl} onChange={e => set('logoUrl', e.target.value)} placeholder="https://..." />
          </Field>
          <Field label="Sector">
            <Select value={form.sector} onValueChange={v => set('sector', v)}>
              <SelectTrigger><SelectValue placeholder="Select sector…" /></SelectTrigger>
              <SelectContent className="max-h-64 overflow-y-auto">
                {SECTORS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Stage">
            <Select value={form.stage} onValueChange={v => set('stage', v)}>
              <SelectTrigger><SelectValue placeholder="Select stage" /></SelectTrigger>
              <SelectContent>
                {STAGE_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Country">
            <Select value={form.country} onValueChange={v => set('country', v)}>
              <SelectTrigger><SelectValue placeholder="Select country…" /></SelectTrigger>
              <SelectContent className="max-h-64 overflow-y-auto">
                {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="City">
            <Input value={form.city} onChange={e => set('city', e.target.value)} placeholder="e.g. Riyadh" />
          </Field>
          <Field label="Founded Year">
            <Input type="number" value={form.foundedYear} onChange={e => setNum('foundedYear', e.target.value)} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Description">
              <Textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="What does your startup do? Who is it for? What problem does it solve?" rows={3} />
            </Field>
          </div>
        </div>
      </Section>

      {/* ── Financials ── */}
      <Section title="Financial Metrics" icon={DollarSign} color="oklch(0.55 0.13 30)">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Field label="Annual Recurring Revenue ($)" hint="Current ARR">
            <Input type="number" value={form.currentARR || ''} onChange={e => setNum('currentARR', e.target.value)} placeholder="0" />
          </Field>
          <Field label="Monthly Burn Rate ($)">
            <Input type="number" value={form.monthlyBurnRate || ''} onChange={e => setNum('monthlyBurnRate', e.target.value)} placeholder="0" />
          </Field>
          <Field label="Cash on Hand ($)">
            <Input type="number" value={form.cashOnHand || ''} onChange={e => setNum('cashOnHand', e.target.value)} placeholder="0" />
          </Field>
          <Field label="Total Raised ($)">
            <Input type="number" value={form.totalRaised || ''} onChange={e => setNum('totalRaised', e.target.value)} placeholder="0" />
          </Field>
          <Field label="Revenue Growth Rate (%)" hint="YoY">
            <Input type="number" value={form.revenueGrowthRate || ''} onChange={e => setNum('revenueGrowthRate', e.target.value)} placeholder="0" />
          </Field>
          <Field label="Gross Margin (%)">
            <Input type="number" value={form.grossMargin || ''} onChange={e => setNum('grossMargin', e.target.value)} placeholder="0" />
          </Field>
          <Field label="TAM ($)" hint="Total Addressable Market">
            <Input type="number" value={form.totalAddressableMarket || ''} onChange={e => setNum('totalAddressableMarket', e.target.value)} placeholder="0" />
          </Field>
          <Field label="Target Raise ($)">
            <Input type="number" value={form.targetRaise || ''} onChange={e => setNum('targetRaise', e.target.value)} placeholder="0" />
          </Field>
          <Field label="Investor Type">
            <Input value={form.investorType} onChange={e => set('investorType', e.target.value)} placeholder="e.g. Angel, VC" />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Use of Funds">
            <Textarea value={form.useOfFunds} onChange={e => set('useOfFunds', e.target.value)} placeholder="How will you use the money you're raising?" rows={2} />
          </Field>
        </div>
        {/* Quick metrics display */}
        {(form.cashOnHand > 0 && form.monthlyBurnRate > 0) && (
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { label: 'Runway', value: `${Math.floor(form.cashOnHand / form.monthlyBurnRate)} months` },
              { label: 'ARR', value: fmt(form.currentARR) },
              { label: 'Total Raised', value: fmt(form.totalRaised) },
            ].map(m => (
              <div key={m.label} className="rounded-lg p-3 text-center" style={{ background: 'oklch(0.97 0.005 80)' }}>
                <div className="text-lg font-bold text-foreground font-mono">{m.value}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{m.label}</div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ── Cap Table ── */}
      <Section title="Cap Table" icon={BarChart3} color="#8B5CF6" defaultOpen={false}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Field label="Total Shares Outstanding" hint="Current total issued shares">
            <Input type="number" value={form.totalSharesOutstanding || ''} onChange={e => setNum('totalSharesOutstanding', e.target.value)} placeholder="e.g. 10,000,000" />
          </Field>
          <Field label="Authorized Shares" hint="Maximum shares the company can issue">
            <Input type="number" value={form.authorizedShares || ''} onChange={e => setNum('authorizedShares', e.target.value)} placeholder="e.g. 100,000,000" />
          </Field>
          <Field label="Par Value per Share ($)" hint="Nominal value per share (often $0.0001)">
            <Input type="number" value={form.parValuePerShare || ''} onChange={e => setNum('parValuePerShare', e.target.value)} placeholder="0.0001" step="0.0001" />
          </Field>
          <Field label="ESOP Pool (%)" hint="Percentage of total shares reserved for employee stock options">
            <Input type="number" value={form.esopPoolPercent || ''} onChange={e => setNum('esopPoolPercent', e.target.value)} placeholder="10" min="0" max="100" />
          </Field>
        </div>
        {(form.totalSharesOutstanding > 0 && form.esopPoolPercent > 0) && (
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { label: 'ESOP Shares', value: Math.round(form.totalSharesOutstanding * form.esopPoolPercent / 100).toLocaleString() },
              { label: 'Available Shares', value: form.authorizedShares > 0 ? (form.authorizedShares - form.totalSharesOutstanding).toLocaleString() : '—' },
              { label: 'Dilution Headroom', value: form.authorizedShares > 0 ? `${((form.authorizedShares - form.totalSharesOutstanding) / form.authorizedShares * 100).toFixed(1)}%` : '—' },
            ].map(m => (
              <div key={m.label} className="rounded-lg p-3 text-center" style={{ background: 'oklch(0.97 0.005 80)' }}>
                <div className="text-lg font-bold text-foreground font-mono">{m.value}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{m.label}</div>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-3">
          When you raise funds, new shares are auto-calculated: New Shares = Amount Raised ÷ (Pre-Money Valuation ÷ Current Shares Outstanding)
        </p>
      </Section>

      {/* ── Social ── */}
      <Section title="Social & Links" icon={Globe} color="#6366F1" defaultOpen={false}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="LinkedIn">
            <Input value={form.linkedinUrl} onChange={e => set('linkedinUrl', e.target.value)} placeholder="https://linkedin.com/company/..." />
          </Field>
          <Field label="Twitter / X">
            <Input value={form.twitterUrl} onChange={e => set('twitterUrl', e.target.value)} placeholder="https://twitter.com/..." />
          </Field>
          <Field label="Pitch Deck URL">
            <Input value={form.pitchDeckUrl ?? ''} onChange={e => set('pitchDeckUrl', e.target.value)} placeholder="https://docsend.com/..." />
          </Field>
        </div>
      </Section>

      {/* ── Team ── */}
      <Section title={`Team Members (${team.length})`} icon={Users} color="#10B981">
        <div className="space-y-3 mb-4">
          {teamLoading ? (
            <div className="flex items-center justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
          ) : team.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-3">No team members yet. Add your co-founders and key hires.</p>
          ) : (
            team.map((m: any) => (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-secondary/20">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                  style={{ background: m.isFounder ? 'oklch(0.55 0.13 30)' : 'oklch(0.18 0.05 240)' }}>
                  {m.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground truncate">{m.name}</span>
                    {m.isFounder && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Founder</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {m.role}{m.equityPercent ? ` · ${m.equityPercent}% equity` : ''}
                    {m.esopShares > 0 ? ` · ${m.esopShares.toLocaleString()} ESOP (${m.esopVestingMonths}mo vest, ${m.esopCliffMonths}mo cliff)` : ''}
                  </div>
                </div>
                <button onClick={() => deleteMember.mutate({ id: m.id })} className="p-1.5 rounded hover:bg-red-50 hover:text-red-500 transition-colors text-muted-foreground">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {addingMember ? (
          <div className="rounded-lg border border-border p-4 bg-secondary/10 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Name *">
                <Input value={newMember.name} onChange={e => setNewMember(m => ({ ...m, name: e.target.value }))} placeholder="Full name" />
              </Field>
              <Field label="Role *">
                <Input value={newMember.role} onChange={e => setNewMember(m => ({ ...m, role: e.target.value }))} placeholder="e.g. CEO, CTO" />
              </Field>
              <Field label="Equity %" hint="Percentage of total company equity">
                <Input type="number" value={newMember.equityPercent || ''} onChange={e => setNewMember(m => ({ ...m, equityPercent: parseFloat(e.target.value) || 0 }))} placeholder="0" />
              </Field>
              <Field label="Is Founder?">
                <div className="flex items-center gap-2 mt-1">
                  <input type="checkbox" checked={newMember.isFounder} onChange={e => setNewMember(m => ({ ...m, isFounder: e.target.checked }))} className="w-4 h-4" />
                  <span className="text-sm text-foreground">Yes, this is a founder</span>
                </div>
              </Field>
            </div>
            {/* ESOP Grant Fields */}
            <div className="rounded-lg border border-border p-3 bg-purple-50/30 space-y-3">
              <p className="text-xs font-semibold text-purple-700">ESOP Grant (optional)</p>
              <div className="grid grid-cols-3 gap-3">
                <Field label="ESOP Shares" hint="Number of options/shares granted">
                  <Input type="number" value={newMember.esopShares || ''} onChange={e => setNewMember(m => ({ ...m, esopShares: parseInt(e.target.value) || 0 }))} placeholder="0" />
                </Field>
                <Field label="Vesting (months)" hint="Total vesting period (e.g. 48 = 4 years)">
                  <Input type="number" value={newMember.esopVestingMonths || ''} onChange={e => setNewMember(m => ({ ...m, esopVestingMonths: parseInt(e.target.value) || 48 }))} placeholder="48" />
                </Field>
                <Field label="Cliff (months)" hint="Months before first vesting (e.g. 12 = 1 year cliff)">
                  <Input type="number" value={newMember.esopCliffMonths || ''} onChange={e => setNewMember(m => ({ ...m, esopCliffMonths: parseInt(e.target.value) || 12 }))} placeholder="12" />
                </Field>
              </div>
            </div>
            <Field label="Bio">
              <Textarea value={newMember.bio} onChange={e => setNewMember(m => ({ ...m, bio: e.target.value }))} placeholder="Short bio..." rows={2} />
            </Field>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => addMember.mutate(newMember)} disabled={!newMember.name || !newMember.role || addMember.isPending}
                style={{ background: '#10B981', color: 'white' }}>
                {addMember.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Add Member
              </Button>
              <Button size="sm" variant="outline" onClick={() => setAddingMember(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setAddingMember(true)} className="flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add Team Member
          </Button>
        )}
      </Section>

      {/* ── Milestones ── */}
      <Section title={`Milestones (${milestoneList.length})`} icon={Flag} color="#F59E0B" defaultOpen={false}>
        <div className="space-y-2 mb-4">
          {milestoneList.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-3">Track key milestones — product launches, revenue targets, funding goals.</p>
          ) : (
            milestoneList.map((m: any) => {
              const cat = MILESTONE_CATEGORIES.find(c => c.value === m.category);
              return (
                <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                  <button
                    onClick={() => updateMilestoneM.mutate({ id: m.id, data: { completedAt: m.completedAt ? null : new Date() } })}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${m.completedAt ? 'bg-green-500 border-green-500' : 'border-border hover:border-green-400'}`}
                  >
                    {m.completedAt && <Check className="w-3 h-3 text-white" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium ${m.completedAt ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{m.title}</div>
                    {m.description && <div className="text-xs text-muted-foreground truncate">{m.description}</div>}
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ background: cat?.color + '20', color: cat?.color }}>
                    {cat?.label}
                  </span>
                  <button onClick={() => deleteMilestoneM.mutate({ id: m.id })} className="p-1 rounded hover:bg-red-50 hover:text-red-500 transition-colors text-muted-foreground shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {addingMilestone ? (
          <div className="rounded-lg border border-border p-4 bg-secondary/10 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Title *">
                <Input value={newMilestone.title} onChange={e => setNewMilestone(m => ({ ...m, title: e.target.value }))} placeholder="e.g. Launch MVP" />
              </Field>
              <Field label="Category">
                <Select value={newMilestone.category} onValueChange={v => setNewMilestone(m => ({ ...m, category: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MILESTONE_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field label="Description">
              <Textarea value={newMilestone.description} onChange={e => setNewMilestone(m => ({ ...m, description: e.target.value }))} placeholder="Details..." rows={2} />
            </Field>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => addMilestoneM.mutate(newMilestone)} disabled={!newMilestone.title || addMilestoneM.isPending}
                style={{ background: '#F59E0B', color: 'white' }}>
                {addMilestoneM.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Add Milestone
              </Button>
              <Button size="sm" variant="outline" onClick={() => setAddingMilestone(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setAddingMilestone(true)} className="flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add Milestone
          </Button>
        )}
      </Section>

      {/* ── Saved Valuations ── */}
      <Section title={`Saved Valuations (${savedVals.length})`} icon={TrendingUp} color="oklch(0.55 0.13 30)" defaultOpen={savedVals.length > 0}>
        {savedVals.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: 'oklch(0.95 0.01 80)' }}>
              <TrendingUp className="w-5 h-5" style={{ color: 'oklch(0.55 0.13 30)' }} />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">No saved valuations yet</p>
            <p className="text-xs text-muted-foreground">Complete a valuation in the Valuation Calculator and click “Save Scenario” to save it here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {savedVals.map((v: any, idx: number) => (
              <div key={v.id} className="group relative p-4 rounded-xl border border-border hover:border-accent/40 hover:shadow-sm transition-all" style={{ background: 'oklch(0.995 0.002 80)' }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono text-muted-foreground">#{idx + 1}</span>
                      <div className="text-sm font-semibold text-foreground truncate">{v.label}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(v.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    {v.summary?.stage && (
                      <span className="inline-block mt-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: 'oklch(0.92 0.02 240)', color: 'oklch(0.35 0.05 240)' }}>
                        {v.summary.stage}
                      </span>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    {v.blendedValue && (
                      <div className="text-lg font-bold font-mono" style={{ color: 'oklch(0.55 0.13 30)' }}>
                        {fmt(v.blendedValue)}
                      </div>
                    )}
                    {v.summary?.weightedLow != null && v.summary?.weightedHigh != null && (
                      <div className="text-[10px] text-muted-foreground font-mono">
                        {fmt(v.summary.weightedLow)} – {fmt(v.summary.weightedHigh)}
                      </div>
                    )}
                    {v.summary?.confidenceScore != null && (
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {v.summary.confidenceScore}% confidence
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-border/50">
                  <button
                    onClick={() => deleteValM.mutate({ id: v.id })}
                    className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-red-500 transition-colors px-2 py-1 rounded hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Save button at bottom */}
      <div className="flex justify-end mt-2 mb-8">
        <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2 text-white px-6"
          style={{ background: 'oklch(0.55 0.13 30)' }}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save All Changes
        </Button>
      </div>
    </div>
  );
}
