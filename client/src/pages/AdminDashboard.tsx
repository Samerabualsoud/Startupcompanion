import { useState, useMemo, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import {
  Shield, CheckCircle2, XCircle, Eye, EyeOff, Users, Building2,
  Briefcase, Rocket, Loader2, RefreshCw,
  ExternalLink, Search, Clock, TrendingUp, UserCheck,
  Mail, Calendar, BarChart3, Activity, FileText, Database,
  ChevronRight, Trash2, Star, Globe, Hash, ArrowLeft,
  ClipboardList, Settings, Bell, Package, UserX, Ban, CheckCheck,
  Info, HelpCircle, AlertTriangle, Megaphone, Lock, Unlock,
  DollarSign, BookOpen, ToggleLeft, ToggleRight, Save
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { toast } from 'sonner';
import * as Tooltip from '@radix-ui/react-tooltip';

type TabId = 'overview' | 'users' | 'kyc' | 'submissions' | 'resources' | 'valuations' | 'audit' | 'analytics' | 'settings';

// ── Tooltip Helper ─────────────────────────────────────────────────────────

function InfoTip({ text }: { text: string }) {
  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button type="button" className="inline-flex items-center justify-center w-4 h-4 rounded-full text-muted-foreground hover:text-foreground transition-colors shrink-0">
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="z-50 max-w-xs px-3 py-2 text-xs text-white bg-gray-900 rounded-lg shadow-lg leading-relaxed"
            sideOffset={5}
          >
            {text}
            <Tooltip.Arrow className="fill-gray-900" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function StatusBadge({ verified }: { verified: boolean | null }) {
  if (verified === true) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
      <CheckCircle2 className="w-3 h-3" /> Verified
    </span>
  );
  if (verified === false) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
      <XCircle className="w-3 h-3" /> Rejected
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
      <Clock className="w-3 h-3" /> Pending
    </span>
  );
}

function StatCard({ label, value, icon: Icon, color, sub, tooltip }: {
  label: string; value: number | string; icon: React.ElementType; color: string; sub?: string; tooltip?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: color }}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <div className="text-2xl font-bold text-foreground">{value}</div>
          {tooltip && <InfoTip text={tooltip} />}
        </div>
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
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
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
  const [banReason, setBanReason] = useState<Record<number, string>>({});
  const [settingsDraft, setSettingsDraft] = useState<Record<string, unknown>>({});
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [resourceSubTab, setResourceSubTab] = useState<'vcs' | 'angels' | 'grants' | 'lawyers'>('vcs');
  const [editingResource, setEditingResource] = useState<{ type: string; item: Record<string, unknown> } | null>(null);
  const [editDraft, setEditDraft] = useState<Record<string, unknown>>({});

  // Queries
  const { data: stats, refetch: refetchStats } = trpc.admin.getStats.useQuery(undefined, { enabled: user?.role === 'admin' });
  const { data: submissions, isFetching: kycFetching, refetch: refetchKyc } = trpc.admin.getKycSubmissions.useQuery(undefined, { enabled: user?.role === 'admin' });
  const { data: users, isLoading: usersLoading, refetch: refetchUsers } = trpc.admin.getUsers.useQuery({ limit: 100, offset: 0 }, { enabled: user?.role === 'admin' });
  const { data: resourceSubmissions, isLoading: subLoading, refetch: refetchSubs } = trpc.admin.getResourceSubmissions.useQuery(
    { status: submissionStatusFilter },
    { enabled: user?.role === 'admin' }
  );
  const { data: auditLogs, isLoading: auditLoading } = trpc.admin.getAuditLog.useQuery(
    { limit: 200, offset: 0 },
    { enabled: user?.role === 'admin' && activeTab === 'audit' }
  );
  const { data: allValuations, isLoading: valuationsLoading } = trpc.admin.getAllValuations.useQuery(
    { limit: 200, offset: 0 },
    { enabled: user?.role === 'admin' && activeTab === 'valuations' }
  );
  const { data: platformSettings, refetch: refetchSettings } = trpc.admin.getPlatformSettings.useQuery(undefined, {
    enabled: user?.role === 'admin' && activeTab === 'settings',
  });
  const { data: resourceDb, isLoading: resourceDbLoading, refetch: refetchResourceDb } = trpc.admin.getResourceDatabase.useQuery(undefined, {
    enabled: user?.role === 'admin' && activeTab === 'resources',
  });

  // Sync settings draft when data loads
  useEffect(() => {
    if (!settingsLoaded && platformSettings) {
      setSettingsDraft({
        announcementText: platformSettings.announcementText ?? '',
        announcementActive: platformSettings.announcementActive,
        announcementType: platformSettings.announcementType,
        maintenanceMode: platformSettings.maintenanceMode,
        maintenanceMessage: platformSettings.maintenanceMessage ?? '',
        allowNewRegistrations: platformSettings.allowNewRegistrations,
      });
      setSettingsLoaded(true);
    }
  }, [platformSettings, settingsLoaded]);

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
  const banUserMutation = trpc.admin.banUser.useMutation({
    onSuccess: () => { toast.success('User ban status updated'); refetchUsers(); },
    onError: (e) => toast.error(e.message),
  });
  const reviewSubmissionMutation = trpc.admin.reviewResourceSubmission.useMutation({
    onSuccess: () => { toast.success('Submission reviewed'); refetchSubs(); refetchStats(); },
    onError: (e) => toast.error(e.message),
  });
  const setPlatformSettingsMutation = trpc.admin.setPlatformSettings.useMutation({
    onSuccess: () => { toast.success('Platform settings saved'); refetchSettings(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteVCMutation = trpc.admin.deleteVC.useMutation({ onSuccess: () => { toast.success('VC deleted'); refetchResourceDb(); }, onError: (e) => toast.error(e.message) });
  const deleteAngelMutation = trpc.admin.deleteAngel.useMutation({ onSuccess: () => { toast.success('Angel deleted'); refetchResourceDb(); }, onError: (e) => toast.error(e.message) });
  const deleteGrantMutation = trpc.admin.deleteGrant.useMutation({ onSuccess: () => { toast.success('Grant deleted'); refetchResourceDb(); }, onError: (e) => toast.error(e.message) });
  const deleteLawyerMutation = trpc.admin.deleteLawyer.useMutation({ onSuccess: () => { toast.success('Lawyer deleted'); refetchResourceDb(); }, onError: (e) => toast.error(e.message) });
  const updateVCMutation = trpc.admin.updateVC.useMutation({ onSuccess: () => { toast.success('VC updated'); refetchResourceDb(); setEditingResource(null); }, onError: (e) => toast.error(e.message) });
  const updateAngelMutation = trpc.admin.updateAngel.useMutation({ onSuccess: () => { toast.success('Angel updated'); refetchResourceDb(); setEditingResource(null); }, onError: (e) => toast.error(e.message) });
  const updateGrantMutation = trpc.admin.updateGrant.useMutation({ onSuccess: () => { toast.success('Grant updated'); refetchResourceDb(); setEditingResource(null); }, onError: (e) => toast.error(e.message) });
  const updateLawyerMutation = trpc.admin.updateLawyer.useMutation({ onSuccess: () => { toast.success('Lawyer updated'); refetchResourceDb(); setEditingResource(null); }, onError: (e) => toast.error(e.message) });

  const pendingKycCount = (submissions?.vcs?.filter((e: KycEntry) => e.isVerified === null).length ?? 0)
    + (submissions?.angels?.filter((e: KycEntry) => e.isVerified === null).length ?? 0)
    + (submissions?.lawyers?.filter((e: KycEntry) => e.isVerified === null).length ?? 0)
    + (submissions?.startups?.filter((e: KycEntry) => e.isVerified === null).length ?? 0);

  const tabs: { id: TabId; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users, badge: stats?.totalUsers },
    { id: 'kyc', label: 'KYC', icon: UserCheck, badge: pendingKycCount },
    { id: 'submissions', label: 'Submissions', icon: ClipboardList, badge: stats?.pendingSubmissions },
    { id: 'resources', label: 'Resource Database', icon: Database },
    { id: 'valuations', label: 'Valuations', icon: TrendingUp },
    { id: 'audit', label: 'Audit Log', icon: Activity },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
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

  const updateDraft = (key: string, value: unknown) => {
    setSettingsDraft(prev => ({ ...prev, [key]: value }));
  };

  const savePlatformSettings = () => {
    setPlatformSettingsMutation.mutate(settingsDraft as Parameters<typeof setPlatformSettingsMutation.mutate>[0]);
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'oklch(0.35 0.2 270)' }}>
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Platform Management
            </h2>
            <p className="text-xs text-muted-foreground">Full control over users, KYC, content, and platform settings</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(pendingKycCount > 0 || (stats?.pendingSubmissions ?? 0) > 0) && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
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
                ? { background: 'white', color: 'oklch(0.35 0.2 270)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }
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
            <StatCard label="Total Users" value={stats?.totalUsers ?? 0} icon={Users} color="oklch(0.35 0.2 270)"
              tooltip="All registered accounts on the platform, including all user types."
              sub={stats?.pendingSubmissions ? `${stats.pendingSubmissions} pending submissions` : undefined} />
            <StatCard label="VC Firms" value={stats?.vcCount ?? 0} icon={Building2} color="oklch(0.45 0.2 270)"
              tooltip="Number of VC firm KYC profiles submitted (verified + unverified)." />
            <StatCard label="Angel Investors" value={stats?.angelCount ?? 0} icon={Star} color="oklch(0.4 0.1 280)"
              tooltip="Number of angel investor KYC profiles submitted." />
            <StatCard label="Startups" value={stats?.startupCount ?? 0} icon={Rocket} color="oklch(0.35 0.12 145)"
              tooltip="Number of startup KYC profiles submitted." />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Venture Lawyers" value={stats?.lawyerCount ?? 0} icon={Briefcase} color="oklch(0.45 0.08 200)"
              tooltip="Number of venture lawyer KYC profiles submitted." />
            <StatCard label="Saved Valuations" value={stats?.savedValuationCount ?? 0} icon={TrendingUp} color="oklch(0.5 0.12 60)"
              tooltip="Total number of valuations saved by all users across the platform." />
            <StatCard label="Pending KYC" value={pendingKycCount} icon={Clock} color="oklch(0.6 0.15 50)"
              tooltip="KYC profiles awaiting your review. These are not yet visible to other users."
              sub={pendingKycCount > 0 ? 'Needs review' : undefined} />
            <StatCard label="Pending Submissions" value={stats?.pendingSubmissions ?? 0} icon={ClipboardList} color="oklch(0.5 0.1 340)"
              tooltip="Self-registration requests from VCs, angels, lawyers, and grant providers waiting for approval."
              sub={(stats?.pendingSubmissions ?? 0) > 0 ? 'Self-registrations' : undefined} />
          </div>

          {/* Recent Users */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-secondary/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">Recent Signups</h3>
                <InfoTip text="The 5 most recently registered users on the platform." />
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => setActiveTab('users')}>
                View All <ChevronRight className="w-3 h-3" />
              </Button>
            </div>
            <div className="divide-y divide-border">
              {(stats?.recentUsers ?? []).slice(0, 5).map((u: { id: number; name: string | null; email: string; role: string; userType: string; createdAt: Date }) => (
                <div key={u.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ background: u.role === 'admin' ? 'oklch(0.45 0.2 270)' : 'oklch(0.35 0.2 270)' }}>
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
              { label: 'Platform Settings', icon: Settings, tab: 'settings' as TabId },
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
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-semibold text-foreground">User Management</h3>
              <InfoTip text="Manage all registered users. You can promote/demote admins, ban users (prevents login), or permanently delete accounts." />
            </div>
          </div>
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
              <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto_auto_auto] gap-0 border-b border-border bg-secondary/30 px-4 py-2.5">
                {['User', 'Type', 'KYC', 'Role', 'Plan', 'Status', 'Joined', 'Actions'].map(h => (
                  <div key={h} className="text-xs font-semibold text-muted-foreground px-2">{h}</div>
                ))}
              </div>
              <div className="divide-y divide-border">
                {filteredUsers.map(u => (
                  <div key={u.id} className={`grid grid-cols-[1fr_auto_auto_auto_auto_auto_auto_auto] gap-0 px-4 py-3 hover:bg-secondary/20 transition-colors items-center ${u.isBanned ? 'opacity-60 bg-red-50/30' : ''}`}>
                    <div className="flex items-center gap-3 min-w-0 px-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ background: u.isBanned ? '#EF4444' : u.role === 'admin' ? 'oklch(0.45 0.2 270)' : 'oklch(0.35 0.2 270)' }}>
                        {(u.name ?? u.email ?? '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-sm text-foreground truncate flex items-center gap-1">
                          {u.name ?? 'Unnamed'}
                          {u.isBanned && <span className="text-[10px] text-red-600 font-bold">[BANNED]</span>}
                        </div>
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
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        : <Clock className="w-4 h-4 text-muted-foreground opacity-40" />}
                    </div>
                    <div className="px-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold whitespace-nowrap ${
                        u.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-secondary text-muted-foreground'
                      }`}>{u.role}</span>
                    </div>
                    <div className="px-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${
                        u.subscriptionStatus === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-secondary text-muted-foreground'
                      }`}>{u.subscriptionPlan ?? u.subscriptionStatus ?? 'free'}</span>
                    </div>
                    <div className="px-2">
                      {u.isBanned ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold whitespace-nowrap">Banned</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 whitespace-nowrap">Active</span>
                      )}
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
                          if (u.isBanned) {
                            banUserMutation.mutate({ userId: u.id, banned: false });
                          } else {
                            const reason = banReason[u.id] || prompt(`Ban reason for ${u.email} (optional):`);
                            banUserMutation.mutate({ userId: u.id, banned: true, reason: reason ?? undefined });
                          }
                        }}
                        disabled={banUserMutation.isPending}
                        className={`h-7 text-xs whitespace-nowrap ${u.isBanned ? 'text-emerald-600 border-emerald-200 hover:bg-emerald-50' : 'text-orange-600 border-orange-200 hover:bg-orange-50'}`}>
                        {u.isBanned ? <><Unlock className="w-3 h-3" /></> : <><Ban className="w-3 h-3" /></>}
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
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">KYC Review</h3>
            <InfoTip text="KYC (Know Your Customer) profiles are submitted by VCs, angels, lawyers, and startups. Verifying a profile marks it as trusted. Setting it to Public makes it visible in the investor/resource directory." />
          </div>
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
            <div className="flex items-center gap-1.5 flex-1">
              <p className="text-sm text-muted-foreground">
                Self-registration requests from VCs, angels, lawyers, and grant providers.
              </p>
              <InfoTip text="When someone fills in the 'Add yourself to the directory' form, it creates a submission here. Approving it adds them to the public directory. Rejecting sends no notification — you may want to email them separately." />
            </div>
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

      {/* ── Valuations Tab ── */}
      {activeTab === 'valuations' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">All Saved Valuations</h3>
            <InfoTip text="Every valuation that a user has saved. Blended Value is the weighted average across all 7 valuation methods. You can use this data to understand how founders are valuing their startups." />
          </div>
          {valuationsLoading ? (
            <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : (allValuations ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <TrendingUp className="w-10 h-10 text-muted-foreground opacity-30 mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">No valuations saved yet</p>
              <p className="text-xs text-muted-foreground">Users haven't saved any valuations</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-0 border-b border-border bg-secondary/30 px-4 py-2.5">
                {['Label', 'User', 'Blended Value', 'Date', ''].map(h => (
                  <div key={h} className="text-xs font-semibold text-muted-foreground px-2">{h}</div>
                ))}
              </div>
              <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
                {(allValuations ?? []).map(v => (
                  <div key={v.id} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-0 px-4 py-3 hover:bg-secondary/20 transition-colors items-center">
                    <div className="px-2">
                      <div className="text-sm font-medium text-foreground">{v.label}</div>
                    </div>
                    <div className="px-2">
                      <div className="text-xs text-foreground">{v.userName ?? 'Unknown'}</div>
                      <div className="text-[10px] text-muted-foreground">{v.userEmail}</div>
                    </div>
                    <div className="px-2 text-sm font-mono font-semibold text-emerald-600">
                      {v.blendedValue ? `$${(v.blendedValue / 1e6).toFixed(2)}M` : '—'}
                    </div>
                    <div className="px-2 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(v.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                    </div>
                    <div className="px-2 text-xs text-muted-foreground">#{v.id}</div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2.5 border-t border-border bg-secondary/10 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{(allValuations ?? []).length} valuations total</p>
                <button
                  onClick={() => {
                    const csv = ['ID,Label,User,Email,Blended Value,Date',
                      ...(allValuations ?? []).map(v =>
                        `${v.id},"${v.label}","${v.userName ?? ''}","${v.userEmail ?? ''}","${v.blendedValue ?? ''}","${new Date(v.createdAt).toLocaleDateString()}"`
                      )
                    ].join('\n');
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url; a.download = 'valuations.csv'; a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="text-xs text-indigo-600 hover:underline font-medium flex items-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5" /> Export CSV
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Audit Log Tab ── */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">Audit Log</h3>
            <InfoTip text="A chronological record of every admin action taken on the platform — KYC approvals, user role changes, bans, and setting updates. This cannot be edited or deleted." />
          </div>
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
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">Platform Analytics</h3>
            <InfoTip text="High-level metrics about platform usage. For detailed page views and session data, check the Dashboard panel in the Management UI sidebar." />
          </div>
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
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-sm font-semibold text-foreground">User Type Breakdown</h3>
              <InfoTip text="Distribution of user types across all registered accounts." />
            </div>
            <div className="space-y-3">
              {[
                { label: 'VC Firms', value: stats?.vcCount ?? 0, total: stats?.totalUsers ?? 1, color: 'oklch(0.35 0.2 270)' },
                { label: 'Angel Investors', value: stats?.angelCount ?? 0, total: stats?.totalUsers ?? 1, color: 'oklch(0.45 0.2 270)' },
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

      {/* ── Resource Database Tab ── */}
      {activeTab === 'resources' && (
        <div className="space-y-4">
          {/* Edit Modal */}
          {editingResource && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setEditingResource(null)}>
              <div className="bg-card rounded-2xl border border-border shadow-xl p-6 w-full max-w-lg space-y-4" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground">Edit {editingResource.type.replace(/_/g, ' ')}</h3>
                  <button onClick={() => setEditingResource(null)} className="text-muted-foreground hover:text-foreground text-lg leading-none">&times;</button>
                </div>
                <div className="space-y-3">
                  {Object.entries(editDraft).filter(([k]) => !['id','createdAt','updatedAt','userId','isVerified','isPublic'].includes(k)).map(([key, val]) => (
                    <div key={key}>
                      <label className="text-xs font-medium text-muted-foreground capitalize mb-1 block">{key.replace(/([A-Z])/g, ' $1')}</label>
                      {typeof val === 'boolean' ? (
                        <button onClick={() => setEditDraft(d => ({ ...d, [key]: !val }))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                            val ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-secondary text-muted-foreground border-border'
                          }`}>{val ? 'Active' : 'Inactive'}</button>
                      ) : (
                        <Input value={String(val ?? '')} onChange={e => setEditDraft(d => ({ ...d, [key]: e.target.value }))}
                          className="h-8 text-xs" />
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" className="flex-1 text-xs" style={{ background: 'oklch(0.35 0.2 270)' }}
                    disabled={updateVCMutation.isPending || updateAngelMutation.isPending || updateGrantMutation.isPending || updateLawyerMutation.isPending}
                    onClick={() => {
                      const id = editDraft.id as number;
                      if (editingResource.type === 'vc') updateVCMutation.mutate({ id, ...editDraft } as Parameters<typeof updateVCMutation.mutate>[0]);
                      else if (editingResource.type === 'angel') updateAngelMutation.mutate({ id, ...editDraft } as Parameters<typeof updateAngelMutation.mutate>[0]);
                      else if (editingResource.type === 'grant') updateGrantMutation.mutate({ id, ...editDraft } as Parameters<typeof updateGrantMutation.mutate>[0]);
                      else if (editingResource.type === 'lawyer') updateLawyerMutation.mutate({ id, ...editDraft } as Parameters<typeof updateLawyerMutation.mutate>[0]);
                    }}>
                    Save Changes
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs" onClick={() => setEditingResource(null)}>Cancel</Button>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">Resource Database</h3>
              <InfoTip text="All entries in the platform's resource directory: VC firms, angel investors, grants, and venture lawyers. You can edit or permanently delete any entry. Deleted entries cannot be recovered." />
            </div>
            <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={() => refetchResourceDb()}>
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </Button>
          </div>

          {/* Subtabs */}
          <div className="flex gap-1 p-1 rounded-xl bg-secondary/40">
            {([
              { id: 'vcs', label: 'VC Firms', count: resourceDb?.vcs?.length },
              { id: 'angels', label: 'Angel Investors', count: resourceDb?.angels?.length },
              { id: 'grants', label: 'Grants & Programs', count: resourceDb?.grants?.length },
              { id: 'lawyers', label: 'Venture Lawyers', count: resourceDb?.lawyers?.length },
            ] as const).map(sub => (
              <button key={sub.id} onClick={() => setResourceSubTab(sub.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap"
                style={resourceSubTab === sub.id
                  ? { background: 'white', color: 'oklch(0.35 0.2 270)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }
                  : { color: 'oklch(0.5 0.03 240)' }}>
                {sub.label}
                {sub.count != null && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-secondary text-muted-foreground">{sub.count}</span>
                )}
              </button>
            ))}
          </div>

          {resourceDbLoading ? (
            <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : (() => {
            const items = (resourceSubTab === 'vcs' ? resourceDb?.vcs
              : resourceSubTab === 'angels' ? resourceDb?.angels
              : resourceSubTab === 'grants' ? resourceDb?.grants
              : resourceDb?.lawyers) as Record<string, unknown>[] | undefined;

            const colMap: Record<string, string[]> = {
              vcs: ['name', 'hqCity', 'hqCountry', 'website', 'checkSizeMin', 'checkSizeMax', 'isActive'],
              angels: ['name', 'location', 'checkSizeMin', 'checkSizeMax', 'isActive'],
              grants: ['name', 'provider', 'amountMin', 'amountMax', 'isActive'],
              lawyers: ['name', 'firm', 'location', 'isActive'],
            };
            const cols = colMap[resourceSubTab];

            const handleDelete = (id: number) => {
              if (!confirm('Permanently delete this entry? This cannot be undone.')) return;
              if (resourceSubTab === 'vcs') deleteVCMutation.mutate({ id });
              else if (resourceSubTab === 'angels') deleteAngelMutation.mutate({ id });
              else if (resourceSubTab === 'grants') deleteGrantMutation.mutate({ id });
              else if (resourceSubTab === 'lawyers') deleteLawyerMutation.mutate({ id });
            };

            const handleEdit = (item: Record<string, unknown>) => {
              setEditDraft({ ...item });
              setEditingResource({ type: resourceSubTab === 'vcs' ? 'vc' : resourceSubTab === 'angels' ? 'angel' : resourceSubTab === 'grants' ? 'grant' : 'lawyer', item });
            };

            if (!items || items.length === 0) return (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Database className="w-10 h-10 text-muted-foreground opacity-30 mb-3" />
                <p className="text-sm font-medium text-foreground mb-1">No entries yet</p>
                <p className="text-xs text-muted-foreground">Add entries via the resource directory tools</p>
              </div>
            );

            return (
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border bg-secondary/30">
                        <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground">#</th>
                        {cols.map(c => (
                          <th key={c} className="text-left px-4 py-2.5 font-semibold text-muted-foreground capitalize">
                            {c.replace(/([A-Z])/g, ' $1').replace(/([Mm]in|[Mm]ax)/, ' $1')}
                          </th>
                        ))}
                        <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {items.map((item) => (
                        <tr key={item.id as number} className="hover:bg-secondary/20 transition-colors">
                          <td className="px-4 py-3 text-muted-foreground font-mono">#{item.id as number}</td>
                          {cols.map(c => (
                            <td key={c} className="px-4 py-3 max-w-[200px]">
                              {c === 'isActive' ? (
                                <span className={`px-2 py-0.5 rounded-full font-semibold ${
                                  item[c] ? 'bg-emerald-100 text-emerald-700' : 'bg-secondary text-muted-foreground'
                                }`}>{item[c] ? 'Active' : 'Inactive'}</span>
                              ) : c === 'website' && item[c] ? (
                                <a href={item[c] as string} target="_blank" rel="noreferrer"
                                  className="text-indigo-600 hover:underline truncate block max-w-[150px]">
                                  {(item[c] as string).replace(/^https?:\/\//, '')}
                                </a>
                              ) : c.includes('Min') || c.includes('Max') ? (
                                <span className="font-mono">{item[c] != null ? `$${Number(item[c]).toLocaleString()}` : '—'}</span>
                              ) : (
                                <span className="truncate block max-w-[180px]" title={String(item[c] ?? '')}>
                                  {String(item[c] ?? '—')}
                                </span>
                              )}
                            </td>
                          ))}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5 justify-end">
                              <button onClick={() => handleEdit(item)}
                                className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                                title="Edit">
                                <FileText className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleDelete(item.id as number)}
                                className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-muted-foreground hover:text-red-600"
                                title="Delete permanently">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-2.5 border-t border-border bg-secondary/10">
                  <p className="text-xs text-muted-foreground">{items.length} entries in {resourceSubTab === 'vcs' ? 'VC Firms' : resourceSubTab === 'angels' ? 'Angel Investors' : resourceSubTab === 'grants' ? 'Grants & Programs' : 'Venture Lawyers'}</p>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ── Platform Settings Tab ── */}
      {activeTab === 'settings' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">Platform Settings</h3>
              <InfoTip text="Global settings that affect all users on the platform. Changes take effect immediately after saving." />
            </div>
            <Button size="sm" className="gap-1.5 h-8 text-xs"
              style={{ background: 'oklch(0.35 0.2 270)' }}
              disabled={setPlatformSettingsMutation.isPending}
              onClick={savePlatformSettings}>
              {setPlatformSettingsMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save Changes
            </Button>
          </div>

          {/* Announcement Banner */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Megaphone className="w-4 h-4 text-indigo-500" />
              <h4 className="text-sm font-semibold text-foreground">Announcement Banner</h4>
              <InfoTip text="Displays a banner at the top of the platform visible to all users. Use it for maintenance notices, new feature announcements, or important updates." />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-foreground">Active</label>
                  <InfoTip text="Toggle to show or hide the announcement banner. The text is saved even when inactive." />
                </div>
                <button
                  onClick={() => updateDraft('announcementActive', !(settingsDraft.announcementActive ?? platformSettings?.announcementActive))}
                  className={`relative w-10 h-5 rounded-full transition-colors ${settingsDraft.announcementActive ?? platformSettings?.announcementActive ? 'bg-indigo-500' : 'bg-secondary'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${settingsDraft.announcementActive ?? platformSettings?.announcementActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <label className="text-xs font-medium text-foreground">Banner Text</label>
                  <InfoTip text="The message shown in the announcement banner. Keep it concise — under 120 characters works best." />
                </div>
                <Input
                  value={(settingsDraft.announcementText as string) ?? platformSettings?.announcementText ?? ''}
                  onChange={e => updateDraft('announcementText', e.target.value)}
                  placeholder="e.g. We're launching a new feature next week! Stay tuned."
                  className="text-sm"
                  maxLength={500}
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <label className="text-xs font-medium text-foreground">Banner Type</label>
                  <InfoTip text="Controls the color of the banner. Info = blue, Warning = amber, Success = green, Error = red." />
                </div>
                <div className="flex gap-2">
                  {(['info', 'warning', 'success', 'error'] as const).map(t => (
                    <button key={t}
                      onClick={() => updateDraft('announcementType', t)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all border ${
                        (settingsDraft.announcementType ?? platformSettings?.announcementType) === t
                          ? t === 'info' ? 'bg-blue-100 text-blue-700 border-blue-300'
                            : t === 'warning' ? 'bg-amber-100 text-amber-700 border-amber-300'
                            : t === 'success' ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                            : 'bg-red-100 text-red-700 border-red-300'
                          : 'border-border text-muted-foreground hover:bg-secondary/50'
                      }`}>{t}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Access Control */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Lock className="w-4 h-4 text-red-500" />
              <h4 className="text-sm font-semibold text-foreground">Access Control</h4>
              <InfoTip text="Control who can access the platform and how." />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-foreground">Allow New Registrations</span>
                    <InfoTip text="When disabled, new users cannot create accounts. Existing users can still log in. Use this to run a closed beta or pause growth temporarily." />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Allow new users to register on the platform</p>
                </div>
                <button
                  onClick={() => updateDraft('allowNewRegistrations', !(settingsDraft.allowNewRegistrations ?? platformSettings?.allowNewRegistrations ?? true))}
                  className={`relative w-10 h-5 rounded-full transition-colors ${settingsDraft.allowNewRegistrations ?? platformSettings?.allowNewRegistrations ?? true ? 'bg-emerald-500' : 'bg-secondary'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${settingsDraft.allowNewRegistrations ?? platformSettings?.allowNewRegistrations ?? true ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-foreground">Maintenance Mode</span>
                    <InfoTip text="When enabled, all non-admin users will see a maintenance page instead of the platform. Admins can still access everything normally." />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Show maintenance page to all non-admin users</p>
                </div>
                <button
                  onClick={() => updateDraft('maintenanceMode', !(settingsDraft.maintenanceMode ?? platformSettings?.maintenanceMode))}
                  className={`relative w-10 h-5 rounded-full transition-colors ${settingsDraft.maintenanceMode ?? platformSettings?.maintenanceMode ? 'bg-red-500' : 'bg-secondary'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${settingsDraft.maintenanceMode ?? platformSettings?.maintenanceMode ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>

              {(settingsDraft.maintenanceMode ?? platformSettings?.maintenanceMode) && (
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <label className="text-xs font-medium text-foreground">Maintenance Message</label>
                    <InfoTip text="The message shown to users during maintenance. Be specific about expected downtime if known." />
                  </div>
                  <Input
                    value={(settingsDraft.maintenanceMessage as string) ?? platformSettings?.maintenanceMessage ?? ''}
                    onChange={e => updateDraft('maintenanceMessage', e.target.value)}
                    placeholder="e.g. We're upgrading our systems. Back in 2 hours."
                    className="text-sm"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Settings Info */}
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 flex gap-3">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-700 leading-relaxed">
              <strong>Note: </strong>Settings are saved to the database and take effect immediately. To manage individual resource entries (VCs, angels, grants, lawyers), use the <strong>Database</strong> panel in the Management UI sidebar.
              {platformSettings?.updatedAt && (
                <span className="block mt-1 text-blue-600">Last updated: {new Date(platformSettings.updatedAt).toLocaleString()}</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
