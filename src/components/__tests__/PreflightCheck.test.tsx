import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { PreflightCheck } from '@components/PreflightCheck';
import type { PreflightResult } from '@app-types/preflight';

const mockCheck = jest.fn();
const mockUsePreflight = jest.fn();

jest.mock('@hooks/usePreflight', () => ({
  usePreflight: () => mockUsePreflight(),
}));

const RESULT: PreflightResult = {
  decision: 'hold',
  summary: 'Failed on: success_rate. Do not pay on this corridor now.',
  score: 41,
  corridor: null,
  checks: [
    { name: 'success_rate', status: 'fail', detail: '80.0% of recent payments succeeded' },
    { name: 'sample_size', status: 'pass', detail: '212 recent payments observed' },
  ],
  alternatives: [
    {
      id: 'XLM->NGN',
      source_asset: 'XLM',
      destination_asset: 'NGN',
      success_rate: 99.1,
      total_attempts: 300,
      liquidity_depth_usd: 50000,
      health_score: 91,
    },
  ],
  evaluated_at: '2026-10-03T10:00:00Z',
};

function hookState(overrides: Partial<ReturnType<typeof mockUsePreflight>> = {}) {
  return { result: null, loading: false, error: null, check: mockCheck, reset: jest.fn(), ...overrides };
}

describe('PreflightCheck', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePreflight.mockReturnValue(hookState());
  });

  it('submits the entered payment', async () => {
    const screen = await render(<PreflightCheck />);

    await fireEvent.changeText(screen.getByTestId('preflight-destination'), 'ngn');
    await fireEvent.changeText(screen.getByTestId('preflight-amount'), '$2,500');
    await fireEvent.press(screen.getByTestId('preflight-submit'));

    expect(mockCheck).toHaveBeenCalledWith({
      source_asset: 'USDC',
      destination_asset: 'ngn',
      amount_usd: 2500,
    });
  });

  it('omits the amount when it is left empty', async () => {
    const screen = await render(<PreflightCheck />);

    await fireEvent.changeText(screen.getByTestId('preflight-destination'), 'NGN');
    await fireEvent.press(screen.getByTestId('preflight-submit'));

    expect(mockCheck).toHaveBeenCalledWith({
      source_asset: 'USDC',
      destination_asset: 'NGN',
      amount_usd: undefined,
    });
  });

  it('shows the decision, checks and alternatives', async () => {
    mockUsePreflight.mockReturnValue(hookState({ result: RESULT }));
    const screen = await render(<PreflightCheck />);

    expect(screen.getByText('Hold')).toBeTruthy();
    expect(screen.getByText(RESULT.summary)).toBeTruthy();
    expect(screen.getByText('Success rate')).toBeTruthy();
    expect(screen.getByText('80.0% of recent payments succeeded')).toBeTruthy();
    expect(screen.getByText('XLM → NGN')).toBeTruthy();
    expect(screen.getByText('Health score 41 of 100')).toBeTruthy();
  });

  it('shows errors', async () => {
    mockUsePreflight.mockReturnValue(hookState({ error: 'Could not reach PayRaider.' }));
    const screen = await render(<PreflightCheck />);

    expect(screen.getByTestId('preflight-error')).toBeTruthy();
    expect(screen.queryByTestId('preflight-result')).toBeNull();
  });
});
