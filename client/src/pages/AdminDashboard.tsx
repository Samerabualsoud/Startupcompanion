import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation } from 'wouter';
import {
  Shield, CheckCircle2, XCircle, Eye, EyeOff, Users, Building2,
  Briefcase, Rocket, Loader2, AlertCircle, RefreshCw, ChevronDown,
  ExternalLink, Globe
} from 'lucide-react';

type TabId = 'vcs' | 'angels' | 'lawyers' | 'startups' | 'users';

interface KycEntry {
  id: number;
  userId: number;
  isVerified: boolean | null;
  isPublic: boolean | null;
  createdAt: Date | null;
  [key: string]: unknown;
}

function StatusBadge({ verified, isPublic }: { verified: boolean | null; isPublic: boolean | null }) {
  if (verified) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: 'oklch(0.94 0.06 145)', color: 'oklch(0.35 0.15 145)' }}>
        <CheckCircle2 className="w-3 h-3" /> Verified
      </span>
    );
  }
  if (verified === false) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: 'oklch(0.97 0.03 30)', color: 'oklch(0.45 0.12 30)' }}>
        <XCircle className="w-3 h-3" /> Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: 'oklch(0.94 0.04 80)', color: 'oklch(0.45 0.1 80)' }}>
      Pending
    </span>
  );
}

