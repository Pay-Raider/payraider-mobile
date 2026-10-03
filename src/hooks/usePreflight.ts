import { useCallback, useRef, useState } from 'react';

import { apiClient } from '@services/api';
import type { PreflightRequest, PreflightResult } from '@app-types/preflight';

export const PREFLIGHT_PATH = '/api/v1/preflight';

export interface UsePreflightReturn {
  result: PreflightResult | null;
  loading: boolean;
  error: string | null;
  check: (request: PreflightRequest) => Promise<void>;
  reset: () => void;
}

/**
 * Validates form input. Returns an error message, or null when the request
 * can be sent.
 */
export function validatePreflightRequest(request: PreflightRequest): string | null {
  if (!request.source_asset.trim()) {
    return 'Enter the asset you are sending.';
  }
  if (!request.destination_asset.trim()) {
    return 'Enter the asset the recipient receives.';
  }
  if (
    request.amount_usd !== undefined &&
    (!Number.isFinite(request.amount_usd) || request.amount_usd <= 0)
  ) {
    return 'Amount must be a positive number.';
  }
  return null;
}

/**
 * Runs PayRaider's pre-payment check. Unlike the browsing screens there is no
 * cached or sample fallback: a stale or made-up answer about whether to send
 * money is worse than none.
 */
export function usePreflight(): UsePreflightReturn {
  const [result, setResult] = useState<PreflightResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Ignore responses from a check that a newer one has superseded.
  const requestId = useRef(0);

  const check = useCallback(async (request: PreflightRequest) => {
    const normalized: PreflightRequest = {
      ...request,
      source_asset: request.source_asset.trim().toUpperCase(),
      destination_asset: request.destination_asset.trim().toUpperCase(),
    };

    const invalid = validatePreflightRequest(normalized);
    if (invalid) {
      setError(invalid);
      setResult(null);
      return;
    }

    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.post<PreflightResult>(PREFLIGHT_PATH, normalized);
      if (id === requestId.current) {
        setResult(data);
      }
    } catch {
      if (id === requestId.current) {
        setResult(null);
        setError('Could not reach PayRaider. Check your connection and try again.');
      }
    } finally {
      if (id === requestId.current) {
        setLoading(false);
      }
    }
  }, []);

  const reset = useCallback(() => {
    requestId.current++;
    setResult(null);
    setError(null);
    setLoading(false);
  }, []);

  return { result, loading, error, check, reset };
}
