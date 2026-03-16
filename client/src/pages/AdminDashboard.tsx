import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import {
  Shield, CheckCircle2, XCircle, Eye, EyeOff, Users, Building2,
  Briefcase, Rocket, Loader2, AlertCircle, RefreshCw, ChevronDown,
  ExternalLink, Globe, Search, Filter, Clock, TrendingUp, UserCheck,
  MoreHorizontal, Mail, Calendar, Hash
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { toast } from 'sonner';

type TabId = 'vcs' | 'angels' | 'lawyers' | 'startups' | 'users';
type StatusFilter = 'all' | 'pending' | 'verified' | 'rejected';

interface KycEntry {
  id: number;
  userId: number;
  isVerified: boolean | null;
  isPublic: boolean | null;
  createdAt: Date | null;
  [key: string]: unknown;
}

function StatusBadge({ verified }: { verified: boolean | null }) {
  if (verified === true) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
        <CheckCircle2 className="w-3 h-3" /> Verified
      </span>
    );
  }
  if (verified === false) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
        <XCircle className="w-3 h-3" /> Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
      <Clock className="w-3 h-3" /> Pending
    </span>
  );
}

function EntryCard({
  entry,
  type,
  onVerify,
  onTogglePublic,
  isUpdating,
}: {
  entry: KycEntry;
  type: 'vc' | 'angel' | 'lawyer' | 'startup';
  onVerify: (id: number, verified: boolean) => void;
  onTogglePublic: (id: number, isPublic: boolean) => void;
  isUpdating: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  const name =
    (entry.firmName as string) ??
    (entry.displayName as string) ??
    (entry.startupName as string) ??
    `Entry #${entry.id}`;

  const subtitle =
    (entry.description as string) ??
    (entry.bio as string) ??
    (entry.tagline as string) ??
    '';

  const website = (entry.website as string) ?? (entry.linkedinUrl as string) ?? null;
  const sector = (entry.sector as string) ?? (entry.sectors as string[])?.join(', ') ?? null;
  const stage = (entry.stage as string) ?? (entry.investmentStages as string[])?.join(', ') ?? null;
  const location = (entry.country as string) ?? (entry.region as string) ?? null;

  const typeColors: Record<string, string> = {
    vc: 'oklch(0.18 0.05 240)',
    angel: 'oklch(0.55 0.13 30)',
    lawyer: 'oklch(0.4 0.1 280)',
    startup: 'oklch(0.35 0.12 145)',
  };

  const typeLabels: Record<string, string> = {
    vc: 'VC Firm',
    angel: 'Angel',
    lawyer: 'Lawyer',
    startup: 'Startup',
  };

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${
      entry.isVerified === null
        ? 'border-amber-200 dark:border-amber-800/50 bg-amber-50/30 dark:bg-amber-900/5'
        : entry.isVerified
        ? 'border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/20 dark:bg-emerald-900/5'
        : 'border-red-200 dark:border-red-800/50 bg-red-50/20 dark:bg-red-900/5'
    }`}>
      {/* Card Header */}
      <div className="flex items-start gap-4 p-4">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white text-sm font-bold"
          style={{ background: typeColors[type] }}>
          {name.charAt(0).toUpperCase()}
        </div>

        {/* Main Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-semibold text-sm text-foreground">{name}</span>
            <StatusBadge verified={entry.isVerified} />
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold text-white"
              style={{ background: typeColors[type] }}>
              {typeLabels[type]}
            </span>
            {entry.isPublic && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                <Globe className="w-2.5 h-2.5" /> Public
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground line-clamp-1 mb-1.5">{subtitle}</p>
          )}
          <div className="flex items-center gap-3 flex-wrap">
            {sector && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <TrendingUp className="w-2.5 h-2.5" /> {sector}
              </span>
            )}
            {stage && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Filter className="w-2.5 h-2.5" /> {stage}
              </span>
            )}
            {location && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Globe className="w-2.5 h-2.5" /> {location}
              </span>
            )}
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Hash className="w-2.5 h-2.5" /> ID {entry.id} · User {entry.userId}
            </span>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Calendar className="w-2.5 h-2.5" />
              {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {website && (
            <a href={website} target="_blank" rel="noopener noreferrer"
              className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
              title="Visit website">
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          <button
            onClick={() => setExpanded(v => !v)}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
            title="View details"
          >
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center gap-2 px-4 pb-4 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onTogglePublic(entry.id, !entry.isPublic)}
          disabled={isUpdating}
          className="h-7 text-xs gap-1.5"
        >
          {entry.isPublic ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          {entry.isPublic ? 'Hide from DB' : 'Show in DB'}
        </Button>
        <Button
          size="sm"
          onClick={() => { onVerify(entry.id, true); toast.success(`${name} verified`); }}
          disabled={isUpdating || entry.isVerified === true}
          className="h-7 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <CheckCircle2 className="w-3 h-3" />
          Verify
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => { onVerify(entry.id, false); toast.error(`${name} rejected`); }}
          disabled={isUpdating || entry.isVerified === false}
          className="h-7 text-xs gap-1.5"
        >
          <XCircle className="w-3 h-3" />
          Reject
        </Button>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-border/50 pt-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.entries(entry)
              .filter(([k]) => !['id', 'userId', 'isVerified', 'isPublic', 'createdAt', 'updatedAt'].includes(k))
              .map(([k, v]) => {
                if (v === null || v === undefined || v === '') return null;
                const display = Array.isArray(v) ? (v as string[]).join(', ') : String(v);
                const label = k.replace(/([A-Z])/g, ' $1').trim();
                return (
                  <div key={k} className="bg-background/60 rounded-lg p-2.5">
                    <div className="text-[10px] text-muted-foreground capitalize mb-0.5 font-medium">{label}</div>
                    <div className="text-xs text-foreground font-semibold truncate" title={display}>{display}</div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, pending }: {
  label: string; value: number; icon: React.ElementType; color: string; pending?: number
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: color }}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        {(pending ?? 0) > 0 && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            {pending} pending
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('vcs');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const { data: submissions, isLoading, refetch, isFetching } = trpc.admin.getKycSubmissions.useQuery(undefined, {
    enabled: user?.role === 'admin',
  });

  const { data: users, isLoading: usersLoading } = trpc.admin.getUsers.useQuery(
    { limit: 100, offset: 0 },
    { enabled: user?.role === 'admin' && activeTab === 'users' }
  );

  const utils = trpc.useUtils();

  const verifyMutation = trpc.admin.verifyKyc.useMutation({
    onSuccess: () => utils.admin.getKycSubmissions.invalidate(),
    onError: (err) => toast.error('Action failed: ' + err.message),
  });

  const togglePublicMutation = trpc.admin.setPublicStatus.useMutation({
    onSuccess: () => utils.admin.getKycSubmissions.invalidate(),
    onError: (err) => toast.error('Action failed: ' + err.message),
  });

  const setRoleMutation = trpc.admin.setUserRole.useMutation({
    onSuccess: (_, vars) => {
      utils.admin.getUsers.invalidate();
      toast.success(`User role updated to ${vars.role}`);
    },
    onError: (err) => toast.error('Failed: ' + err.message),
  });

  // Filter helpers
  const filterEntries = (entries: KycEntry[]) => {
    return entries.filter(e => {
      const name = ((e.firmName as string) ?? (e.displayName as string) ?? (e.startupName as string) ?? '').toLowerCase();
      const matchesSearch = !searchQuery || name.includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'pending' && e.isVerified === null) ||
        (statusFilter === 'verified' && e.isVerified === true) ||
        (statusFilter === 'rejected' && e.isVerified === false);
      return matchesSearch && matchesStatus;
    });
  };

  const filteredVcs = useMemo(() => filterEntries(submissions?.vcs as KycEntry[] ?? []), [submissions?.vcs, searchQuery, statusFilter]);
  const filteredAngels = useMemo(() => filterEntries(submissions?.angels as KycEntry[] ?? []), [submissions?.angels, searchQuery, statusFilter]);
  const filteredLawyers = useMemo(() => filterEntries(submissions?.lawyers as KycEntry[] ?? []), [submissions?.lawyers, searchQuery, statusFilter]);
  const filteredStartups = useMemo(() => filterEntries(submissions?.startups as KycEntry[] ?? []), [submissions?.startups, searchQuery, statusFilter]);

  const pendingCount = (submissions?.vcs?.filter(e => e.isVerified === null).length ?? 0)
    + (submissions?.angels?.filter(e => e.isVerified === null).length ?? 0)
    + (submissions?.lawyers?.filter(e => e.isVerified === null).length ?? 0)
    + (submissions?.startups?.filter(e => e.isVerified === null).length ?? 0);

  const tabs: { id: TabId; label: string; icon: React.ElementType; count?: number; pending?: number }[] = [
    {
      id: 'vcs', label: 'VC Firms', icon: Building2,
      count: submissions?.vcs?.length,
      pending: submissions?.vcs?.filter(e => e.isVerified === null).length
    },
    {
      id: 'angels', label: 'Angels', icon: Users,
      count: submissions?.angels?.length,
      pending: submissions?.angels?.filter(e => e.isVerified === null).length
    },
    {
      id: 'lawyers', label: 'Lawyers', icon: Briefcase,
      count: submissions?.lawyers?.length,
      pending: submissions?.lawyers?.filter(e => e.isVerified === null).length
    },
    {
      id: 'startups', label: 'Startups', icon: Rocket,
      count: submissions?.startups?.length,
      pending: submissions?.startups?.filter(e => e.isVerified === null).length
    },
    { id: 'users', label: 'Users', icon: UserCheck },
  ];

  const activeEntries = {
    vcs: filteredVcs,
    angels: filteredAngels,
    lawyers: filteredLawyers,
    startups: filteredStartups,
  };

  const activeType: Record<Exclude<TabId, 'users'>, 'vc' | 'angel' | 'lawyer' | 'startup'> = {
    vcs: 'vc',
    angels: 'angel',
    lawyers: 'lawyer',
    startups: 'startup',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-8">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-secondary">
          <Shield className="w-8 h-8 text-muted-foreground opacity-40" />
        </div>
        <h2 className="text-lg font-bold mb-2">Admin Access Required</h2>
        <p className="text-sm text-muted-foreground">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* ── Page Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'oklch(0.18 0.05 240)' }}>
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: 'Playfair Display, serif' }}>
              Admin Dashboard
            </h2>
            <p className="text-xs text-muted-foreground">
              Manage KYC submissions and user accounts
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              <AlertCircle className="w-3.5 h-3.5" />
              {pendingCount} pending
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-1.5 h-8 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="VC Firms" value={submissions?.vcs?.length ?? 0} icon={Building2}
          color="oklch(0.18 0.05 240)"
          pending={submissions?.vcs?.filter(e => e.isVerified === null).length}
        />
        <StatCard
          label="Angel Investors" value={submissions?.angels?.length ?? 0} icon={Users}
          color="oklch(0.55 0.13 30)"
          pending={submissions?.angels?.filter(e => e.isVerified === null).length}
        />
        <StatCard
          label="Venture Lawyers" value={submissions?.lawyers?.length ?? 0} icon={Briefcase}
          color="oklch(0.4 0.1 280)"
          pending={submissions?.lawyers?.filter(e => e.isVerified === null).length}
        />
        <StatCard
          label="Startups" value={submissions?.startups?.length ?? 0} icon={Rocket}
          color="oklch(0.35 0.12 145)"
          pending={submissions?.startups?.filter(e => e.isVerified === null).length}
        />
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 p-1 rounded-xl bg-secondary/40 w-fit overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap"
              style={isActive
                ? { background: 'white', color: 'oklch(0.18 0.05 240)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }
                : { color: 'oklch(0.5 0.03 240)' }
              }
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                  style={isActive
                    ? { background: 'oklch(0.18 0.05 240)', color: 'white' }
                    : { background: 'oklch(0.88 0.02 240)', color: 'oklch(0.4 0.04 240)' }
                  }>
                  {tab.count}
                </span>
              )}
              {(tab.pending ?? 0) > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Search & Filter Bar (for KYC tabs) ── */}
      {activeTab !== 'users' && (
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name…"
              className="pl-8 h-9 text-sm"
            />
          </div>
          <Select value={statusFilter} onValueChange={v => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-36 h-9 text-sm">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* ── Content ── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-48 gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading submissions…</p>
        </div>
      ) : (
        <>
          {/* KYC Tabs */}
          {activeTab !== 'users' && (
            <div className="space-y-3">
              {activeEntries[activeTab].length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-3">
                    <MoreHorizontal className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">No submissions found</p>
                  <p className="text-xs text-muted-foreground">
                    {searchQuery || statusFilter !== 'all'
                      ? 'Try adjusting your search or filter'
                      : 'No submissions in this category yet'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Showing {activeEntries[activeTab].length} result{activeEntries[activeTab].length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  {activeEntries[activeTab].map(entry => (
                    <EntryCard
                      key={entry.id}
                      entry={entry}
                      type={activeType[activeTab]}
                      isUpdating={verifyMutation.isPending || togglePublicMutation.isPending}
                      onVerify={(id, verified) => verifyMutation.mutate({ type: activeType[activeTab], id, verified })}
                      onTogglePublic={(id, isPublic) => togglePublicMutation.mutate({ type: activeType[activeTab], id, isPublic })}
                    />
                  ))}
                </>
              )}
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div>
              {usersLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="rounded-xl border border-border overflow-hidden">
                  {/* Table Header */}
                  <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-0 border-b border-border bg-secondary/30 px-4 py-2.5">
                    <div className="text-xs font-semibold text-muted-foreground">User</div>
                    <div className="text-xs font-semibold text-muted-foreground px-3">Type</div>
                    <div className="text-xs font-semibold text-muted-foreground px-3">KYC</div>
                    <div className="text-xs font-semibold text-muted-foreground px-3">Role</div>
                    <div className="text-xs font-semibold text-muted-foreground px-3">Joined</div>
                    <div className="text-xs font-semibold text-muted-foreground px-3">Actions</div>
                  </div>

                  {/* Table Rows */}
                  <div className="divide-y divide-border">
                    {(users ?? []).map(u => (
                      <div key={u.id} className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-0 px-4 py-3 hover:bg-secondary/20 transition-colors items-center">
                        {/* User info */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ background: u.role === 'admin' ? 'oklch(0.55 0.13 30)' : 'oklch(0.18 0.05 240)' }}>
                            {(u.name ?? u.email ?? '?').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-sm text-foreground truncate">{u.name ?? 'Unnamed'}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                              <Mail className="w-2.5 h-2.5 shrink-0" />
                              {u.email}
                            </div>
                          </div>
                        </div>

                        {/* Type */}
                        <div className="px-3">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground capitalize whitespace-nowrap">
                            {u.userType ?? 'unknown'}
                          </span>
                        </div>

                        {/* KYC */}
                        <div className="px-3 flex justify-center">
                          {u.kycCompleted ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-muted-foreground opacity-40" />
                          )}
                        </div>

                        {/* Role */}
                        <div className="px-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold whitespace-nowrap ${
                            u.role === 'admin'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                              : 'bg-secondary text-muted-foreground'
                          }`}>
                            {u.role}
                          </span>
                        </div>

                        {/* Joined */}
                        <div className="px-3 text-xs text-muted-foreground whitespace-nowrap">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }) : 'N/A'}
                        </div>

                        {/* Actions */}
                        <div className="px-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setRoleMutation.mutate({ userId: u.id, role: u.role === 'admin' ? 'user' : 'admin' })}
                            disabled={setRoleMutation.isPending}
                            className="h-7 text-xs whitespace-nowrap"
                          >
                            {u.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="px-4 py-2.5 border-t border-border bg-secondary/10">
                    <p className="text-xs text-muted-foreground">{(users ?? []).length} users total</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
