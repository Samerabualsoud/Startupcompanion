import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export type SyncStatus = 'synced' | 'syncing' | 'error';

interface SyncStatusBadgeProps {
  status: SyncStatus;
  lastSyncTime?: Date;
  className?: string;
}

/**
 * Visual indicator for real-time sync status
 */
export function SyncStatusBadge({
  status,
  lastSyncTime,
  className = '',
}: SyncStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'synced':
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5" />,
          label: 'Synced',
          variant: 'default' as const,
          bgColor: 'bg-green-50',
          textColor: 'text-green-700',
          borderColor: 'border-green-200',
        };
      case 'syncing':
        return {
          icon: <Clock className="w-3.5 h-3.5 animate-spin" />,
          label: 'Syncing...',
          variant: 'secondary' as const,
          bgColor: 'bg-amber-50',
          textColor: 'text-amber-700',
          borderColor: 'border-amber-200',
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-3.5 h-3.5" />,
          label: 'Sync Error',
          variant: 'destructive' as const,
          bgColor: 'bg-red-50',
          textColor: 'text-red-700',
          borderColor: 'border-red-200',
        };
    }
  };

  const config = getStatusConfig();
  const timeAgo = lastSyncTime
    ? Math.round((Date.now() - lastSyncTime.getTime()) / 1000)
    : null;

  const getTimeLabel = () => {
    if (!timeAgo) return '';
    if (timeAgo < 60) return `${timeAgo}s ago`;
    if (timeAgo < 3600) return `${Math.round(timeAgo / 60)}m ago`;
    return `${Math.round(timeAgo / 3600)}h ago`;
  };

  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${config.bgColor} ${config.borderColor} ${className}`}
    >
      <div className={config.textColor}>{config.icon}</div>
      <span className={`text-xs font-medium ${config.textColor}`}>
        {config.label}
      </span>
      {status === 'synced' && timeAgo !== null && (
        <span className={`text-xs ${config.textColor} opacity-70`}>
          {getTimeLabel()}
        </span>
      )}
    </div>
  );
}

export default SyncStatusBadge;
