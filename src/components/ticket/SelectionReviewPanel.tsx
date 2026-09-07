import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useInfiniteQuery, useMutation } from '@tanstack/react-query';
import { ChevronRight } from '@/components/modern-icons';
import { callWithMobileRefresh, trpc } from '@/lib/api/client';
import { selectionCopy, type SelectionDecision, type SelectionPresentation, type SelectionReview } from '@/lib/selection-display';
import { PressableScale } from '@/components/ui';
import { useAppTheme } from '@/theme/colors';
import { fonts } from '@/theme/typography';
import { radius, spacing } from '@/theme/spacing';
import { SelectionDecisionCard, SelectionEvidenceSheet, SelectionOutcomeBadge } from './SelectionExplanation';
export { SelectionDecisionCard } from './SelectionExplanation';

type ReviewedCandidate = { id: string; label: string; odds: number | null; decision: SelectionDecision; selectionPresentation?: SelectionPresentation | null };
type ReviewPage = { run: SelectionReview; candidates: ReviewedCandidate[]; nextCursor: string | null };
type OutcomeFilter = SelectionDecision['outcome'] | undefined;
const filters: { label: string; value: OutcomeFilter }[] = [
  { label: 'All', value: undefined }, { label: 'Selected', value: 'SELECTED' },
  { label: 'Qualified · omitted', value: 'QUALIFIED_NOT_SELECTED' },
  { label: 'Rejected', value: 'REJECTED' }, { label: 'Not evaluated', value: 'NOT_EVALUATED' },
];

export function SelectionReviewPanel({ runId, initialReview }: { runId?: string | null; initialReview?: SelectionReview | null }) {
  // A new run starts with fresh controls and no open candidate sheet.
  return <ReviewContent key={runId ?? 'historical'} runId={runId} initialReview={initialReview} />;
}

