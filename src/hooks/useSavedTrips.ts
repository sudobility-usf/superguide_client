import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  BaseResponse,
  NetworkClient,
  Optional,
  Trip,
  TripCreateRequest,
} from '@sudobility/superguide_types';
import type { FirebaseIdToken } from '../types';
import { SuperguideClient } from '../network/SuperguideClient';
import { DEFAULT_GC_TIME, DEFAULT_STALE_TIME, QUERY_KEYS } from '../types';

const EMPTY_TRIPS: Trip[] = [];

/**
 * Return type for the {@link useSavedTrips} hook.
 */
export interface UseSavedTripsReturn {
  /** The user's saved trips, newest-first. Empty array before load. */
  trips: Trip[];
  /** Whether the query is currently loading. */
  isLoading: boolean;
  /** Most recent error from query or mutations, or `null`. */
  error: Optional<string>;
  /** Trigger a refetch of the trips list. */
  update: () => void;
  /** Persist a newly generated trip. */
  createTrip: (data: TripCreateRequest) => Promise<BaseResponse<Trip>>;
  /** Delete a saved trip by id. */
  deleteTrip: (tripId: string) => Promise<BaseResponse<void>>;
  isCreating: boolean;
  isDeleting: boolean;
  clearError: () => void;
}

/**
 * TanStack Query hook that fetches a user's saved trips and exposes
 * create/delete mutations, mirroring the shape of {@link useHistories}.
 *
 * The query is disabled when `userId` or `token` is `null`.
 */
export const useSavedTrips = (
  networkClient: NetworkClient,
  baseUrl: string,
  userId: string | null,
  token: FirebaseIdToken | null,
  options?: { enabled?: boolean }
): UseSavedTripsReturn => {
  const enabled = (options?.enabled ?? true) && !!userId && !!token;

  const client = useMemo(
    () => new SuperguideClient({ baseUrl, networkClient }),
    [baseUrl, networkClient]
  );

  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEYS.savedTrips(userId ?? ''),
    queryFn: async () => {
      const response = await client.listTrips(userId!, token!);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch trips');
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
        queryKey: QUERY_KEYS.savedTrips(userId),
      });
    }
  }, [queryClient, userId]);

  const createMutation = useMutation({
    mutationFn: async (input: TripCreateRequest) =>
      client.createTrip(userId!, input, token!),
    onSuccess: response => {
      if (response.success) invalidate();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (tripId: string) =>
      client.deleteTrip(userId!, tripId, token!),
    onSuccess: response => {
      if (response.success) invalidate();
    },
  });

  const createTrip = useCallback(
    (input: TripCreateRequest) => createMutation.mutateAsync(input),
    [createMutation]
  );
  const deleteTrip = useCallback(
    (tripId: string) => deleteMutation.mutateAsync(tripId),
    [deleteMutation]
  );

  const mutationError = createMutation.error ?? deleteMutation.error;
  const queryErrorMessage =
    queryError instanceof Error ? queryError.message : null;
  const mutationErrorMessage =
    mutationError instanceof Error ? mutationError.message : null;
  const error = queryErrorMessage ?? mutationErrorMessage;

  const clearError = useCallback(() => {
    createMutation.reset();
    deleteMutation.reset();
  }, [createMutation, deleteMutation]);

  return useMemo(
    () => ({
      trips: data ?? EMPTY_TRIPS,
      isLoading,
      error,
      update: refetch,
      createTrip,
      deleteTrip,
      isCreating: createMutation.isPending,
      isDeleting: deleteMutation.isPending,
      clearError,
    }),
    [
      data,
      isLoading,
      error,
      refetch,
      createTrip,
      deleteTrip,
      createMutation.isPending,
      deleteMutation.isPending,
      clearError,
    ]
  );
};
