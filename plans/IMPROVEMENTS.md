# Improvement Plans for @sudobility/starter_client

## Priority 1 - High Impact

### 1. Add JSDoc Documentation to Public API Surface -- COMPLETED
- `StarterClient` class and all its methods (`getUser`, `getHistories`, `createHistory`, `updateHistory`, `deleteHistory`, `getHistoriesTotal`) have zero JSDoc comments
- Hook functions (`useHistories`, `useHistoriesTotal`, `useHistoryMutations`) lack parameter documentation and usage examples
- The `QUERY_KEYS` factory object has no documentation explaining its purpose or how consumers should use it for manual cache invalidation
- Utility functions (`createAuthHeaders`, `createHeaders`, `buildUrl`, `handleApiError`) in `starter-helpers.ts` have no JSDoc
- As a published SDK, API documentation is critical for downstream consumers

### 2. Improve Error Handling in StarterClient Methods -- COMPLETED
- All `StarterClient` methods use bare `as` type assertions on response data (e.g., `response.data as BaseResponse<History[]>`) with no runtime validation
- If the API returns an unexpected response shape, errors will surface much later in consuming code rather than at the client layer
- The `handleApiError` utility exists in `starter-helpers.ts` but is never used by any `StarterClient` method -- it appears to be dead code
- Network errors (timeouts, connection refused) are not caught or wrapped with meaningful context
- Consider adding response shape validation or at least defensive checks before the type assertion

### 3. Add Tests for Hook Functions -- SKIPPED (requires React test infrastructure with TanStack Query wrapper)
- Only `StarterClient` has test coverage (`StarterClient.test.ts`)
- `useHistories`, `useHistoriesTotal`, and `useHistoryMutations` hooks have zero test coverage
- These hooks contain significant logic: enabled/disabled state derivation, error extraction, memoization, query invalidation on mutation success
- Hook testing would require a TanStack Query test wrapper but would catch regressions in cache invalidation behavior, which is critical for data consistency

## Priority 2 - Medium Impact

### 3. Eliminate Redundant StarterClient Instantiation Across Hooks -- SKIPPED (architectural change: context/provider pattern)
- Each hook (`useHistories`, `useHistoriesTotal`, `useHistoryMutations`) independently creates its own `StarterClient` instance via `useMemo`
- When a consumer uses all three hooks with the same `baseUrl` and `networkClient`, three separate client instances are created
- Consider accepting a pre-built `StarterClient` instance as a parameter, or providing a context/provider pattern that shares a single instance
- This would reduce memory overhead and simplify the hook signatures

### 4. Add Retry and Timeout Configuration -- PARTIALLY COMPLETED
- Hooks use default TanStack Query retry behavior with no project-specific configuration
- `staleTime` (5 min) and `gcTime` (30 min) are hardcoded in each hook rather than centralized as configurable defaults
- No timeout handling exists at the `StarterClient` level -- a hung request will block indefinitely
- Consider exposing cache timing as configurable options and adding a request timeout to the client

## Priority 3 - Nice to Have

### 5. Add Utility Tests for starter-helpers.ts -- COMPLETED
- `createAuthHeaders`, `createHeaders`, `buildUrl`, and `handleApiError` have no dedicated tests
- The `buildUrl` function's trailing-slash handling is only tested indirectly through `StarterClient.test.ts`
- `handleApiError` appears to be dead code -- if it is intentionally exported for consumer use, it needs tests; if not, it should be removed

### 6. Add Optimistic Update Support to Mutation Hooks -- SKIPPED (significant architectural addition)
- `useHistoryMutations` currently waits for server response before updating the UI (via query invalidation)
- For better perceived performance, the mutation hooks could support optimistic updates that immediately update the TanStack Query cache and roll back on failure
- This would require coordinating with the `QUERY_KEYS` structure and the expected response shapes
