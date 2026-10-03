// Mirrors PreflightResponse in payraider-backend (src/api/preflight.rs).

export type PreflightDecision = 'proceed' | 'caution' | 'hold' | 'unknown';

export type PreflightCheckStatus = 'pass' | 'warn' | 'fail';

export interface PreflightCheck {
  name: string;
  status: PreflightCheckStatus;
  detail: string;
}

export interface PreflightCorridor {
  id: string;
  source_asset: string;
  destination_asset: string;
  success_rate: number;
  total_attempts: number;
  liquidity_depth_usd: number;
  health_score: number;
}

export interface PreflightRequest {
  source_asset: string;
  destination_asset: string;
  amount_usd?: number;
  min_success_rate?: number;
}

export interface PreflightResult {
  decision: PreflightDecision;
  summary: string;
  score: number | null;
  corridor: PreflightCorridor | null;
  checks: PreflightCheck[];
  alternatives: PreflightCorridor[];
  evaluated_at: string;
}
