import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader2, Globe, Linkedin, Twitter, Mail, TrendingUp, Users, Target, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function PublicStartupProfile() {
  const { slug } = useParams<{ slug?: string }>();
  const { data: profile, isLoading, error } = trpc.publicProfile.getPublicProfile.useQuery(
    { slug: slug ?? "" },
    { enabled: !!slug }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Profile Not Found</h1>
          <p className="text-muted-foreground">This startup profile doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-card border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="flex items-start gap-6">
            {/* Logo */}
            <div className="shrink-0">
              {profile.publicProfileLogoUrl || profile.logoUrl ? (
                <img
                  src={(profile.publicProfileLogoUrl || profile.logoUrl) ?? ""}
                  alt={profile.name ?? "Startup logo"}
                  className="w-24 h-24 rounded-lg object-contain bg-background border border-border"
                />
              ) : (
                <div className="w-24 h-24 rounded-lg bg-secondary flex items-center justify-center">
                  <span className="text-2xl font-bold text-muted-foreground">
                    {profile.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Header Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl font-bold">{profile.name}</h1>
                {profile.publicProfileVerified && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                    Verified
                  </span>
                )}
              </div>
              <p className="text-lg text-muted-foreground mb-4">{profile.tagline}</p>

              <div className="flex flex-wrap gap-2 mb-4">
                {profile.stage && (
                  <span className="px-3 py-1 bg-secondary text-secondary-foreground text-sm rounded-full">
                    {profile.stage}
                  </span>
                )}
                {profile.sector && (
                  <span className="px-3 py-1 bg-secondary text-secondary-foreground text-sm rounded-full">
                    {profile.sector}
                  </span>
                )}
                {profile.country && (
                  <span className="px-3 py-1 bg-secondary text-secondary-foreground text-sm rounded-full">
                    {profile.city ? `${profile.city}, ${profile.country}` : profile.country}
                  </span>
                )}
              </div>

              {/* AI Score */}
              {profile.publicProfileAiScore && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/20 rounded-lg">
                  <span className="text-sm font-semibold">AI Score:</span>
                  <span className="text-lg font-bold text-accent">{profile.publicProfileAiScore}/100</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid grid-cols-3 gap-6 mb-12">
          {/* Left Column - Main Info */}
          <div className="col-span-2 space-y-8">
            {/* Problem & Solution */}
            {(profile.problem || profile.solution) && (
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">Problem & Solution</h2>
                {profile.problem && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-sm text-muted-foreground mb-2">The Problem</h3>
                    <p className="text-sm leading-relaxed">{profile.problem}</p>
                  </div>
                )}
                {profile.solution && (
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-2">Our Solution</h3>
                    <p className="text-sm leading-relaxed">{profile.solution}</p>
                  </div>
                )}
              </Card>
            )}

            {/* Business Details */}
            {(profile.targetCustomer || profile.businessModel) && (
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">Business Details</h2>
                {profile.targetCustomer && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-sm text-muted-foreground mb-2">Target Customer</h3>
                    <p className="text-sm leading-relaxed">{profile.targetCustomer}</p>
                  </div>
                )}
                {profile.businessModel && (
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-2">Business Model</h3>
                    <p className="text-sm leading-relaxed">{profile.businessModel}</p>
                  </div>
                )}
              </Card>
            )}

            {/* Bio */}
            {profile.publicProfileBio && (
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">About</h2>
                <p className="text-sm leading-relaxed">{profile.publicProfileBio}</p>
              </Card>
            )}

            {/* Investor Note */}
            {profile.publicProfileInvestorNote && (
              <Card className="p-6 border-accent/30 bg-accent/5">
                <h2 className="text-xl font-bold mb-4">Message to Investors</h2>
                <p className="text-sm leading-relaxed">{profile.publicProfileInvestorNote}</p>
              </Card>
            )}
          </div>

          {/* Right Column - Metrics & CTA */}
          <div className="space-y-6">
            {/* Key Metrics */}
            <Card className="p-6">
              <h3 className="font-bold mb-4">Key Metrics</h3>
              <div className="space-y-4">
                {profile.currentARR && (
                  <div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <DollarSign className="w-4 h-4" />
                      <span>Current ARR</span>
                    </div>
                    <p className="font-semibold">${(profile.currentARR / 1000).toFixed(0)}K</p>
                  </div>
                )}
                {profile.totalRaised && (
                  <div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <TrendingUp className="w-4 h-4" />
                      <span>Total Raised</span>
                    </div>
                    <p className="font-semibold">${(profile.totalRaised / 1000000).toFixed(1)}M</p>
                  </div>
                )}
                {profile.targetRaise && (
                  <div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <Target className="w-4 h-4" />
                      <span>Seeking</span>
                    </div>
                    <p className="font-semibold">${(profile.targetRaise / 1000000).toFixed(1)}M</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Contact CTA */}
            {profile.publicProfileContactEmail && (
              <Card className="p-6">
                <h3 className="font-bold mb-4">Interested?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Reach out to learn more about this opportunity.
                </p>
                <Button asChild className="w-full">
                  <a href={`mailto:${profile.publicProfileContactEmail}`}>
                    <Mail className="w-4 h-4 mr-2" />
                    Contact Founder
                  </a>
                </Button>
              </Card>
            )}

            {/* Social Links */}
            {(profile.websiteUrl || profile.linkedinUrl || profile.twitterUrl) && (
              <Card className="p-6">
                <h3 className="font-bold mb-4">Connect</h3>
                <div className="flex flex-col gap-2">
                  {profile.websiteUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={profile.websiteUrl} target="_blank" rel="noopener noreferrer">
                        <Globe className="w-4 h-4 mr-2" />
                        Website
                      </a>
                    </Button>
                  )}
                  {profile.linkedinUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer">
                        <Linkedin className="w-4 h-4 mr-2" />
                        LinkedIn
                      </a>
                    </Button>
                  )}
                  {profile.twitterUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={profile.twitterUrl} target="_blank" rel="noopener noreferrer">
                        <Twitter className="w-4 h-4 mr-2" />
                        Twitter
                      </a>
                    </Button>
                  )}
                </div>
              </Card>
            )}

            {/* Stats */}
            <Card className="p-6 bg-secondary/50">
              <div className="text-xs text-muted-foreground">
                <p>Profile Views: {profile.publicProfileViewCount ?? 0}</p>
                {profile.foundedYear && <p>Founded: {profile.foundedYear}</p>}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