function ReviewContent({ runId, initialReview }: { runId?: string | null; initialReview?: SelectionReview | null }) {
  const theme = useAppTheme();
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [outcome, setOutcome] = useState<OutcomeFilter>();
  const [selected, setSelected] = useState<ReviewedCandidate | null>(null);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);
  const review = useInfiniteQuery({
    queryKey: ['selection', runId, debouncedSearch, outcome],
    enabled: expanded && Boolean(runId),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => callWithMobileRefresh(() => trpc.selection.reviewedCandidates.query({
      runId: runId!, search: debouncedSearch, outcome, cursor: pageParam, limit: 25,
    }) as Promise<ReviewPage>),
    getNextPageParam: (page: ReviewPage) => page.nextCursor ?? undefined,
  });
  const run = review.data?.pages[0]?.run ?? initialReview;
  const summary = run?.summary;
  const candidates = [...new Map(review.data?.pages.flatMap(page => page.candidates).map(candidate => [candidate.id, candidate]) ?? []).values()];
  const textStyle = [styles.body, { color: theme.foreground }];
  if (!runId) return <Text style={textStyle}>A complete decision trail is unavailable for this historical ticket.</Text>;
  return <View style={[styles.panel, { backgroundColor: theme.card, borderColor: theme.border }]}>
    <Text accessibilityRole="header" style={[styles.heading, { color: theme.foregroundStrong }]}>Every decision, explained.</Text>
    {run?.mode === 'shadow' ? <Text style={textStyle}>Research comparison — these decisions did not select this ticket.</Text> : null}
    {run && run.status !== 'COMPLETE' ? <Text accessibilityLiveRegion="polite" style={textStyle}>Review incomplete. {run.failure} This is not a no-picks verdict.</Text> : null}
    {summary && run?.status === 'COMPLETE' ? <>
      <Text style={textStyle}>{run.mode === 'shadow' ? 'Research would select' : 'Selected'} {summary.returnedCount} of {summary.requestedCount} requested picks.</Text>
      {summary.shortfall ? <Text style={[styles.small, { color: theme.mutedLight }]}>{summary.shortfall}</Text> : null}
      <Text style={[styles.small, { color: theme.mutedLight }]}>{summary.reviewedCount} evaluated · {summary.notEvaluatedCount} not evaluated. This is the collected pool, not every available game.</Text>
    </> : null}
    <PressableScale accessibilityRole="button" accessibilityState={{ expanded }} scaleTo={1}
      onPress={() => setExpanded(value => !value)} style={styles.button}>
      <Text style={[styles.buttonText, { color: theme.primarySoft }]}>{expanded ? 'Hide reviewed games' : 'Inspect reviewed games'}</Text>
    </PressableScale>
    {expanded ? <View style={styles.stack}>
      <TextInput accessibilityLabel="Search reviewed games" placeholder="Search team, league or market" placeholderTextColor={theme.mutedLight}
        autoCorrect={false} maxLength={100} style={[styles.input, { color: theme.foregroundStrong, backgroundColor: theme.field, borderColor: theme.border }]}
        value={search} onChangeText={setSearch} />
      <View style={styles.filters}>{filters.map(filter => <PressableScale key={filter.label} accessibilityRole="button"
        accessibilityState={{ selected: filter.value === outcome }} onPress={() => setOutcome(filter.value)} scaleTo={1}
        style={[styles.filter, { backgroundColor: filter.value === outcome ? theme.primarySubtle : theme.field, borderColor: filter.value === outcome ? theme.selectionBorder : theme.border }]}>
        <Text style={[styles.small, { color: filter.value === outcome ? theme.primarySoft : theme.mutedLight }]}>{filter.label}</Text>
      </PressableScale>)}</View>
      {review.isLoading || search.trim() !== debouncedSearch ? <Text accessibilityLiveRegion="polite" style={textStyle}>Loading reviewed games…</Text> : null}
      {review.isError ? <PressableScale accessibilityRole="button" onPress={() => void (review.isFetchNextPageError ? review.fetchNextPage() : review.refetch())} style={styles.button}>
        <Text style={textStyle}>Review could not be loaded. Tap to retry.</Text>
      </PressableScale> : null}
      {!review.isLoading && !review.isError && review.data && !candidates.length ? <Text style={textStyle}>No games match these filters. Try another outcome or team.</Text> : null}
      {candidates.map(candidate => <PressableScale key={candidate.id} accessibilityRole="button" scaleTo={1}
        accessibilityLabel={`View evidence: ${candidate.label}`} onPress={() => setSelected(candidate)}
        style={[styles.candidate, { borderColor: theme.border }]}>
        <View style={styles.candidateTop}><SelectionOutcomeBadge decision={candidate.decision} /><ChevronRight size={18} color={theme.mutedLight} /></View>
        <Text style={[styles.candidateTitle, { color: theme.foregroundStrong }]}>{candidate.label}</Text>
        <Text style={[styles.small, { color: theme.mutedLight }]}>Recorded odds: {candidate.odds?.toFixed(2) ?? 'Unavailable'}</Text>
        <Text style={textStyle}>{selectionCopy(candidate.decision, candidate.selectionPresentation).summary}</Text>
      </PressableScale>)}
      {review.hasNextPage ? <PressableScale accessibilityRole="button" disabled={review.isFetchingNextPage}
        onPress={() => void review.fetchNextPage()} style={styles.button}>
        <Text style={[styles.buttonText, { color: theme.primarySoft }]}>{review.isFetchingNextPage ? 'Loading more…' : 'Load more games'}</Text>
      </PressableScale> : null}
      {run?.status === 'COMPLETE' && summary?.limitingReasons?.length ? <Text style={[styles.small, { color: theme.mutedLight }]}>Recorded limits: {summary.limitingReasons.join(' ')}</Text> : null}
      {run?.status === 'COMPLETE' && summary?.jointProbability != null ? <Text style={[styles.small, { color: theme.mutedLight }]}>Combined estimate: {(summary.jointProbability * 100).toFixed(1)}%. {summary.jointProbabilityAssumption}</Text> : null}
    </View> : null}
    {selected ? <SelectionEvidenceSheet visible title={selected.label} decision={selected.decision} presentation={selected.selectionPresentation} onClose={() => setSelected(null)} /> : null}
  </View>;
}

