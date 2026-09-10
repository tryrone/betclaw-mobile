import { FixTicketReviewPanel } from "@/components/ticket/FixTicketReviewPanel";
import { SelectionReviewPanel } from "@/components/ticket/SelectionReviewPanel";
import { type SelectionDecision, type SelectionPresentation } from '@/lib/selection-display';
import { SelectionDecisionCard } from '@/components/ticket/SelectionExplanation';
import { useLocalSearchParams } from 'expo-router';
import { Copy, SlidersHorizontal, Target, Wand2 } from '@/components/modern-icons';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View, Switch } from 'react-native';
import Animated from 'react-native-reanimated';

import { JobProgressPanel } from '@/components/ticket/JobProgressPanel';
import { LegDetailSheet, type TicketLeg } from '@/components/ticket/LegDetailSheet';
import {
  enterUp,
  FormField,
  GlassCard,
  GradientButton,
  IconButton,
  PressableScale,
  ProgressBar,
  Screen,
  ScreenHeader,
  StatusBadge,
} from '@/components/ui';
import type { TicketRowData as BaseTicketRowData } from '@/data/mock';
import { getErrorMessage } from '@/lib/api/client';
import { useFixTicketMutation, useJobStatus, useTicketById } from '@/lib/api/hooks';
import { useAppTheme } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

type TicketRowData = BaseTicketRowData & { selectionDecision?: SelectionDecision | null; selectionPresentation?: SelectionPresentation | null; selectionReason?: string | null };
const riskLevels = ['Safe', 'Balanced', 'Bold'];
const riskMap = {
  Balanced: 'moderate',
  Bold: 'aggressive',
  Safe: 'conservative',
} as const;


function TicketRow({ onPress, row }: { onPress?: () => void; row: TicketRowData }) {
  const theme = useAppTheme();
  const keep = row.status === 'Keep';

  return (
      <GlassCard style={styles.ticketRow}>
        <View style={styles.ticketTop}>
          <View style={styles.ticketCopy}>
            <Text numberOfLines={1} style={[styles.ticketTeams, { color: theme.foregroundStrong }]}>
              {row.teams}
            </Text>
            <Text numberOfLines={1} style={[styles.ticketMarket, { color: theme.mutedLight }]}>
              {row.market}
            </Text>
          </View>
          <StatusBadge label={row.status} tone={keep ? 'success' : 'danger'} />
        </View>
        <SelectionDecisionCard decision={row.selectionDecision} presentation={row.selectionPresentation} recorded={row} title={row.teams} market={row.market} onViewEvidence={onPress} />

      </GlassCard>
  );
}

