/**
 * TrackedApplicationsContext — Shares accelerator application tracking state
 * between AcceleratorRecommender and InvestorCRM
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export interface TrackedApplication {
  id: string;
  acceleratorName: string;
  organization: string;
  deadline: string;
  equity: string;
  website: string;
  trackedAt: string;
}

interface TrackedApplicationsContextValue {
  tracked: TrackedApplication[];
  trackApplication: (app: TrackedApplication) => void;
  isTracked: (name: string) => boolean;
  untrack: (name: string) => void;
}

const TrackedApplicationsContext = createContext<TrackedApplicationsContextValue>({
  tracked: [],
  trackApplication: () => {},
  isTracked: () => false,
  untrack: () => {},
});

export function TrackedApplicationsProvider({ children }: { children: ReactNode }) {
  const [tracked, setTracked] = useState<TrackedApplication[]>([]);

  const trackApplication = useCallback((app: TrackedApplication) => {
    setTracked(prev => {
      if (prev.some(t => t.acceleratorName === app.acceleratorName)) return prev;
      return [...prev, app];
    });
  }, []);

  const isTracked = useCallback((name: string) => {
    return tracked.some(t => t.acceleratorName === name);
  }, [tracked]);

  const untrack = useCallback((name: string) => {
    setTracked(prev => prev.filter(t => t.acceleratorName !== name));
  }, []);

  return (
    <TrackedApplicationsContext.Provider value={{ tracked, trackApplication, isTracked, untrack }}>
      {children}
    </TrackedApplicationsContext.Provider>
  );
}

export function useTrackedApplications() {
  return useContext(TrackedApplicationsContext);
}