function EntryRow({
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

  return (
    <div className="border border-border rounded-xl overflow-hidden mb-3">
      <div className="flex items-center gap-3 p-4 bg-card">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-foreground truncate">{name}</span>
            <StatusBadge verified={entry.isVerified} isPublic={entry.isPublic} />
            {entry.isPublic && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: 'oklch(0.92 0.04 220)', color: 'oklch(0.4 0.1 220)' }}>
                <Globe className="w-3 h-3" /> Public
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{subtitle}</p>}
          <p className="text-[10px] text-muted-foreground mt-0.5">
            User ID: {entry.userId} · Submitted: {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : 'N/A'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {website && (
            <a href={website} target="_blank" rel="noopener noreferrer"
              className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          <button
            onClick={() => setExpanded(v => !v)}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
          <button
            onClick={() => onTogglePublic(entry.id, !entry.isPublic)}
            disabled={isUpdating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80 disabled:opacity-50"
            style={entry.isPublic
              ? { background: 'oklch(0.94 0.04 220)', color: 'oklch(0.4 0.1 220)' }
              : { background: 'oklch(0.92 0.02 240)', color: 'oklch(0.4 0.04 240)' }
            }
            title={entry.isPublic ? 'Hide from public database' : 'Show in public database'}
          >
            {entry.isPublic ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            {entry.isPublic ? 'Hide' : 'Show'}
          </button>
          <button
            onClick={() => onVerify(entry.id, true)}
            disabled={isUpdating || entry.isVerified === true}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40"
            style={{ background: 'oklch(0.5 0.15 145)' }}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Verify
          </button>
          <button
            onClick={() => onVerify(entry.id, false)}
            disabled={isUpdating || entry.isVerified === false}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40"
            style={{ background: 'oklch(0.55 0.15 30)' }}
          >
            <XCircle className="w-3.5 h-3.5" />
            Reject
          </button>
        </div>
      </div>

      {expanded && (
        <div className="p-4 border-t border-border bg-secondary/20">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            {Object.entries(entry)
              .filter(([k]) => !['id', 'userId', 'isVerified', 'isPublic', 'createdAt', 'updatedAt'].includes(k))
              .map(([k, v]) => {
                if (v === null || v === undefined || v === '') return null;
                const display = Array.isArray(v) ? (v as string[]).join(', ') : String(v);
                return (
                  <div key={k}>
                    <div className="text-muted-foreground capitalize mb-0.5">{k.replace(/([A-Z])/g, ' $1').trim()}</div>
                    <div className="text-foreground font-medium truncate">{display}</div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<TabId>('vcs');

  const { data: submissions, isLoading, refetch } = trpc.admin.getKycSubmissions.useQuery(undefined, {
    enabled: user?.role === 'admin',
  });

  const { data: users, isLoading: usersLoading } = trpc.admin.getUsers.useQuery(
    { limit: 50, offset: 0 },
    { enabled: user?.role === 'admin' && activeTab === 'users' }
  );

  const utils = trpc.useUtils();

  const verifyMutation = trpc.admin.verifyKyc.useMutation({
    onSuccess: () => utils.admin.getKycSubmissions.invalidate(),
  });

  const togglePublicMutation = trpc.admin.setPublicStatus.useMutation({
    onSuccess: () => utils.admin.getKycSubmissions.invalidate(),
  });

  const setRoleMutation = trpc.admin.setUserRole.useMutation({
    onSuccess: () => utils.admin.getUsers.invalidate(),
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Shield className="w-12 h-12 mb-4 text-muted-foreground opacity-40" />
        <h2 className="text-lg font-bold mb-2">Admin Access Required</h2>
        <p className="text-sm text-muted-foreground">You do not have permission to view this page.</p>
      </div>
    );
  }

  const tabs: { id: TabId; label: string; icon: React.ElementType; count?: number }[] = [
    { id: 'vcs', label: 'VC Firms', icon: Building2, count: submissions?.vcs.length },
    { id: 'angels', label: 'Angels', icon: Users, count: submissions?.angels.length },
    { id: 'lawyers', label: 'Lawyers', icon: Briefcase, count: submissions?.lawyers.length },
    { id: 'startups', label: 'Startups', icon: Rocket, count: submissions?.startups.length },
    { id: 'users', label: 'All Users', icon: Shield },
  ];

  const pendingCount = (submissions?.vcs.filter(e => e.isVerified === null).length ?? 0)
    + (submissions?.angels.filter(e => e.isVerified === null).length ?? 0)
    + (submissions?.lawyers.filter(e => e.isVerified === null).length ?? 0)
    + (submissions?.startups.filter(e => e.isVerified === null).length ?? 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'oklch(0.18 0.05 240)' }}>
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: 'Playfair Display, serif' }}>
              Admin Dashboard
            </h2>
            <p className="text-xs text-muted-foreground">
              Review and verify community KYC submissions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: 'oklch(0.94 0.06 80)', color: 'oklch(0.45 0.12 80)' }}>
              <AlertCircle className="w-3.5 h-3.5" />
              {pendingCount} pending review
            </div>
          )}
          <button
            onClick={() => refetch()}
            className="p-2 rounded-xl hover:bg-secondary transition-colors text-muted-foreground"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'VC Submissions', value: submissions?.vcs.length ?? 0, icon: Building2, color: 'oklch(0.18 0.05 240)' },
          { label: 'Angel Submissions', value: submissions?.angels.length ?? 0, icon: Users, color: 'oklch(0.55 0.13 30)' },
          { label: 'Lawyer Submissions', value: submissions?.lawyers.length ?? 0, icon: Briefcase, color: 'oklch(0.4 0.1 280)' },
          { label: 'Startup Submissions', value: submissions?.startups.length ?? 0, icon: Rocket, color: 'oklch(0.5 0.15 145)' },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: stat.color }}>
                  <Icon className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-secondary/50 w-fit">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
              style={activeTab === tab.id
                ? { background: 'white', color: 'oklch(0.18 0.05 240)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }
                : { color: 'oklch(0.5 0.03 240)' }
              }
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'oklch(0.18 0.05 240)', color: 'white' }}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {activeTab === 'vcs' && (
            <div>
              {(submissions?.vcs ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No VC submissions yet.</p>
              ) : (
                (submissions?.vcs ?? []).map(entry => (
                  <EntryRow
                    key={entry.id}
                    entry={entry as KycEntry}
                    type="vc"
                    isUpdating={verifyMutation.isPending || togglePublicMutation.isPending}
                    onVerify={(id, verified) => verifyMutation.mutate({ type: 'vc', id, verified })}
                    onTogglePublic={(id, isPublic) => togglePublicMutation.mutate({ type: 'vc', id, isPublic })}
                  />
                ))
              )}
            </div>
          )}

          {activeTab === 'angels' && (
            <div>
              {(submissions?.angels ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No angel submissions yet.</p>
              ) : (
                (submissions?.angels ?? []).map(entry => (
                  <EntryRow
                    key={entry.id}
                    entry={entry as KycEntry}
                    type="angel"
                    isUpdating={verifyMutation.isPending || togglePublicMutation.isPending}
                    onVerify={(id, verified) => verifyMutation.mutate({ type: 'angel', id, verified })}
                    onTogglePublic={(id, isPublic) => togglePublicMutation.mutate({ type: 'angel', id, isPublic })}
                  />
                ))
              )}
            </div>
          )}

          {activeTab === 'lawyers' && (
            <div>
              {(submissions?.lawyers ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No lawyer submissions yet.</p>
              ) : (
                (submissions?.lawyers ?? []).map(entry => (
                  <EntryRow
                    key={entry.id}
                    entry={entry as KycEntry}
                    type="lawyer"
                    isUpdating={verifyMutation.isPending || togglePublicMutation.isPending}
                    onVerify={(id, verified) => verifyMutation.mutate({ type: 'lawyer', id, verified })}
                    onTogglePublic={(id, isPublic) => togglePublicMutation.mutate({ type: 'lawyer', id, isPublic })}
                  />
                ))
              )}
            </div>
          )}

          {activeTab === 'startups' && (
            <div>
              {(submissions?.startups ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No startup submissions yet.</p>
              ) : (
                (submissions?.startups ?? []).map(entry => (
                  <EntryRow
                    key={entry.id}
                    entry={entry as KycEntry}
                    type="startup"
                    isUpdating={verifyMutation.isPending || togglePublicMutation.isPending}
                    onVerify={(id, verified) => verifyMutation.mutate({ type: 'startup', id, verified })}
                    onTogglePublic={(id, isPublic) => togglePublicMutation.mutate({ type: 'startup', id, isPublic })}
                  />
                ))
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              {usersLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="rounded-xl border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-secondary/30">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">User</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Type</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">KYC</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Role</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Joined</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(users ?? []).map(u => (
                        <tr key={u.id} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-medium text-foreground">{u.name ?? 'Unnamed'}</div>
                            <div className="text-xs text-muted-foreground">{u.email}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground capitalize">
                              {u.userType ?? 'unknown'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {u.kycCompleted ? (
                              <CheckCircle2 className="w-4 h-4" style={{ color: 'oklch(0.5 0.15 145)' }} />
                            ) : (
                              <XCircle className="w-4 h-4 text-muted-foreground opacity-40" />
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${u.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-secondary text-muted-foreground'}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => setRoleMutation.mutate({ userId: u.id, role: u.role === 'admin' ? 'user' : 'admin' })}
                              disabled={setRoleMutation.isPending}
                              className="text-xs px-2.5 py-1 rounded-lg font-medium transition-all hover:opacity-80 disabled:opacity-50"
                              style={u.role === 'admin'
                                ? { background: 'oklch(0.97 0.03 30)', color: 'oklch(0.45 0.12 30)' }
                                : { background: 'oklch(0.94 0.04 80)', color: 'oklch(0.4 0.1 80)' }
                              }
                            >
                              {u.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
