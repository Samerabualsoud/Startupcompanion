/**
 * ReportContext — Shared state for the full toolkit PDF report
 * Allows FundraisingReadiness, PitchDeckScorecard, and AdvancedDilutionSimulator
 * to publish their scores so the header can compile a full report.
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { ReadinessData, PitchScoreData, DilutionRoundData } from '@/lib/fullReport';

interface ReportContextValue {
  readiness: ReadinessData | null;
  pitchScore: PitchScoreData | null;
  dilution: DilutionRoundData[] | null;
  setReadiness: (d: ReadinessData) => void;
  setPitchScore: (d: PitchScoreData) => void;
  setDilution: (d: DilutionRoundData[]) => void;
}

const ReportContext = createContext<ReportContextValue>({
  readiness: null,
  pitchScore: null,
  dilution: null,
  setReadiness: () => {},
  setPitchScore: () => {},
  setDilution: () => {},
});

export function ReportProvider({ children }: { children: ReactNode }) {
  const [readiness, setReadinessState] = useState<ReadinessData | null>(null);
  const [pitchScore, setPitchScoreState] = useState<PitchScoreData | null>(null);
  const [dilution, setDilutionState] = useState<DilutionRoundData[] | null>(null);

  const setReadiness = useCallback((d: ReadinessData) => setReadinessState(d), []);
  const setPitchScore = useCallback((d: PitchScoreData) => setPitchScoreState(d), []);
  const setDilution = useCallback((d: DilutionRoundData[]) => setDilutionState(d), []);

  return (
    <ReportContext.Provider value={{ readiness, pitchScore, dilution, setReadiness, setPitchScore, setDilution }}>
      {children}
    </ReportContext.Provider>
  );
}

export function useReport() {
  return useContext(ReportContext);
}
