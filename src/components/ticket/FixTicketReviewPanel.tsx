import { useState } from 'react';
import { Text, View } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trpc, callWithMobileRefresh } from '@/lib/api/client';
import { bookingCodeFromResult, formatReviewEstimate, reviewDispositionLabel, reviewIsPending, type FixReview } from '@/lib/fix-ticket-review';
import { GlassCard, GradientButton, PressableScale } from '@/components/ui';
import { useAppTheme } from '@/theme/colors';
function ReviewDetail({ id }: { id: string }) {
  const theme = useAppTheme();
  const queryClient = useQueryClient();
  const [showOther, setShowOther] = useState(false);
  const review = useQuery<FixReview>({ queryKey: ['fixReview', id],
    refetchInterval: query => reviewIsPending(query.state.data) ? 3000 : false,
    queryFn: () => callWithMobileRefresh(() => trpc.ticket.getFixReview.query({ reviewId: id })) });
  const refresh = () => { void review.refetch(); void queryClient.invalidateQueries({ queryKey: ['ticket'] }); void queryClient.invalidateQueries({ queryKey: ['fixReviews'] }); };
  const confirm = useMutation({ mutationFn: (input: { reviewId: string; proposalHash: string; revision: number }) =>
    callWithMobileRefresh(() => trpc.ticket.confirmFixProposal.mutate(input)), onSettled: refresh });
  const generate = useMutation<{ bookingCode: string; revision: number }, Error, { ticketId: string; revision: number }>({
    mutationFn: async input => {
      const result = await callWithMobileRefresh(() => trpc.ticket.generateBookingCode.mutate({ ticketId: input.ticketId, platform: 'SPORTYBET' }));
      return { bookingCode: bookingCodeFromResult(result), revision: input.revision };
    }, onSettled: refresh,
  });
  if (review.isLoading) return <Text accessibilityRole="alert" style={{ color: theme.mutedLight }}>Loading review…</Text>;
  if (review.error) return <Text accessibilityRole="alert" style={{ color: theme.danger }}>{review.error.message}</Text>;
  const data = review.data;
  if (!data) return null;
  const proposed = data.rows.filter(r => ['SELECTED', 'KEPT'].includes(r.disposition));
  const others = data.rows.filter(r => !['SELECTED', 'KEPT'].includes(r.disposition));
  const pending = reviewIsPending(data);
  const visible = proposed.length && !showOther ? proposed : [...proposed, ...others];
  return <View style={{ gap: 14 }}>
    <Text accessibilityRole="header" style={{ color: theme.foregroundStrong, fontWeight: '700', fontSize: 18 }}>{pending ? 'Review in progress' : data.status === 'REVIEW_ONLY' ? 'Review complete — no supported repair' : data.status === 'FAILED' ? 'Review interrupted' : 'Your proposed repair'}</Text>
    <Text style={{ color: theme.foregroundStrong }}>{data.summary ?? 'Checking your selections. You can return to this review later.'}</Text>
    <Text style={{ color: theme.mutedLight }}>{data.objective === 'reduce_risk' ? 'Reduce risk' : data.objective === 'find_value' ? 'Find value' : 'Legacy evaluation'} · {data.comparison}</Text>
    <Text style={{ color: theme.mutedLight }}>Odds: {data.originalOdds?.toFixed(2) ?? 'Unavailable'} → {data.proposedOdds?.toFixed(2) ?? 'No proposal'}</Text>
    <Text style={{ color: theme.mutedLight }}>Estimated probability: {formatReviewEstimate(data.originalProbability)} → {formatReviewEstimate(data.proposedProbability)}</Text>
    {data.reservationState === 'RELEASED' && <Text style={{ color: theme.mutedLight }}>Request restored. No research tokens charged.</Text>}
    {!data.diagnosticsAvailable && <Text style={{ color: theme.mutedLight }}>Detailed diagnostics have expired. Historical explanations cannot be reconstructed.</Text>}
    {visible.map(r => <View key={r.key} style={{ gap: 6, borderWidth: 1, borderColor: theme.border, borderRadius: 12, padding: 12 }}>
      <Text style={{ color: theme.foregroundStrong, fontWeight: '600' }}>{r.fixture}</Text>
      <Text style={{ color: theme.mutedLight }}>{r.market} · {r.original ? 'Original' : 'Alternative'} · {reviewDispositionLabel(r.disposition)}</Text>
      <Text style={{ color: theme.mutedLight }}>Odds {r.odds ?? 'unavailable'} · Chance {formatReviewEstimate(r.probability)} · Expected return {formatReviewEstimate(r.expectedValue)}</Text>
      <Text style={{ color: theme.mutedLight }}>{r.reason}</Text>
    </View>)}
    {proposed.length > 0 && others.length > 0 && <PressableScale accessibilityRole="button" accessibilityState={{ expanded: showOther }} onPress={() => setShowOther(!showOther)} style={{ paddingVertical: 12 }}><Text style={{ color: theme.primarySoft }}>{showOther ? 'Hide other selections' : `Show other selections (${others.length})`}</Text></PressableScale>}
    {data.status === 'REPAIRED' && data.ticketId && data.proposalHash && !pending && <>
      <GradientButton disabled={confirm.isPending || data.confirmed || !data.diagnosticsAvailable} onPress={() => { generate.reset(); confirm.mutate({ reviewId: id, proposalHash: data.proposalHash!, revision: data.revision }); }}>{confirm.isPending ? 'Confirming…' : data.confirmed ? 'Proposal confirmed' : 'Confirm proposed changes'}</GradientButton>
      {data.confirmed && <GradientButton disabled={generate.isPending} onPress={() => generate.mutate({ ticketId: data.ticketId!, revision: data.revision })}>{generate.isPending ? 'Checking current quotes…' : 'Generate booking code'}</GradientButton>}
    </>}
    {(confirm.error || generate.error) && <Text accessibilityRole="alert" style={{ color: theme.danger }}>{confirm.error?.message ?? generate.error?.message}</Text>}
    {data.confirmed && generate.data?.revision === data.revision && !generate.isPending && !generate.error && <Text selectable style={{ color: theme.foregroundStrong }}>Booking code: {generate.data.bookingCode}</Text>}
  </View>;
}
export function FixTicketReviewPanel({ reviewId }: { reviewId: string | null }) {
  const theme = useAppTheme();
  const [selection, setSelection] = useState<{ id: string; base: string | null } | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const id = selection && selection.base === reviewId ? selection.id : reviewId;
  const history = useQuery<{ id: string; status: string; createdAt: string }[]>({ queryKey: ['fixReviews', reviewId],
    queryFn: () => callWithMobileRefresh(() => trpc.ticket.listFixReviews.query()) });
  return <GlassCard>
    <View style={{ gap: 16 }}>
      <Text accessibilityRole="header" style={{ color: theme.foregroundStrong, fontWeight: '700', fontSize: 18 }}>Ticket reviews</Text>
      <PressableScale accessibilityRole="button" accessibilityState={{ expanded: showHistory }} onPress={() => setShowHistory(!showHistory)} style={{ paddingVertical: 10 }}><Text style={{ color: theme.primarySoft }}>{showHistory ? 'Hide review history' : 'Choose from review history'}</Text></PressableScale>
      {history.error && <Text accessibilityRole="alert" style={{ color: theme.danger }}>Review history could not load.</Text>}
      {showHistory && history.data?.map(r => <PressableScale key={r.id} accessibilityRole="button" accessibilityState={{ selected: id === r.id }} style={{ paddingVertical: 12 }} onPress={() => { setSelection({ id: r.id, base: reviewId }); setShowHistory(false); }}><Text style={{ color: theme.primarySoft }}>{new Date(r.createdAt).toLocaleString()} · {r.status.toLowerCase().replaceAll('_', ' ')}</Text></PressableScale>)}
      {id ? <ReviewDetail key={id} id={id} /> : <Text style={{ color: theme.mutedLight }}>Completed reviews and proposals will appear here.</Text>}
    </View>
  </GlassCard>;
}
