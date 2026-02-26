import type { NetworkClient } from '@sudobility/types';
import type {
  BaseResponse,
  History,
  HistoryCreateRequest,
  HistoryTotalResponse,
  HistoryUpdateRequest,
  User,
} from '@sudobility/superguide_types';
import type { FirebaseIdToken } from '../types';
import {
  buildUrl,
  createAuthHeaders,
  createHeaders,
} from '../utils/starter-helpers';

/**
 * Validates that a response from the API conforms to the expected {@link BaseResponse} shape.
 *
 * Performs a defensive check that the response has a `success` boolean field,
 * guarding against unexpected response shapes from the network layer.
 *
 * @param data - The raw response data from the network client
 * @param operation - Description of the operation, used in the error message if validation fails
 * @returns The validated response cast to `BaseResponse<T>`
 * @throws {Error} If the response does not have a `success` boolean field
 *
 * @internal
 */
function validateResponse<T>(
  data: unknown,
  operation: string
): BaseResponse<T> {
  if (
    data != null &&
    typeof data === 'object' &&
    'success' in data &&
    typeof (data as Record<string, unknown>).success === 'boolean'
  ) {
    return data as BaseResponse<T>;
  }
  throw new Error(
    `Invalid API response for ${operation}: response does not match expected BaseResponse shape`
  );
}

/**
 * HTTP client for the Starter API.
 *
 * Communicates with the Starter backend using dependency-injected {@link NetworkClient}.
 * All HTTP calls go through the injected `networkClient` -- this class never uses `fetch` directly.
 *
 * @example
 * ```typescript
 * import { StarterClient } from '@sudobility/superguide_client';
 *
 * const client = new StarterClient({
 *   baseUrl: 'https://api.example.com',
 *   networkClient: myNetworkClient,
 * });
 *
 * // Fetch user profile
 * const user = await client.getUser(userId, idToken);
 *
 * // Fetch all histories
 * const histories = await client.getHistories(userId, idToken);
 * ```
 */
export class StarterClient {
  private readonly baseUrl: string;
  private readonly networkClient: NetworkClient;

  /**
   * Creates a new StarterClient instance.
   *
   * @param config - Client configuration
   * @param config.baseUrl - The base URL of the Starter API (e.g., `"https://api.example.com"`)
   * @param config.networkClient - A {@link NetworkClient} implementation for making HTTP requests
   */
  constructor(config: { baseUrl: string; networkClient: NetworkClient }) {
    this.baseUrl = config.baseUrl;
    this.networkClient = config.networkClient;
  }

  // --- User ---

  /**
   * Fetches a user profile by ID.
   *
   * @param userId - The Firebase UID of the user to fetch
   * @param token - A valid Firebase ID token for authentication
   * @returns The user profile wrapped in a {@link BaseResponse}
   * @throws {Error} If the response does not match the expected shape
   *
   * @example
   * ```typescript
   * const response = await client.getUser('user-123', idToken);
   * if (response.success && response.data) {
   *   console.log(response.data.email);
   * }
   * ```
   */
  async getUser(
    userId: string,
    token: FirebaseIdToken
  ): Promise<BaseResponse<User>> {
    const url = buildUrl(this.baseUrl, `/api/v1/users/${userId}`);
    const response = await this.networkClient.get(url, {
      headers: createAuthHeaders(token),
    });
    return validateResponse<User>(response.data, 'getUser');
  }

  // --- Histories ---

  /**
   * Fetches all histories for a user.
   *
   * @param userId - The Firebase UID of the user whose histories to fetch
   * @param token - A valid Firebase ID token for authentication
   * @returns The list of histories wrapped in a {@link BaseResponse}
   * @throws {Error} If the response does not match the expected shape
   *
   * @example
   * ```typescript
   * const response = await client.getHistories('user-123', idToken);
   * if (response.success && response.data) {
   *   response.data.forEach(history => console.log(history.value));
   * }
   * ```
   */
  async getHistories(
    userId: string,
    token: FirebaseIdToken
  ): Promise<BaseResponse<History[]>> {
    const url = buildUrl(this.baseUrl, `/api/v1/users/${userId}/histories`);
    const response = await this.networkClient.get(url, {
      headers: createAuthHeaders(token),
    });
    return validateResponse<History[]>(response.data, 'getHistories');
  }

