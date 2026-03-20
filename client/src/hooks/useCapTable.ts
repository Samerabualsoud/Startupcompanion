/**
 * useCapTable — Unified cap table hook
 * Single source of truth for all equity tools.
 * Loads from DB, provides typed state + updaters, auto-saves with debounce.
 */
import { useCallback, useEffect, useRef } from 'react';
import { trpc } from '@/lib/trpc';
import type { CapTableState, CapTableShareholder, CapTableInstrument, EsopPool, FundingRound } from '@shared/equity';
import { buildCapTableRows } from '@shared/equity';

const DEBOUNCE_MS = 1200;

export function useCapTable() {
  const utils = trpc.useUtils();

  // ── Load ──────────────────────────────────────────────────────────────────
  const { data: state, isLoading } = trpc.equity.get.useQuery(undefined, {
    staleTime: 1000 * 60 * 5, // 5 min
    refetchOnWindowFocus: false,
  });

  // ── Save mutation ─────────────────────────────────────────────────────────
  const saveMutation = trpc.equity.save.useMutation({
    onSuccess: () => utils.equity.get.invalidate(),
  });

  // ── Debounced save ────────────────────────────────────────────────────────
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveState = useCallback((newState: CapTableState) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveMutation.mutate({ state: newState });
    }, DEBOUNCE_MS);
  }, [saveMutation]);

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  // ── Updaters ──────────────────────────────────────────────────────────────
  function update(patch: Partial<CapTableState>) {
    if (!state) return;
    const next = { ...state, ...patch };
    utils.equity.get.setData(undefined, next);
    saveState(next);
  }

  function setShareholders(shareholders: CapTableShareholder[]) {
    update({ shareholders });
  }

  function setInstruments(instruments: CapTableInstrument[]) {
    update({ instruments });
  }

  function setEsop(esop: EsopPool) {
    update({ esop });
  }

  function setRounds(rounds: FundingRound[]) {
    update({ rounds });
  }

  function setNextRound(preMoneyValuation: number, investment: number) {
    update({ nextRoundPreMoneyValuation: preMoneyValuation, nextRoundInvestment: investment });
  }

  // ── Computed ──────────────────────────────────────────────────────────────
  const computed = state ? buildCapTableRows(state) : null;

  return {
    state,
    isLoading,
    computed,
    update,
    setShareholders,
    setInstruments,
    setEsop,
    setRounds,
    setNextRound,
    isSaving: saveMutation.isPending,
  };
}
