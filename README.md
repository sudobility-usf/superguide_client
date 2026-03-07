# @sudobility/superguide_client

API client SDK for Superguide with TanStack Query hooks.

## Installation

```bash
bun add @sudobility/superguide_client
```

Peer dependencies: `react` (>=18), `@tanstack/react-query` (>=5), `@sudobility/types`.

## Usage

```ts
import { SuperguideClient } from "@sudobility/superguide_client";
import { useHistories, useHistoriesTotal } from "@sudobility/superguide_client/hooks";

// HTTP client (dependency-injected NetworkClient)
const client = new SuperguideClient({ baseUrl, networkClient });

// React hooks
const { data, createHistory, updateHistory, deleteHistory } = useHistories(config);
const { data: total } = useHistoriesTotal(config);
```

## API

### SuperguideClient

HTTP client class constructed with `{ baseUrl, networkClient }`. Uses dependency injection via the `NetworkClient` interface -- no direct fetch calls.

### Hooks

- `useHistories(config)` -- query + mutations for user histories with automatic cache invalidation
- `useHistoriesTotal(config)` -- query for global total (public endpoint)

### Utilities

- `createAuthHeaders(token)` -- build Authorization header
- `buildUrl(base, path)` -- construct API URLs
- `handleApiError(error)` -- standardized error handling
- `QUERY_KEYS` -- type-safe cache key factory for TanStack Query

## Development

```bash
bun run build          # Build ESM
bun test               # Run Vitest tests
bun run typecheck      # TypeScript check
bun run lint           # ESLint
bun run verify         # All checks + build (use before commit)
```

## Related Packages

- **superguide_types** -- Shared type definitions
- **superguide_api** -- Backend server this client communicates with
- **superguide_lib** -- Business logic layer that wraps this client
- **superguide_app** -- Web frontend
- **superguide_app_rn** -- React Native mobile app

## License

BUSL-1.1
