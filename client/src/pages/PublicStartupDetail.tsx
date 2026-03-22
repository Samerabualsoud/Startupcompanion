import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader2, Globe, Mail, MapPin, TrendingUp, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";

export default function PublicStartupDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: profile, isLoading } = trpc.publicProfile.getPublicProfile.useQuery(
    { slug: slug || "" },
    { enabled: !!slug }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Startup not found</h1>
        <Link href="/directory">
          <Button>Back to Directory</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/directory">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="flex items-start gap-6 mb-8">
          {profile.publicProfileLogoUrl ? (
            <img
              src={profile.publicProfileLogoUrl}
              alt={profile.name}
              className="w-32 h-32 rounded-lg object-contain bg-secondary border border-border"
            />
          ) : (
            <div className="w-32 h-32 rounded-lg bg-secondary border border-border flex items-center justify-center text-4xl font-bold text-muted-foreground">
              {profile.name.charAt(0)}
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-2">{profile.name}</h1>
            <p className="text-xl text-muted-foreground mb-4">{profile.tagline}</p>
            <div className="flex gap-2 flex-wrap">
              {profile.stage && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                  {profile.stage}
                </span>
              )}
              {profile.sector && (
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">
                  {profile.sector}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* About Section */}
        {profile.description && (
          <Card className="p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">About</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">{profile.description}</p>
          </Card>
        )}

        {/* Founder Message */}
        {profile.publicProfileBio && (
          <Card className="p-6 mb-6 bg-blue-50 border-blue-200">
            <h2 className="text-2xl font-bold mb-4 text-blue-900">Founder Message</h2>
            <p className="text-lg text-blue-800 leading-relaxed">{profile.publicProfileBio}</p>
          </Card>
        )}

        {/* Key Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {profile.country && (
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <MapPin className="w-5 h-5 text-muted-foreground" />
                <h3 className="font-semibold">Location</h3>
              </div>
              <p className="text-lg">
                {profile.city && `${profile.city}, `}
                {profile.country}
              </p>
            </Card>
          )}

          {profile.foundedYear && (
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <TrendingUp className="w-5 h-5 text-muted-foreground" />
                <h3 className="font-semibold">Founded</h3>
              </div>
              <p className="text-lg">{profile.foundedYear}</p>
            </Card>
          )}
        </div>

        {/* Investor Note */}
        {profile.publicProfileInvestorNote && (
          <Card className="p-6 mb-6 bg-amber-50 border-amber-200">
            <h2 className="text-2xl font-bold mb-4 text-amber-900">Message to Investors</h2>
            <p className="text-lg text-amber-800 leading-relaxed">{profile.publicProfileInvestorNote}</p>
          </Card>
        )}

        {/* Contact Section */}
        <Card className="p-6 bg-secondary/50">
          <h2 className="text-2xl font-bold mb-6">Get in Touch</h2>
          <div className="flex gap-4 flex-wrap">
            {profile.websiteUrl && (
              <Button asChild className="gap-2">
                <a href={profile.websiteUrl} target="_blank" rel="noopener noreferrer">
                  <Globe className="w-4 h-4" />
                  Visit Website
                </a>
              </Button>
            )}

            {profile.publicProfileContactEmail && (
              <Button asChild className="gap-2">
                <a href={`mailto:${profile.publicProfileContactEmail}`}>
                  <Mail className="w-4 h-4" />
                  Contact Founder
                </a>
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
