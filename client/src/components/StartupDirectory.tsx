/**
 * Startup Directory
 * Public-facing directory of verified startups on the platform
 */

import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { trpc } from '@/lib/trpc';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Search, MapPin, ExternalLink, Linkedin, Twitter, Users, DollarSign } from 'lucide-react';
import { SECTORS, STARTUP_STAGES, COUNTRIES } from '@shared/dropdowns';

const STAGE_COLORS: Record<string, string> = {
  'idea': 'bg-gray-100 text-gray-700 border-gray-200',
  'pre-seed': 'bg-purple-100 text-purple-700 border-purple-200',
  'seed': 'bg-blue-100 text-blue-700 border-blue-200',
  'series-a': 'bg-green-100 text-green-700 border-green-200',
  'series-b': 'bg-amber-100 text-amber-700 border-amber-200',
  'growth': 'bg-orange-100 text-orange-700 border-orange-200',
};

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function getAvatarColor(name: string): string {
  const colors = [
    'oklch(0.45 0.12 30)',
    'oklch(0.35 0.08 240)',
    'oklch(0.40 0.10 160)',
    'oklch(0.38 0.10 280)',
    'oklch(0.42 0.12 50)',
  ];
  return colors[name.charCodeAt(0) % colors.length];
}

export default function StartupDirectory() {
  const { isRTL } = useLanguage();
  const [search, setSearch] = useState('');
  const [filterSector, setFilterSector] = useState('all');
  const [filterStage, setFilterStage] = useState('all');
  const [filterCountry, setFilterCountry] = useState('all');

  const { data: startups, isLoading } = trpc.resources.getPublicStartups.useQuery();

  const filtered = useMemo(() => {
    if (!startups) return [];
    return startups.filter(s => {
      const matchSearch = !search ||
        s.companyName.toLowerCase().includes(search.toLowerCase()) ||
        (s.tagline || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.description || '').toLowerCase().includes(search.toLowerCase());
      const matchSector = filterSector === 'all' || s.sector === filterSector;
      const matchStage = filterStage === 'all' || s.stage === filterStage;
      const matchCountry = filterCountry === 'all' || s.country === filterCountry;
      return matchSearch && matchSector && matchStage && matchCountry;
    });
  }, [startups, search, filterSector, filterStage, filterCountry]);

  const clearFilters = () => {
    setSearch('');
    setFilterSector('all');
    setFilterStage('all');
    setFilterCountry('all');
  };

  const hasFilters = search || filterSector !== 'all' || filterStage !== 'all' || filterCountry !== 'all';

  return (
    <div className="max-w-6xl mx-auto space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'oklch(0.35 0.2 270)' }}>
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Startup Directory
          </h1>
          {startups && (
            <Badge variant="secondary" className="text-xs">{startups.length} startups</Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Discover MENA startups building on Polaris Arabia — searchable by sector, stage, and country.
        </p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search startups by name, tagline, or description…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterSector} onValueChange={setFilterSector}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="All sectors" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sectors</SelectItem>
            {SECTORS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStage} onValueChange={setFilterStage}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="All stages" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {STARTUP_STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterCountry} onValueChange={setFilterCountry}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="All countries" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Countries</SelectItem>
            {COUNTRIES.map((c: string) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Results Count */}
      {!isLoading && (
        <div className="text-sm text-muted-foreground">
          Showing {filtered.length} startup{filtered.length !== 1 ? 's' : ''}
          {hasFilters ? ' matching your filters' : ''}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-16">
          <Building2 className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
          <p className="text-sm text-muted-foreground">
            {hasFilters
              ? 'No startups match your filters. Try adjusting your search.'
              : 'No startups in the directory yet. Be the first to add yours via the KYC onboarding!'}
          </p>
        </div>
      )}

      {/* Startup Cards */}
      {!isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(startup => (
            <Card key={startup.id} className="hover:shadow-md transition-shadow group">
              <CardContent className="p-5">
                {/* Logo / Avatar + Name */}
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={{ background: getAvatarColor(startup.companyName) }}
                  >
                    {getInitials(startup.companyName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground text-sm truncate">{startup.companyName}</div>
                    {startup.tagline && (
                      <div className="text-xs text-muted-foreground line-clamp-1">{startup.tagline}</div>
                    )}
                  </div>
                  {startup.isVerified && (
                    <Badge variant="outline" className="text-[10px] text-green-700 border-green-300 bg-green-50 shrink-0">
                      Verified
                    </Badge>
                  )}
                </div>

                {/* Description */}
                {startup.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{startup.description}</p>
                )}

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {startup.stage && (
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${STAGE_COLORS[startup.stage] || 'bg-gray-100 text-gray-700'}`}>
                      {startup.stage}
                    </span>
                  )}
                  {startup.sector && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                      {startup.sector}
                    </span>
                  )}
                </div>

                {/* Meta */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                  {startup.country && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{startup.city ? `${startup.city}, ` : ''}{startup.country}</span>
                    </div>
                  )}
                  {startup.teamSize && (
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{startup.teamSize} people</span>
                    </div>
                  )}
                  {startup.targetRaise && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      <span>Raising {startup.targetRaise >= 1_000_000 ? `$${(startup.targetRaise / 1_000_000).toFixed(1)}M` : `$${(startup.targetRaise / 1_000).toFixed(0)}K`}</span>
                    </div>
                  )}
                </div>

                {/* Links */}
                <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                  {startup.website && (
                    <a
                      href={startup.website.startsWith('http') ? startup.website : `https://${startup.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" /> Website
                    </a>
                  )}
                  {startup.linkedinUrl && (
                    <a
                      href={startup.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Linkedin className="w-3 h-3" /> LinkedIn
                    </a>
                  )}
                  {startup.twitterUrl && (
                    <a
                      href={startup.twitterUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Twitter className="w-3 h-3" /> Twitter
                    </a>
                  )}
                  {!startup.website && !startup.linkedinUrl && !startup.twitterUrl && (
                    <span className="text-xs text-muted-foreground italic">No links provided</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
