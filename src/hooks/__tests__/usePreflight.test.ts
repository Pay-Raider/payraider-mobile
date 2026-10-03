import { act, renderHook } from '@testing-library/react-native';

import {
  PREFLIGHT_PATH,
  usePreflight,
  validatePreflightRequest,
} from '@hooks/usePreflight';
import type { PreflightResult } from '@app-types/preflight';

jest.mock('@services/api', () => ({
  apiClient: {
    post: jest.fn(),
  },
}));

import { apiClient } from '@services/api';

const RESULT: PreflightResult = {
  decision: 'caution',
  summary: 'Marginal on: liquidity.',
  score: 83,
  corridor: null,
  checks: [{ name: 'liquidity', status: 'warn', detail: 'payment is 15% of liquidity' }],
  alternatives: [],
  evaluated_at: '2026-10-03T10:00:00Z',
};

describe('validatePreflightRequest', () => {
  it('requires both assets', () => {
    expect(validatePreflightRequest({ source_asset: ' ', destination_asset: 'NGN' })).toMatch(
      /sending/,
    );
    expect(validatePreflightRequest({ source_asset: 'USDC', destination_asset: '' })).toMatch(
      /recipient/,
    );
  });

  it('rejects non-positive or non-numeric amounts', () => {
    const base = { source_asset: 'USDC', destination_asset: 'NGN' };
    expect(validatePreflightRequest({ ...base, amount_usd: 0 })).toMatch(/positive/);
    expect(validatePreflightRequest({ ...base, amount_usd: NaN })).toMatch(/positive/);
    expect(validatePreflightRequest({ ...base, amount_usd: 10 })).toBeNull();
    expect(validatePreflightRequest(base)).toBeNull();
  });
});

describe('usePreflight', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('posts a normalized request and stores the result', async () => {
    (apiClient.post as jest.Mock).mockResolvedValue(RESULT);
    const { result } = await renderHook(() => usePreflight());

    await act(async () => {
      await result.current.check({
        source_asset: ' usdc ',
        destination_asset: 'ngn',
        amount_usd: 2500,
      });
    });

    expect(apiClient.post).toHaveBeenCalledWith(PREFLIGHT_PATH, {
      source_asset: 'USDC',
      destination_asset: 'NGN',
      amount_usd: 2500,
    });
    expect(result.current.result).toEqual(RESULT);
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('does not call the API for invalid input', async () => {
    const { result } = await renderHook(() => usePreflight());

    await act(async () => {
      await result.current.check({ source_asset: 'USDC', destination_asset: '' });
    });

    expect(apiClient.post).not.toHaveBeenCalled();
    expect(result.current.error).toMatch(/recipient/);
  });

  it('reports an error instead of a fallback answer when the API fails', async () => {
    (apiClient.post as jest.Mock).mockRejectedValue(new Error('network'));
    const { result } = await renderHook(() => usePreflight());

    await act(async () => {
      await result.current.check({ source_asset: 'USDC', destination_asset: 'NGN' });
    });

    expect(result.current.result).toBeNull();
    expect(result.current.error).toMatch(/Could not reach PayRaider/);
  });

  it('ignores a response that a newer check superseded', async () => {
    let resolveFirst: (value: PreflightResult) => void = () => {};
    (apiClient.post as jest.Mock)
      .mockImplementationOnce(
        () => new Promise<PreflightResult>(resolve => (resolveFirst = resolve)),
      )
      .mockResolvedValueOnce({ ...RESULT, decision: 'proceed' });
    const { result } = await renderHook(() => usePreflight());

    let first: Promise<void> = Promise.resolve();
    await act(async () => {
      first = result.current.check({ source_asset: 'USDC', destination_asset: 'NGN' });
      await result.current.check({ source_asset: 'USDC', destination_asset: 'KES' });
    });
    await act(async () => {
      resolveFirst({ ...RESULT, decision: 'hold' });
      await first;
    });

    expect(result.current.result?.decision).toBe('proceed');
  });
});
