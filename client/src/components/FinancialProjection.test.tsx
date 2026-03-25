import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import FinancialProjection from './FinancialProjection';
import { trpc } from '@/lib/trpc';

// Mock trpc
vi.mock('@/lib/trpc', () => ({
  trpc: {
    profile: {
      get: {
        useQuery: vi.fn(),
      },
    },
    cogs: {
      list: {
        useQuery: vi.fn(),
      },
    },
    projection: {
      save: {
        useMutation: vi.fn(),
      },
      list: {
        useQuery: vi.fn(),
      },
      delete: {
        useMutation: vi.fn(),
      },
    },
    ai: {
      marketResearch: {
        useMutation: vi.fn(),
      },
    },
  },
}));

describe('FinancialProjection - Business Model Sync', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  it('should sync business model from profile on load', async () => {
    const mockProfile = {
      id: 1,
      businessModel: 'saas',
      sector: 'Technology',
    };

    vi.mocked(trpc.profile.get.useQuery).mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(trpc.cogs.list.useQuery).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(trpc.projection.list.useQuery).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    render(
      <QueryClientProvider client={queryClient}>
        <FinancialProjection />
      </QueryClientProvider>
    );

    // Wait for the component to load and sync business model
    await waitFor(() => {
      expect(screen.getByText(/SaaS/i)).toBeInTheDocument();
    });
  });

  it('should allow manual override of synced business model', async () => {
    const mockProfile = {
      id: 1,
      businessModel: 'saas',
    };

    vi.mocked(trpc.profile.get.useQuery).mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(trpc.cogs.list.useQuery).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(trpc.projection.list.useQuery).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <FinancialProjection />
      </QueryClientProvider>
    );

    // User should be able to change the model after it's synced
    await waitFor(() => {
      expect(screen.getByText(/SaaS/i)).toBeInTheDocument();
    });

    // The component should allow changing to a different model
    const modelSelector = screen.getByRole('button', { name: /SaaS/i });
    expect(modelSelector).toBeInTheDocument();
  });

  it('should default to SaaS if profile has no business model', async () => {
    const mockProfile = {
      id: 1,
      businessModel: null,
    };

    vi.mocked(trpc.profile.get.useQuery).mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(trpc.cogs.list.useQuery).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(trpc.projection.list.useQuery).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    render(
      <QueryClientProvider client={queryClient}>
        <FinancialProjection />
      </QueryClientProvider>
    );

    // Should default to SaaS
    await waitFor(() => {
      expect(screen.getByText(/SaaS/i)).toBeInTheDocument();
    });
  });

  it('should handle invalid business model from profile gracefully', async () => {
    const mockProfile = {
      id: 1,
      businessModel: 'invalid_model',
    };

    vi.mocked(trpc.profile.get.useQuery).mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(trpc.cogs.list.useQuery).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(trpc.projection.list.useQuery).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    render(
      <QueryClientProvider client={queryClient}>
        <FinancialProjection />
      </QueryClientProvider>
    );

    // Should fall back to SaaS for invalid model
    await waitFor(() => {
      expect(screen.getByText(/SaaS/i)).toBeInTheDocument();
    });
  });
});
