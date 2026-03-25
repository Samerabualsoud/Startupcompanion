import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { ArrowRight, MapPin, TrendingUp, CheckCircle, Rocket } from "lucide-react";

const STAGE_COLORS: Record<string, string> = {
  idea: "bg-gray-100 text-gray-700",
  "pre-seed": "bg-purple-100 text-purple-700",
  seed: "bg-blue-100 text-blue-700",
  "series-a": "bg-green-100 text-green-700",
  "series-b": "bg-yellow-100 text-yellow-700",
  growth: "bg-orange-100 text-orange-700",
};

function formatRaise(amount: number | null | undefined): string {
  if (!amount) return "";
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount}`;
}

function StartupCard({ startup }: { startup: any }) {
  const logoLetter = startup.name?.charAt(0)?.toUpperCase() || "S";
  const stageClass = STAGE_COLORS[startup.stage] || "bg-gray-100 text-gray-700";

  return (
    <Link href={`/startup/${startup.slug}`}>
      <div className="group relative bg-white rounded-2xl border border-gray-100 p-6 hover:border-blue-200 hover:shadow-lg transition-all duration-300 cursor-pointer h-full flex flex-col">
        {/* Verified badge */}
        {startup.verified && (
          <div className="absolute top-4 right-4">
            <CheckCircle className="w-4 h-4 text-blue-500" />
          </div>
        )}

        {/* Logo + Name */}
        <div className="flex items-center gap-3 mb-4">
          {startup.logoUrl ? (
            <img
              src={startup.logoUrl}
              alt={startup.name}
              className="w-12 h-12 rounded-xl object-contain border border-gray-100 bg-gray-50"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
              {logoLetter}
            </div>
          )}
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate group-hover:text-blue-600 transition-colors">
              {startup.name}
            </h3>
            {startup.tagline && (
              <p className="text-xs text-gray-500 truncate mt-0.5">{startup.tagline}</p>
            )}
          </div>
        </div>

        {/* Description */}
        {startup.description && (
          <p className="text-xs text-gray-600 line-clamp-2 mb-4 flex-1 leading-relaxed">
            {startup.description}
          </p>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {startup.stage && (
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${stageClass}`}>
              {startup.stage}
            </span>
          )}
          {startup.sector && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
              {startup.sector}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <MapPin className="w-3 h-3" />
            <span className="truncate max-w-[100px]">
              {[startup.city, startup.country].filter(Boolean).join(", ")}
            </span>
          </div>
          {startup.targetRaise ? (
            <div className="flex items-center gap-1 text-xs font-medium text-green-600">
              <TrendingUp className="w-3 h-3" />
              <span>Raising {formatRaise(startup.targetRaise)}</span>
            </div>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="col-span-3 flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
        <Rocket className="w-8 h-8 text-blue-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-700 mb-2">Be the First Featured Startup</h3>
      <p className="text-sm text-gray-500 max-w-xs">
        Create your startup profile and publish it to appear here and get discovered by investors.
      </p>
    </div>
  );
}

export default function FeaturedStartups() {
  const { data: startups, isLoading } = trpc.publicProfile.getFeaturedProfiles.useQuery();

  if (isLoading) {
    return (
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="h-8 bg-gray-200 rounded-lg w-64 mx-auto mb-3 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-96 mx-auto animate-pulse" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-200" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-1" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-3 bg-gray-200 rounded mb-2" />
                <div className="h-3 bg-gray-200 rounded w-4/5" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 text-xs font-semibold px-3 py-1.5 rounded-full mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Live on Polaris Arabia
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
              Featured Startups
            </h2>
            <p className="mt-2 text-gray-500 text-base max-w-lg">
              Discover high-potential startups building on Polaris Arabia and actively seeking investment.
            </p>
          </div>
          <Link href="/startups">
            <button className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors whitespace-nowrap">
              View all startups
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {!startups || startups.length === 0 ? (
            <EmptyState />
          ) : (
            startups.map((startup) => (
              <StartupCard key={startup.id} startup={startup} />
            ))
          )}
        </div>

        {/* Bottom CTA */}
        {startups && startups.length > 0 && (
          <div className="mt-10 text-center">
            <Link href="/startups">
              <button className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 hover:border-blue-300 hover:text-blue-600 font-medium text-sm px-6 py-3 rounded-xl transition-all duration-200 shadow-sm hover:shadow">
                Browse all {startups.length > 1 ? "startups" : "startup"} in the directory
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
