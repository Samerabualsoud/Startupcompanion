import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Loader2, X, Globe, Mail, MapPin, Users, TrendingUp, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface StartupDetailModalProps {
  slug: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function StartupDetailModal({ slug, isOpen, onClose }: StartupDetailModalProps) {
  const { data: profile, isLoading } = trpc.publicProfile.getPublicProfile.useQuery(
    { slug },
    { enabled: isOpen }
  );

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Startup Profile</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : profile ? (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start gap-4">
              {profile.publicProfileLogoUrl ? (
                <img
                  src={profile.publicProfileLogoUrl}
                  alt={profile.name}
                  className="w-20 h-20 rounded-lg object-contain bg-secondary border border-border"
                />
              ) : (
                <div className="w-20 h-20 rounded-lg bg-secondary border border-border flex items-center justify-center text-2xl font-bold text-muted-foreground">
                  {profile.name.charAt(0)}
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{profile.name}</h2>
                <p className="text-muted-foreground">{profile.tagline}</p>
                <div className="flex gap-2 mt-2">
                  {profile.stage && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                      {profile.stage}
                    </span>
                  )}
                  {profile.sector && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-semibold">
                      {profile.sector}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* About */}
            {profile.description && (
              <Card className="p-4">
                <h3 className="font-semibold mb-2">About</h3>
                <p className="text-sm text-muted-foreground">{profile.description}</p>
              </Card>
            )}

            {/* Bio */}
            {profile.publicProfileBio && (
              <Card className="p-4">
                <h3 className="font-semibold mb-2">Founder Message</h3>
                <p className="text-sm text-muted-foreground">{profile.publicProfileBio}</p>
              </Card>
            )}

            {/* Key Info Grid */}
            <div className="grid grid-cols-2 gap-4">
              {profile.country && (
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-semibold text-muted-foreground">Location</span>
                  </div>
                  <p className="font-semibold">{profile.city}, {profile.country}</p>
                </Card>
              )}

              {profile.foundedYear && (
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-semibold text-muted-foreground">Founded</span>
                  </div>
                  <p className="font-semibold">{profile.foundedYear}</p>
                </Card>
              )}


            </div>

            {/* Investor Note */}
            {profile.publicProfileInvestorNote && (
              <Card className="p-4 bg-blue-50 border-blue-200">
                <h3 className="font-semibold mb-2 text-blue-900">Message to Investors</h3>
                <p className="text-sm text-blue-800">{profile.publicProfileInvestorNote}</p>
              </Card>
            )}

            {/* Contact Section */}
            <div className="flex gap-2">
              {profile.websiteUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="gap-2"
                >
                  <a href={profile.websiteUrl} target="_blank" rel="noopener noreferrer">
                    <Globe className="w-4 h-4" />
                    Website
                  </a>
                </Button>
              )}

              {profile.publicProfileContactEmail && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="gap-2"
                >
                  <a href={`mailto:${profile.publicProfileContactEmail}`}>
                    <Mail className="w-4 h-4" />
                    Contact
                  </a>
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Profile not found
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
