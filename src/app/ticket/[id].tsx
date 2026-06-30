import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Copy, ExternalLink, Share2, ShieldCheck, Trophy } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { enterUp, GlassCard, IconButton, PressableScale, ProgressBar, Screen, ScreenHeader, StatusBadge } from '@/components/ui';
import { getErrorMessage } from '@/lib/api/client';
import {
  useCreateShareLinkMutation,
  useGenerateBookingCodeMutation,
  useSetMatchResultMutation,
  useTicketById,
} from '@/lib/api/hooks';
import type { TicketMatchResult } from '@/lib/api/types';
import { BOOKMAKER_PLATFORM_OPTIONS, DEFAULT_BOOKMAKER_PLATFORM, type SupportedPlatform } from '@/lib/bookmaker-platforms';
import { copyOrShareText, formatDateTime, openExternalUrl } from '@/lib/mobile-format';
import { useAppTheme } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

const resultActions: { label: string; value: TicketMatchResult }[] = [
  { label: 'Pending', value: 'PENDING' },
  { label: 'Won', value: 'WON' },
  { label: 'Lost', value: 'LOST' },
];

function matchTone(status?: string) {
  if (status === 'KEPT') return 'success' as const;
  if (status === 'REMOVED') return 'danger' as const;
  return 'neutral' as const;
}

function resultTone(result?: string | null) {
  if (result === 'WON') return 'success' as const;
  if (result === 'LOST') return 'danger' as const;
  return 'warning' as const;
}

function PlatformPill({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  const theme = useAppTheme();

  return (
    <PressableScale
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.platformPill,
        {
          backgroundColor: active ? theme.primarySubtle : theme.field,
          borderColor: active ? theme.selectionBorder : theme.border,
        },
      ]}>
      <Text style={[styles.platformText, { color: active ? theme.primarySoft : theme.mutedLight }]}>{label}</Text>
    </PressableScale>
  );
}

function MatchDetailRow({
  match,
  onSetResult,
}: {
  match: any;
  onSetResult: (matchId: string, result: TicketMatchResult) => void;
}) {
  const theme = useAppTheme();
  const confidence = Math.round(match.confidence ?? 0);
  const evidence = [
    match.selectionReason,
    match.confidenceReason,
    match.h2hSummary,
    match.keyFactors,
    match.reason,
  ].filter(Boolean);

  return (
    <GlassCard style={styles.matchCard}>
      <View style={styles.matchTop}>
        <View style={styles.matchCopy}>
          <Text numberOfLines={1} style={[styles.matchTeams, { color: theme.foregroundStrong }]}>
            {match.homeTeam} vs {match.awayTeam}
          </Text>
          <Text numberOfLines={1} style={[styles.matchMeta, { color: theme.mutedLight }]}>
            {match.selectionLabel ?? match.market}
          </Text>
        </View>
        <StatusBadge label={match.status ?? 'Match'} tone={matchTone(match.status)} />
      </View>

      <View style={styles.metricRow}>
        <Text style={[styles.metric, { color: theme.primarySoft }]}>Odds {Number(match.odds ?? 0).toFixed(2)}</Text>
        <Text style={[styles.metric, { color: theme.foreground }]}>{confidence}% confidence</Text>
        <StatusBadge label={match.matchResult ?? 'PENDING'} tone={resultTone(match.matchResult)} />
      </View>
      <ProgressBar tone={match.status === 'KEPT' ? 'success' : 'warning'} value={confidence} />

      {evidence.slice(0, 3).map((item, index) => (
        <View key={`${match.id}-${index}`} style={styles.evidenceRow}>
          <View style={[styles.evidenceDot, { backgroundColor: theme.primarySoft }]} />
          <Text style={[styles.evidenceText, { color: theme.mutedLight }]}>{String(item)}</Text>
        </View>
      ))}

      {Array.isArray(match.citations) && match.citations.length > 0 ? (
        <View style={styles.citationList}>
          {match.citations.slice(0, 2).map((citation: any) => (
            <PressableScale
              accessibilityLabel={citation.title ?? 'Open source'}
              accessibilityRole="link"
              key={citation.url}
              onPress={() => void openExternalUrl(citation.url)}
              style={[styles.citationPill, { borderColor: theme.border, backgroundColor: theme.field }]}>
              <ExternalLink color={theme.primarySoft} size={13} />
              <Text numberOfLines={1} style={[styles.citationText, { color: theme.foreground }]}>
                {citation.title ?? citation.url}
              </Text>
            </PressableScale>
          ))}
        </View>
      ) : null}

      <View style={styles.resultRow}>
        {resultActions.map((action) => {
          const active = match.matchResult === action.value;
          return (
            <PressableScale
              accessibilityLabel={`Mark ${action.label}`}
              accessibilityRole="button"
              key={action.value}
              onPress={() => onSetResult(match.id, action.value)}
              style={[
                styles.resultButton,
                {
                  backgroundColor: active ? theme.primarySubtle : theme.field,
                  borderColor: active ? theme.selectionBorder : theme.border,
                },
              ]}>
              <Text style={[styles.resultText, { color: active ? theme.primarySoft : theme.mutedLight }]}>{action.label}</Text>
            </PressableScale>
          );
        })}
      </View>
    </GlassCard>
  );
}