  /**
   * Creates a new history entry for a user.
   *
   * @param userId - The Firebase UID of the user
   * @param data - The history data to create
   * @param token - A valid Firebase ID token for authentication
   * @returns The created history wrapped in a {@link BaseResponse}
   * @throws {Error} If the response does not match the expected shape
   *
   * @example
   * ```typescript
   * const response = await client.createHistory('user-123', {
   *   datetime: '2024-01-01T00:00:00Z',
   *   value: 100,
   * }, idToken);
   * ```
   */
  async createHistory(
    userId: string,
    data: HistoryCreateRequest,
    token: FirebaseIdToken
  ): Promise<BaseResponse<History>> {
    const url = buildUrl(this.baseUrl, `/api/v1/users/${userId}/histories`);
    const response = await this.networkClient.post(url, data, {
      headers: createAuthHeaders(token),
    });
    return validateResponse<History>(response.data, 'createHistory');
  }

  /**
   * Updates an existing history entry.
   *
   * @param userId - The Firebase UID of the user
   * @param historyId - The ID of the history to update
   * @param data - The fields to update on the history
   * @param token - A valid Firebase ID token for authentication
   * @returns The updated history wrapped in a {@link BaseResponse}
   * @throws {Error} If the response does not match the expected shape
   *
   * @example
   * ```typescript
   * const response = await client.updateHistory('user-123', 'hist-456', {
   *   value: 200,
   * }, idToken);
   * ```
   */
  async updateHistory(
    userId: string,
    historyId: string,
    data: HistoryUpdateRequest,
    token: FirebaseIdToken
  ): Promise<BaseResponse<History>> {
    const url = buildUrl(
      this.baseUrl,
      `/api/v1/users/${userId}/histories/${historyId}`
    );
    const response = await this.networkClient.put(url, data, {
      headers: createAuthHeaders(token),
    });
    return validateResponse<History>(response.data, 'updateHistory');
  }

  /**
   * Deletes a history entry.
   *
   * @param userId - The Firebase UID of the user
   * @param historyId - The ID of the history to delete
   * @param token - A valid Firebase ID token for authentication
   * @returns A void response wrapped in a {@link BaseResponse}
   * @throws {Error} If the response does not match the expected shape
   *
   * @example
   * ```typescript
   * const response = await client.deleteHistory('user-123', 'hist-456', idToken);
   * if (response.success) {
   *   console.log('History deleted');
   * }
   * ```
   */
  async deleteHistory(
    userId: string,
    historyId: string,
    token: FirebaseIdToken
  ): Promise<BaseResponse<void>> {
    const url = buildUrl(
      this.baseUrl,
      `/api/v1/users/${userId}/histories/${historyId}`
    );
    const response = await this.networkClient.delete(url, {
      headers: createAuthHeaders(token),
    });
    return validateResponse<void>(response.data, 'deleteHistory');
  }

  // --- Total (public) ---

  /**
   * Fetches the global total count of all histories.
   *
   * This is a public endpoint that does not require authentication.
   *
   * @returns The total count wrapped in a {@link BaseResponse}
   * @throws {Error} If the response does not match the expected shape
   *
   * @example
   * ```typescript
   * const response = await client.getHistoriesTotal();
   * if (response.success && response.data) {
   *   console.log(`Total histories: ${response.data.total}`);
   * }
   * ```
   */
  async getHistoriesTotal(): Promise<BaseResponse<HistoryTotalResponse>> {
    const url = buildUrl(this.baseUrl, '/api/v1/histories/total');
    const response = await this.networkClient.get(url, {
      headers: createHeaders(),
    });
    return validateResponse<HistoryTotalResponse>(
      response.data,
      'getHistoriesTotal'
    );
  }
}
