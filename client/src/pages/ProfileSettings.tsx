import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2, Upload, Copy, Check, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export default function ProfileSettings() {
  const { user } = useAuth();
  const { data: profile, isLoading, refetch } = trpc.publicProfile.getMyProfile.useQuery();
  const updateProfile = trpc.publicProfile.updatePublicProfile.useMutation();
  const uploadLogo = trpc.publicProfile.uploadLogo.useMutation();

  const [bio, setBio] = useState("");
  const [highlights, setHighlights] = useState<string[]>([]);
  const [contactEmail, setContactEmail] = useState("");
  const [investorNote, setInvestorNote] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");
  const [copied, setCopied] = useState(false);

  // Load profile data when available
  useEffect(() => {
    if (profile) {
      setBio(profile.publicProfileBio || "");
      setHighlights(
        Array.isArray(profile.publicProfileHighlights)
          ? profile.publicProfileHighlights
          : []
      );
      setContactEmail(profile.publicProfileContactEmail || "");
      setInvestorNote(profile.publicProfileInvestorNote || "");
      setIsPublished(profile.isPublicProfilePublished || false);
      setLogoUrl(profile.publicProfileLogoUrl || "");
    }
  }, [profile]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Logo must be smaller than 5MB");
      return;
    }

    // Validate MIME type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPEG, PNG, WebP, and SVG images are allowed");
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        const base64Data = base64.split(",")[1]; // Remove data:image/... prefix

        const result = await uploadLogo.mutateAsync({
          fileName: file.name,
          fileData: base64Data,
          mimeType: file.type,
        });

        setLogoUrl(result.url);
        toast.success("Logo uploaded successfully");
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("Failed to upload logo");
      console.error(error);
    }
  };

  const handlePublish = async () => {
    try {
      await updateProfile.mutateAsync({
        publicProfileBio: bio,
        publicProfileLogoUrl: logoUrl,
        publicProfileHighlights: highlights,
        publicProfileContactEmail: contactEmail,
        publicProfileInvestorNote: investorNote,
        isPublicProfilePublished: true,
      });

      setIsPublished(true);
      toast.success("Profile published successfully!");
      refetch();
    } catch (error) {
      toast.error("Failed to publish profile");
      console.error(error);
    }
  };

  const handleUnpublish = async () => {
    try {
      await updateProfile.mutateAsync({
        isPublicProfilePublished: false,
      });

      setIsPublished(false);
      toast.success("Profile unpublished");
      refetch();
    } catch (error) {
      toast.error("Failed to unpublish profile");
      console.error(error);
    }
  };

  const handleSaveDraft = async () => {
    try {
      await updateProfile.mutateAsync({
        publicProfileBio: bio,
        publicProfileLogoUrl: logoUrl,
        publicProfileHighlights: highlights,
        publicProfileContactEmail: contactEmail,
        publicProfileInvestorNote: investorNote,
      });

      toast.success("Draft saved");
      refetch();
    } catch (error) {
      toast.error("Failed to save draft");
      console.error(error);
    }
  };

  const copyProfileLink = () => {
    if (profile?.publicProfileSlug) {
      const url = `${window.location.origin}/startup/${profile.publicProfileSlug}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Profile link copied!");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Public Profile Settings</h1>
      <p className="text-muted-foreground mb-8">
        Customize how your startup appears to investors and the community
      </p>

      <div className="space-y-6">
        {/* Logo Upload */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Company Logo</h2>
          <div className="flex items-center gap-6">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Company logo"
                className="w-24 h-24 rounded-lg object-contain bg-secondary border border-border"
              />
            ) : (
              <div className="w-24 h-24 rounded-lg bg-secondary border-2 border-dashed border-border flex items-center justify-center">
                <span className="text-xs text-muted-foreground text-center">No logo</span>
              </div>
            )}
            <div className="flex-1">
              <label htmlFor="logo-upload" className="cursor-pointer">
                <Button asChild variant="outline">
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Logo
                  </span>
                </Button>
              </label>
              <input
                id="logo-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/svg+xml"
                onChange={handleLogoUpload}
                className="hidden"
                disabled={uploadLogo.isPending}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Max 5MB. JPEG, PNG, WebP, or SVG
              </p>
            </div>
          </div>
        </Card>

        {/* Bio */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">About Your Startup</h2>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell investors about your startup, your vision, and why you're building this..."
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground resize-none"
            rows={4}
            maxLength={1000}
          />
          <p className="text-xs text-muted-foreground mt-2">
            {bio.length}/1000 characters
          </p>
        </Card>

        {/* Contact Email */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Contact Email</h2>
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="founder@company.com"
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Investors can use this to reach out to you
          </p>
        </Card>

        {/* Investor Note */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Message to Investors</h2>
          <textarea
            value={investorNote}
            onChange={(e) => setInvestorNote(e.target.value)}
            placeholder="What specific type of investors are you looking for? What's your ask? Any special terms?"
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground resize-none"
            rows={4}
            maxLength={2000}
          />
          <p className="text-xs text-muted-foreground mt-2">
            {investorNote.length}/2000 characters
          </p>
        </Card>

        {/* Profile Status */}
        <Card className="p-6 bg-secondary/50">
          <h2 className="text-xl font-bold mb-4">Publication Status</h2>
          {isPublished && profile?.publicProfileSlug ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-green-100 text-green-800 rounded-lg">
                <Globe className="w-5 h-5" />
                <span className="font-semibold">Your profile is live!</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/startup/${profile.publicProfileSlug}`}
                  className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm"
                />
                <Button size="sm" variant="outline" onClick={copyProfileLink}>
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <Button
                variant="destructive"
                onClick={handleUnpublish}
                disabled={updateProfile.isPending}
              >
                Unpublish Profile
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Your profile is currently private. Publish it to make it visible to investors.
              </p>
              <Button onClick={handlePublish} disabled={updateProfile.isPending}>
                Publish Profile
              </Button>
            </div>
          )}
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={updateProfile.isPending}
          >
            Save Draft
          </Button>
          {!isPublished && (
            <Button
              onClick={handlePublish}
              disabled={updateProfile.isPending || !bio || !contactEmail}
            >
              Publish Profile
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
