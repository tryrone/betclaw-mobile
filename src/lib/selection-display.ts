export type SelectionDecision = {
  candidateKey: string; outcome: 'SELECTED' | 'QUALIFIED_NOT_SELECTED' | 'REJECTED' | 'NOT_EVALUATED';
  estimatedWinProbability: number | null; netExpectedReturn: number | null;
  offeredOdds: number | null; probabilitySource: string | null; probabilityVersion: string | null;
  evidenceQuality: string; explanation: string; mainRisk: string;
  quoteAt: string | null; evidenceAt: string | null; evidenceReferences: string[];
  checks: { code: string; passed: boolean }[];
};
export type SelectionReview = {
  id: string; mode: string; status: string; failure?: string | null;
  summary: { requestedCount: number; requestedOdds: number | null; returnedCount: number;
    returnedOdds: number | null; shortfall: string | null; limitingReasons?: string[]; jointProbability: number | null;
    jointProbabilityAssumption: string; reviewedCount: number; notEvaluatedCount: number } | null;
};
export function formatSelectionChance(decision?: Pick<SelectionDecision, 'estimatedWinProbability'> | null) {
  const p = decision?.estimatedWinProbability;
  return typeof p === 'number' && Number.isFinite(p) && p > 0 && p < 1 ? `${(p * 100).toFixed(1)}%` : 'Unavailable';
}

const selectionCheckLabels: Record<string, string> = {
  FIXTURE_UNVERIFIED: 'Verified fixture', MARKET_UNVERIFIED: 'Verified market and selection',
  KICKOFF_INVALID: 'Verified future kickoff', ODDS_UNPRICED: 'Usable offered price', STALE_PRICE: 'Fresh price',
  INSUFFICIENT_EVIDENCE: 'Complete required evidence', STALE_EVIDENCE: 'Fresh evidence',
  UNSUPPORTED_PROBABILITY: 'Validated, permitted probability source',
  PROBABILITY_BELOW_THRESHOLD: 'Estimated win chance at least 70%', INSUFFICIENT_VALUE: 'Estimated net return at least 3%',
};
export function selectionCheckLabel(code: string) { return selectionCheckLabels[code] ?? code.toLowerCase().replaceAll('_', ' '); }
