export type FixReviewRow = { key: string; fixture: string; market: string; odds: number | null;
  probability: number | null; expectedValue: number | null; disposition: string; reason: string; original: boolean };
export type FixReview = { id: string; status: string; ticketId: string | null; summary: string | null; objective: unknown;
  revision: number; failureCode: string | null; proposalHash: string | null; confirmed: boolean; reservationState: string; diagnosticsAvailable: boolean;
  rows: FixReviewRow[]; originalOdds: number | null; proposedOdds: number | null;
  originalProbability: number | null; proposedProbability: number | null; comparison: string };

export function formatReviewEstimate(value: number | null) {
  return value === null || !Number.isFinite(value) ? "Unavailable" : `${(value * 100).toFixed(1)}%`;
}
export function reviewDispositionLabel(value: string) {
  const labels: Record<string, string> = { SELECTED: "Proposed", KEPT: "Proposed", REJECTED: "Removed", NO_BET: "Removed",
    REMOVED: "Removed", NOT_EVALUATED: "Not evaluated", NOT_PUBLISHED: "Not proposed", QUALIFIED_NOT_SELECTED: "Not chosen" };
  return labels[value] ?? "Under review";
}
export function bookingResultError(value: unknown) {
  const result = value && typeof value === "object" ? value as Record<string, unknown> : {};
  if (result.success !== false && typeof result.bookingCode === "string" && result.bookingCode.trim()) return null;
  return typeof result.error === "string" && result.error ? result.error : typeof result.regenerationError === "string" && result.regenerationError ? result.regenerationError : "A booking code could not be generated. Please retry.";
}
export function bookingCodeFromResult(value: unknown): string {
  const error = bookingResultError(value);
  if (error) throw new Error(error);
  return (value as { bookingCode: string }).bookingCode;
}
export function reviewIsPending(value?: {status: string; failureCode?: string | null}) {
  return Boolean(value && (["QUEUED", "PROCESSING"].includes(value.status) || value.failureCode === "PROPOSAL_REFRESHING"));
}
