/**
 * DataRoomShare — Public viewer page for shared data rooms.
 * Renders only the sections the founder enabled when generating the share link.
 * Sections: Documents & Files, Company Overview, Financials, Team, Key Metrics, Contact Info.
 */
import { useState, useCallback } from 'react';
import { trpc } from '@/lib/trpc';
import { useRoute } from 'wouter';
import {
  FileText, FileImage, FileVideo, File, Download,
  ExternalLink, Building2, Users, TrendingUp, DollarSign,
  Mail, Phone, Globe, Loader2, Lock, AlertCircle,
  ChevronDown, ChevronRight, Eye, BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ── Types ──────────────────────────────────────────────────────────────────
interface SharedFile {
  id: number;
  name: string;
  fileUrl: string;
  mimeType: string;
  sizeBytes: number;
  folder: string;
}

interface TeamMember {
  id: number;
  name: string;
  role: string;
  bio: string | null;
  linkedinUrl: string | null;
  avatarUrl: string | null;
}

interface StartupProfile {
  companyName: string | null;
  tagline: string | null;
  industry: string | null;
  stage: string | null;
  foundedYear: number | null;
  teamSize: number | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  city: string | null;
  monthlyRevenue: number | null;
  annualRevenue: number | null;
  monthlyBurn: number | null;
  runway: number | null;
  totalFunding: number | null;
  valuation: number | null;
  mau: number | null;
  dau: number | null;
  nps: number | null;
  churnRate: number | null;
  ltv: number | null;
  cac: number | null;
  description: string | null;
}

interface VisibleSections {
  files: boolean;
  companyOverview: boolean;
  financials: boolean;
  team: boolean;
  metrics: boolean;
  contactInfo: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function formatBytes(bytes: number): string {
  if (!bytes) return '';
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

function formatNum(n: number | null | undefined, prefix = ''): string {
  if (n == null) return '—';
  if (n >= 1_000_000) return `${prefix}${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${prefix}${(n / 1_000).toFixed(1)}K`;
  return `${prefix}${n}`;
}

function getFileIconComponent(mimeType: string) {
  if (mimeType?.startsWith('image/')) return FileImage;
  if (mimeType?.startsWith('video/')) return FileVideo;
  if (mimeType?.includes('pdf') || mimeType?.includes('document') || mimeType?.includes('text')) return FileText;
  return File;
}

function getFileEmoji(mime: string | null): string {
  if (!mime) return '📄';
  if (mime.includes('pdf')) return '📕';
  if (mime.includes('image')) return '🖼️';
  if (mime.includes('spreadsheet') || mime.includes('excel') || mime.includes('csv')) return '📊';
  if (mime.includes('presentation') || mime.includes('powerpoint')) return '📊';
  if (mime.includes('word') || mime.includes('document')) return '📝';
  if (mime.includes('zip') || mime.includes('archive')) return '📦';
  return '📄';
}

// ── Email Gate ─────────────────────────────────────────────────────────────
function EmailGate({ onSubmit }: { onSubmit: (email: string, name: string) => void }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4">
      <Card className="w-full max-w-sm shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-lg">Access Required</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Enter your details to view this data room</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Your Name</Label>
            <Input placeholder="Jane Smith" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Email Address *</Label>
            <Input
              type="email"
              placeholder="jane@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && email.includes('@') && onSubmit(email, name)}
            />
          </div>
          <Button
            className="w-full"
            disabled={!email.includes('@')}
            onClick={() => onSubmit(email, name)}
          >
            View Data Room
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Files Section ──────────────────────────────────────────────────────────
function FilesSection({ files, token, viewerEmail, viewerName }: {
  files: SharedFile[];
  token: string;
  viewerEmail?: string;
  viewerName?: string;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['General']));
  const trackView = trpc.dataRoom.trackFileView.useMutation();

  const byFolder = files.reduce<Record<string, SharedFile[]>>((acc, f) => {
    const folder = f.folder || 'General';
    if (!acc[folder]) acc[folder] = [];
    acc[folder].push(f);
    return acc;
  }, {});

  const toggleFolder = (folder: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(folder)) next.delete(folder);
      else next.add(folder);
      return next;
    });
  };

  const handleOpen = useCallback((file: SharedFile) => {
    trackView.mutate({ token, fileId: file.id, viewerEmail, viewerName });
    window.open(file.fileUrl, '_blank');
  }, [token, viewerEmail, viewerName, trackView]);

  if (files.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="text-sm">No files in this data room yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {Object.entries(byFolder).map(([folder, folderFiles]) => (
        <div key={folder} className="rounded-xl border border-border overflow-hidden">
          <button
            className="w-full flex items-center gap-3 px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
            onClick={() => toggleFolder(folder)}
          >
            {expanded.has(folder)
              ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
              : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
            <span className="text-sm font-semibold">{folder}</span>
            <Badge variant="secondary" className="ml-auto text-[10px]">{folderFiles.length}</Badge>
          </button>
          {expanded.has(folder) && (
            <div className="divide-y divide-border">
              {folderFiles.map(file => {
                const Icon = getFileIconComponent(file.mimeType);
                return (
                  <div
                    key={file.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors group cursor-pointer"
                    onClick={() => handleOpen(file)}
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-[11px] text-muted-foreground">{formatBytes(file.sizeBytes)}</p>
                    </div>
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" variant="ghost" className="h-7 px-2" onClick={e => { e.stopPropagation(); handleOpen(file); }}>
                        <Eye className="w-3.5 h-3.5 mr-1" /> View
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 px-2" asChild onClick={e => e.stopPropagation()}>
                        <a href={file.fileUrl} download={file.name} target="_blank" rel="noreferrer">
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Company Section ────────────────────────────────────────────────────────
function CompanySection({ profile }: { profile: StartupProfile }) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shrink-0">
          <Building2 className="w-7 h-7 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold">{profile.companyName ?? 'Startup'}</h3>
          {profile.tagline && <p className="text-muted-foreground text-sm mt-0.5">{profile.tagline}</p>}
          <div className="flex flex-wrap gap-2 mt-2">
            {profile.industry && <Badge variant="secondary">{profile.industry}</Badge>}
            {profile.stage && <Badge variant="outline">{profile.stage}</Badge>}
            {(profile.country || profile.city) && (
              <Badge variant="outline">📍 {profile.city ? `${profile.city}, ` : ''}{profile.country}</Badge>
            )}
          </div>
        </div>
      </div>
      {profile.description && (
        <p className="text-sm text-muted-foreground leading-relaxed">{profile.description}</p>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {profile.foundedYear && (
          <div className="p-3 rounded-xl bg-muted/30 border border-border">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Founded</p>
            <p className="text-sm font-bold mt-0.5">{profile.foundedYear}</p>
          </div>
        )}
        {profile.teamSize && (
          <div className="p-3 rounded-xl bg-muted/30 border border-border">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Team Size</p>
            <p className="text-sm font-bold mt-0.5">{profile.teamSize} people</p>
          </div>
        )}
        {profile.website && (
          <div className="p-3 rounded-xl bg-muted/30 border border-border">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Website</p>
            <a href={profile.website} target="_blank" rel="noreferrer" className="text-sm font-bold mt-0.5 text-primary hover:underline truncate block">
              {profile.website.replace(/^https?:\/\//, '')}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Financials Section ─────────────────────────────────────────────────────
function FinancialsSection({ profile }: { profile: StartupProfile }) {
  const items = [
    { label: 'Annual Revenue (ARR)', value: formatNum(profile.annualRevenue, '$'), icon: TrendingUp },
    { label: 'Monthly Revenue (MRR)', value: formatNum(profile.monthlyRevenue, '$'), icon: DollarSign },
    { label: 'Monthly Burn', value: formatNum(profile.monthlyBurn, '$'), icon: DollarSign },
    { label: 'Runway', value: profile.runway ? `${profile.runway} months` : '—', icon: TrendingUp },
    { label: 'Total Funding', value: formatNum(profile.totalFunding, '$'), icon: DollarSign },
    { label: 'Valuation', value: formatNum(profile.valuation, '$'), icon: TrendingUp },
  ].filter(i => i.value !== '—');

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Financial data not available.</p>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {items.map(({ label, value, icon: Icon }) => (
        <div key={label} className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
          <div className="flex items-center gap-1.5 mb-1">
            <Icon className="w-3.5 h-3.5 text-primary" />
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
          </div>
          <p className="text-lg font-bold text-foreground">{value}</p>
        </div>
      ))}
    </div>
  );
}

// ── Metrics Section ────────────────────────────────────────────────────────
function MetricsSection({ profile }: { profile: StartupProfile }) {
  const items = [
    { label: 'MAU', value: formatNum(profile.mau) },
    { label: 'DAU', value: formatNum(profile.dau) },
    { label: 'NPS', value: profile.nps != null ? String(profile.nps) : '—' },
    { label: 'Churn Rate', value: profile.churnRate != null ? `${profile.churnRate}%` : '—' },
    { label: 'LTV', value: formatNum(profile.ltv, '$') },
    { label: 'CAC', value: formatNum(profile.cac, '$') },
  ].filter(i => i.value !== '—');

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Metrics not available.</p>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {items.map(({ label, value }) => (
        <div key={label} className="p-4 rounded-xl bg-muted/30 border border-border text-center">
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  );
}

// ── Team Section ───────────────────────────────────────────────────────────
function TeamSection({ team }: { team: TeamMember[] }) {
  if (team.length === 0) {
    return <p className="text-sm text-muted-foreground">Team information not available.</p>;
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {team.map(member => (
        <div key={member.id} className="flex items-start gap-3 p-4 rounded-xl border border-border bg-muted/20">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shrink-0 text-white font-bold text-sm overflow-hidden">
            {member.avatarUrl
              ? <img src={member.avatarUrl} alt={member.name} className="w-10 h-10 rounded-full object-cover" />
              : member.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">{member.name}</p>
              {member.linkedinUrl && (
                <a href={member.linkedinUrl} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <p className="text-xs text-primary font-medium">{member.role}</p>
            {member.bio && <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{member.bio}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Contact Section ────────────────────────────────────────────────────────
function ContactSection({ profile }: { profile: StartupProfile }) {
  const items = [
    { icon: Mail, label: 'Email', value: profile.email, href: profile.email ? `mailto:${profile.email}` : null },
    { icon: Phone, label: 'Phone', value: profile.phone, href: profile.phone ? `tel:${profile.phone}` : null },
    { icon: Globe, label: 'Website', value: profile.website, href: profile.website },
  ].filter(i => i.value);

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Contact information not available.</p>;
  }

  return (
    <div className="space-y-3">
      {items.map(({ icon: Icon, label, value, href }) => (
        <div key={label} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
            {href
              ? <a href={href} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary hover:underline">{value}</a>
              : <p className="text-sm font-medium">{value}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function DataRoomShare() {
  const [, params] = useRoute('/data-room/:token');
  const token = params?.token ?? '';

  const [viewerEmail, setViewerEmail] = useState<string | undefined>(undefined);
  const [viewerName, setViewerName] = useState<string | undefined>(undefined);
  const [activeSection, setActiveSection] = useState<string>('');

  const { data, isLoading, error } = trpc.dataRoom.getSharedRoom.useQuery(
    { token, viewerEmail, viewerName },
    { enabled: !!token, retry: false }
  );

  // Email gate — show before loading content
  if (!isLoading && data?.requireEmail && !viewerEmail) {
    return (
      <EmailGate
        onSubmit={(email, name) => {
          setViewerEmail(email);
          setViewerName(name || undefined);
        }}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading data room…</p>
        </div>
      </div>
    );
  }

  if (error || !data?.room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-bold mb-2">Data Room Not Found</h2>
          <p className="text-sm text-muted-foreground">
            {error?.message?.includes('expired')
              ? 'This share link has expired. Please request a new one from the sender.'
              : 'This data room link is invalid or has been revoked.'}
          </p>
        </div>
      </div>
    );
  }

  // Parse data from server response
  const room = data.room as { id: number; name: string; description: string | null; shareTitle?: string | null; shareMessage?: string | null };
  const sections = (data.sections ?? { files: true, companyOverview: false, financials: false, team: false, metrics: false, contactInfo: false }) as VisibleSections;
  const files = (data.files ?? []) as SharedFile[];
  const profile = (data.profile ?? null) as StartupProfile | null;
  const team = (data.team ?? []) as TeamMember[];

  // Build navigation from enabled sections
  const navItems = [
    { key: 'files', label: 'Documents', icon: FileText, enabled: sections.files },
    { key: 'companyOverview', label: 'Company', icon: Building2, enabled: sections.companyOverview && !!profile },
    { key: 'financials', label: 'Financials', icon: DollarSign, enabled: sections.financials && !!profile },
    { key: 'team', label: 'Team', icon: Users, enabled: sections.team },
    { key: 'metrics', label: 'Metrics', icon: BarChart3, enabled: sections.metrics && !!profile },
    { key: 'contactInfo', label: 'Contact', icon: Mail, enabled: sections.contactInfo && !!profile },
  ].filter(i => i.enabled);

  const currentSection = activeSection || (navItems[0]?.key ?? 'files');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold leading-tight">
                {room.shareTitle ?? room.name}
              </h1>
              {room.description && (
                <p className="text-[10px] text-muted-foreground leading-tight">{room.description}</p>
              )}
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] gap-1">
            <Lock className="w-2.5 h-2.5" /> Confidential
          </Badge>
        </div>

        {/* Tab navigation */}
        {navItems.length > 1 && (
          <div className="max-w-5xl mx-auto px-4 flex gap-0 overflow-x-auto border-t border-border/50">
            {navItems.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveSection(key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                  currentSection === key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Welcome message */}
      {room.shareMessage && (
        <div className="max-w-5xl mx-auto px-4 pt-6">
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-sm text-foreground/80 leading-relaxed">
            {room.shareMessage}
          </div>
        </div>
      )}

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {currentSection === 'files' && (
          <section>
            <h2 className="text-base font-bold mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> Documents & Files
            </h2>
            <FilesSection files={files} token={token} viewerEmail={viewerEmail} viewerName={viewerName} />
          </section>
        )}

        {currentSection === 'companyOverview' && profile && (
          <section>
            <h2 className="text-base font-bold mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" /> Company Overview
            </h2>
            <CompanySection profile={profile} />
          </section>
        )}

        {currentSection === 'financials' && profile && (
          <section>
            <h2 className="text-base font-bold mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" /> Financials
            </h2>
            <FinancialsSection profile={profile} />
          </section>
        )}

        {currentSection === 'team' && (
          <section>
            <h2 className="text-base font-bold mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" /> Team
            </h2>
            <TeamSection team={team} />
          </section>
        )}

        {currentSection === 'metrics' && profile && (
          <section>
            <h2 className="text-base font-bold mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" /> Key Metrics
            </h2>
            <MetricsSection profile={profile} />
          </section>
        )}

        {currentSection === 'contactInfo' && profile && (
          <section>
            <h2 className="text-base font-bold mb-4 flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" /> Contact Information
            </h2>
            <ContactSection profile={profile} />
          </section>
        )}

        {navItems.length === 0 && (
          <div className="text-center py-16">
            <Lock className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">No content has been shared in this data room.</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12 py-6">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-[11px] text-muted-foreground">
            This data room is confidential and intended solely for the recipient.{' '}
            Powered by <a href="/" className="text-primary hover:underline">Polaris Arabia</a>.
          </p>
        </div>
      </footer>
    </div>
  );
}
