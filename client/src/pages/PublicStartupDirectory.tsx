import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Loader2, Search, TrendingUp, DollarSign, ArrowLeft, Bookmark, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function PublicStartupDirectory() {
  const [, navigate] = useLocation();
  const [page, setPage] = useState(1);
  const [sector, setSector] = useState<string>("");
  const [stage, setStage] = useState<string>("");
  const [country, setCountry] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());

  const { mutate: saveProfile } = trpc.watchlist.saveProfile.useMutation({
    onSuccess: (_, { startupProfileId }) => {
      setSavedIds(prev => new Set(prev).add(startupProfileId));
    },
  });

  const { mutate: unsaveProfile } = trpc.watchlist.unsaveProfile.useMutation({
    onSuccess: (_, { startupProfileId }) => {
      setSavedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(startupProfileId);
        return newSet;
      });
    },
  });

  const { data: directory, isLoading } = trpc.publicProfile.listPublicProfiles.useQuery({
    page,
    limit: 20,
    sector: sector || undefined,
    stage: stage || undefined,
    country: country || undefined,
  });

  const { data: stats } = trpc.publicProfile.getDirectoryStats.useQuery();

  const stages = ["idea", "pre-seed", "seed", "series-a", "series-b", "growth"];
  const sectors = [
    "Technology",
    "Healthcare",
    "Finance",
    "E-commerce",
    "Education",
    "Logistics / Supply Chain",
    "Other",
  ];
  const countries = ["Saudi Arabia", "UAE", "Egypt", "Kuwait", "Qatar", "Bahrain", "Oman"];

  // Filter profiles by search term (client-side for instant feedback)
  const filteredProfiles = (directory?.profiles || []).filter((p) =>
    !search ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.tagline?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
          <div className="text-right">
            <h1 className="text-2xl font-bold">Startup Directory</h1>
            <p className="text-sm text-muted-foreground">
              {stats?.totalProfiles || 0} startups
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Description */}
        <p className="text-muted-foreground mb-6">
          Discover startups building on Polaris Arabia — searchable by sector, stage, and country.
          Make your profile public from the <strong>Startup Profile</strong> page to appear here.
        </p>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search startups by name or tagline..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 w-full"
          />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <select
            value={sector}
            onChange={(e) => { setSector(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm"
          >
            <option value="">All Sectors</option>
            {sectors.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          <select
            value={stage}
            onChange={(e) => { setStage(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm"
          >
            <option value="">All Stages</option>
            {stages.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>

          <select
            value={country}
            onChange={(e) => { setCountry(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm"
          >
            <option value="">All Countries</option>
            {countries.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="text-center py-20">
            <h3 className="text-lg font-semibold mb-2">No startups found</h3>
            <p className="text-muted-foreground">Try adjusting your filters or search term</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Showing {filteredProfiles.length} startup{filteredProfiles.length !== 1 ? "s" : ""}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {filteredProfiles.map((startup) => (
                <Card
                  key={startup.id}
                  className="p-6 hover:shadow-lg transition-shadow flex flex-col relative cursor-pointer"
                  onClick={() => navigate(`/startup/${startup.slug}`)}
                >
                  {/* Bookmark Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (savedIds.has(startup.id)) {
                        unsaveProfile({ startupProfileId: startup.id });
                      } else {
                        saveProfile({ startupProfileId: startup.id });
                      }
                    }}
                    className="absolute top-4 right-4 p-2 rounded-lg hover:bg-secondary transition-colors z-10"
                    title={savedIds.has(startup.id) ? "Remove from watchlist" : "Save to watchlist"}
                  >
                    <Bookmark
                      className="w-5 h-5"
                      fill={savedIds.has(startup.id) ? "currentColor" : "none"}
                      color={savedIds.has(startup.id) ? "#3b82f6" : "currentColor"}
                    />
                  </button>

                  {/* Logo & Name */}
                  <div className="flex items-center gap-3 mb-3 pr-8">
                    {startup.logoUrl ? (
                      <img
                        src={startup.logoUrl}
                        alt={startup.name}
                        className="w-12 h-12 rounded-lg object-contain bg-secondary flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-bold text-muted-foreground">
                          {startup.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="font-bold text-base truncate">{startup.name}</h3>
                      {startup.tagline && (
                        <p className="text-xs text-muted-foreground truncate">{startup.tagline}</p>
                      )}
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {startup.stage && (
                      <span className="px-2 py-0.5 bg-secondary text-secondary-foreground text-xs rounded-full">
                        {startup.stage}
                      </span>
                    )}
                    {startup.sector && (
                      <span className="px-2 py-0.5 bg-secondary text-secondary-foreground text-xs rounded-full">
                        {startup.sector}
                      </span>
                    )}
                  </div>

                  {/* Location */}
                  {(startup.city || startup.country) && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                      <MapPin className="w-3 h-3" />
                      <span>{[startup.city, startup.country].filter(Boolean).join(", ")}</span>
                    </div>
                  )}

                  {/* Metrics */}
                  <div className="flex-1 space-y-1.5">
                    {startup.targetRaise && (
                      <div className="flex items-center gap-2 text-xs font-medium text-green-600">
                        <DollarSign className="w-3 h-3" />
                        <span>Raising ${(startup.targetRaise / 1000).toFixed(0)}K</span>
                      </div>
                    )}
                    {startup.currentARR && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <TrendingUp className="w-3 h-3" />
                        <span>ARR: ${(startup.currentARR / 1000).toFixed(0)}K</span>
                      </div>
                    )}
                  </div>

                  {/* AI Score */}
                  {startup.aiScore && (
                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-border">
                      <span className="text-xs text-muted-foreground">AI Score</span>
                      <span className="text-sm font-bold text-primary">{startup.aiScore}/100</span>
                    </div>
                  )}
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {directory?.pagination && directory.pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {directory.pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={page === directory.pagination.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
