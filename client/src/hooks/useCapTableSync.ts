import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

/**
 * Hook for real-time Cap Table synchronization
 * Automatically syncs Cap Table changes across all tools
 */
export function useCapTableSync() {
  const queryClient = useQueryClient();
  const syncTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastSyncRef = useRef<number>(0);

  // Fetch current user to get userId
  const { data: user } = trpc.auth.me.useQuery(undefined, {
    retry: false,
  });
  const userId = user?.id;

  // Get Cap Table data
  const { data: capTable } = trpc.equity.get.useQuery(undefined, {
    enabled: !!userId,
  });

  /**
   * Trigger sync across all dependent queries
   */
  const triggerSync = useCallback(() => {
    const now = Date.now();
    // Debounce syncs to max once per 500ms
    if (now - lastSyncRef.current < 500) {
      return;
    }
    lastSyncRef.current = now;

    // Invalidate queries that depend on Cap Table
    queryClient.invalidateQueries({ queryKey: ['equity.get'] });
    queryClient.invalidateQueries({ queryKey: ['dilution'] });
    queryClient.invalidateQueries({ queryKey: ['valuation'] });

    // Show sync indicator
    toast.success('Cap Table synced across all tools', {
      duration: 2000,
      description: 'Dilution Simulator and Valuation Report updated',
    });
  }, [queryClient]);

  /**
   * Setup real-time listeners using polling + event-based updates
   * (In production, this would use WebSockets)
   */
  useEffect(() => {
    if (!userId) return;

    // Poll for Cap Table changes every 2 seconds
    const pollInterval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['equity.get'] });
    }, 2000);

    return () => {
      clearInterval(pollInterval);
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [userId, queryClient]);

  /**
   * Trigger sync when Cap Table changes
   */
  useEffect(() => {
    if (capTable) {
      // Debounce the sync trigger
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }

      syncTimeoutRef.current = setTimeout(() => {
        triggerSync();
      }, 300);
    }

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [capTable, triggerSync]);

  return {
    capTable,
    triggerSync,
    userId,
  };
}

/**
 * Hook for real-time Dilution Simulator sync
 */
export function useDilutionSync() {
  const queryClient = useQueryClient();
  const { data: user } = trpc.auth.me.useQuery(undefined, {
    retry: false,
  });

  useEffect(() => {
    if (!user?.id) return;

    // Refetch dilution data when Cap Table changes
    const unsubscribe = queryClient.getQueryCache().subscribe((event: any) => {
      if (
        event.type === 'updated' &&
        event.query.queryKey[0] === 'equity.get'
      ) {
        // Invalidate dilution queries
        queryClient.invalidateQueries({ queryKey: ['dilution'] });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [user?.id, queryClient]);
}

/**
 * Hook for real-time Valuation Report sync
 */
export function useValuationSync() {
  const queryClient = useQueryClient();
  const { data: user } = trpc.auth.me.useQuery(undefined, {
    retry: false,
  });

  useEffect(() => {
    if (!user?.id) return;

    // Refetch valuation data when Cap Table changes
    const unsubscribe = queryClient.getQueryCache().subscribe((event: any) => {
      if (
        event.type === 'updated' &&
        event.query.queryKey[0] === 'equity.get'
      ) {
        // Invalidate valuation queries
        queryClient.invalidateQueries({ queryKey: ['valuation'] });
        queryClient.invalidateQueries({ queryKey: ['projection'] });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [user?.id, queryClient]);
}
