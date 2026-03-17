/**
 * StartupContext — Central shared state for the founder workspace.
 *
 * All tools read from and write to this context so that data entered
 * in one place (e.g. valuation, COGS, ESOP, profile) is automatically
 * reflected in every other tool.
 *
 * Data is sourced from the DB via tRPC and kept in sync via invalidation.
 */

import {
  createContext,
  useContext,
  useCallback,
  type ReactNode,
} from 'react';
import { trpc } from '@/lib/trpc';

// ── Shared types ────────────────────────────────────────────────────────────

export interface TeamMemberEquity {
  id: number;
  name: string;
  role: string;
  equityPercent: number | null;
  esopShares: number | null;
  isFounder: boolean;
}

export interface StartupSnapshot {
  // Identity
  companyName: string;
  sector: string;
  stage: string;
  country: string;
  // Financials
  currentARR: number | null;
  monthlyBurnRate: number | null;
  cashOnHand: number | null;
  totalRaised: number | null;
  grossMargin: number | null;
  revenueGrowthRate: number | null;
  targetRaise: number | null;
  // Cap table
  totalShares: number | null;
  authorizedShares: number | null;
  parValue: number | null;
  esopPoolPct: number | null;
  // Team equity
  teamMembers: TeamMemberEquity[];
  // Latest valuation
  latestValuation: number | null;
  latestValuationDate: Date | null;
  // COGS
  latestGrossMarginPct: number | null;
  latestMonthlyRevenue: number | null;
  latestMonthlyCOGS: number | null;
  // ESOP (from saved plan)
  currentOptionPool: number | null;
  esopPlanId: number | null;
  esopTotalShares: number | null;
  esopPricePerShare: number | null;
  // Sales
  totalSalesRevenue: number | null;
  salesThisMonth: number | null;
  salesLastMonth: number | null;
  salesMoMGrowth: number | null;
  // Fundraising readiness score (0–100)
  readinessScore: number | null;
  // Pitch deck score (0–100)
  pitchScore: number | null;
}

interface StartupContextValue {
  snapshot: StartupSnapshot;
  isLoading: boolean;
  // Call after any tool saves data to refresh the snapshot
  refresh: () => void;
  // Partial updates from tools (in-memory, no DB write)
  updateSnapshot: (partial: Partial<StartupSnapshot>) => void;
}

const DEFAULT_SNAPSHOT: StartupSnapshot = {
  companyName: '',
  sector: '',
  stage: '',
  country: '',
  currentARR: null,
  monthlyBurnRate: null,
  cashOnHand: null,
  totalRaised: null,
  grossMargin: null,
  revenueGrowthRate: null,
  targetRaise: null,
  totalShares: null,
  authorizedShares: null,
  parValue: null,
  esopPoolPct: null,
  teamMembers: [],
  latestValuation: null,
  latestValuationDate: null,
  latestGrossMarginPct: null,
  latestMonthlyRevenue: null,
  latestMonthlyCOGS: null,
  currentOptionPool: null,
  esopPlanId: null,
  esopTotalShares: null,
  esopPricePerShare: null,
  totalSalesRevenue: null,
  salesThisMonth: null,
  salesLastMonth: null,
  salesMoMGrowth: null,
  readinessScore: null,
  pitchScore: null,
};

const StartupContext = createContext<StartupContextValue>({
  snapshot: DEFAULT_SNAPSHOT,
  isLoading: false,
  refresh: () => {},
  updateSnapshot: () => {},
});

