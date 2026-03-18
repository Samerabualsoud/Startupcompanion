import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import {
  Building2, Users, Gift, Scale, Search, ExternalLink,
  MapPin, DollarSign, ChevronDown, Globe, Star, CheckCircle2, Filter, X,
  Plus, Loader2, Send
} from 'lucide-react';
import { toast } from 'sonner';

type Tab = 'vc' | 'angel' | 'grants' | 'lawyers';

const TABS: { id: Tab; label: string; icon: React.ElementType; count: number }[] = [
  { id: 'vc', label: 'VC Firms', icon: Building2, count: 35 },
  { id: 'angel', label: 'Angel Investors', icon: Users, count: 25 },
  { id: 'grants', label: 'Grants & Programs', icon: Gift, count: 22 },
  { id: 'lawyers', label: 'Venture Lawyers', icon: Scale, count: 20 },
];

const REGIONS = ['Global', 'North America', 'Europe', 'MENA', 'Africa', 'Southeast Asia', 'Latin America', 'Asia'];
const STAGES = ['pre-seed', 'seed', 'series-a', 'series-b', 'growth'];
const SECTORS = ['ai', 'fintech', 'saas', 'healthtech', 'edtech', 'e-commerce', 'deeptech', 'cleantech', 'consumer', 'marketplace'];
const GRANT_TYPES = ['government', 'corporate', 'foundation', 'eu', 'other'];
const SPECIALIZATIONS = ['term-sheets', 'equity', 'm&a', 'ip', 'employment', 'regulatory', 'gdpr', 'ipo'];

function Badge({ children, color = 'default' }: { children: React.ReactNode; color?: 'default' | 'green' | 'blue' | 'orange' | 'purple' }) {
  const colors = {
    default: 'bg-secondary text-muted-foreground',
    green: 'bg-green-50 text-green-700 border border-green-200',
    blue: 'bg-blue-50 text-blue-700 border border-blue-200',
    orange: 'bg-orange-50 text-orange-700 border border-orange-200',
    purple: 'bg-purple-50 text-purple-700 border border-purple-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${colors[color]}`}>
      {children}
    </span>
  );
}

