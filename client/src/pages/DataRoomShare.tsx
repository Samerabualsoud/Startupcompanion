/**
 * DataRoomShare — Public page for viewing a shared data room via token link
 * Route: /data-room/:token
 */
import { useState } from 'react';
import { useParams } from 'wouter';
import { trpc } from '@/lib/trpc';
import { FolderOpen, FileText, Download, Lock, AlertCircle, Eye, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SharedFile {
  id: number;
  fileName: string;
  fileUrl: string;
  fileSize: number | null;
  mimeType: string | null;
  folder: string | null;
  description: string | null;
}

function formatSize(bytes: number | null) {
  if (!bytes) return '';
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

function getFileIcon(mime: string | null) {
  if (!mime) return '📄';
  if (mime.includes('pdf')) return '📕';
  if (mime.includes('image')) return '🖼️';
  if (mime.includes('spreadsheet') || mime.includes('excel') || mime.includes('csv')) return '📊';
  if (mime.includes('presentation') || mime.includes('powerpoint')) return '📊';
  if (mime.includes('word') || mime.includes('document')) return '📝';
  if (mime.includes('zip') || mime.includes('archive')) return '📦';
  return '📄';
}

export default function DataRoomShare() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [viewerEmail, setViewerEmail] = useState('');
  const [viewerName, setViewerName] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [accessEmail, setAccessEmail] = useState<string | undefined>(undefined);

  const { data, isLoading, error, refetch } = trpc.dataRoom.getSharedRoom.useQuery(
    { token, viewerEmail: accessEmail },
    { enabled: !!token, retry: false }
  );

  const trackView = (trpc as any).dataRoom.trackFileView.useMutation();

  const handleEmailSubmit = () => {
    if (!viewerEmail.trim()) return;
    setAccessEmail(viewerEmail.trim());
    setEmailSubmitted(true);
    refetch();
  };

  const handleFileClick = (file: SharedFile) => {
    trackView.mutate({ token, fileId: file.id, viewerEmail: accessEmail, viewerName });
    window.open(file.fileUrl, '_blank');
  };

  // Group files by folder
  const filesByFolder: Record<string, SharedFile[]> = {};
  if (data?.files) {
    for (const f of data.files as SharedFile[]) {
      const folder = f.folder || 'General';
      if (!filesByFolder[folder]) filesByFolder[folder] = [];
      filesByFolder[folder].push(f);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-6 py-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary">
          <Building2 className="w-4 h-4 text-primary-foreground" />
        </div>
        <div>
          <div className="text-sm font-bold text-foreground">Polaris Arabia</div>
          <div className="text-xs text-muted-foreground">Secure Data Room</div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <p className="text-muted-foreground text-sm">Loading data room…</p>
          </div>
        )}

        {/* Error */}
        {!isLoading && error && (
          <Card className="max-w-md mx-auto mt-16">
            <CardContent className="pt-8 pb-8 text-center">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h2 className="text-lg font-bold text-foreground mb-2">Data Room Unavailable</h2>
              <p className="text-sm text-muted-foreground">
                {error.message.includes('expired')
                  ? 'This share link has expired. Please request a new link from the owner.'
                  : error.message.includes('not found') || error.message.includes('not shared')
                  ? 'This data room link is invalid or has been revoked.'
                  : 'Unable to load this data room. Please try again or contact the sender.'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Email gate */}
        {!isLoading && !error && data?.requireEmail && !emailSubmitted && (
          <Card className="max-w-md mx-auto mt-16">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Lock className="w-5 h-5 text-primary" />
                Access Required
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                The owner of this data room requires your email address before granting access.
              </p>
              <div>
                <Label>Your Name</Label>
                <Input
                  value={viewerName}
                  onChange={e => setViewerName(e.target.value)}
                  placeholder="Full name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Email Address *</Label>
                <Input
                  type="email"
                  value={viewerEmail}
                  onChange={e => setViewerEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="mt-1"
                  onKeyDown={e => e.key === 'Enter' && handleEmailSubmit()}
                />
              </div>
              <Button className="w-full" onClick={handleEmailSubmit} disabled={!viewerEmail.trim()}>
                Access Data Room
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Data room content */}
        {!isLoading && !error && data?.room && (
          <div className="space-y-6">
            {/* Room header */}
            <div>
              <div className="flex items-center gap-3 mb-1">
                <FolderOpen className="w-6 h-6 text-primary" />
                <h1 className="text-2xl font-bold text-foreground">{data.room.name}</h1>
                <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                  <Eye className="w-3 h-3 mr-1" />
                  Shared Access
                </Badge>
              </div>
              {data.room.description && (
                <p className="text-sm text-muted-foreground ml-9">{data.room.description}</p>
              )}
            </div>

            {/* Files */}
            {Object.keys(filesByFolder).length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No files in this data room yet.</p>
                </CardContent>
              </Card>
            ) : (
              Object.entries(filesByFolder).map(([folder, files]) => (
                <Card key={folder}>
                  <CardHeader className="pb-2 pt-4">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FolderOpen className="w-4 h-4 text-muted-foreground" />
                      {folder}
                      <Badge variant="secondary" className="text-xs ml-1">{files.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="space-y-2">
                      {files.map(file => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/40 transition-colors cursor-pointer group"
                          onClick={() => handleFileClick(file)}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-xl shrink-0">{getFileIcon(file.mimeType)}</span>
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-foreground truncate">{file.fileName}</div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {file.mimeType && <span>{file.mimeType.split('/').pop()?.toUpperCase()}</span>}
                                {file.fileSize && <span>· {formatSize(file.fileSize)}</span>}
                                {file.description && <span>· {file.description}</span>}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                            onClick={e => { e.stopPropagation(); handleFileClick(file); }}
                          >
                            <Download className="w-4 h-4" />
                            View
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}

            {/* Footer */}
            <p className="text-center text-xs text-muted-foreground pt-4">
              This data room is powered by{' '}
              <a href="/" className="text-primary hover:underline">Polaris Arabia</a>.
              All access is logged for security purposes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