export function StartupProvider({ children }: { children: ReactNode }) {
  const utils = trpc.useUtils();

  // Load startup profile
  const { data: profile, isLoading: profileLoading } = trpc.profile.get.useQuery(undefined, {
    retry: false,
  });

  // Load team members
  const { data: teamData, isLoading: teamLoading } = trpc.profile.getTeam.useQuery(undefined, {
    retry: false,
  });

  // Load saved valuations
  const { data: savedValuations, isLoading: valuationsLoading } = trpc.profile.getSavedValuations.useQuery(undefined, {
    retry: false,
  });

  // Load COGS calculations
  const { data: cogsData, isLoading: cogsLoading } = trpc.cogs.list.useQuery(undefined, {
    retry: false,
  });

  // Load valuation history
  const { data: valuationHistory, isLoading: historyLoading } = trpc.valuationHistory.getAll.useQuery(undefined, {
    retry: false,
  });

  // Load active ESOP plan
  const { data: esopPlan, isLoading: esopLoading } = trpc.esop.getActive.useQuery(undefined, {
    retry: false,
  });

  // Load sales summary
  const { data: salesSummary, isLoading: salesLoading } = trpc.sales.summary.useQuery(undefined, {
    retry: false,
  });

  const isLoading = profileLoading || valuationsLoading || cogsLoading || historyLoading || teamLoading || esopLoading || salesLoading;

  // Derive the latest valuation from saved valuations or history
  const latestValuation = (() => {
    if (savedValuations && savedValuations.length > 0) {
      const sorted = [...savedValuations].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      return sorted[0]?.blendedValue ?? null;
    }
    if (valuationHistory && valuationHistory.length > 0) {
      const sorted = [...valuationHistory].sort(
        (a, b) => new Date(b.valuationDate).getTime() - new Date(a.valuationDate).getTime()
      );
      return sorted[0]?.postMoneyValuation ?? sorted[0]?.preMoneyValuation ?? null;
    }
    return null;
  })();

  const latestValuationDate = (() => {
    if (savedValuations && savedValuations.length > 0) {
      const sorted = [...savedValuations].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const d = sorted[0]?.createdAt;
      return d ? new Date(d) : null;
    }
    return null;
  })();

  // Derive latest COGS data
  const latestCogs = (() => {
    if (!cogsData || cogsData.length === 0) return null;
    return [...cogsData].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
  })();

  // Derive sales metrics
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
  const lastMonthEnd = thisMonthStart - 1;

  const salesThisMonth = salesSummary?.thisMonth ?? null;
  const salesLastMonth = salesSummary?.lastMonth ?? null;
  const salesMoMGrowth = (() => {
    if (!salesThisMonth || !salesLastMonth || salesLastMonth === 0) return null;
    return ((salesThisMonth - salesLastMonth) / salesLastMonth) * 100;
  })();

  // Team members equity
  const teamMembers: TeamMemberEquity[] = (teamData ?? []).map((m: any) => ({
    id: m.id,
    name: m.name,
    role: m.role ?? '',
    equityPercent: m.equityPercent ?? null,
    esopShares: m.esopShares ?? null,
    isFounder: m.isFounder ?? false,
  }));

  const snapshot: StartupSnapshot = {
    companyName: profile?.name ?? '',
    sector: profile?.sector ?? '',
    stage: profile?.stage ?? '',
    country: profile?.country ?? '',
    currentARR: profile?.currentARR ?? null,
    monthlyBurnRate: profile?.monthlyBurnRate ?? null,
    cashOnHand: profile?.cashOnHand ?? null,
    totalRaised: profile?.totalRaised ?? null,
    grossMargin: profile?.grossMargin ?? null,
    revenueGrowthRate: profile?.revenueGrowthRate ?? null,
    targetRaise: profile?.targetRaise ?? null,
    totalShares: (profile as any)?.totalShares ?? null,
    authorizedShares: (profile as any)?.authorizedShares ?? null,
    parValue: (profile as any)?.parValue ?? null,
    esopPoolPct: (profile as any)?.esopPoolPct ?? null,
    teamMembers,
    latestValuation,
    latestValuationDate,
    latestGrossMarginPct: latestCogs?.grossMarginPct ?? null,
    latestMonthlyRevenue: latestCogs
      ? (latestCogs.revenuePerUnit ?? 0) * (latestCogs.unitsPerMonth ?? 0)
      : null,
    latestMonthlyCOGS: latestCogs?.totalCOGS ?? null,
    currentOptionPool: esopPlan ? Number(esopPlan.currentOptionPool) : null,
    esopPlanId: esopPlan?.id ?? null,
    esopTotalShares: esopPlan ? Number(esopPlan.totalShares) : null,
    esopPricePerShare: esopPlan?.pricePerShare ?? null,
    totalSalesRevenue: salesSummary?.total ?? null,
    salesThisMonth,
    salesLastMonth,
    salesMoMGrowth,
    readinessScore: null,
    pitchScore: null,
  };

  const refresh = useCallback(() => {
    utils.profile.get.invalidate();
    utils.profile.getSavedValuations.invalidate();
    utils.profile.getTeam.invalidate();
    utils.cogs.list.invalidate();
    utils.valuationHistory.getAll.invalidate();
    utils.esop.getActive.invalidate();
    utils.sales.summary.invalidate();
  }, [utils]);

  const updateSnapshot = useCallback((_partial: Partial<StartupSnapshot>) => {
    // DB-backed; invalidate on save instead
  }, []);

  return (
    <StartupContext.Provider value={{ snapshot, isLoading, refresh, updateSnapshot }}>
      {children}
    </StartupContext.Provider>
  );
}

export function useStartup() {
  return useContext(StartupContext);
}
