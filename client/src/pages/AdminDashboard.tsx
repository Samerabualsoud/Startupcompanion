import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import {
  Shield, CheckCircle2, XCircle, Eye, EyeOff, Users, Building2,
  Briefcase, Rocket, Loader2, AlertCircle, RefreshCw,
  ExternalLink, Search, Clock, TrendingUp, UserCheck,
  Mail, Calendar, BarChart3, Activity, FileText, Database,
  ChevronRight, Trash2, Star, Globe, Hash, ArrowLeft,
  ClipboardList, Settings, Bell, Package, UserX
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { toast } from 'sonner';

type TabId = 'overview' | 'users' | 'kyc' | 'submissions' | 'resources' | 'audit' | 'analytics';

// ── Helpers ────────────────────────────────────────────────────────────────

function StatusBadge({ verified }: { verified: boolean | null }) {
  if (verified === true) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
      <CheckCircle2 className="w-3 h-3" /> Verified
    </span>
  );
  if (verified === false) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
      <XCircle className="w-3 h-3" /> Rejected
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
      <Clock className="w-3 h-3" /> Pending
    </span>
  );
}

function StatCard({ label, value, icon: Icon, color, sub }: {
  label: string; value: number | string; icon: React.ElementType; color: string; sub?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: color }}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
        {sub && <div className="text-[10px] text-amber-600 font-medium mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

// ── KYC Entry Card ─────────────────────────────────────────────────────────

interface KycEntry {
  id: number; userId: number; isVerified: boolean | null; isPublic: boolean | null;
  createdAt: Date | null; [key: string]: unknown;
}

function KycEntryCard({ entry, type, onVerify, onTogglePublic, isUpdating }: {
  entry: KycEntry; type: 'vc' | 'angel' | 'lawyer' | 'startup';
  onVerify: (id: number, v: boolean) => void;
  onTogglePublic: (id: number, p: boolean) => void;
  isUpdating: boolean;
}) {
  const name = (entry.firmName as string) ?? (entry.displayName as string) ?? (entry.companyName as string) ?? `#${entry.id}`;
  const subtitle = (entry.description as string) ?? (entry.bio as string) ?? (entry.tagline as string) ?? '';
  const website = (entry.website as string) ?? (entry.linkedinUrl as string) ?? null;

  return (
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col sm:flex-row gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="font-semibold text-sm text-foreground">{name}</span>
          <StatusBadge verified={entry.isVerified ?? null} />
          {entry.isPublic ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              <Eye className="w-3 h-3" /> Public
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-secondary text-muted-foreground">
              <EyeOff className="w-3 h-3" /> Private
            </span>
          )}
        </div>
        {subtitle && <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{subtitle}</p>}
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1"><Hash className="w-3 h-3" />User #{entry.userId}</span>
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />
            {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : 'N/A'}
          </span>
          {website && (
            <a href={website} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-500 hover:underline">
              <ExternalLink className="w-3 h-3" /> View
            </a>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 flex-wrap">
        <Button variant="outline" size="sm" disabled={isUpdating}
          onClick={() => onTogglePublic(entry.id, !entry.isPublic)}
          className="h-7 text-xs gap-1">
          {entry.isPublic ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          {entry.isPublic ? 'Hide' : 'Show'}
        </Button>
        {entry.isVerified !== true && (
          <Button size="sm" disabled={isUpdating}
            onClick={() => onVerify(entry.id, true)}
            className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white">
            <CheckCircle2 className="w-3 h-3" /> Verify
          </Button>
        )}
        {entry.isVerified !== false && (
          <Button variant="outline" size="sm" disabled={isUpdating}
            onClick={() => onVerify(entry.id, false)}
            className="h-7 text-xs gap-1 text-red-600 border-red-200 hover:bg-red-50">
            <XCircle className="w-3 h-3" /> Reject
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [kycTypeFilter, setKycTypeFilter] = useState<'vcs' | 'angels' | 'lawyers' | 'startups'>('vcs');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  const [submissionStatusFilter, setSubmissionStatusFilter] = useState<'pending' | 'approved' | 'rejected' | undefined>(undefined);
  const [reviewNote, setReviewNote] = useState<Record<number, string>>({});

  // Queries
  const { data: stats, refetch: refetchStats } = trpc.admin.getStats.useQuery(undefined, { enabled: user?.role === 'admin' });
  const { data: submissions, isFetching: kycFetching, refetch: refetchKyc } = trpc.admin.getKycSubmissions.useQuery(undefined, { enabled: user?.role === 'admin' });
  const { data: users, isLoading: usersLoading, refetch: refetchUsers } = trpc.admin.getUsers.useQuery({ limit: 100, offset: 0 }, { enabled: user?.role === 'admin' });
  const { data: resourceSubmissions, isLoading: subLoading, refetch: refetchSubs } = trpc.admin.getResourceSubmissions.useQuery(
    { status: submissionStatusFilter },
    { enabled: user?.role === 'admin' }
  );
  const { data: auditLogs, isLoading: auditLoading } = trpc.admin.getAuditLog.useQuery({ limit: 200, offset: 0 }, { enabled: user?.role === 'admin' && activeTab === 'audit' });

  // Mutations
  const verifyMutation = trpc.admin.verifyKyc.useMutation({
    onSuccess: () => { toast.success('KYC status updated'); refetchKyc(); refetchStats(); },
    onError: (e) => toast.error(e.message),
  });
  const togglePublicMutation = trpc.admin.setPublicStatus.useMutation({
    onSuccess: () => { toast.success('Visibility updated'); refetchKyc(); },
    onError: (e) => toast.error(e.message),
  });
  const setRoleMutation = trpc.admin.setUserRole.useMutation({
    onSuccess: () => { toast.success('User role updated'); refetchUsers(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteUserMutation = trpc.admin.deleteUser.useMutation({
    onSuccess: () => { toast.success('User deleted'); refetchUsers(); refetchStats(); },
    onError: (e) => toast.error(e.message),
  });
  const reviewSubmissionMutation = trpc.admin.reviewResourceSubmission.useMutation({
    onSuccess: () => { toast.success('Submission reviewed'); refetchSubs(); refetchStats(); },
    onError: (e) => toast.error(e.message),
  });

  const pendingKycCount = (submissions?.vcs?.filter((e: KycEntry) => e.isVerified === null).length ?? 0)
    + (submissions?.angels?.filter((e: KycEntry) => e.isVerified === null).length ?? 0)
    + (submissions?.lawyers?.filter((e: KycEntry) => e.isVerified === null).length ?? 0)
    + (submissions?.startups?.filter((e: KycEntry) => e.isVerified === null).length ?? 0);

  const tabs: { id: TabId; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users, badge: stats?.totalUsers },
    { id: 'kyc', label: 'KYC', icon: UserCheck, badge: pendingKycCount },
    { id: 'submissions', label: 'Submissions', icon: ClipboardList, badge: stats?.pendingSubmissions },
    { id: 'resources', label: 'Resources', icon: Database },
    { id: 'audit', label: 'Audit Log', icon: Activity },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  ];

  const kycEntries: KycEntry[] = useMemo(() => {
    const raw = kycTypeFilter === 'vcs' ? submissions?.vcs
      : kycTypeFilter === 'angels' ? submissions?.angels
      : kycTypeFilter === 'lawyers' ? submissions?.lawyers
      : submissions?.startups;
    return (raw as KycEntry[] ?? []).filter(e => {
      const name = ((e.firmName as string) ?? (e.displayName as string) ?? (e.companyName as string) ?? '').toLowerCase();
      const matchSearch = !searchQuery || name.includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'all'
        || (statusFilter === 'pending' && e.isVerified === null)
        || (statusFilter === 'verified' && e.isVerified === true)
        || (statusFilter === 'rejected' && e.isVerified === false);
      return matchSearch && matchStatus;
    });
  }, [submissions, kycTypeFilter, searchQuery, statusFilter]);

  const filteredUsers = useMemo(() => {
    return (users ?? []).filter(u => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (u.name ?? '').toLowerCase().includes(q) || (u.email ?? '').toLowerCase().includes(q);
    });
  }, [users, searchQuery]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
    </div>
  );

  if (!user || user.role !== 'admin') return (
    <div className="flex flex-col items-center justify-center h-64 text-center p-8">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-secondary">
        <Shield className="w-8 h-8 text-muted-foreground opacity-40" />
      </div>
      <h2 className="text-lg font-bold mb-2">Admin Access Required</h2>
      <p className="text-sm text-muted-foreground">You do not have permission to view this page.</p>
      <Link href="/">
        <Button variant="outline" size="sm" className="mt-4 gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Button>
      </Link>
    </div>
  );

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'oklch(0.18 0.05 240)' }}>
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: 'Playfair Display, serif' }}>
              Platform Management
            </h2>
            <p className="text-xs text-muted-foreground">Full control over users, KYC, resources, and analytics</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(pendingKycCount > 0 || (stats?.pendingSubmissions ?? 0) > 0) && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              <Bell className="w-3.5 h-3.5" />
              {pendingKycCount + (stats?.pendingSubmissions ?? 0)} pending
            </div>
          )}
          <Link href="/">
            <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
              <ArrowLeft className="w-3.5 h-3.5" /> Home
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={() => { refetchStats(); refetchKyc(); refetchUsers(); refetchSubs(); }}
            className="gap-1.5 h-8 text-xs">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 p-1 rounded-xl bg-secondary/40 overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap relative"
              style={isActive
                ? { background: 'white', color: 'oklch(0.18 0.05 240)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }
                : { color: 'oklch(0.5 0.03 240)' }}>
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
              {tab.badge != null && tab.badge > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white leading-none">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Overview Tab ── */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Total Users" value={stats?.totalUsers ?? 0} icon={Users} color="oklch(0.18 0.05 240)"
              sub={stats?.pendingSubmissions ? `${stats.pendingSubmissions} pending submissions` : undefined} />
            <StatCard label="VC Firms" value={stats?.vcCount ?? 0} icon={Building2} color="oklch(0.55 0.13 30)" />
            <StatCard label="Angel Investors" value={stats?.angelCount ?? 0} icon={Star} color="oklch(0.4 0.1 280)" />
            <StatCard label="Startups" value={stats?.startupCount ?? 0} icon={Rocket} color="oklch(0.35 0.12 145)" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Venture Lawyers" value={stats?.lawyerCount ?? 0} icon={Briefcase} color="oklch(0.45 0.08 200)" />
            <StatCard label="Saved Valuations" value={stats?.savedValuationCount ?? 0} icon={TrendingUp} color="oklch(0.5 0.12 60)" />
            <StatCard label="Pending KYC" value={pendingKycCount} icon={Clock} color="oklch(0.6 0.15 50)"
              sub={pendingKycCount > 0 ? 'Needs review' : undefined} />
            <StatCard label="Pending Submissions" value={stats?.pendingSubmissions ?? 0} icon={ClipboardList} color="oklch(0.5 0.1 340)"
              sub={(stats?.pendingSubmissions ?? 0) > 0 ? 'Self-registrations' : undefined} />
          </div>

          {/* Recent Users */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-secondary/20 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Recent Signups</h3>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => setActiveTab('users')}>
                View All <ChevronRight className="w-3 h-3" />
              </Button>
            </div>
            <div className="divide-y divide-border">
              {(stats?.recentUsers ?? []).slice(0, 5).map((u: { id: number; name: string | null; email: string; role: string; userType: string; createdAt: Date }) => (
                <div key={u.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ background: u.role === 'admin' ? 'oklch(0.55 0.13 30)' : 'oklch(0.18 0.05 240)' }}>
                    {(u.name ?? u.email ?? '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{u.name ?? 'Unnamed'}</div>
                    <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                  </div>
                  <div className="text-xs text-muted-foreground capitalize">{u.userType}</div>
                  <div className="text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</div>
                </div>
              ))}
              {(stats?.recentUsers ?? []).length === 0 && (
                <div className="px-4 py-8 text-center text-xs text-muted-foreground">No users yet</div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Review KYC', icon: UserCheck, tab: 'kyc' as TabId, badge: pendingKycCount },
              { label: 'Review Submissions', icon: ClipboardList, tab: 'submissions' as TabId, badge: stats?.pendingSubmissions },
              { label: 'Manage Users', icon: Users, tab: 'users' as TabId },
              { label: 'Audit Log', icon: Activity, tab: 'audit' as TabId },
            ].map(action => (
              <button key={action.label} onClick={() => setActiveTab(action.tab)}
                className="flex items-center gap-2 p-3 rounded-xl border border-border bg-card hover:bg-secondary/30 transition-colors text-left">
                <action.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-xs font-medium text-foreground">{action.label}</span>
                {action.badge != null && action.badge > 0 && (
                  <span className="ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">{action.badge}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Users Tab ── */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search by name or email..." value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)} className="pl-9 h-9 text-sm" />
            </div>
          </div>
          {usersLoading ? (
            <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto_auto] gap-0 border-b border-border bg-secondary/30 px-4 py-2.5">
                {['User', 'Type', 'KYC', 'Role', 'Plan', 'Joined', 'Actions'].map(h => (
                  <div key={h} className="text-xs font-semibold text-muted-foreground px-2">{h}</div>
                ))}
              </div>
              <div className="divide-y divide-border">
                {filteredUsers.map(u => (
                  <div key={u.id} className="grid grid-cols-[1fr_auto_auto_auto_auto_auto_auto] gap-0 px-4 py-3 hover:bg-secondary/20 transition-colors items-center">
                    <div className="flex items-center gap-3 min-w-0 px-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ background: u.role === 'admin' ? 'oklch(0.55 0.13 30)' : 'oklch(0.18 0.05 240)' }}>
                        {(u.name ?? u.email ?? '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-sm text-foreground truncate">{u.name ?? 'Unnamed'}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                          <Mail className="w-2.5 h-2.5 shrink-0" />{u.email}
                        </div>
                      </div>
                    </div>
                    <div className="px-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground capitalize whitespace-nowrap">
                        {u.userType ?? 'unknown'}
                      </span>
                    </div>
                    <div className="px-2 flex justify-center">
                      {u.kycCompleted
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        : <XCircle className="w-4 h-4 text-muted-foreground opacity-40" />}
                    </div>
                    <div className="px-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold whitespace-nowrap ${
                        u.role === 'admin' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-secondary text-muted-foreground'
                      }`}>{u.role}</span>
                    </div>
                    <div className="px-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${
                        u.subscriptionStatus === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-secondary text-muted-foreground'
                      }`}>{u.subscriptionPlan ?? u.subscriptionStatus ?? 'free'}</span>
                    </div>
                    <div className="px-2 text-xs text-muted-foreground whitespace-nowrap">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }) : 'N/A'}
                    </div>
                    <div className="px-2 flex items-center gap-1">
                      <Button variant="outline" size="sm"
                        onClick={() => setRoleMutation.mutate({ userId: u.id, role: u.role === 'admin' ? 'user' : 'admin' })}
                        disabled={setRoleMutation.isPending}
                        className="h-7 text-xs whitespace-nowrap">
                        {u.role === 'admin' ? 'Demote' : 'Admin'}
                      </Button>
                      <Button variant="outline" size="sm"
                        onClick={() => {
                          if (confirm(`Delete user ${u.email}? This cannot be undone.`)) {
                            deleteUserMutation.mutate({ userId: u.id });
                          }
                        }}
                        disabled={deleteUserMutation.isPending}
                        className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2.5 border-t border-border bg-secondary/10">
                <p className="text-xs text-muted-foreground">{filteredUsers.length} of {users?.length ?? 0} users</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── KYC Tab ── */}
      {activeTab === 'kyc' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <div className="flex gap-1 p-1 rounded-lg bg-secondary/40">
              {(['vcs', 'angels', 'lawyers', 'startups'] as const).map(t => (
                <button key={t} onClick={() => setKycTypeFilter(t)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize ${
                    kycTypeFilter === t ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground'
                  }`}>{t}</button>
              ))}
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
              <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 h-8 text-xs" />
            </div>
          </div>
          {kycFetching ? (
            <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : kycEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-3">
                <UserCheck className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">No submissions found</p>
              <p className="text-xs text-muted-foreground">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">{kycEntries.length} result{kycEntries.length !== 1 ? 's' : ''}</p>
              {kycEntries.map(entry => (
                <KycEntryCard key={entry.id} entry={entry}
                  type={kycTypeFilter === 'vcs' ? 'vc' : kycTypeFilter === 'angels' ? 'angel' : kycTypeFilter === 'lawyers' ? 'lawyer' : 'startup'}
                  isUpdating={verifyMutation.isPending || togglePublicMutation.isPending}
                  onVerify={(id, v) => verifyMutation.mutate({ type: kycTypeFilter === 'vcs' ? 'vc' : kycTypeFilter === 'angels' ? 'angel' : kycTypeFilter === 'lawyers' ? 'lawyer' : 'startup', id, verified: v })}
                  onTogglePublic={(id, p) => togglePublicMutation.mutate({ type: kycTypeFilter === 'vcs' ? 'vc' : kycTypeFilter === 'angels' ? 'angel' : kycTypeFilter === 'lawyers' ? 'lawyer' : 'startup', id, isPublic: p })}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Resource Submissions Tab ── */}
      {activeTab === 'submissions' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm text-muted-foreground flex-1">
              Self-registration requests from VCs, angels, lawyers, and grant providers.
            </p>
            <div className="flex gap-1 p-1 rounded-lg bg-secondary/40">
              {([undefined, 'pending', 'approved', 'rejected'] as const).map(s => (
                <button key={String(s)} onClick={() => setSubmissionStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize ${
                    submissionStatusFilter === s ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground'
                  }`}>{s ?? 'All'}</button>
              ))}
            </div>
          </div>
          {subLoading ? (
            <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : (resourceSubmissions ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-3">
                <ClipboardList className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">No submissions yet</p>
              <p className="text-xs text-muted-foreground">Self-registration requests will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(resourceSubmissions ?? []).map((sub) => {
                const data = sub.data as Record<string, unknown>;
                return (
                  <div key={sub.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-sm text-foreground">
                            {(data.name as string) ?? (data.firmName as string) ?? `Submission #${sub.id}`}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground capitalize">{sub.type}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                            sub.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                            sub.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-red-100 text-red-700'
                          }`}>{sub.status}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          From: {sub.submitterName ?? 'Anonymous'} · {sub.submitterEmail ?? 'No email'} · {new Date(sub.createdAt).toLocaleDateString()}
                        </p>
                        {(data.description as string) && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{data.description as string}</p>
                        )}
                      </div>
                    </div>
                    {sub.status === 'pending' && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <Input placeholder="Admin note (optional)..." value={reviewNote[sub.id] ?? ''}
                          onChange={e => setReviewNote(n => ({ ...n, [sub.id]: e.target.value }))}
                          className="h-8 text-xs flex-1 min-w-[200px]" />
                        <Button size="sm" className="h-8 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                          disabled={reviewSubmissionMutation.isPending}
                          onClick={() => reviewSubmissionMutation.mutate({ id: sub.id, status: 'approved', adminNote: reviewNote[sub.id] })}>
                          <CheckCircle2 className="w-3 h-3" /> Approve
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 text-xs gap-1 text-red-600 border-red-200 hover:bg-red-50"
                          disabled={reviewSubmissionMutation.isPending}
                          onClick={() => reviewSubmissionMutation.mutate({ id: sub.id, status: 'rejected', adminNote: reviewNote[sub.id] })}>
                          <XCircle className="w-3 h-3" /> Reject
                        </Button>
                      </div>
                    )}
                    {sub.adminNote && (
                      <p className="text-xs text-muted-foreground italic border-l-2 border-border pl-2">Note: {sub.adminNote}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Resources Tab ── */}
      {activeTab === 'resources' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <Database className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <h3 className="text-sm font-semibold text-foreground mb-1">Resource Database Management</h3>
            <p className="text-xs text-muted-foreground mb-4">
              The resource database contains VCs, angels, grants, and lawyers. Use the Database panel in the Management UI to directly edit records, or approve self-registration submissions from the Submissions tab.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
              {[
                { label: 'VC Firms', icon: Building2, color: 'oklch(0.18 0.05 240)' },
                { label: 'Angel Investors', icon: Users, color: 'oklch(0.55 0.13 30)' },
                { label: 'Grants', icon: Package, color: 'oklch(0.35 0.12 145)' },
                { label: 'Venture Lawyers', icon: Briefcase, color: 'oklch(0.4 0.1 280)' },
              ].map(r => (
                <div key={r.label} className="rounded-lg border border-border p-3 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: r.color }}>
                    <r.icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-medium text-foreground">{r.label}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              To add or edit resource entries directly, use the <strong>Database</strong> tab in the Management UI sidebar.
            </p>
          </div>
        </div>
      )}

      {/* ── Audit Log Tab ── */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          {auditLoading ? (
            <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : (auditLogs ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-3">
                <Activity className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">No audit logs yet</p>
              <p className="text-xs text-muted-foreground">Admin actions will be recorded here</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="grid grid-cols-[auto_1fr_auto_auto] gap-0 border-b border-border bg-secondary/30 px-4 py-2.5">
                {['#', 'Action', 'Target', 'Time'].map(h => (
                  <div key={h} className="text-xs font-semibold text-muted-foreground px-2">{h}</div>
                ))}
              </div>
              <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
                {[...(auditLogs ?? [])].reverse().map(log => (
                  <div key={log.id} className="grid grid-cols-[auto_1fr_auto_auto] gap-0 px-4 py-3 hover:bg-secondary/20 transition-colors items-center">
                    <div className="px-2 text-xs text-muted-foreground font-mono">#{log.id}</div>
                    <div className="px-2">
                      <div className="text-xs font-medium text-foreground">{log.action.replace(/_/g, ' ')}</div>
                      <div className="text-[10px] text-muted-foreground">{log.adminEmail}</div>
                    </div>
                    <div className="px-2 text-xs text-muted-foreground">
                      {log.targetType && <span className="capitalize">{log.targetType} #{log.targetId}</span>}
                    </div>
                    <div className="px-2 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Analytics Tab ── */}
      {activeTab === 'analytics' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-border bg-card p-5 text-center">
              <div className="text-3xl font-bold text-foreground mb-1">{stats?.totalUsers ?? 0}</div>
              <div className="text-xs text-muted-foreground">Total Registered Users</div>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 text-center">
              <div className="text-3xl font-bold text-foreground mb-1">{stats?.savedValuationCount ?? 0}</div>
              <div className="text-xs text-muted-foreground">Valuations Saved</div>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 text-center">
              <div className="text-3xl font-bold text-foreground mb-1">
                {(stats?.vcCount ?? 0) + (stats?.angelCount ?? 0) + (stats?.lawyerCount ?? 0) + (stats?.startupCount ?? 0)}
              </div>
              <div className="text-xs text-muted-foreground">Total KYC Profiles</div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">User Type Breakdown</h3>
            <div className="space-y-3">
              {[
                { label: 'VC Firms', value: stats?.vcCount ?? 0, total: stats?.totalUsers ?? 1, color: 'oklch(0.18 0.05 240)' },
                { label: 'Angel Investors', value: stats?.angelCount ?? 0, total: stats?.totalUsers ?? 1, color: 'oklch(0.55 0.13 30)' },
                { label: 'Venture Lawyers', value: stats?.lawyerCount ?? 0, total: stats?.totalUsers ?? 1, color: 'oklch(0.4 0.1 280)' },
                { label: 'Startups', value: stats?.startupCount ?? 0, total: stats?.totalUsers ?? 1, color: 'oklch(0.35 0.12 145)' },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">{item.label}</span>
                    <span className="text-xs font-semibold text-foreground">{item.value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (item.value / Math.max(1, item.total)) * 100)}%`, background: item.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 text-center">
            <BarChart3 className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
            <p className="text-xs text-muted-foreground">
              For detailed analytics including page views and user sessions, check the <strong>Dashboard</strong> panel in the Management UI.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
