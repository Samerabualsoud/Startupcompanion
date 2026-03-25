import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Loader2, TrendingUp, DollarSign, ArrowLeft, Bookmark, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/_core/hooks/useAuth";

export default function SavedStartups() {
  const { isAuthenticated } = useAuth();
  const [search, setSearch] = useState<string>("");

  const { data: savedData, isLoading } = trpc.watchlist.getSavedProfiles.useQuery(
    { search, limit: 50, offset: 0 },
    { enabled: isAuthenticated }
  );

  const { mutate: unsaveProfile } = trpc.watchlist.unsaveProfile.useMutation({
    onSuccess: () => {
      // Refetch the list
    },
  });

  const profiles = savedData?.profiles || [];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Sign in to view your watchlist</h2>
          <p className="text-muted-foreground mb-6">You need to be logged in to save and manage startup profiles.</p>
          <Link href="/login">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
          <div className="text-right">
            <h1 className="text-2xl font-bold flex items-center gap-2 justify-end">
              <Heart className="w-6 h-6 fill-red-500 text-red-500" />
              Saved Startups
            </h1>
            <p className="text-sm text-muted-foreground">
              {profiles.length} startup{profiles.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search */}
        <div className="mb-8">
          <Input
            placeholder="Search your saved startups..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No saved startups yet</h3>
            <p className="text-muted-foreground mb-6">
              Browse the startup directory and bookmark profiles to add them to your watchlist.
            </p>
            <Link href="/startups">
              <Button>Browse Startups</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profiles.map((startup: any) => (
              <Link key={startup.id} href={`/startup/${startup.publicProfileSlug}`}>
                <Card className="p-6 hover:shadow-lg transition-shadow h-full flex flex-col relative">
                  {/* Remove Button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      unsaveProfile({ startupProfileId: startup.id });
                    }}
                    className="absolute top-4 right-4 p-2 rounded-lg hover:bg-red-100 transition-colors"
                    title="Remove from watchlist"
                  >
                    <Bookmark className="w-5 h-5 fill-blue-500 text-blue-500" />
                  </button>

                  {/* Logo & Header */}
                  <div className="flex items-start gap-4 mb-4 cursor-pointer">
                    <Link href={`/startup/${startup.publicProfileSlug}`} className="flex items-start gap-4 flex-1">
                      {startup.publicProfileLogoUrl ? (
                        <img
                          src={startup.publicProfileLogoUrl}
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
                      </div>
                    </Link>
                  </div>

                  <Link href={`/startup/${startup.publicProfileSlug}`}>
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
                  </Link>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
