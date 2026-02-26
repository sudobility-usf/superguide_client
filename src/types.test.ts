import { describe, it, expect } from 'vitest';
import { QUERY_KEYS } from './types';

describe('QUERY_KEYS', () => {
  describe('histories', () => {
    it('should return correct key for a user', () => {
      const key = QUERY_KEYS.histories('user-123');
      expect(key).toEqual(['starter', 'histories', 'user-123']);
    });

    it('should return different keys for different users', () => {
      const key1 = QUERY_KEYS.histories('user-a');
      const key2 = QUERY_KEYS.histories('user-b');
      expect(key1).not.toEqual(key2);
    });

    it('should always start with starter prefix', () => {
      const key = QUERY_KEYS.histories('any-user');
      expect(key[0]).toBe('starter');
    });

    it('should have histories as second element', () => {
      const key = QUERY_KEYS.histories('any-user');
      expect(key[1]).toBe('histories');
    });

    it('should have userId as third element', () => {
      const key = QUERY_KEYS.histories('my-uid');
      expect(key[2]).toBe('my-uid');
    });
  });

  describe('historiesTotal', () => {
    it('should return correct key', () => {
      const key = QUERY_KEYS.historiesTotal();
      expect(key).toEqual(['starter', 'histories', 'total']);
    });

    it('should be consistent across calls', () => {
      const key1 = QUERY_KEYS.historiesTotal();
      const key2 = QUERY_KEYS.historiesTotal();
      expect(key1).toEqual(key2);
    });
  });

  describe('user', () => {
    it('should return correct key for a user', () => {
      const key = QUERY_KEYS.user('user-xyz');
      expect(key).toEqual(['starter', 'user', 'user-xyz']);
    });

    it('should have user as second element', () => {
      const key = QUERY_KEYS.user('any-user');
      expect(key[1]).toBe('user');
    });
  });
});
