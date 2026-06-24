import * as SecureStore from 'expo-secure-store';

/**
 * Secure auth-token storage using expo-secure-store.
 *
 * All sensitive information (token) and non-sensitive metadata (expiry)
 * are stored in the platform-native secure encrypted store.
 */

const TOKEN_KEY = 'com.stellarinsights.auth.token';
const EXPIRY_KEY = 'com.stellarinsights.auth.expiry';

/**
 * Persist an auth token in encrypted storage.
 *
 * @param token - The auth token to store.
 * @param expiresAt - Optional expiry as a Unix epoch in milliseconds.
 */
export async function saveToken(
  token: string,
  expiresAt?: number,
): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);

  if (typeof expiresAt === 'number') {
    await SecureStore.setItemAsync(EXPIRY_KEY, String(expiresAt));
  } else {
    await SecureStore.deleteItemAsync(EXPIRY_KEY);
  }
}

/**
 * Read the stored auth token.
 *
 * @returns The token, or `null` when none is stored.
 */
export async function getToken(): Promise<string | null> {
  return await SecureStore.getItemAsync(TOKEN_KEY);
}

/**
 * Read the stored token expiry timestamp.
 *
 * @returns Expiry as a Unix epoch in milliseconds, or `null` when unset.
 */
export async function getTokenExpiry(): Promise<number | null> {
  const raw = await SecureStore.getItemAsync(EXPIRY_KEY);
  if (!raw) {
    return null;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Remove the stored auth token and its expiry metadata.
 */
export async function removeToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(EXPIRY_KEY);
}

/**
 * Clear all auth-related storage (token + metadata).
 */
export async function clearAll(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(EXPIRY_KEY);
}

/**
 * Determine whether a usable (present and unexpired) token exists. This is the
 * predicate the app uses to choose between the authenticated and login routes.
 *
 * @returns `true` when a non-expired token is stored.
 */
export async function hasValidToken(): Promise<boolean> {
  const token = await getToken();
  if (!token) {
    return false;
  }

  const expiry = await getTokenExpiry();
  if (expiry !== null && expiry <= Date.now()) {
    return false;
  }

  return true;
}

