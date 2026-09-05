import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { useQuery, useMutation } from '@tanstack/react-query';
import { callWithMobileRefresh, trpc } from '@/lib/api/client';
import { selectionCheckLabel, formatSelectionChance, type SelectionDecision, type SelectionReview } from '@/lib/selection-display';
import { PressableScale } from '@/components/ui';
import { useAppTheme } from '@/theme/colors';

type ReviewPage = { run: SelectionReview; candidates: { id: string; label: string; odds: number | null; decision: SelectionDecision }[]; nextCursor: string | null };
export function SelectionDecisionCard({ decision }: { decision?: SelectionDecision | null }) {
  const theme = useAppTheme();
  const [expanded, setExpanded] = useState(false);
  const textStyle = { color: theme.foreground, fontSize: 13, lineHeight: 20 };
  if (!decision) return <Text style={textStyle}>Estimated win chance: Unavailable. A complete validated decision trail is unavailable for this selection.</Text>;
  return <View style={{ gap: 8 }}>
    <Text style={textStyle}>Estimated win chance: {formatSelectionChance(decision)} · Evidence quality: {decision.evidenceQuality}</Text>
    <Text style={textStyle}>{decision.explanation}</Text><Text style={textStyle}>Main risk: {decision.mainRisk}</Text>
    <PressableScale accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpanded(!expanded)}><Text style={{ color: theme.primary }}>Supporting evidence and checks</Text></PressableScale>
    {expanded ? <View style={{ gap: 6 }}>
      <Text style={textStyle}>Price observed: {decision.quoteAt ? new Date(decision.quoteAt).toLocaleString() : 'Unavailable'}</Text>
      <Text style={textStyle}>Evidence captured: {decision.evidenceAt ? new Date(decision.evidenceAt).toLocaleString() : 'Unavailable'}</Text>
      <Text style={textStyle}>Offered odds: {decision.offeredOdds?.toFixed(2) ?? 'Unavailable'} · Source: {decision.probabilitySource ?? 'Unavailable'} {decision.probabilityVersion ?? ''}</Text>
      <Text style={textStyle}>Value calculation: {decision.estimatedWinProbability !== null && decision.offeredOdds ? `${decision.estimatedWinProbability} × ${decision.offeredOdds} − 1` : 'Unavailable'}</Text>
      <Text style={textStyle}>Estimated net return: {decision.netExpectedReturn === null ? 'Unavailable' : `${(decision.netExpectedReturn * 100).toFixed(1)}%`}</Text>
      {decision.checks.map(check => <Text key={check.code} style={textStyle}>{check.passed ? 'Passed' : 'Failed'}: {selectionCheckLabel(check.code)}</Text>)}
      <Text style={textStyle}>Evidence references: {decision.evidenceReferences.join('; ') || 'Unavailable'}</Text>
    </View> : null}
  </View>;
}
export function SelectionReviewPanel({ runId }: { runId?: string | null }) {
  const theme = useAppTheme();
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState('');
  const [cursor, setCursor] = useState<string | undefined>();
  const review = useQuery<ReviewPage>({ queryKey: ['selection', runId, search, cursor], enabled: Boolean(runId),
    queryFn: () => callWithMobileRefresh(() => trpc.selection.reviewedCandidates.query({ runId, search, cursor, limit: 25 }) as Promise<ReviewPage>) });
  const textStyle = { color: theme.foreground, fontSize: 13, lineHeight: 20 };
  if (!runId) return <Text style={textStyle}>A complete decision trail is unavailable for this historical ticket.</Text>;
  if (review.isLoading) return <Text accessibilityLiveRegion="polite" style={textStyle}>Loading selection review…</Text>;
  if (review.isError) return <PressableScale accessibilityRole="button" onPress={() => void review.refetch()}><Text style={textStyle}>Selection review could not be loaded. Tap to retry.</Text></PressableScale>;
  if (!review.data) return null;
  const { run, candidates, nextCursor } = review.data;
  const summary = run.summary;
  return <View style={{ borderWidth: 1, borderColor: theme.border, borderRadius: 12, padding: 16, gap: 12 }}>
    <Text style={[textStyle, { fontWeight: '600' }]}>{run.mode === 'shadow' ? 'Research comparison — did not select this ticket' : 'Why these games were selected'}</Text>
    {run.status !== 'COMPLETE' ? <Text style={textStyle}>Review incomplete. {run.failure} This is not a no-picks verdict.</Text> : null}
    {summary && run.status === 'COMPLETE' ? <>
      <Text style={textStyle}>Requested: {summary.requestedCount} games{summary.requestedOdds ? ` at ${summary.requestedOdds.toFixed(2)} odds` : ''}. {run.mode === 'shadow' ? 'Research policy would select' : 'Returned'}: {summary.returnedCount}{summary.returnedOdds ? ` at ${summary.returnedOdds.toFixed(2)} odds` : ''}.</Text>
      {summary.shortfall ? <Text style={textStyle}>{summary.shortfall}</Text> : null}
      {summary.limitingReasons?.length ? <Text style={textStyle}>Limiting reasons: {summary.limitingReasons.join(" ")}</Text> : null}
      {summary.jointProbability !== null ? <Text style={textStyle}>Combined estimate: {(summary.jointProbability * 100).toFixed(1)}%. {summary.jointProbabilityAssumption}</Text> : null}
      <Text style={textStyle}>{summary.reviewedCount} reviewed; {summary.notEvaluatedCount} not evaluated. This is the collected pool, not every available game.</Text>
    </> : null}
    <PressableScale accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpanded(!expanded)}><Text style={{ color: theme.primary }}>{expanded ? 'Hide reviewed games' : 'Inspect reviewed games'}</Text></PressableScale>
    {expanded ? <View style={{ gap: 12 }}>
      <TextInput accessibilityLabel="Search reviewed games" placeholder="Search team, league or market" placeholderTextColor={theme.muted} style={[textStyle, { borderWidth: 1, borderColor: theme.border, borderRadius: 8, padding: 12 }]} value={search} onChangeText={value => { setSearch(value); setCursor(undefined); }} />
      {!candidates.length ? <Text style={textStyle}>No reviewed candidates match this search.</Text> : null}
      {candidates.map(candidate => <View key={candidate.id} style={{ gap: 8, borderTopWidth: 1, borderColor: theme.border, paddingTop: 12 }}>
        <Text style={[textStyle, { fontWeight: '600' }]}>{candidate.label}</Text>
        <Text style={textStyle}>{candidate.decision.outcome.toLowerCase().replaceAll('_', ' ')} · Odds {candidate.odds?.toFixed(2) ?? 'Unavailable'}</Text>
        <SelectionDecisionCard decision={candidate.decision} />
      </View>)}
      {cursor ? <PressableScale accessibilityRole="button" onPress={() => setCursor(undefined)}><Text style={{ color: theme.primary }}>First page</Text></PressableScale> : null}
      {nextCursor ? <PressableScale accessibilityRole="button" onPress={() => setCursor(nextCursor)}><Text style={{ color: theme.primary }}>Next page</Text></PressableScale> : null}
    </View> : null}
  </View>;
}

