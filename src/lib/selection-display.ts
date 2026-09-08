export type SelectionDecision = {
  candidateKey: string; outcome: 'SELECTED' | 'QUALIFIED_NOT_SELECTED' | 'REJECTED' | 'NOT_EVALUATED';
  primaryReason?: string; policyVersion?: string; failedChecks?: string[];
  estimatedWinProbability: number | null; netExpectedReturn: number | null;
  offeredOdds: number | null; probabilitySource: string | null; probabilityVersion: string | null;
  evidenceQuality: string; explanation: string; mainRisk: string;
  quoteAt: string | null; evidenceAt: string | null; evidenceReferences: string[];
  checks: { code: string; passed: boolean }[];
};
export type SelectionPresentation = { version: 1; summary: string; risk: string };
export type SelectionReview = {
  id: string; mode: string; status: string; failure?: string | null;
  summary: { requestedCount: number; requestedOdds: number | null; returnedCount: number;
    returnedOdds: number | null; shortfall: string | null; limitingReasons?: string[]; jointProbability: number | null;
    jointProbabilityAssumption: string; reviewedCount: number; notEvaluatedCount: number;
    reasonCounts?: Record<string, number> } | null;
};
export function formatSelectionChance(decision?: Pick<SelectionDecision, 'estimatedWinProbability'> | null) {
  const p = decision?.estimatedWinProbability;
  if (typeof p !== 'number' || !Number.isFinite(p) || p <= 0 || p >= 1) return 'Unavailable';
  // Do not round a failed 70% threshold up to an apparent pass.
  if (p < 0.7 && (p * 100).toFixed(1) === '70.0') return '<70%';
  return `${(p * 100).toFixed(1)}%`;
}

const selectionCheckLabels: Record<string, string> = {
  FIXTURE_UNVERIFIED: 'Verified fixture', MARKET_UNVERIFIED: 'Verified market and selection',
  KICKOFF_INVALID: 'Verified future kickoff', ODDS_UNPRICED: 'Usable offered price', STALE_PRICE: 'Fresh price',
  INSUFFICIENT_EVIDENCE: 'Complete required evidence', STALE_EVIDENCE: 'Fresh evidence',
  UNSUPPORTED_PROBABILITY: 'Validated, permitted probability source',
  PROBABILITY_BELOW_THRESHOLD: 'Estimated win chance at least 70%', INSUFFICIENT_VALUE: 'Estimated net return at least 3%',
};
export function selectionCheckLabel(code: string) { return selectionCheckLabels[code] ?? code.toLowerCase().replaceAll('_', ' '); }

export type RecordedSelectionReason = { selectionReason?: string | null; reason?: string | null };

/** Saved prose is useful even when it is not a validated policy decision. */
export function selectionCopy(decision?: SelectionDecision | null, presentation?: SelectionPresentation | null, recorded?: RecordedSelectionReason | null) {
  if (!decision) return {
    summary: recorded?.selectionReason?.trim() || recorded?.reason?.trim() || 'This selection does not have a complete recorded decision trail.',
    risk: recorded?.selectionReason?.trim() || recorded?.reason?.trim()
      ? 'This is the saved analysis note. A validated win estimate and complete selection checks are unavailable.'
      : 'We cannot reconstruct its original win estimate or selection checks.',
  };
  if (presentation?.version === 1 && presentation.summary?.trim() && presentation.risk?.trim()) return presentation;
  return {
    summary: decision.explanation,
    risk: decision.mainRisk === decision.explanation
      ? 'This candidate was not selected. See the recorded checks for the reason.'
      : decision.mainRisk,
  };
}

export function selectionOutcomeLabel(outcome?: SelectionDecision['outcome']) {
  return outcome ? {
    SELECTED: 'Selected', QUALIFIED_NOT_SELECTED: 'Qualified · omitted',
    REJECTED: 'Rejected', NOT_EVALUATED: 'Not evaluated',
  }[outcome] : 'Decision unavailable';
}

export function selectionReasonTitle(outcome?: SelectionDecision['outcome']) {
  return outcome ? {
    SELECTED: 'Why selected', QUALIFIED_NOT_SELECTED: 'Why omitted',
    REJECTED: 'Why not selected', NOT_EVALUATED: 'Review incomplete',
  }[outcome] : 'Recorded selection';
}

export function formatSelectionReturn(decision?: SelectionDecision | null) {
  const net = decision?.netExpectedReturn;
  return typeof net === 'number' && Number.isFinite(net) ? `${net >= 0 ? '+' : ''}${(net * 100).toFixed(1)}%` : 'Unavailable';
}

export function selectionEvidenceSources(decision?: SelectionDecision | null) {
  const names = new Set<string>();
  for (const reference of decision?.evidenceReferences ?? []) {
    if (reference.startsWith('features:')) names.add('Recorded match features');
    if (reference.startsWith('quote:')) names.add('Recorded bookmaker price');
    if (reference.startsWith('forecast:')) names.add('Recorded model forecast');
  }
  return [...names];
}
