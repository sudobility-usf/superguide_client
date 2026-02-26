import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  BaseResponse,
  History,
  HistoryCreateRequest,
  HistoryUpdateRequest,
  NetworkClient,
  Optional,
} from '@sudobility/superguide_types';
import type { FirebaseIdToken } from '../types';
import { StarterClient } from '../network/StarterClient';
import { DEFAULT_GC_TIME, DEFAULT_STALE_TIME, QUERY_KEYS } from '../types';

const EMPTY_HISTORIES: History[] = [];

/**
 * Return type for the {@link useHistories} hook.
 */
export interface UseHistoriesReturn {
  /** The list of histories for the user, or an empty array if not yet loaded. */
  histories: History[];
  /** Whether the query is currently loading. */
  isLoading: boolean;
  /** An error message if the query or any mutation failed, or `null` if no error. */
  error: Optional<string>;
  /** Function to manually trigger an update of the histories. */
  update: () => void;
  /**
   * Creates a new history entry.
   *
   * @param data - The history data to create
   * @returns The created history wrapped in a {@link BaseResponse}
   */
  createHistory: (data: HistoryCreateRequest) => Promise<BaseResponse<History>>;
  /**
   * Updates an existing history entry.
   *
   * @param historyId - The ID of the history to update
   * @param data - The fields to update
   * @returns The updated history wrapped in a {@link BaseResponse}
   */
  updateHistory: (
    historyId: string,
    data: HistoryUpdateRequest
  ) => Promise<BaseResponse<History>>;
  /**
   * Deletes a history entry.
   *
   * @param historyId - The ID of the history to delete
   * @returns A void response wrapped in a {@link BaseResponse}
   */
  deleteHistory: (historyId: string) => Promise<BaseResponse<void>>;
  /** Whether a create mutation is currently in progress. */
  isCreating: boolean;
  /** Whether an update mutation is currently in progress. */
  isUpdating: boolean;
  /** Whether a delete mutation is currently in progress. */
  isDeleting: boolean;
  /** Resets all mutation error states. */
  clearError: () => void;
}

/**
 * TanStack Query hook that fetches a user's history list and provides
 * mutation functions for creating, updating, and deleting history entries.
 *
 * Automatically manages caching, background refetching, error state, and
 * query invalidation after successful mutations.
 *
 * The query is disabled when `userId` or `token` is `null`, or when
 * `options.enabled` is `false`.
 *
 * @param networkClient - A {@link NetworkClient} implementation for HTTP requests
 * @param baseUrl - The base URL of the Starter API
 * @param userId - The Firebase UID of the user, or `null` if not authenticated
 * @param token - A valid Firebase ID token, or `null` if not authenticated
 * @param options - Optional configuration
 * @param options.enabled - Whether the query should execute (default: `true`)
 * @returns An object containing histories data, loading state, error, update, and mutation functions
 *
 * @example
 * ```typescript
 * import { useHistories } from '@sudobility/superguide_client';
 *
 * function HistoryList() {
 *   const { histories, isLoading, error, createHistory } = useHistories(
 *     networkClient,
 *     'https://api.example.com',
 *     userId,
 *     idToken
 *   );
 *
 *   if (isLoading) return <Loading />;
 *   if (error) return <Error message={error} />;
 *   return <List items={histories} />;
 * }
 * ```
 */
export const useHistories = (
  networkClient: NetworkClient,
  baseUrl: string,
  userId: string | null,
  token: FirebaseIdToken | null,
  options?: { enabled?: boolean }
): UseHistoriesReturn => {
  const enabled = (options?.enabled ?? true) && !!userId && !!token;

  const client = useMemo(
    () => new StarterClient({ baseUrl, networkClient }),
    [baseUrl, networkClient]
  );

  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEYS.histories(userId ?? ''),
    queryFn: async () => {
      const response = await client.getHistories(userId!, token!);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch histories');
      }
      return response.data;
    },
    enabled,
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
  });

  const invalidate = useCallback(() => {
    if (userId) {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.histories(userId),
      });
    }
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.historiesTotal(),
    });
  }, [queryClient, userId]);

  const createMutation = useMutation({
    mutationFn: async (data: HistoryCreateRequest) => {
      return client.createHistory(userId!, data, token!);
    },
    onSuccess: response => {
      if (response.success) invalidate();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      historyId,
      data,
    }: {
      historyId: string;
      data: HistoryUpdateRequest;
    }) => {
      return client.updateHistory(userId!, historyId, data, token!);
    },
    onSuccess: response => {
      if (response.success) invalidate();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (historyId: string) => {
      return client.deleteHistory(userId!, historyId, token!);
    },
    onSuccess: response => {
      if (response.success) invalidate();
    },
  });

  const createHistory = useCallback(
    (data: HistoryCreateRequest) => createMutation.mutateAsync(data),
    [createMutation]
  );

  const updateHistory = useCallback(
    (historyId: string, data: HistoryUpdateRequest) =>
      updateMutation.mutateAsync({ historyId, data }),
    [updateMutation]
  );

  const deleteHistory = useCallback(
    (historyId: string) => deleteMutation.mutateAsync(historyId),
    [deleteMutation]
  );

  const mutationError =
    createMutation.error ?? updateMutation.error ?? deleteMutation.error;

  const queryErrorMessage =
    queryError instanceof Error ? queryError.message : null;
  const mutationErrorMessage =
    mutationError instanceof Error ? mutationError.message : null;
  const error = queryErrorMessage ?? mutationErrorMessage;

  const clearError = useCallback(() => {
    createMutation.reset();
    updateMutation.reset();
    deleteMutation.reset();
  }, [createMutation, updateMutation, deleteMutation]);

  return useMemo(
    () => ({
      histories: data ?? EMPTY_HISTORIES,
      isLoading,
      error,
      update: refetch,
      createHistory,
      updateHistory,
      deleteHistory,
      isCreating: createMutation.isPending,
      isUpdating: updateMutation.isPending,
      isDeleting: deleteMutation.isPending,
      clearError,
    }),
    [
      data,
      isLoading,
      error,
      refetch,
      createHistory,
      updateHistory,
      deleteHistory,
      createMutation.isPending,
      updateMutation.isPending,
      deleteMutation.isPending,
      clearError,
    ]
  );
};
