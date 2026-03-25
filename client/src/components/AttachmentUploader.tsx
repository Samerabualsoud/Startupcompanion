/**
 * AttachmentUploader Component
 * 
 * Features:
 * - Drag-and-drop file upload zone
 * - File input with validation
 * - Upload progress indicators with percentage
 * - File list display with metadata
 * - Delete functionality with confirmation
 * - Error handling and user feedback
 * - File size and type validation
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, File, Trash2, Download, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { formatBytes, formatDate } from '@/lib/utils';

interface AttachmentUploaderProps {
  dataRoomId: string;
  maxFileSize?: number; // in bytes, default 50MB
  allowedTypes?: string[];
}

interface UploadingFile {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

export default function AttachmentUploader({
  dataRoomId,
  maxFileSize = 50 * 1024 * 1024, // 50MB default
  allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain', 'image/jpeg', 'image/png', 'image/gif'],
}: AttachmentUploaderProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // toast from sonner imported above

  // tRPC queries and mutations
  const { data: attachments, isLoading: isLoadingAttachments, refetch: refetchAttachments } = trpc.attachments.getAttachments.useQuery(
    { dataRoomId },
    { enabled: !!dataRoomId }
  );

  const uploadMutation = trpc.attachments.uploadAttachment.useMutation();
  const deleteMutation = trpc.attachments.deleteAttachment.useMutation();
  // Download URL query disabled for now

  // Validate file
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    if (file.size > maxFileSize) {
      return {
        valid: false,
        error: `File size exceeds ${formatBytes(maxFileSize)} limit`,
      };
    }

    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'File type not allowed',
      };
    }

    return { valid: true };
  };

  // Handle file upload
  const handleFileUpload = useCallback(
    async (files: File[]) => {
      const validFiles = files.filter((file) => {
        const validation = validateFile(file);
        if (!validation.valid) {
          toast.error(`${file.name}: ${validation.error}`);
          return false;
        }
        return true;
      });

      if (validFiles.length === 0) return;

      // Create uploading file entries
      const newUploadingFiles: UploadingFile[] = validFiles.map((file) => ({
        id: `${Date.now()}_${Math.random()}`,
        name: file.name,
        size: file.size,
        progress: 0,
        status: 'uploading',
      }));

      setUploadingFiles((prev) => [...prev, ...newUploadingFiles]);

      // Upload each file
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        const uploadingFile = newUploadingFiles[i];

        try {
          // Convert file to base64
          const reader = new FileReader();
          reader.onload = async (e) => {
            const fileData = (e.target?.result as string).split(',')[1]; // Get base64 part

            // Simulate progress (in real scenario, this would come from the upload)
            const progressInterval = setInterval(() => {
              setUploadingFiles((prev) =>
                prev.map((f) =>
                  f.id === uploadingFile.id
                    ? { ...f, progress: Math.min(f.progress + Math.random() * 30, 90) }
                    : f
                )
              );
            }, 200);

            try {
              await uploadMutation.mutateAsync({
                fileName: file.name,
                fileData,
                fileType: file.type,
                dataRoomId,
              });

              clearInterval(progressInterval);

              // Mark as success
              setUploadingFiles((prev) =>
                prev.map((f) =>
                  f.id === uploadingFile.id
                    ? { ...f, progress: 100, status: 'success' }
                    : f
                )
              );

              toast.success(`${file.name} uploaded successfully`);

              // Refetch attachments
              await refetchAttachments();

              // Remove from uploading list after 2 seconds
              setTimeout(() => {
                setUploadingFiles((prev) => prev.filter((f) => f.id !== uploadingFile.id));
              }, 2000);
            } catch (error) {
              clearInterval(progressInterval);

              const errorMessage = error instanceof Error ? error.message : 'Upload failed';
              setUploadingFiles((prev) =>
                prev.map((f) =>
                  f.id === uploadingFile.id
                    ? { ...f, status: 'error', error: errorMessage }
                    : f
                )
              );

              toast.error(errorMessage);
            }
          };

          reader.readAsDataURL(file);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Upload failed';
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.id === uploadingFile.id
                ? { ...f, status: 'error', error: errorMessage }
                : f
            )
          );
        }
      }
    },
    [dataRoomId, maxFileSize, allowedTypes, toast, uploadMutation, refetchAttachments]
  );

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);

      const files = Array.from(e.dataTransfer.files);
      handleFileUpload(files);
    },
    [handleFileUpload]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      handleFileUpload(files);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [handleFileUpload]
  );

  // Delete attachment
  const handleDelete = useCallback(
    async (attachmentId: string) => {
      if (!window.confirm('Are you sure you want to delete this file?')) return;

      try {
        await deleteMutation.mutateAsync({ attachmentId });
        toast.success('File has been deleted successfully');
        await refetchAttachments();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Delete failed';
        toast.error(errorMessage);
      }
    },
    [deleteMutation, refetchAttachments, toast]
  );

  // Download attachment
  const handleDownload = useCallback(
    async (attachmentId: string, fileName: string) => {
      // Download URL generation disabled for now
      return;
    },
    []
  );

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-8 transition-colors ${
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-border bg-background hover:border-primary/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleInputChange}
          className="hidden"
          accept={allowedTypes.join(',')}
        />

        <div className="flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Upload className="w-6 h-6 text-primary" />
          </div>

          <div className="text-center">
            <h3 className="font-semibold text-foreground mb-1">
              Drag and drop files here
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              or click to browse from your computer
            </p>
            <p className="text-xs text-muted-foreground">
              Maximum file size: {formatBytes(maxFileSize)}
            </p>
          </div>

          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            size="sm"
          >
            <Upload className="w-4 h-4 mr-2" />
            Select Files
          </Button>
        </div>
      </div>

      {/* Uploading Files */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">Uploading</h4>
          {uploadingFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card"
            >
              <File className="w-4 h-4 text-muted-foreground shrink-0" />

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground ml-2">
                    {file.status === 'uploading' && `${Math.round(file.progress)}%`}
                  </p>
                </div>

                {file.status === 'uploading' && (
                  <div className="w-full bg-secondary rounded-full h-1.5">
                    <div
                      className="bg-primary h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>
                )}

                {file.status === 'error' && (
                  <p className="text-xs text-destructive">{file.error}</p>
                )}
              </div>

              <div className="shrink-0">
                {file.status === 'uploading' && (
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                )}
                {file.status === 'success' && (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                )}
                {file.status === 'error' && (
                  <AlertCircle className="w-4 h-4 text-destructive" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Uploaded Files */}
      {isLoadingAttachments ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
        </div>
      ) : attachments && attachments.length > 0 ? (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">
            Uploaded Files ({attachments.length})
          </h4>
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-card/80 transition-colors"
            >
              <File className="w-4 h-4 text-muted-foreground shrink-0" />

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {attachment.fileName}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatBytes(attachment.fileSize)}</span>
                  <span>•</span>
                  <span>{formatDate(attachment.uploadedAt)}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(attachment.id, attachment.fileName)}
                  disabled={false}
                  title="Download file"
                >
                  <Download className="w-4 h-4" />
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(attachment.id)}
                  disabled={deleteMutation.isPending}
                  title="Delete file"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-8 rounded-lg border border-border bg-card/50">
          <File className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
          <p className="text-sm text-muted-foreground">
            No files uploaded yet
          </p>
        </div>
      )}
    </div>
  );
}