export function ReplacementSuggestions({ ticketId, matchId }: { ticketId: string; matchId: string }) {
  const theme = useAppTheme();
  const router = useRouter();
  const suggest = useMutation({ mutationFn: () => callWithMobileRefresh(() => trpc.selection.suggestReplacements.mutate({ ticketId, matchId }) as Promise<{
    runId: string; mode: string; status: string; suggestions: { candidateKey: string; homeTeam: string; awayTeam: string; market: string; odds: number | null; decision: SelectionDecision; selectionPresentation?: SelectionPresentation | null }[];
  }>) });
  const accept = useMutation({ mutationFn: (candidateKey: string) => callWithMobileRefresh(() => trpc.selection.acceptReplacement.mutate({ ticketId, matchId, runId: suggest.data?.runId, candidateKey }) as Promise<{ ticketId: string }>) });
  return <View style={{ gap: 12, marginTop: 12 }}>
    <PressableScale style={styles.button} accessibilityRole="button" disabled={suggest.isPending} onPress={() => suggest.mutate()}><Text style={{ color: theme.primarySoft }}>{suggest.isPending ? 'Checking alternatives…' : 'Find a qualified replacement'}</Text></PressableScale>
    {suggest.error ? <Text style={{ color: theme.danger }}>{suggest.error.message}</Text> : null}
    {suggest.data?.status === 'INCOMPLETE' ? <Text style={{ color: theme.foreground }}>Replacement review is incomplete. Please retry.</Text> : null}
    {suggest.data?.status === 'COMPLETE' && suggest.data.mode === 'on' && !suggest.data.suggestions.length ? <Text style={{ color: theme.foreground }}>No independently qualified replacement was found.</Text> : null}
    {suggest.data?.mode === 'shadow' ? <Text style={{ color: theme.foreground }}>Research comparison only. Replacement acceptance is not enabled.</Text> : null}
    {suggest.data?.suggestions.map(s => <View key={s.candidateKey} style={{ gap: 8 }}>
      <Text style={{ color: theme.foreground }}>{s.homeTeam} vs {s.awayTeam} · {s.market} · Odds {s.odds?.toFixed(2)}</Text>
      <SelectionDecisionCard decision={s.decision} presentation={s.selectionPresentation} title={`${s.homeTeam} vs ${s.awayTeam}`} market={s.market} />
      {suggest.data.mode === 'on' ? <PressableScale style={styles.button} accessibilityRole="button" disabled={accept.isPending} onPress={() => accept.mutate(s.candidateKey)}><Text style={{ color: theme.primarySoft }}>Accept and recheck current price</Text></PressableScale> : null}
    </View>)}
    {accept.error ? <Text style={{ color: theme.danger }}>{accept.error.message}</Text> : null}
    {accept.data ? <PressableScale style={styles.button} accessibilityRole="link" onPress={() => router.push(`/ticket/${accept.data!.ticketId}`)}><Text style={{ color: theme.primarySoft }}>Open revised ticket — original preserved</Text></PressableScale> : null}
  </View>;
}

const styles = StyleSheet.create({
  panel: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  stack: { gap: spacing.md },
  heading: { fontFamily: fonts.display, fontSize: 18, lineHeight: 27 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 24 },
  small: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 21 },
  button: { minHeight: 48, justifyContent: 'center', paddingVertical: spacing.md },
  buttonText: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 22 },
  input: { minHeight: 48, borderWidth: 1, borderRadius: radius.md, padding: spacing.md, fontFamily: fonts.regular, fontSize: 16 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  filter: { minHeight: 48, justifyContent: 'center', borderWidth: 1, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  candidate: { minHeight: 48, borderTopWidth: 1, paddingVertical: spacing.lg, gap: spacing.sm },
  candidateTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  candidateTitle: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 24 },
});
