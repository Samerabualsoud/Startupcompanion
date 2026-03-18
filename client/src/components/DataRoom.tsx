/**
 * Data Room Management
 * Features: create rooms, upload files (S3), organize by folder,
 * generate shareable links, view activity log (who opened, what they viewed).
 */
import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderOpen, Upload, Share2, Eye, Trash2, Plus, Copy, Check,
  FileText, FileImage, FileVideo, File, Link2, Lock, Unlock,
  Activity, ChevronDown, ChevronRight, X, ExternalLink, Clock,
  Users, Download, AlertCircle, Loader2, FolderPlus
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

// ── Types ──────────────────────────────────────────────────────────────────
type DataRoom = {
  id: number; name: string; description: string | null;
  shareToken: string | null; isShared: boolean; requireEmail: boolean;
  viewCount: number; createdAt: Date; updatedAt: Date;
  expiresAt: Date | null;
};
type DataRoomFile = {
  id: number; dataRoomId: number; name: string; fileUrl: string;
  mimeType: string; sizeBytes: number; folder: string; createdAt: Date;
};
type ActivityEntry = {
  id: number; action: string; viewerEmail: string | null;
  viewerName: string | null; fileName: string | null; createdAt: Date;
};

// ── Helpers ────────────────────────────────────────────────────────────────
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return FileImage;
  if (mimeType.startsWith('video/')) return FileVideo;
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return FileText;
  return File;
}

function timeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const ACTION_LABELS: Record<string, string> = {
  room_opened: 'Opened data room',
  file_viewed: 'Viewed file',
  file_downloaded: 'Downloaded file',
};