export function ReplacementSuggestions({ ticketId, matchId }: { ticketId: string; matchId: string }) {
  const theme = useAppTheme();
  const router = useRouter();
  const suggest = useMutation({ mutationFn: () => callWithMobileRefresh(() => trpc.selection.suggestReplacements.mutate({ ticketId, matchId }) as Promise<{
    runId: string; mode: string; status: string; suggestions: { candidateKey: string; homeTeam: string; awayTeam: string; market: string; odds: number | null; decision: SelectionDecision }[];
  }>) });
  const accept = useMutation({ mutationFn: (candidateKey: string) => callWithMobileRefresh(() => trpc.selection.acceptReplacement.mutate({ ticketId, matchId, runId: suggest.data?.runId, candidateKey }) as Promise<{ ticketId: string }>) });
  return <View style={{ gap: 12, marginTop: 12 }}>
    <PressableScale accessibilityRole="button" disabled={suggest.isPending} onPress={() => suggest.mutate()}><Text style={{ color: theme.primary }}>{suggest.isPending ? 'Checking alternatives…' : 'Find a qualified replacement'}</Text></PressableScale>
    {suggest.error ? <Text style={{ color: theme.danger }}>{suggest.error.message}</Text> : null}
    {suggest.data?.status === 'INCOMPLETE' ? <Text style={{ color: theme.foreground }}>Replacement review is incomplete. Please retry.</Text> : null}
    {suggest.data?.status === 'COMPLETE' && suggest.data.mode === 'on' && !suggest.data.suggestions.length ? <Text style={{ color: theme.foreground }}>No independently qualified replacement was found.</Text> : null}
    {suggest.data?.mode === 'shadow' ? <Text style={{ color: theme.foreground }}>Research comparison only. Replacement acceptance is not enabled.</Text> : null}
    {suggest.data?.suggestions.map(s => <View key={s.candidateKey} style={{ gap: 8 }}>
      <Text style={{ color: theme.foreground }}>{s.homeTeam} vs {s.awayTeam} · {s.market} · Odds {s.odds?.toFixed(2)}</Text>
      <SelectionDecisionCard decision={s.decision} />
      {suggest.data.mode === 'on' ? <PressableScale accessibilityRole="button" disabled={accept.isPending} onPress={() => accept.mutate(s.candidateKey)}><Text style={{ color: theme.primary }}>Accept and recheck current price</Text></PressableScale> : null}
    </View>)}
    {accept.error ? <Text style={{ color: theme.danger }}>{accept.error.message}</Text> : null}
    {accept.data ? <PressableScale accessibilityRole="link" onPress={() => router.push(`/ticket/${accept.data!.ticketId}`)}><Text style={{ color: theme.primary }}>Open revised ticket — original preserved</Text></PressableScale> : null}
  </View>;
}
