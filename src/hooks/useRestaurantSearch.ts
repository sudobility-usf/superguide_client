import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type {
  NetworkClient,
  Optional,
  Restaurant,
} from '@sudobility/superguide_types';
import { StarterClient } from '../network/StarterClient';
import { DEFAULT_GC_TIME, DEFAULT_STALE_TIME, QUERY_KEYS } from '../types';

/**
 * Return type for the {@link useRestaurantSearch} hook.
 */
export interface UseRestaurantSearchReturn {
  /** The list of matching restaurants, or empty array if not yet loaded. */
  restaurants: Restaurant[];
  /** Whether the query is currently loading. */
  isLoading: boolean;
  /** An error message if the query failed, or `null` if no error. */
  error: Optional<string>;
  /** Function to manually trigger a refetch. */
  refetch: () => void;
}

/**
 * TanStack Query hook that searches for restaurants by dish and location.
 *
 * This uses a public endpoint and does not require authentication.
 * The query is only enabled when both `dish` and `location` are provided.
 *
 * @param networkClient - A {@link NetworkClient} implementation for HTTP requests
 * @param baseUrl - The base URL of the Superguide API
 * @param dish - The dish to search for
 * @param location - The location to search near
 * @param options - Optional configuration
 * @param options.enabled - Whether the query should execute (default: `true`)
 * @returns An object containing the restaurants list, loading state, error, and refetch function
 */
export const useRestaurantSearch = (
  networkClient: NetworkClient,
  baseUrl: string,
  dish: string | undefined,
  location: string | undefined,
  options?: { enabled?: boolean }
): UseRestaurantSearchReturn => {
  const enabled = (options?.enabled ?? true) && !!dish && !!location;

  const client = useMemo(
    () => new StarterClient({ baseUrl, networkClient }),
    [baseUrl, networkClient]
  );

  const {
    data,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEYS.restaurantSearch(dish ?? '', location ?? ''),
    queryFn: async () => {
      const response = await client.searchRestaurants({
        dish: dish!,
        location: location!,
      });
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to search restaurants');
      }
      return response.data;
    },
    enabled,
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
  });

  const error = queryError instanceof Error ? queryError.message : null;

  return useMemo(
    () => ({
      restaurants: data?.restaurants ?? [],
      isLoading,
      error,
      refetch,
    }),
    [data, isLoading, error, refetch]
  );
};
