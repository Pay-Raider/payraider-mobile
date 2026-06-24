import * as SecureStore from 'expo-secure-store';

import {
  clearAll,
  getToken,
  getTokenExpiry,
  hasValidToken,
  removeToken,
  saveToken,
} from '@services/tokenStorage';

jest.mock('expo-secure-store', () => {
  const store: Record<string, string> = {};
  return {
    setItemAsync: jest.fn(async (key: string, value: string) => {
      store[key] = value;
    }),
    getItemAsync: jest.fn(async (key: string) => {
      return store[key] || null;
    }),
    deleteItemAsync: jest.fn(async (key: string) => {
      delete store[key];
    }),
  };
});

const mockSetItem = SecureStore.setItemAsync as jest.Mock;
const mockGetItem = SecureStore.getItemAsync as jest.Mock;
const mockDeleteItem = SecureStore.deleteItemAsync as jest.Mock;

const TOKEN_KEY = 'com.stellarinsights.auth.token';
const EXPIRY_KEY = 'com.stellarinsights.auth.expiry';

describe('tokenStorage', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
  });

  it('saves the token and expiry to secure store', async () => {
    const expiresAt = Date.now() + 60_000;
    await saveToken('my-token', expiresAt);

    expect(mockSetItem).toHaveBeenCalledWith(TOKEN_KEY, 'my-token');
    expect(mockSetItem).toHaveBeenCalledWith(EXPIRY_KEY, String(expiresAt));
  });

  it('clears any stale expiry when saving a token without one', async () => {
    mockGetItem.mockResolvedValueOnce(null);
    await saveToken('my-token');

    expect(mockSetItem).toHaveBeenCalledWith(TOKEN_KEY, 'my-token');
    expect(mockDeleteItem).toHaveBeenCalledWith(EXPIRY_KEY);
  });

  it('returns the stored token value', async () => {
    mockGetItem.mockResolvedValueOnce('my-token');
    await expect(getToken()).resolves.toBe('my-token');
  });

  it('returns null when no token is stored', async () => {
    mockGetItem.mockResolvedValueOnce(null);
    await expect(getToken()).resolves.toBeNull();
  });

  it('reads and parses the expiry, returning null for missing/invalid values', async () => {
    mockGetItem.mockResolvedValueOnce(null);
    await expect(getTokenExpiry()).resolves.toBeNull();

    mockGetItem.mockResolvedValueOnce('987654');
    await expect(getTokenExpiry()).resolves.toBe(987654);

    mockGetItem.mockResolvedValueOnce('not-a-number');
    await expect(getTokenExpiry()).resolves.toBeNull();
  });

  it('removes the token and clears the expiry', async () => {
    await removeToken();

    expect(mockDeleteItem).toHaveBeenCalledWith(TOKEN_KEY);
    expect(mockDeleteItem).toHaveBeenCalledWith(EXPIRY_KEY);
  });

  it('clears all auth storage', async () => {
    await clearAll();

    expect(mockDeleteItem).toHaveBeenCalledWith(TOKEN_KEY);
    expect(mockDeleteItem).toHaveBeenCalledWith(EXPIRY_KEY);
  });

  describe('hasValidToken (initial-route predicate)', () => {
    it('is false when no token is stored', async () => {
      mockGetItem.mockImplementation(async (key) => {
        if (key === TOKEN_KEY) return null;
        return null;
      });
      await expect(hasValidToken()).resolves.toBe(false);
    });

    it('is true when a token without expiry is stored', async () => {
      mockGetItem.mockImplementation(async (key) => {
        if (key === TOKEN_KEY) return 'tok';
        if (key === EXPIRY_KEY) return null;
        return null;
      });
      await expect(hasValidToken()).resolves.toBe(true);
    });

    it('is true when a token with a future expiry is stored', async () => {
      mockGetItem.mockImplementation(async (key) => {
        if (key === TOKEN_KEY) return 'tok';
        if (key === EXPIRY_KEY) return String(Date.now() + 60_000);
        return null;
      });
      await expect(hasValidToken()).resolves.toBe(true);
    });

    it('is false when the stored token has expired', async () => {
      mockGetItem.mockImplementation(async (key) => {
        if (key === TOKEN_KEY) return 'tok';
        if (key === EXPIRY_KEY) return String(Date.now() - 60_000);
        return null;
      });
      await expect(hasValidToken()).resolves.toBe(false);
    });
  });
});

