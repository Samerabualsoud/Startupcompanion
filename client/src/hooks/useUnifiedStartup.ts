/**
 * useUnifiedStartup — Hook for accessing unified startup data
 * Replaces fragmented data sources with single source of truth
 */

import { useCallback } from 'react';
import { trpc } from '@/lib/trpc';

export function useUnifiedStartup() {
  const utils = trpc.useUtils();

  // Get unified startup data
  const { data: startup, isLoading } = trpc.startup.getUnified.useQuery(undefined, {
    staleTime: 1000 * 60 * 5, // 5 min
    refetchOnWindowFocus: false,
  });

  // Update profile mutation
  const updateProfileMutation = trpc.startup.updateProfile.useMutation({
    onSuccess: () => {
      utils.startup.getUnified.invalidate();
    },
  });

  // Update cofounders mutation
  const updateCofoundersMutation = trpc.startup.updateCofounders.useMutation({
    onSuccess: () => {
      utils.startup.getUnified.invalidate();
    },
  });

  // Update financials mutation
  const updateFinancialsMutation = trpc.startup.updateFinancials.useMutation({
    onSuccess: () => {
      utils.startup.getUnified.invalidate();
    },
  });

  // Get cap table data
  const { data: capTable } = trpc.startup.getCapTable.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  const updateProfile = useCallback(
    (data: Parameters<typeof updateProfileMutation.mutateAsync>[0]) => {
      return updateProfileMutation.mutateAsync(data);
    },
    [updateProfileMutation]
  );

  const updateCofounders = useCallback(
    (cofounders: Array<{
      id: string;
      name: string;
      email?: string;
      ownership: number;
      shares?: number;
      color?: string;
    }>) => {
      return updateCofoundersMutation.mutateAsync({ cofounders });
    },
    [updateCofoundersMutation]
  );

  const updateFinancials = useCallback(
    (data: Parameters<typeof updateFinancialsMutation.mutateAsync>[0]) => {
      return updateFinancialsMutation.mutateAsync(data);
    },
    [updateFinancialsMutation]
  );

  return {
    // Data
    startup,
    capTable,
    isLoading,
    
    // Mutations
    updateProfile,
    updateCofounders,
    updateFinancials,
    
    // Loading states
    isUpdatingProfile: updateProfileMutation.isPending,
    isUpdatingCofounders: updateCofoundersMutation.isPending,
    isUpdatingFinancials: updateFinancialsMutation.isPending,
  };
}