// ── Main Component ─────────────────────────────────────────────────────────
export default function DataRoom() {
  const { t, isRTL } = useLanguage();
  const utils = trpc.useUtils();

  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [uploadFolder, setUploadFolder] = useState('General');
  const [customFolder, setCustomFolder] = useState('');
  const [requireEmail, setRequireEmail] = useState(false);
  const [expiresInDays, setExpiresInDays] = useState<string>('');
  const [shareTitle, setShareTitle] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [visibleSections, setVisibleSections] = useState({
    files: true,
    companyOverview: false,
    financials: false,
    team: false,
    metrics: false,
    contactInfo: false,
  });
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['General']));
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── tRPC queries ──
  const { data: rooms = [], isLoading: roomsLoading } = trpc.dataRoom.list.useQuery(undefined, { retry: false });
  const selectedRoom = rooms.find(r => r.id === selectedRoomId) ?? null;

  const { data: files = [], isLoading: filesLoading } = trpc.dataRoom.listFiles.useQuery(
    { dataRoomId: selectedRoomId! },
    { enabled: !!selectedRoomId, retry: false }
  );

  const { data: activity = [], isLoading: activityLoading } = trpc.dataRoom.getActivity.useQuery(
    { dataRoomId: selectedRoomId! },
    { enabled: !!selectedRoomId && showActivity, retry: false }
  );

  // ── Mutations ──
  const createRoom = trpc.dataRoom.create.useMutation({
    onSuccess: (room) => {
      utils.dataRoom.list.invalidate();
      setSelectedRoomId(room.id);
      setShowCreateRoom(false);
      setNewRoomName('');
      setNewRoomDesc('');
      toast.success('Data room created');
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteRoom = trpc.dataRoom.delete.useMutation({
    onSuccess: () => {
      utils.dataRoom.list.invalidate();
      setSelectedRoomId(null);
      toast.success('Data room deleted');
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteFile = trpc.dataRoom.deleteFile.useMutation({
    onSuccess: () => {
      utils.dataRoom.listFiles.invalidate({ dataRoomId: selectedRoomId! });
      toast.success('File deleted');
    },
    onError: (e) => toast.error(e.message),
  });

  const generateLink = trpc.dataRoom.generateShareLink.useMutation({
    onSuccess: (data) => {
      const fullUrl = `${window.location.origin}${data.shareUrl}`;
      setShareUrl(fullUrl);
      utils.dataRoom.list.invalidate();
      toast.success('Share link generated');
    },
    onError: (e) => toast.error(e.message),
  });

  const revokeLink = trpc.dataRoom.revokeShareLink.useMutation({
    onSuccess: () => {
      setShareUrl(null);
      utils.dataRoom.list.invalidate();
      toast.success('Share link revoked');
    },
    onError: (e) => toast.error(e.message),
  });

  const uploadFile = trpc.dataRoom.uploadFile.useMutation({
    onSuccess: () => {
      utils.dataRoom.listFiles.invalidate({ dataRoomId: selectedRoomId! });
      toast.success('File uploaded successfully');
    },
    onError: (e) => toast.error(e.message),
  });

  // ── File upload handler ──
  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || !selectedRoomId) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (file.size > 20 * 1024 * 1024) {
          toast.error(`${file.name} exceeds 20 MB limit`);
          continue;
        }
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]); // strip data URL prefix
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const folder = uploadFolder === '__custom__' ? (customFolder || 'General') : uploadFolder;
        await uploadFile.mutateAsync({
          dataRoomId: selectedRoomId,
          name: file.name,
          mimeType: file.type || 'application/octet-stream',
          sizeBytes: file.size,
          folder,
          base64Data: base64,
        });
      }
    } finally {
      setUploading(false);
    }
  }, [selectedRoomId, uploadFolder, customFolder, uploadFile]);

  // ── Drag & drop ──
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFileUpload(e.dataTransfer.files);
  }, [handleFileUpload]);

  // ── Copy share link ──
  const copyShareLink = useCallback(async () => {
    const url = shareUrl ?? (selectedRoom?.shareToken ? `${window.location.origin}/data-room/${selectedRoom.shareToken}` : null);
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [shareUrl, selectedRoom]);

  // ── Group files by folder ──
  const filesByFolder = files.reduce<Record<string, DataRoomFile[]>>((acc, f) => {
    const folder = f.folder || 'General';
    if (!acc[folder]) acc[folder] = [];
    acc[folder].push(f);
    return acc;
  }, {});

  const PRESET_FOLDERS = ['General', 'Financial', 'Legal', 'Product', 'Team', 'Market Research', 'Pitch Deck'];

  return (
    <div className={`flex h-full ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* ── Left Panel: Room List ── */}
      <div className="w-64 shrink-0 border-r border-border flex flex-col" style={{ background: 'oklch(0.18 0.05 240)' }}>
        <div className="p-4 border-b border-border/30">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-white">Data Rooms</h2>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-white/60 hover:text-white hover:bg-white/10"
              onClick={() => setShowCreateRoom(true)}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-[10px] text-white/40">Secure document sharing with activity tracking</p>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {roomsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-white/40" />
            </div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-8 px-3">
              <FolderOpen className="w-8 h-8 mx-auto mb-2 text-white/20" />
              <p className="text-[11px] text-white/40">No data rooms yet. Create one to get started.</p>
            </div>
          ) : (
            rooms.map(room => (
              <button
                key={room.id}
                onClick={() => setSelectedRoomId(room.id)}
                className={`w-full text-left p-2.5 rounded-lg transition-all ${
                  selectedRoomId === room.id
                    ? 'bg-white/15 text-white'
                    : 'text-white/70 hover:bg-white/8 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 shrink-0" style={{ color: room.isShared ? '#10B981' : 'oklch(0.55 0.13 30)' }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold truncate">{room.name}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {room.isShared && (
                        <Badge className="text-[9px] h-3.5 px-1 bg-green-500/20 text-green-400 border-0">Shared</Badge>
                      )}
                      <span className="text-[10px] text-white/30">{room.viewCount} views</span>
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="p-3 border-t border-border/30">
          <Button
            className="w-full h-8 text-xs"
            style={{ background: 'oklch(0.55 0.13 30)' }}
            onClick={() => setShowCreateRoom(true)}
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" /> New Data Room
          </Button>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!selectedRoom ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-sm">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'oklch(0.22 0.05 240)' }}>
                <FolderOpen className="w-8 h-8" style={{ color: 'oklch(0.55 0.13 30)' }} />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Select or Create a Data Room</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Organize your startup documents and share them securely with investors, advisors, or partners.
              </p>
              <Button onClick={() => setShowCreateRoom(true)} style={{ background: 'oklch(0.55 0.13 30)' }}>
                <Plus className="w-4 h-4 mr-2" /> Create Data Room
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="shrink-0 px-5 py-3.5 border-b border-border flex items-center justify-between" style={{ background: 'oklch(0.18 0.05 240)' }}>
              <div className="flex items-center gap-3">
                <FolderOpen className="w-5 h-5" style={{ color: 'oklch(0.55 0.13 30)' }} />
                <div>
                  <h2 className="text-sm font-bold text-white">{selectedRoom.name}</h2>
                  {selectedRoom.description && (
                    <p className="text-[11px] text-white/50">{selectedRoom.description}</p>
                  )}
                </div>
                {selectedRoom.isShared && (
                  <Badge className="bg-green-500/20 text-green-400 border-0 text-[10px]">
                    <Unlock className="w-2.5 h-2.5 mr-1" /> Shared · {selectedRoom.viewCount} views
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-white/70 hover:text-white hover:bg-white/10 text-xs gap-1.5"
                  onClick={() => { setShowActivity(true); }}
                >
                  <Activity className="w-3.5 h-3.5" /> Activity
                </Button>
                <Button
                  size="sm"
                  className="h-8 text-xs gap-1.5"
                  style={{ background: 'oklch(0.55 0.13 30)' }}
                  onClick={() => { setShareUrl(selectedRoom.shareToken ? `${window.location.origin}/data-room/${selectedRoom.shareToken}` : null); setShowShareModal(true); }}
                >
                  <Share2 className="w-3.5 h-3.5" /> Share
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-red-400/70 hover:text-red-400 hover:bg-red-500/10"
                  onClick={() => {
                    if (confirm('Delete this data room and all its files?')) {
                      deleteRoom.mutate({ id: selectedRoom.id });
                    }
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Upload Zone + Folder Selector */}
            <div className="shrink-0 px-5 py-3 border-b border-border bg-card/50">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <Label className="text-xs text-muted-foreground shrink-0">Upload to:</Label>
                  <Select value={uploadFolder} onValueChange={setUploadFolder}>
                    <SelectTrigger className="h-8 text-xs w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRESET_FOLDERS.map(f => (
                        <SelectItem key={f} value={f} className="text-xs">{f}</SelectItem>
                      ))}
                      <SelectItem value="__custom__" className="text-xs">Custom folder…</SelectItem>
                    </SelectContent>
                  </Select>
                  {uploadFolder === '__custom__' && (
                    <Input
                      className="h-8 text-xs w-36"
                      placeholder="Folder name"
                      value={customFolder}
                      onChange={e => setCustomFolder(e.target.value)}
                    />
                  )}
                </div>
                <Button
                  size="sm"
                  className="h-8 text-xs gap-1.5"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  {uploading ? 'Uploading…' : 'Upload Files'}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={e => handleFileUpload(e.target.files)}
                />
              </div>
            </div>

            {/* Files Area */}
            <div
              className="flex-1 overflow-y-auto p-5"
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
            >
              {filesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : files.length === 0 ? (
                <div
                  className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-sm font-medium text-muted-foreground">Drop files here or click to upload</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">PDF, Word, Excel, images — up to 20 MB per file</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(filesByFolder).map(([folder, folderFiles]) => (
                    <div key={folder}>
                      <button
                        className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2 hover:text-primary transition-colors"
                        onClick={() => {
                          setExpandedFolders(prev => {
                            const next = new Set(prev);
                            if (next.has(folder)) next.delete(folder);
                            else next.add(folder);
                            return next;
                          });
                        }}
                      >
                        {expandedFolders.has(folder) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        <FolderOpen className="w-4 h-4" style={{ color: 'oklch(0.55 0.13 30)' }} />
                        {folder}
                        <span className="text-xs text-muted-foreground font-normal">({folderFiles.length})</span>
                      </button>

                      <AnimatePresence>
                        {expandedFolders.has(folder) && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-1.5 ml-6"
                          >
                            {folderFiles.map(file => {
                              const FileIcon = getFileIcon(file.mimeType);
                              return (
                                <div
                                  key={file.id}
                                  className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-card hover:bg-secondary/30 transition-colors group"
                                >
                                  <FileIcon className="w-4 h-4 shrink-0 text-muted-foreground" />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-xs font-medium text-foreground truncate">{file.name}</div>
                                    <div className="text-[10px] text-muted-foreground">
                                      {formatBytes(file.sizeBytes)} · {timeAgo(file.createdAt)}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <a
                                      href={file.fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                    <button
                                      className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                                      onClick={() => {
                                        if (confirm(`Delete "${file.name}"?`)) {
                                          deleteFile.mutate({ fileId: file.id, dataRoomId: selectedRoom.id });
                                        }
                                      }}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Activity Panel (right drawer) ── */}
      <AnimatePresence>
        {showActivity && selectedRoom && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="shrink-0 border-l border-border flex flex-col overflow-hidden"
            style={{ background: 'oklch(0.18 0.05 240)' }}
          >
            <div className="p-4 border-b border-border/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4" style={{ color: 'oklch(0.55 0.13 30)' }} />
                <h3 className="text-sm font-bold text-white">Activity Log</h3>
              </div>
              <button onClick={() => setShowActivity(false)} className="text-white/40 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {activityLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-white/40" />
                </div>
              ) : activity.length === 0 ? (
                <div className="text-center py-8">
                  <Eye className="w-8 h-8 mx-auto mb-2 text-white/20" />
                  <p className="text-[11px] text-white/40">No activity yet. Share the link to start tracking.</p>
                </div>
              ) : (
                activity.map((entry: ActivityEntry) => (
                  <div key={entry.id} className="p-2.5 rounded-lg" style={{ background: 'oklch(0.22 0.04 240)' }}>
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'oklch(0.55 0.13 30)20' }}>
                        {entry.action === 'room_opened' ? (
                          <Eye className="w-3 h-3" style={{ color: 'oklch(0.55 0.13 30)' }} />
                        ) : (
                          <FileText className="w-3 h-3" style={{ color: 'oklch(0.55 0.13 30)' }} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-semibold text-white">
                          {entry.viewerName ?? entry.viewerEmail ?? 'Anonymous'}
                        </div>
                        <div className="text-[10px] text-white/50">
                          {ACTION_LABELS[entry.action] ?? entry.action}
                          {entry.fileName && <span className="text-white/70"> · {entry.fileName}</span>}
                        </div>
                        <div className="text-[10px] text-white/30 mt-0.5 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {timeAgo(entry.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-3 border-t border-border/30">
              <div className="flex items-center gap-2 text-[11px] text-white/40">
                <Users className="w-3.5 h-3.5" />
                {activity.length} total events tracked
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Create Room Modal ── */}
      <Dialog open={showCreateRoom} onOpenChange={setShowCreateRoom}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderPlus className="w-5 h-5" style={{ color: 'oklch(0.55 0.13 30)' }} />
              Create Data Room
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Room Name *</Label>
              <Input
                placeholder="e.g. Series A Due Diligence"
                value={newRoomName}
                onChange={e => setNewRoomName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && newRoomName.trim() && createRoom.mutate({ name: newRoomName.trim(), description: newRoomDesc || undefined })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Description (optional)</Label>
              <Input
                placeholder="Brief description for investors"
                value={newRoomDesc}
                onChange={e => setNewRoomDesc(e.target.value)}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowCreateRoom(false)}>Cancel</Button>
              <Button
                className="flex-1"
                style={{ background: 'oklch(0.55 0.13 30)' }}
                disabled={!newRoomName.trim() || createRoom.isPending}
                onClick={() => createRoom.mutate({ name: newRoomName.trim(), description: newRoomDesc || undefined })}
              >
                {createRoom.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Share Modal ── */}
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-primary" />
              Share Data Room
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-2">

            {/* Current link */}
            {selectedRoom?.isShared && (
              <div className="p-3 rounded-lg border border-green-500/30 bg-green-500/5">
                <div className="flex items-center gap-2 mb-2">
                  <Unlock className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-semibold text-green-600">Room is currently shared</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={shareUrl ?? `${window.location.origin}/data-room/${selectedRoom.shareToken}`}
                    className="text-xs h-8 font-mono"
                  />
                  <Button size="sm" variant="outline" className="h-8 shrink-0" onClick={copyShareLink}>
                    {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>
            )}

            {/* Branding */}
            <div className="space-y-3">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Branding</p>
              <div className="space-y-1.5">
                <Label className="text-xs">Page title shown to viewers (optional)</Label>
                <Input
                  placeholder={`e.g. ${selectedRoom?.name ?? 'Acme Inc'} — Investor Data Room`}
                  className="h-8 text-xs"
                  value={shareTitle}
                  onChange={e => setShareTitle(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Welcome message (optional)</Label>
                <textarea
                  placeholder="e.g. Thank you for your interest. Please review the documents below."
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs min-h-[56px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  value={shareMessage}
                  onChange={e => setShareMessage(e.target.value)}
                />
              </div>
            </div>

            {/* Visible sections */}
            <div className="space-y-3">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">What can viewers see?</p>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { key: 'files' as const, label: 'Documents & Files', emoji: '📁' },
                  { key: 'companyOverview' as const, label: 'Company Overview', emoji: '🏢' },
                  { key: 'financials' as const, label: 'Financials (ARR, Burn)', emoji: '💰' },
                  { key: 'team' as const, label: 'Team Members', emoji: '👥' },
                  { key: 'metrics' as const, label: 'Key Metrics', emoji: '📊' },
                  { key: 'contactInfo' as const, label: 'Contact Info', emoji: '📬' },
                ]).map(({ key, label, emoji }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setVisibleSections(prev => ({ ...prev, [key]: !prev[key] }))}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all ${
                      visibleSections[key]
                        ? 'border-primary/60 bg-primary/10 text-primary'
                        : 'border-border bg-muted/20 text-muted-foreground hover:border-border/80'
                    }`}
                  >
                    <span className="text-base leading-none">{emoji}</span>
                    <span className="text-xs font-medium leading-tight flex-1">{label}</span>
                    {visibleSections[key] && <Check className="w-3 h-3 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Access controls */}
            <div className="space-y-3">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Access Controls</p>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-semibold">Require email to view</Label>
                  <p className="text-[10px] text-muted-foreground">Viewers must enter their email before accessing</p>
                </div>
                <Switch checked={requireEmail} onCheckedChange={setRequireEmail} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Link expires in (days, optional)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 30"
                  className="h-8 text-xs"
                  value={expiresInDays}
                  onChange={e => setExpiresInDays(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              {selectedRoom?.isShared && (
                <Button
                  variant="outline"
                  className="flex-1 text-red-500 border-red-500/30 hover:bg-red-500/10"
                  onClick={() => {
                    revokeLink.mutate({ dataRoomId: selectedRoom.id });
                    setShowShareModal(false);
                  }}
                  disabled={revokeLink.isPending}
                >
                  <Lock className="w-3.5 h-3.5 mr-1.5" /> Revoke Link
                </Button>
              )}
              <Button
                className="flex-1"
                disabled={generateLink.isPending}
                onClick={() => {
                  if (!selectedRoom) return;
                  generateLink.mutate({
                    dataRoomId: selectedRoom.id,
                    requireEmail,
                    expiresInDays: expiresInDays ? parseInt(expiresInDays) : undefined,
                    shareTitle: shareTitle || undefined,
                    shareMessage: shareMessage || undefined,
                    visibleSections,
                  });
                }}
              >
                {generateLink.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <><Link2 className="w-3.5 h-3.5 mr-1.5" /> {selectedRoom?.isShared ? 'Regenerate Link' : 'Generate Link'}</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
