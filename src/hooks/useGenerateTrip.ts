import { useCallback, useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import type {
  BaseResponse,
  NetworkClient,
  Optional,
  TripGenerateRequest,
  TripGenerateResponse,
} from '@sudobility/superguide_types';
import { StarterClient } from '../network/StarterClient';

/**
 * Return type for the {@link useGenerateTrip} hook.
 */
export interface UseGenerateTripReturn {
  /** Triggers trip generation with the given request data. */
  generateTrip: (data: TripGenerateRequest) => Promise<BaseResponse<TripGenerateResponse>>;
  /** Whether a trip generation request is currently in progress. */
  isGenerating: boolean;
  /** An error message if the generation failed, or `null`. */
  error: Optional<string>;
  /** The most recent successful response, or `null`. */
  data: Optional<TripGenerateResponse>;
  /** Resets the mutation state (error, data). */
  reset: () => void;
}

/**
 * Hook for generating trip itineraries via the API.
 *
 * Uses a mutation (not a query) since trip generation is an on-demand action,
 * not a cached data fetch.
 *
 * @param networkClient - A {@link NetworkClient} implementation for HTTP requests
 * @param baseUrl - The base URL of the API
 * @returns An object with the generate function, loading state, error, and result data
 */
export const useGenerateTrip = (
  networkClient: NetworkClient,
  baseUrl: string,
): UseGenerateTripReturn => {
  const client = useMemo(
    () => new StarterClient({ baseUrl, networkClient }),
    [baseUrl, networkClient]
  );

  const mutation = useMutation({
    mutationFn: async (data: TripGenerateRequest) => {
      return client.generateTrip(data);
    },
  });

  const generateTrip = useCallback(
    (data: TripGenerateRequest) => mutation.mutateAsync(data),
    [mutation]
  );

  const error = mutation.error instanceof Error ? mutation.error.message : null;
  const data = mutation.data?.success ? mutation.data.data : null;

  return useMemo(
    () => ({
      generateTrip,
      isGenerating: mutation.isPending,
      error,
      data,
      reset: mutation.reset,
    }),
    [generateTrip, mutation.isPending, error, data, mutation.reset]
  );
};