function formatMoney(min?: number | null, max?: number | null, currency = 'USD') {
  if (!min && !max) return 'Varies';
  const fmt = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(0)}B` : n >= 1 ? `$${n}M` : `$${(n * 1000).toFixed(0)}K`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  return `Up to ${fmt(max!)}`;
}

// ── VC Firms ──────────────────────────────────────────────────────────────
function VcCard({ firm }: { firm: any }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-border hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base truncate" style={{ fontFamily: 'Playfair Display, serif', color: 'oklch(0.18 0.05 240)' }}>
            {firm.name}
          </h3>
          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3" />
            {firm.hqCity}, {firm.hqCountry}
          </div>
        </div>
        {firm.aum && (
          <div className="text-right shrink-0">
            <div className="text-xs text-muted-foreground">AUM</div>
            <div className="text-sm font-bold font-mono" style={{ color: 'oklch(0.55 0.13 30)' }}>
              ${firm.aum >= 1000 ? `${(firm.aum / 1000).toFixed(0)}B` : `${firm.aum}M`}
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2">{firm.description}</p>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-muted-foreground w-14 shrink-0">Stages</span>
          {(firm.stages as string[]).map(s => <Badge key={s} color="blue">{s}</Badge>)}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-muted-foreground w-14 shrink-0">Check</span>
          <span className="text-xs font-mono font-medium" style={{ color: 'oklch(0.4 0.05 240)' }}>
            {formatMoney(firm.checkSizeMin, firm.checkSizeMax)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-muted-foreground w-14 shrink-0">Regions</span>
          {(firm.regions as string[]).slice(0, 3).map(r => <Badge key={r}>{r}</Badge>)}
        </div>
      </div>

      {firm.notablePortfolio?.length > 0 && (
        <div className="mb-4">
          <div className="text-[10px] text-muted-foreground mb-1">Notable portfolio</div>
          <div className="flex flex-wrap gap-1">
            {(firm.notablePortfolio as string[]).slice(0, 4).map(p => (
              <span key={p} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{p}</span>
            ))}
          </div>
        </div>
      )}

      {firm.isCommunity && (
        <div className="mb-2">
          <Badge color="purple">🌐 Community Member</Badge>
        </div>
      )}
      {firm.applyUrl && (
        <a href={firm.applyUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
          style={{ background: 'oklch(0.18 0.05 240)', color: 'white' }}>
          <ExternalLink className="w-3.5 h-3.5" />
          Visit Website
        </a>
      )}
    </div>
  );
}

// ── Angel Investors ───────────────────────────────────────────────────────
function AngelCard({ angel }: { angel: any }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-border hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-sm"
          style={{ background: 'oklch(0.55 0.13 30)' }}>
          {angel.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm" style={{ fontFamily: 'Playfair Display, serif', color: 'oklch(0.18 0.05 240)' }}>
            {angel.name}
          </h3>
          <div className="text-xs text-muted-foreground truncate">{angel.title}</div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
            <MapPin className="w-3 h-3" />{angel.location}
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2">{angel.bio}</p>

      <div className="space-y-1.5 mb-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-muted-foreground w-14 shrink-0">Check</span>
          <span className="text-xs font-mono font-medium" style={{ color: 'oklch(0.4 0.05 240)' }}>
            {formatMoney(angel.checkSizeMin, angel.checkSizeMax)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-muted-foreground w-14 shrink-0">Sectors</span>
          {(angel.sectors as string[]).slice(0, 3).map(s => <Badge key={s} color="orange">{s}</Badge>)}
        </div>
      </div>

      {angel.notableInvestments?.length > 0 && (
        <div className="mb-4">
          <div className="text-[10px] text-muted-foreground mb-1">Notable investments</div>
          <div className="flex flex-wrap gap-1">
            {(angel.notableInvestments as string[]).slice(0, 4).map(i => (
              <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{i}</span>
            ))}
          </div>
        </div>
      )}

      {angel.isCommunity && (
        <div className="mb-2">
          <Badge color="purple">🌐 Community Member</Badge>
        </div>
      )}
      <div className="flex gap-2">
        {angel.linkedinUrl && (
          <a href={angel.linkedinUrl} target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium border border-border hover:bg-secondary transition-colors text-muted-foreground">
            LinkedIn
          </a>
        )}
        {angel.angellistUrl && (
          <a href={angel.angellistUrl} target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium border border-border hover:bg-secondary transition-colors text-muted-foreground">
            AngelList
          </a>
        )}
      </div>
    </div>
  );
}

// ── Grants ────────────────────────────────────────────────────────────────
function GrantCard({ grant }: { grant: any }) {
  const typeColors: Record<string, 'green' | 'blue' | 'orange' | 'purple'> = {
    government: 'blue', corporate: 'orange', foundation: 'purple', eu: 'green', other: 'default' as any,
  };
  return (
    <div className="bg-white rounded-2xl p-5 border border-border hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm leading-tight" style={{ fontFamily: 'Playfair Display, serif', color: 'oklch(0.18 0.05 240)' }}>
            {grant.name}
          </h3>
          <div className="text-xs text-muted-foreground mt-0.5">{grant.provider}</div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <Badge color={typeColors[grant.type] ?? 'default'}>{grant.type}</Badge>
          {grant.isEquityFree && <Badge color="green">Equity-free</Badge>}
        </div>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2">{grant.description}</p>

      <div className="space-y-1.5 mb-4">
        <div className="flex items-center gap-1.5">
          <DollarSign className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs font-mono font-medium" style={{ color: 'oklch(0.4 0.05 240)' }}>
            {grant.amountMin || grant.amountMax
              ? `${grant.currency} ${formatMoney(grant.amountMin, grant.amountMax)}`
              : 'Amount varies'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground">Deadline:</span>
          <span className="text-[10px] font-medium">{grant.deadline || 'Rolling'}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {(grant.regions as string[]).slice(0, 3).map(r => <Badge key={r}>{r}</Badge>)}
        </div>
      </div>

      {grant.applyUrl && (
        <a href={grant.applyUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
          style={{ background: 'oklch(0.18 0.05 240)', color: 'white' }}>
          <ExternalLink className="w-3.5 h-3.5" />
          Apply Now
        </a>
      )}
    </div>
  );
}

// ── Venture Lawyers ───────────────────────────────────────────────────────
function LawyerCard({ lawyer }: { lawyer: any }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-border hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-sm"
          style={{ background: 'oklch(0.3 0.06 240)' }}>
          {lawyer.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm leading-tight" style={{ fontFamily: 'Playfair Display, serif', color: 'oklch(0.18 0.05 240)' }}>
            {lawyer.name}
          </h3>
          <div className="text-xs text-muted-foreground">{lawyer.firm}</div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
            <MapPin className="w-3 h-3" />{lawyer.location}
          </div>
        </div>
        <div className="flex flex-col gap-1 items-end shrink-0">
          {lawyer.startupFriendly && <Badge color="green">Startup-friendly</Badge>}
          {lawyer.offersFreeConsult && <Badge color="orange">Free consult</Badge>}
        </div>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2">{lawyer.bio}</p>

      <div className="mb-4">
        <div className="text-[10px] text-muted-foreground mb-1.5">Specializations</div>
        <div className="flex flex-wrap gap-1">
          {(lawyer.specializations as string[]).slice(0, 5).map(s => (
            <Badge key={s} color="purple">{s}</Badge>
          ))}
        </div>
      </div>

      {lawyer.languages?.length > 1 && (
        <div className="mb-4">
          <div className="text-[10px] text-muted-foreground mb-1">Languages</div>
          <div className="text-xs text-muted-foreground">{(lawyer.languages as string[]).join(', ')}</div>
        </div>
      )}

      {lawyer.isCommunity && (
        <div className="mb-2">
          <Badge color="purple">🌐 Community Member</Badge>
        </div>
      )}
      <div className="flex gap-2">
        {lawyer.websiteUrl && (
          <a href={lawyer.websiteUrl} target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
            style={{ background: 'oklch(0.18 0.05 240)', color: 'white' }}>
            <Globe className="w-3.5 h-3.5" />
            Website
          </a>
        )}
        {lawyer.linkedinUrl && (
          <a href={lawyer.linkedinUrl} target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium border border-border hover:bg-secondary transition-colors text-muted-foreground">
            LinkedIn
          </a>
        )}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function ResourceDatabase() {
  const [activeTab, setActiveTab] = useState<Tab>('vc');
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('');
  const [stage, setStage] = useState('');
  const [sector, setSector] = useState('');
  const [grantType, setGrantType] = useState('');
  const [equityFreeOnly, setEquityFreeOnly] = useState(false);
  const [freeConsultOnly, setFreeConsultOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showListModal, setShowListModal] = useState(false);
  const [listForm, setListForm] = useState<Record<string, string>>({
    name: '', email: '', website: '', description: '', location: '', type: 'vc'
  });
  const submitListingMutation = trpc.resources.submitListing.useMutation({
    onSuccess: () => {
      toast.success('Your listing has been submitted! Our team will review it within 2-3 business days.');
      setShowListModal(false);
      setListForm({ name: '', email: '', website: '', description: '', location: '', type: activeTab === 'grants' ? 'grant' : activeTab === 'lawyers' ? 'lawyer' : activeTab === 'angel' ? 'angel' : 'vc' });
    },
    onError: (e) => toast.error(e.message),
  });

  const vcQuery = trpc.resources.getVcFirms.useQuery(
    { search: search || undefined, stage: stage || undefined, sector: sector || undefined, region: region || undefined },
    { enabled: activeTab === 'vc' }
  );
  const angelQuery = trpc.resources.getAngelInvestors.useQuery(
    { search: search || undefined, stage: stage || undefined, sector: sector || undefined, region: region || undefined },
    { enabled: activeTab === 'angel' }
  );
  const grantsQuery = trpc.resources.getGrants.useQuery(
    { search: search || undefined, type: grantType || undefined, sector: sector || undefined, region: region || undefined, equityFreeOnly: equityFreeOnly || undefined },
    { enabled: activeTab === 'grants' }
  );
  const lawyersQuery = trpc.resources.getVentureLawyers.useQuery(
    { search: search || undefined, region: region || undefined, freeConsultOnly: freeConsultOnly || undefined },
    { enabled: activeTab === 'lawyers' }
  );

  const clearFilters = () => {
    setSearch(''); setRegion(''); setStage(''); setSector('');
    setGrantType(''); setEquityFreeOnly(false); setFreeConsultOnly(false);
  };

  const hasFilters = search || region || stage || sector || grantType || equityFreeOnly || freeConsultOnly;

  const currentData = activeTab === 'vc' ? vcQuery.data
    : activeTab === 'angel' ? angelQuery.data
    : activeTab === 'grants' ? grantsQuery.data
    : lawyersQuery.data;

  const isLoading = activeTab === 'vc' ? vcQuery.isLoading
    : activeTab === 'angel' ? angelQuery.isLoading
    : activeTab === 'grants' ? grantsQuery.isLoading
    : lawyersQuery.isLoading;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold" style={{ fontFamily: 'Playfair Display, serif', color: 'oklch(0.18 0.05 240)' }}>
            Investor & Resources Database
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Curated directory of VCs, angels, grants, and startup lawyers — searchable and filterable.
          </p>
        </div>
        <button
          onClick={() => { setShowListModal(true); setListForm(f => ({ ...f, type: activeTab === 'grants' ? 'grant' : activeTab === 'lawyers' ? 'lawyer' : activeTab === 'angel' ? 'angel' : 'vc' })); }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white shrink-0 hover:opacity-90 transition-opacity"
          style={{ background: 'oklch(0.55 0.13 30)' }}
        >
          <Plus className="w-3.5 h-3.5" />
          List Your Firm
        </button>
      </div>

      {/* List Your Firm Modal */}
      {showListModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base" style={{ fontFamily: 'Playfair Display, serif', color: 'oklch(0.18 0.05 240)' }}>List Your Firm</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Submit your listing for review. Our team will verify and publish within 2-3 business days.</p>
              </div>
              <button onClick={() => setShowListModal(false)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Type selector */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Listing Type</label>
                <div className="flex gap-1 p-1 rounded-lg bg-secondary/40">
                  {(['vc', 'angel', 'lawyer', 'grant'] as const).map(t => (
                    <button key={t} onClick={() => setListForm(f => ({ ...f, type: t }))}
                      className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all capitalize ${
                        listForm.type === t ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground'
                      }`}>
                      {t === 'vc' ? 'VC Firm' : t === 'angel' ? 'Angel' : t === 'lawyer' ? 'Lawyer' : 'Grant'}
                    </button>
                  ))}
                </div>
              </div>
              {/* Common fields */}
              {[
                { key: 'name', label: listForm.type === 'vc' ? 'Firm Name' : listForm.type === 'angel' ? 'Your Name' : listForm.type === 'lawyer' ? 'Your Name / Firm' : 'Grant / Program Name', placeholder: 'e.g. Sequoia Capital' },
                { key: 'email', label: 'Contact Email', placeholder: 'contact@yourfirm.com' },
                { key: 'website', label: 'Website / LinkedIn URL', placeholder: 'https://...' },
                { key: 'location', label: 'Location / HQ City', placeholder: 'e.g. Dubai, UAE' },
              ].map(field => (
                <div key={field.key}>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">{field.label}</label>
                  <input
                    type={field.key === 'email' ? 'email' : 'text'}
                    value={listForm[field.key] ?? ''}
                    onChange={e => setListForm(f => ({ ...f, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 rounded-lg text-sm border border-border bg-white outline-none focus:border-[oklch(0.55_0.13_30)] transition-colors"
                  />
                </div>
              ))}
              {/* Type-specific fields */}
              {(listForm.type === 'vc' || listForm.type === 'angel') && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Investment Stages (comma-separated)</label>
                  <input value={listForm.stages ?? ''} onChange={e => setListForm(f => ({ ...f, stages: e.target.value }))}
                    placeholder="e.g. pre-seed, seed, series-a"
                    className="w-full px-3 py-2 rounded-lg text-sm border border-border bg-white outline-none focus:border-[oklch(0.55_0.13_30)] transition-colors" />
                </div>
              )}
              {listForm.type === 'grant' && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Grant Amount (USD)</label>
                  <input value={listForm.amount ?? ''} onChange={e => setListForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder="e.g. 50000"
                    className="w-full px-3 py-2 rounded-lg text-sm border border-border bg-white outline-none focus:border-[oklch(0.55_0.13_30)] transition-colors" />
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Description / Bio</label>
                <textarea
                  value={listForm.description ?? ''}
                  onChange={e => setListForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Brief description of your firm, focus areas, and what you offer to startups..."
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg text-sm border border-border bg-white outline-none focus:border-[oklch(0.55_0.13_30)] transition-colors resize-none"
                />
              </div>
              <button
                disabled={!listForm.name || !listForm.email || submitListingMutation.isPending}
                onClick={() => submitListingMutation.mutate({
                  type: listForm.type as any,
                  data: { ...listForm },
                  submitterEmail: listForm.email,
                  submitterName: listForm.name,
                })}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: 'oklch(0.18 0.05 240)' }}
              >
                {submitListingMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Submit for Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'oklch(0.93 0.01 240)' }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                isActive ? 'text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
              style={isActive ? { background: 'oklch(0.18 0.05 240)' } : {}}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Search + Filter bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`Search ${TABS.find(t => t.id === activeTab)?.label.toLowerCase()}…`}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm border border-border bg-white outline-none focus:border-[oklch(0.55_0.13_30)] transition-colors"
          />
        </div>
        <button
          onClick={() => setShowFilters(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium border transition-all ${
            showFilters || hasFilters ? 'border-[oklch(0.55_0.13_30)] text-[oklch(0.55_0.13_30)] bg-orange-50' : 'border-border text-muted-foreground hover:bg-secondary'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          Filters
          {hasFilters && <span className="w-4 h-4 rounded-full bg-[oklch(0.55_0.13_30)] text-white text-[9px] flex items-center justify-center">!</span>}
        </button>
        {hasFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1 px-3 py-2.5 rounded-xl text-xs text-muted-foreground border border-border hover:bg-secondary transition-colors">
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="p-4 rounded-xl border border-border bg-white grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Region</label>
            <select value={region} onChange={e => setRegion(e.target.value)}
              className="w-full text-xs border border-border rounded-lg px-2.5 py-2 bg-white outline-none">
              <option value="">All regions</option>
              {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          {(activeTab === 'vc' || activeTab === 'angel') && (
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Stage</label>
              <select value={stage} onChange={e => setStage(e.target.value)}
                className="w-full text-xs border border-border rounded-lg px-2.5 py-2 bg-white outline-none">
                <option value="">All stages</option>
                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}
          {activeTab !== 'lawyers' && (
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Sector</label>
              <select value={sector} onChange={e => setSector(e.target.value)}
                className="w-full text-xs border border-border rounded-lg px-2.5 py-2 bg-white outline-none">
                <option value="">All sectors</option>
                {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}
          {activeTab === 'grants' && (
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Type</label>
              <select value={grantType} onChange={e => setGrantType(e.target.value)}
                className="w-full text-xs border border-border rounded-lg px-2.5 py-2 bg-white outline-none">
                <option value="">All types</option>
                {GRANT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          )}
          {activeTab === 'grants' && (
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input type="checkbox" checked={equityFreeOnly} onChange={e => setEquityFreeOnly(e.target.checked)} className="rounded" />
                Equity-free only
              </label>
            </div>
          )}
          {activeTab === 'lawyers' && (
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input type="checkbox" checked={freeConsultOnly} onChange={e => setFreeConsultOnly(e.target.checked)} className="rounded" />
                Free consult only
              </label>
            </div>
          )}
        </div>
      )}

      {/* Results count */}
      {!isLoading && currentData && (
        <div className="text-xs text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{currentData.length}</span> {TABS.find(t => t.id === activeTab)?.label.toLowerCase()}
          {hasFilters && ' matching your filters'}
        </div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-border animate-pulse">
              <div className="h-4 bg-secondary rounded w-2/3 mb-2" />
              <div className="h-3 bg-secondary rounded w-1/3 mb-4" />
              <div className="h-3 bg-secondary rounded w-full mb-2" />
              <div className="h-3 bg-secondary rounded w-4/5" />
            </div>
          ))}
        </div>
      ) : currentData && currentData.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {activeTab === 'vc' && (currentData as any[]).map(item => <VcCard key={item.id} firm={item} />)}
          {activeTab === 'angel' && (currentData as any[]).map(item => <AngelCard key={item.id} angel={item} />)}
          {activeTab === 'grants' && (currentData as any[]).map(item => <GrantCard key={item.id} grant={item} />)}
          {activeTab === 'lawyers' && (currentData as any[]).map(item => <LawyerCard key={item.id} lawyer={item} />)}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <Search className="w-8 h-8 mx-auto mb-3 opacity-40" />
          <div className="font-medium mb-1">No results found</div>
          <div className="text-xs">Try adjusting your search or filters</div>
          {hasFilters && (
            <button onClick={clearFilters} className="mt-3 text-xs underline" style={{ color: 'oklch(0.55 0.13 30)' }}>
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