export default function TicketDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const theme = useAppTheme();
  const ticketId = Array.isArray(id) ? id[0] : id;
  const ticket = useTicketById(ticketId);
  const generateCode = useGenerateBookingCodeMutation();
  const createShareLink = useCreateShareLinkMutation();
  const setMatchResult = useSetMatchResultMutation(ticketId);
  const [platform, setPlatform] = useState<SupportedPlatform>(DEFAULT_BOOKMAKER_PLATFORM);
  const [message, setMessage] = useState<string | null>(null);
  const data = ticket.data;
  const kept = data?.matches?.filter((match) => match.status === 'KEPT').length ?? 0;
  const total = data?.matches?.length ?? 0;

  const handleGenerate = () => {
    if (!ticketId || generateCode.isPending) return;
    setMessage(null);
    generateCode.mutate({ platform, ticketId });
  };

  const handleShare = async () => {
    if (!ticketId || createShareLink.isPending) return;
    try {
      const result = await createShareLink.mutateAsync({ ticketId });
      await copyOrShareText(result.previewUrl, 'BetClaw ticket');
      setMessage('Share link ready');
    } catch {
      setMessage('Could not create share link');
    }
  };

  const handleCopyCode = async (code?: string | null) => {
    if (!code) return;
    try {
      const mode = await copyOrShareText(code, 'BetClaw booking code');
      setMessage(mode === 'copied' ? 'Code copied' : 'Code shared');
    } catch {
      setMessage('Could not copy code');
    }
  };

  const handleSetResult = (matchId: string, result: TicketMatchResult) => {
    setMatchResult.mutate({ matchId, result });
  };

  return (
    <Screen>
      <Animated.View entering={enterUp(0)}>
        <ScreenHeader
          eyebrow="Ticket detail"
          leadingAction={<IconButton icon={ArrowLeft} label="Go back" onPress={() => router.back()} />}
          title="Saved Slip"
        />
      </Animated.View>

      {ticket.isLoading ? (
        <Animated.View entering={enterUp(1)}>
          <GlassCard style={styles.emptyCard}>
            <Text style={[styles.emptyTitle, { color: theme.foregroundStrong }]}>Loading ticket</Text>
            <Text style={[styles.emptyCopy, { color: theme.muted }]}>Fetching saved matches and evidence.</Text>
          </GlassCard>
        </Animated.View>
      ) : null}

      {data ? (
        <>
          <Animated.View entering={enterUp(1)}>
            <GlassCard gradient="hero" style={styles.summaryCard}>
              <View style={styles.summaryTop}>
                <StatusBadge label={data.result ?? 'PENDING'} tone={resultTone(data.result)} />
                <ShieldCheck color={theme.primarySoft} size={22} />
              </View>
              <Text style={[styles.summaryTitle, { color: theme.foregroundStrong }]}>
                {data.bookingCode ?? data.originalCode ?? 'BetClaw ticket'}
              </Text>
              <Text style={[styles.summaryMeta, { color: theme.mutedLight }]}>
                {formatDateTime(data.createdAt)} · {kept}/{total} kept · odds {data.optimizedOdds?.toFixed(2) ?? '-'}
              </Text>
              <View style={styles.metricTiles}>
                <View style={[styles.metricTile, { backgroundColor: theme.field, borderColor: theme.border }]}>
                  <Text style={[styles.tileValue, { color: theme.primarySoft }]}>{kept}</Text>
                  <Text style={[styles.tileLabel, { color: theme.muted }]}>Kept</Text>
                </View>
                <View style={[styles.metricTile, { backgroundColor: theme.field, borderColor: theme.border }]}>
                  <Text style={[styles.tileValue, { color: theme.foregroundStrong }]}>{data.avgConfidence?.toFixed(0) ?? '-'}</Text>
                  <Text style={[styles.tileLabel, { color: theme.muted }]}>Avg conf.</Text>
                </View>
                <View style={[styles.metricTile, { backgroundColor: theme.field, borderColor: theme.border }]}>
                  <Text style={[styles.tileValue, { color: theme.foregroundStrong }]}>{data.optimizedOdds?.toFixed(2) ?? '-'}</Text>
                  <Text style={[styles.tileLabel, { color: theme.muted }]}>Odds</Text>
                </View>
              </View>
            </GlassCard>
          </Animated.View>

          <Animated.View entering={enterUp(2)}>
            <GlassCard>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: theme.foregroundStrong }]}>Generate booking code</Text>
                <Trophy color={theme.primarySoft} size={20} />
              </View>
              <ScrollView contentContainerStyle={styles.platformRow} horizontal showsHorizontalScrollIndicator={false}>
                {BOOKMAKER_PLATFORM_OPTIONS.map((option) => (
                  <PlatformPill
                    active={platform === option.id}
                    key={option.id}
                    label={option.label}
                    onPress={() => setPlatform(option.id)}
                  />
                ))}
              </ScrollView>
              <View style={styles.actionGrid}>
                <PressableScale accessibilityLabel="Generate booking code" accessibilityRole="button" onPress={handleGenerate} style={[styles.actionButton, { backgroundColor: theme.field, borderColor: theme.border }]}>
                  <Copy color={theme.primarySoft} size={16} />
                  <Text style={[styles.actionText, { color: theme.foreground }]}>{generateCode.isPending ? 'Generating...' : 'Generate'}</Text>
                </PressableScale>
                <PressableScale accessibilityLabel="Create share link" accessibilityRole="button" onPress={handleShare} style={[styles.actionButton, { backgroundColor: theme.field, borderColor: theme.border }]}>
                  <Share2 color={theme.primarySoft} size={16} />
                  <Text style={[styles.actionText, { color: theme.foreground }]}>{createShareLink.isPending ? 'Sharing...' : 'Share'}</Text>
                </PressableScale>
              </View>
              {generateCode.data?.bookingCode ? (
                <PressableScale accessibilityLabel="Copy booking code" accessibilityRole="button" onPress={() => handleCopyCode(generateCode.data?.bookingCode)} style={[styles.codeBox, { backgroundColor: theme.field, borderColor: theme.selectionBorder }]}>
                  <Text style={[styles.codeText, { color: theme.primarySoft }]}>{generateCode.data.bookingCode}</Text>
                  <Copy color={theme.primarySoft} size={16} />
                </PressableScale>
              ) : null}
              {generateCode.data && !generateCode.data.success ? (
                <Text style={[styles.errorText, { color: theme.warning }]}>
                  {generateCode.data.error ?? generateCode.data.regenerationError ?? 'Code generation is unavailable.'}
                </Text>
              ) : null}
              {generateCode.error ? <Text style={[styles.errorText, { color: theme.danger }]}>{getErrorMessage(generateCode.error)}</Text> : null}
              {createShareLink.error ? <Text style={[styles.errorText, { color: theme.danger }]}>{getErrorMessage(createShareLink.error)}</Text> : null}
              {message ? <Text style={[styles.message, { color: theme.success }]}>{message}</Text> : null}
            </GlassCard>
          </Animated.View>

          {data.matches?.map((match, index) => (
            <Animated.View entering={enterUp(3 + index)} key={match.id}>
              <MatchDetailRow match={match} onSetResult={handleSetResult} />
            </Animated.View>
          ))}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 42,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionText: {
    fontFamily: fonts.bold,
    fontSize: 12,
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
  citationList: {
    gap: spacing.xs,
  },
  citationPill: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 32,
    paddingHorizontal: spacing.sm,
  },
  citationText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 11,
  },
  codeBox: {
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  codeText: {
    flex: 1,
    fontFamily: fonts.extraBold,
    fontSize: 20,
    letterSpacing: 0,
  },
  emptyCard: {
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.lg,
  },
  emptyCopy: {
    fontFamily: fonts.medium,
    fontSize: 12,
    textAlign: 'center',
  },
  emptyTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 16,
  },
  errorText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
  },
  evidenceDot: {
    borderRadius: radius.pill,
    height: 7,
    marginTop: 6,
    width: 7,
  },
  evidenceRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  evidenceText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
  },
  matchCard: {
    gap: spacing.sm,
  },
  matchCopy: {
    flex: 1,
    minWidth: 0,
  },
  matchMeta: {
    fontFamily: fonts.medium,
    fontSize: 12,
    marginTop: 3,
  },
  matchTeams: {
    fontFamily: fonts.extraBold,
    fontSize: 14,
  },
  matchTop: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  message: {
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  metric: {
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  metricRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metricTile: {
    borderRadius: radius.lg,
    borderWidth: 1,
    flex: 1,
    padding: spacing.md,
  },
  metricTiles: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  platformPill: {
    borderRadius: radius.pill,
    borderWidth: 1,
    minHeight: 34,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  platformRow: {
    gap: spacing.sm,
    paddingVertical: 2,
  },
  platformText: {
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  resultButton: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    flex: 1,
    minHeight: 34,
    justifyContent: 'center',
  },
  resultRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  resultText: {
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  summaryCard: {
    gap: spacing.md,
  },
  summaryMeta: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
  },
  summaryTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 20,
  },
  summaryTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tileLabel: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    marginTop: 3,
  },
  tileValue: {
    fontFamily: fonts.extraBold,
    fontSize: 20,
  },
});
