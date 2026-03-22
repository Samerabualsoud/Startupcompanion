import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Loader2, Search, TrendingUp, DollarSign, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function PublicStartupDirectory() {
  const [page, setPage] = useState(1);
  const [sector, setSector] = useState<string>("");
  const [stage, setStage] = useState<string>("");
  const [country, setCountry] = useState<string>("");
  const [search, setSearch] = useState<string>("");

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

  // Filter profiles by search term
  const filteredProfiles = directory?.profiles.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.tagline?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
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
        <div className="mb-8">
          <p className="text-muted-foreground mb-6">
            Discover startups building on Polaris Arabia — searchable by sector, stage, and country.
            Make your profile public from the Startup Profile page to appear here.
          </p>

          {/* Search */}
          <div className="mb-6">
            <Input
              placeholder="Search startups by name, tagline, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div>
              <label className="block text-sm font-medium mb-2">Sector</label>
              <select
                value={sector}
                onChange={(e) => {
                  setSector(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
              >
                <option value="">All Sectors</option>
                {sectors.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Stage</label>
              <select
                value={stage}
                onChange={(e) => {
                  setStage(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
              >
                <option value="">All Stages</option>
                {stages.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Country</label>
              <select
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
              >
                <option value="">All Countries</option>
                {countries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : !filteredProfiles || filteredProfiles.length === 0 ? (
          <div className="text-center py-20">
            <h3 className="text-lg font-semibold mb-2">No startups found</h3>
            <p className="text-muted-foreground">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {filteredProfiles.map((startup) => (
                <Link key={startup.id} href={`/startup/${startup.slug}`}>
                  <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col">
                    {/* Logo & Header */}
                    <div className="flex items-start gap-4 mb-4">
                      {startup.logoUrl ? (
                        <img
                          src={startup.logoUrl}
                          alt={startup.name}
                          className="w-16 h-16 rounded-lg object-contain bg-secondary"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-secondary flex items-center justify-center">
                          <span className="text-xl font-bold text-muted-foreground">
                            {startup.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1">{startup.name}</h3>
                        {startup.verified && (
                          <span className="inline-block px-2 py-0.5 bg-green-100 text-green-800 text-xs font-semibold rounded">
                            Verified
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Tagline */}
                    {startup.tagline && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {startup.tagline}
                      </p>
                    )}

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {startup.stage && (
                        <span className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded">
                          {startup.stage}
                        </span>
                      )}
                      {startup.sector && (
                        <span className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded">
                          {startup.sector}
                        </span>
                      )}
                    </div>

                    {/* Metrics */}
                    <div className="flex-1 space-y-2 mb-4">
                      {startup.totalRaised && (
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Raised: ${(startup.totalRaised / 1000000).toFixed(1)}M
                          </span>
                        </div>
                      )}
                      {startup.currentARR && (
                        <div className="flex items-center gap-2 text-sm">
                          <TrendingUp className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            ARR: ${(startup.currentARR / 1000000).toFixed(1)}M
                          </span>
                        </div>
                      )}
                    </div>

                    {/* AI Score */}
                    {startup.aiScore && (
                      <div className="flex items-center justify-between pt-4 border-t border-border">
                        <span className="text-sm text-muted-foreground">AI Score</span>
                        <span className="text-lg font-bold text-accent">{startup.aiScore}/100</span>
                      </div>
                    )}
                  </Card>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {directory?.pagination && directory.pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
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