export default function FixTicketScreen() {
  const params = useLocalSearchParams<{ code?: string; reviewId?: string }>();
  const [bookingCode, setBookingCode] = useState('');
  const [jobId, setJobId] = useState<string | null>(null);
  const [objective, setObjective] = useState<'reduce_risk' | 'find_value'>('reduce_risk');
  const [allowOutsideReplacements, setAllowOutsideReplacements] = useState(false);

  // Adjust state when the route param changes (React "derived state" pattern).
  const seededCode = Array.isArray(params.code) ? params.code[0] : params.code;
  const [appliedSeed, setAppliedSeed] = useState<string | undefined>();
  if (seededCode && seededCode !== appliedSeed) {
    setAppliedSeed(seededCode);
    setBookingCode(seededCode);
  }
  const [risk, setRisk] = useState('Balanced');
  const [selectedLeg, setSelectedLeg] = useState<TicketLeg | null>(null);
  const theme = useAppTheme();
  const fixTicket = useFixTicketMutation();
  const jobStatus = useJobStatus(jobId);
  const reviewId = jobStatus.data?.status === 'done' || jobStatus.data?.status === 'review'
    ? jobStatus.data.reviewId ?? params.reviewId ?? null : params.reviewId ?? null;
  // Durable reviews own their result UI, including history changes and revised proposals.
  const ticket = useTicketById(!reviewId && jobStatus.data?.status === 'done' ? jobStatus.data.ticketId : null);
  const displayRows = useMemo<TicketRowData[]>(() => {
    const matches = ticket.data?.matches;
    if (!Array.isArray(matches) || matches.length === 0) return [];

    return matches.map((match: any) => ({
      id: match.id,
      teams: `${match.homeTeam} vs ${match.awayTeam}`,
      market: match.market,
      confidence: Math.round(match.confidence ?? 0),
      selectionDecision: match.selectionDecision,
      selectionPresentation: match.selectionPresentation,
      selectionReason: match.selectionReason,
      status: match.status === 'KEPT' ? 'Keep' : 'Remove',
      reason: match.reason ?? '',
    }));
  }, [ticket.data]);
  const pipelineState = jobStatus.data?.status ?? (fixTicket.isPending ? 'processing' : null);

  const handleOptimize = () => {
    fixTicket.mutate(
      {
        bookingCode: bookingCode.trim(),
        platform: 'SPORTYBET', objective, allowOutsideReplacements,
        riskTolerance: riskMap[risk as keyof typeof riskMap],
      },
      {
        onSuccess: (result) => {
          setJobId(result.jobId);
        },
      },
    );
  };

  return (
    <Screen hasTabs>
      <Animated.View entering={enterUp(0)}>
        <ScreenHeader action={<IconButton icon={SlidersHorizontal} label="Ticket settings" />} eyebrow="Optimize" title="Fix Ticket" />
      </Animated.View>

      <Animated.View entering={enterUp(1)}>
        <GlassCard style={styles.bookingCard}>
          <View style={styles.bookingTop}>
            <StatusBadge label="Booking code" tone="accent" />
            <StatusBadge label="SportyBet" />
          </View>
          <FormField autoCapitalize="characters" icon={Copy} label="Booking code" onChangeText={setBookingCode} placeholder="Paste SportyBet code" value={bookingCode} />
          <View style={styles.riskGrid}>
            {(['reduce_risk', 'find_value'] as const).map(mode => <PressableScale key={mode} accessibilityRole="button" accessibilityLabel={mode === 'reduce_risk' ? 'Reduce risk' : 'Find value'} onPress={() => setObjective(mode)} style={styles.riskPill}>
              <Text style={{ color: objective === mode ? theme.primarySoft : theme.mutedLight }}>{mode === 'reduce_risk' ? 'Reduce risk' : 'Find value'}</Text>
            </PressableScale>)}
          </View>
          <Text style={{ color: theme.mutedLight }}>Reduce risk prioritizes supported estimates and may lower payout. Find value also requires positive expected return.</Text>
          <Text style={{ color: theme.mutedLight }}>Allow replacements from other fixtures in the original kickoff window</Text>
          <Switch accessibilityLabel="Allow outside replacements" value={allowOutsideReplacements} onValueChange={setAllowOutsideReplacements} />
          <View style={styles.riskGrid}>
            {riskLevels.map((level) => {
              const active = level === risk;
              return (
                <PressableScale
                  accessibilityLabel={`${level} risk`}
                  accessibilityRole="button"
                  key={level}
                  onPress={() => setRisk(level)}
                  style={[
                    styles.riskPill,
                    {
                      backgroundColor: active ? theme.primarySubtle : theme.field,
                      borderColor: active ? theme.selectionBorder : theme.border,
                    },
                  ]}>
                  <Text style={[styles.riskText, { color: active ? theme.primarySoft : theme.mutedLight }]}>{level}</Text>
                </PressableScale>
              );
            })}
          </View>
          {fixTicket.error ? <Text style={[styles.reason, { color: theme.danger }]}>{getErrorMessage(fixTicket.error)}</Text> : null}
          <GradientButton icon={Wand2} onPress={handleOptimize}>
            {fixTicket.isPending ? 'Submitting...' : 'Optimize Ticket'}
          </GradientButton>
        </GlassCard>
      </Animated.View>

      <Animated.View entering={enterUp(2)}>
        <GlassCard>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: theme.foregroundStrong }]}>Pipeline</Text>
            <StatusBadge
              label={pipelineState === 'review' ? 'Review complete' : pipelineState === 'done' ? 'Done' : pipelineState === 'error' ? 'Failed' : pipelineState === 'processing' ? 'Researching' : 'Ready'}
              tone={pipelineState === 'done' ? 'success' : pipelineState === 'error' ? 'danger' : pipelineState === 'processing' ? 'warning' : 'neutral'}
            />
          </View>
          {jobStatus.data?.status === 'error' ? <Text style={[styles.reason, { color: theme.danger }]}>{jobStatus.data.message}</Text> : null}
          {(jobStatus.data?.status === 'done' || jobStatus.data?.status === 'review') ? <Text style={[styles.reason, { color: theme.mutedLight }]}>{jobStatus.data.summary}</Text> : null}
          <JobProgressPanel pending={fixTicket.isPending} state={jobStatus.data ?? null} />
        </GlassCard>
      </Animated.View>

      <Animated.View entering={enterUp(3)}>
        <GlassCard gradient="amberCard">
          <View style={styles.cardHeader}>
            <View>
              <Text style={[styles.cardTitle, { color: theme.foregroundStrong }]}>Ticket trust</Text>
              <Text style={[styles.cardCaption, { color: theme.muted }]}>Verified data coverage across kept legs.</Text>
            </View>
            <Target color={theme.primarySoft} size={21} />
          </View>
          <ProgressBar value={pipelineState === 'done' ? 100 : pipelineState === 'processing' ? 62 : 0} />
        </GlassCard>
      </Animated.View>

      <Animated.View entering={enterUp(4)} style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.foregroundStrong }]}>Optimized slip</Text>
        <StatusBadge label={`${displayRows.filter((row) => row.status === 'Keep').length} kept`} tone="success" />
      </Animated.View>

      {displayRows.length === 0 ? (
        <Animated.View entering={enterUp(5)}>
          <GlassCard style={styles.emptyCard}>
            <Text style={[styles.emptyTitle, { color: theme.foregroundStrong }]}>
              {ticket.isLoading ? 'Loading optimized slip' : 'No optimized slip yet'}
            </Text>
            <Text style={[styles.emptyCopy, { color: theme.muted }]}>
              {ticket.isLoading ? 'Fetching the saved ticket decisions.' : 'Run a booking code to see real kept and removed legs.'}
            </Text>
          </GlassCard>
        </Animated.View>
      ) : null}

      {ticket.data ? <SelectionReviewPanel runId={ticket.data.evaluationRunId} initialReview={ticket.data.selectionReview} /> : null}
      {displayRows.map((row, index) => (
        <Animated.View entering={enterUp(6 + index)} key={row.id}>
          <TicketRow
            onPress={() => {
              const leg = ticket.data?.matches?.find((match) => match.id === row.id) ?? null;
              setSelectedLeg(leg);
            }}
            row={row}
          />
        </Animated.View>
      ))}

      {pipelineState !== 'processing' && <FixTicketReviewPanel reviewId={reviewId} />}
      <LegDetailSheet leg={selectedLeg} onClose={() => setSelectedLeg(null)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  bookingCard: {
    gap: spacing.md,
  },
  bookingCode: {
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  bookingText: {
    fontFamily: fonts.extraBold,
    fontSize: 20,
    letterSpacing: 0,
  },
  bookingTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardCaption: {
    fontFamily: fonts.medium,
    fontSize: 12,
    marginTop: 4,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 16,
  },
  copyButton: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  emptyCard: {
    gap: spacing.xs,
    padding: spacing.lg,
  },
  emptyCopy: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
  },
  emptyTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 15,
  },
  reason: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 19,
  },
  riskGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  riskPill: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    flex: 1,
    height: 36,
    justifyContent: 'center',
  },
  riskText: {
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 17,
  },
  ticketCopy: {
    flex: 1,
    minWidth: 0,
  },
  ticketMarket: {
    fontFamily: fonts.medium,
    fontSize: 12,
    marginTop: 4,
  },
  ticketRow: {
    gap: spacing.sm,
    padding: spacing.md,
  },
  ticketTeams: {
    fontFamily: fonts.extraBold,
    fontSize: 14,
  },
  ticketTop: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
});
