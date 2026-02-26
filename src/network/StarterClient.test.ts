import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StarterClient } from './StarterClient';
import type { NetworkClient } from '@sudobility/types';

function createMockNetworkClient(
  responseData: unknown = { success: true, data: null, timestamp: '2024-01-01T00:00:00Z' }
): NetworkClient {
  const mockResponse = { data: responseData };
  return {
    get: vi.fn().mockResolvedValue(mockResponse),
    post: vi.fn().mockResolvedValue(mockResponse),
    put: vi.fn().mockResolvedValue(mockResponse),
    delete: vi.fn().mockResolvedValue(mockResponse),
  };
}

describe('StarterClient', () => {
  const baseUrl = 'https://api.example.com';
  let mockNetworkClient: NetworkClient;
  let client: StarterClient;

  beforeEach(() => {
    mockNetworkClient = createMockNetworkClient();
    client = new StarterClient({ baseUrl, networkClient: mockNetworkClient });
  });

  describe('constructor', () => {
    it('should create a client instance', () => {
      expect(client).toBeInstanceOf(StarterClient);
    });
  });

  describe('getUser', () => {
    it('should call GET with correct URL', async () => {
      await client.getUser('user-123', 'token-abc');
      expect(mockNetworkClient.get).toHaveBeenCalledWith(
        'https://api.example.com/api/v1/users/user-123',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer token-abc',
          }),
        })
      );
    });

    it('should return response data', async () => {
      const userData = {
        success: true,
        data: {
          firebase_uid: 'user-123',
          email: 'test@example.com',
          display_name: 'Test',
          created_at: null,
          updated_at: null,
        },
        timestamp: '2024-01-01T00:00:00Z',
      };
      mockNetworkClient = createMockNetworkClient(userData);
      client = new StarterClient({ baseUrl, networkClient: mockNetworkClient });

      const result = await client.getUser('user-123', 'token');
      expect(result.success).toBe(true);
      expect(result.data!.firebase_uid).toBe('user-123');
    });

    it('should throw on invalid response shape', async () => {
      mockNetworkClient = createMockNetworkClient('not an object');
      client = new StarterClient({ baseUrl, networkClient: mockNetworkClient });

      await expect(client.getUser('user-123', 'token')).rejects.toThrow(
        'Invalid API response for getUser'
      );
    });
  });

  describe('getHistories', () => {
    it('should call GET with correct URL', async () => {
      await client.getHistories('user-123', 'token-abc');
      expect(mockNetworkClient.get).toHaveBeenCalledWith(
        'https://api.example.com/api/v1/users/user-123/histories',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer token-abc',
          }),
        })
      );
    });
  });

  describe('createHistory', () => {
    it('should call POST with correct URL and body', async () => {
      const data = { datetime: '2024-01-01T00:00:00Z', value: 100 };
      await client.createHistory('user-123', data, 'token-abc');
      expect(mockNetworkClient.post).toHaveBeenCalledWith(
        'https://api.example.com/api/v1/users/user-123/histories',
        data,
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer token-abc',
          }),
        })
      );
    });
  });

  describe('updateHistory', () => {
    it('should call PUT with correct URL and body', async () => {
      const data = { value: 200 };
      await client.updateHistory('user-123', 'hist-456', data, 'token-abc');
      expect(mockNetworkClient.put).toHaveBeenCalledWith(
        'https://api.example.com/api/v1/users/user-123/histories/hist-456',
        data,
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer token-abc',
          }),
        })
      );
    });
  });

  describe('deleteHistory', () => {
    it('should call DELETE with correct URL', async () => {
      await client.deleteHistory('user-123', 'hist-456', 'token-abc');
      expect(mockNetworkClient.delete).toHaveBeenCalledWith(
        'https://api.example.com/api/v1/users/user-123/histories/hist-456',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer token-abc',
          }),
        })
      );
    });
  });

  describe('getHistoriesTotal', () => {
    it('should call GET with correct URL without auth', async () => {
      await client.getHistoriesTotal();
      expect(mockNetworkClient.get).toHaveBeenCalledWith(
        'https://api.example.com/api/v1/histories/total',
        expect.objectContaining({
          headers: expect.not.objectContaining({
            Authorization: expect.any(String),
          }),
        })
      );
    });

    it('should include Content-Type header', async () => {
      await client.getHistoriesTotal();
      expect(mockNetworkClient.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });
  });

  describe('URL construction', () => {
    it('should strip trailing slash from baseUrl', async () => {
      const trailingSlashClient = new StarterClient({
        baseUrl: 'https://api.example.com/',
        networkClient: mockNetworkClient,
      });
      await trailingSlashClient.getHistoriesTotal();
      expect(mockNetworkClient.get).toHaveBeenCalledWith(
        'https://api.example.com/api/v1/histories/total',
        expect.any(Object)
      );
    });
  });

  describe('response validation', () => {
    it('should accept valid BaseResponse with success: true', async () => {
      const validResponse = {
        success: true,
        data: { total: 42 },
        timestamp: '2024-01-01T00:00:00Z',
      };
      mockNetworkClient = createMockNetworkClient(validResponse);
      client = new StarterClient({ baseUrl, networkClient: mockNetworkClient });

      const result = await client.getHistoriesTotal();
      expect(result.success).toBe(true);
      expect(result.data!.total).toBe(42);
    });

    it('should accept valid BaseResponse with success: false', async () => {
      const errorResponse = {
        success: false,
        error: 'Not found',
        timestamp: '2024-01-01T00:00:00Z',
      };
      mockNetworkClient = createMockNetworkClient(errorResponse);
      client = new StarterClient({ baseUrl, networkClient: mockNetworkClient });

      const result = await client.getHistoriesTotal();
      expect(result.success).toBe(false);
      expect(result.error).toBe('Not found');
    });

    it('should throw on null response data', async () => {
      mockNetworkClient = createMockNetworkClient(null);
      client = new StarterClient({ baseUrl, networkClient: mockNetworkClient });

      await expect(client.getHistoriesTotal()).rejects.toThrow(
        'Invalid API response for getHistoriesTotal'
      );
    });

    it('should throw on primitive string response data', async () => {
      mockNetworkClient = createMockNetworkClient('raw string');
      client = new StarterClient({ baseUrl, networkClient: mockNetworkClient });

      await expect(client.getHistoriesTotal()).rejects.toThrow(
        'Invalid API response for getHistoriesTotal'
      );
    });

    it('should throw on response missing success field', async () => {
      mockNetworkClient = createMockNetworkClient({ data: 'some data' });
      client = new StarterClient({ baseUrl, networkClient: mockNetworkClient });

      await expect(client.getHistoriesTotal()).rejects.toThrow(
        'Invalid API response for getHistoriesTotal'
      );
    });

    it('should throw on response with non-boolean success field', async () => {
      mockNetworkClient = createMockNetworkClient({ success: 'yes', data: {} });
      client = new StarterClient({ baseUrl, networkClient: mockNetworkClient });

      await expect(client.getHistoriesTotal()).rejects.toThrow(
        'Invalid API response for getHistoriesTotal'
      );
    });
  });
});
