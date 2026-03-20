/**
 * useToolState — reusable hook for DB-backed tool state persistence
 *
 * Usage:
 *   const { state, setState, isLoading } = useToolState<MyState>('readiness', defaultState);
 *
 * - Loads state from DB on mount
 * - Auto-saves to DB on change (debounced 1.5s)
 * - Falls back to defaultState if no saved state exists
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { trpc } from '@/lib/trpc';

export function useToolState<T>(toolKey: string, defaultState: T) {
  const [state, setStateLocal] = useState<T>(defaultState);
  const [initialized, setInitialized] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: savedState, isLoading } = trpc.toolState.get.useQuery(
    { toolKey },
    { staleTime: 0, refetchOnWindowFocus: false }
  );

  const saveMutation = trpc.toolState.save.useMutation();

  // Load saved state once it arrives
  useEffect(() => {
    if (!isLoading && !initialized) {
      if (savedState !== null && savedState !== undefined) {
        setStateLocal(savedState as T);
      }
      setInitialized(true);
    }
  }, [savedState, isLoading, initialized]);

  const setState = useCallback((updater: T | ((prev: T) => T)) => {
    setStateLocal(prev => {
      const next = typeof updater === 'function' ? (updater as (p: T) => T)(prev) : updater;
      // Debounced save
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        saveMutation.mutate({ toolKey, state: next });
      }, 1500);
      return next;
    });
  }, [toolKey, saveMutation]);

  return { state, setState, isLoading: isLoading && !initialized };
}
