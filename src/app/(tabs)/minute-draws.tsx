import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  ArrowLeft,
  Check,
  Clock3,
  Copy,
  Info,
  Minus,
  Plus,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
} from '@/components/modern-icons';
import {
  DashboardChip,
  DashboardGlassCard,
  IconButton,
  PressableScale,
  Screen,
  ScreenHeader,
  StatusBadge,
  useToast,
} from '@/components/ui';
import { useMinuteDrawInventory } from '@/lib/api/hooks';
import type { MinuteDrawDayOffset, MinuteDrawMode, MinuteDrawResult } from '@/lib/api/types';
import { isMinuteDrawHandoffFresh, MINUTE_DRAW_PRESENTATION } from '@/lib/minute-draw';
import { copyOrShareText } from '@/lib/mobile-format';
import { useAppTheme } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

const dateOptions = [
  { label: 'Today', value: 0 },
  { label: 'Tomorrow', value: 1 },
  { label: 'Next day', value: 2 },
] as const satisfies readonly { label: string; value: MinuteDrawDayOffset }[];

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function signedPercent(value: number) {
  const amount = value * 100;
  return `${amount >= 0 ? '+' : ''}${amount.toFixed(1)}%`;
}

function kickoffLabel(value: string | Date) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Kickoff unavailable';
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    day: 'numeric',
    timeZone: 'Africa/Lagos',
    timeZoneName: 'short',
  }).format(date);
}

function checkedLabel(value: string | Date) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Verification time unavailable';
  const ageMinutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60_000));
  if (ageMinutes < 1) return 'Checked just now';
  return `Checked ${ageMinutes} min ago`;
}

function recommendationTone(result: MinuteDrawResult) {
  return MINUTE_DRAW_PRESENTATION[result.recommendationState].tone;
}

function recommendationLabel(result: MinuteDrawResult) {
  return MINUTE_DRAW_PRESENTATION[result.recommendationState].label;
}

function Segment({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  const theme = useAppTheme();
  return (
    <PressableScale
      accessibilityLabel={label}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[
        styles.segment,
        {
          backgroundColor: active ? theme.primary : theme.surface,
          borderColor: active ? theme.primary : theme.border,
        },
      ]}>
      <Text style={[styles.segmentText, { color: active ? theme.primaryDark : theme.mutedLight }]}>{label}</Text>
    </PressableScale>
  );
}

function ResultCard({
  nowMs,
  result,
  staleAfterSeconds,
}: {
  nowMs: number;
  result: MinuteDrawResult;
  staleAfterSeconds: number;
}) {
  const theme = useAppTheme();
  const { showToast } = useToast();
  const canHandoff = isMinuteDrawHandoffFresh({
    nowMs,
    quoteFetchedAt: result.quoteFetchedAt,
    serverFresh: result.fresh,
    staleAfterSeconds,
  });
  const handleCopy = async () => {
    if (!isMinuteDrawHandoffFresh({
      quoteFetchedAt: result.quoteFetchedAt,
      serverFresh: result.fresh,
      staleAfterSeconds,
    })) {
      showToast({ message: 'Refresh SportyBet availability before using this market', title: 'Quote is stale', tone: 'error' });
      return;
    }
    const reference = [
      'SportyBet Nigeria manual reference',
      `${result.homeTeam} vs ${result.awayTeam}`,
      result.league,
      kickoffLabel(result.kickoffTime),
      `${result.intervalMinutes} minutes - 1X2: Draw`,
      `Market ${result.marketId} (${result.specifier})`,
      `Outcome ${result.selectionId}: ${result.selectionLabel}`,
      `Current odds ${result.odds.toFixed(2)}`,
      checkedLabel(result.quoteFetchedAt),
    ].join('\n');
    try {
      const mode = await copyOrShareText(reference, 'SportyBet minute draw reference');
      showToast({
        message: mode === 'copied' ? 'Exact market reference copied' : 'Exact market reference shared',
        title: 'Manual handoff',
        tone: 'success',
      });
    } catch {
      showToast({ message: 'Could not copy the market reference', title: 'Copy failed', tone: 'error' });
    }
  };

  return (
    <DashboardGlassCard
      style={styles.resultCard}>
      <View
        accessible
        accessibilityLabel={`${result.homeTeam} versus ${result.awayTeam}. ${result.intervalMinutes} minute draw. Odds ${result.odds.toFixed(2)}. ${recommendationLabel(result)}.`}
        style={styles.resultHeader}>
        <View style={styles.flex}>
          <Text numberOfLines={1} style={[styles.league, { color: theme.primary }]}>{result.league}</Text>
          <Text style={[styles.fixture, { color: theme.foregroundStrong }]}>{result.homeTeam} vs {result.awayTeam}</Text>
          <Text style={[styles.kickoff, { color: theme.mutedLight }]}>{kickoffLabel(result.kickoffTime)}</Text>
        </View>
        <StatusBadge label={recommendationLabel(result)} tone={recommendationTone(result)} />
      </View>

      <View style={[styles.marketRow, { backgroundColor: theme.primarySubtle, borderColor: theme.borderAccent }]}>
        <View style={[styles.clockIcon, { backgroundColor: theme.card }]}><Clock3 color={theme.primary} size={20} /></View>
        <View style={styles.flex}>
          <Text style={[styles.marketTitle, { color: theme.foregroundStrong }]}>{result.intervalMinutes}-minute 1X2 · Draw</Text>
          <Text style={[styles.marketMeta, { color: theme.mutedLight }]}>SportyBet market {result.marketId} · {result.specifier}</Text>
        </View>
        <Text style={[styles.odds, { color: theme.foregroundStrong }]}>{result.odds.toFixed(2)}</Text>
      </View>

      <View style={styles.metrics}>
        <View style={[styles.metric, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.metricLabel, { color: theme.muted }]}>OUR PROBABILITY</Text>
          <Text style={[styles.metricValue, { color: theme.foregroundStrong }]}>
            {result.dataQuality === 'RATED' ? percent(result.modelProbability) : '—'}
          </Text>
        </View>
        <View style={[styles.metric, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.metricLabel, { color: theme.muted }]}>SPORTYBET IMPLIED</Text>
          <Text style={[styles.metricValue, { color: theme.foregroundStrong }]}>
            {result.dataCoverage.siblingPrices === 3 ? percent(result.bookmakerProbability) : '—'}
          </Text>
        </View>
        <View style={[styles.metric, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.metricLabel, { color: theme.muted }]}>MODEL EDGE</Text>
          <Text style={[styles.metricValue, { color: result.edge > 0 ? theme.success : theme.mutedLight }]}>
            {result.dataQuality === 'RATED' ? signedPercent(result.edge) : '—'}
          </Text>
        </View>
      </View>

      <Text style={[styles.explanation, { color: theme.mutedLight }]}>{result.explanation}</Text>
      <View style={styles.verificationRow}>
        {result.fresh ? <ShieldCheck color={theme.success} size={16} /> : <TriangleAlert color={theme.danger} size={16} />}
        <Text style={[styles.verificationText, { color: result.fresh ? theme.success : theme.danger }]}>
          {checkedLabel(result.quoteFetchedAt)}
        </Text>
      </View>
      <PressableScale
        accessibilityHint={canHandoff ? 'Copies the exact fixture and SportyBet market details' : 'Refresh availability before using this market'}
        accessibilityLabel="Copy SportyBet manual reference"
        accessibilityRole="button"
        accessibilityState={{ disabled: !canHandoff }}
        disabled={!canHandoff}
        onPress={handleCopy}
        style={[
          styles.copyButton,
          {
            backgroundColor: canHandoff ? theme.primary : theme.surface,
            borderColor: canHandoff ? theme.primary : theme.border,
            opacity: canHandoff ? 1 : 0.5,
          },
        ]}>
        <Copy color={canHandoff ? theme.primaryDark : theme.muted} size={17} />
        <Text style={[styles.copyButtonText, { color: canHandoff ? theme.primaryDark : theme.muted }]}>Copy manual reference</Text>
      </PressableScale>
    </DashboardGlassCard>
  );
}

export default function MinuteDrawsScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const [mode, setMode] = useState<MinuteDrawMode>('recommended');
  const [dayOffset, setDayOffset] = useState<MinuteDrawDayOffset>(0);
  const [intervals, setIntervals] = useState<(5 | 10)[]>([5, 10]);
  const [gameCount, setGameCount] = useState(5);
  const [leagueKeys, setLeagueKeys] = useState<string[]>([]);
  const [nowMs, setNowMs] = useState(0);
  useEffect(() => {
    const immediate = setTimeout(() => setNowMs(Date.now()), 0);
    const timer = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => {
      clearTimeout(immediate);
      clearInterval(timer);
    };
  }, []);
  const input = useMemo(
    () => ({ dayOffset, gameCount, intervalMinutes: intervals, leagueKeys, mode }),
    [dayOffset, gameCount, intervals, leagueKeys, mode],
  );
  const inventory = useMinuteDrawInventory(input);
  const pages = inventory.data?.pages ?? [];
  const summary = pages[0];
  const results = Array.from(
    new Map(
      pages.flatMap((page) => page.results).map((result) => [
        `${result.eventId}:${result.marketId}:${result.specifier}`,
        result,
      ]),
    ).values(),
  );
  const leagues = summary?.leagues ?? [];

  const toggleInterval = (interval: 5 | 10) => {
    setIntervals((current) => {
      if (!current.includes(interval)) return [...current, interval].sort() as (5 | 10)[];
      if (current.length === 1) return current;
      return current.filter((value) => value !== interval);
    });
  };
  const toggleLeague = (key: string) => {
    setLeagueKeys((current) => current.includes(key) ? current.filter((value) => value !== key) : [...current, key]);
  };
  const providerTone = summary?.provider.status === 'FRESH'
    ? 'success'
    : summary?.provider.status === 'UNAVAILABLE'
      ? 'danger'
      : 'warning';

  return (
    <Screen
      hasTabs
      onRefresh={() => inventory.refetch()}
      refreshing={inventory.isRefetching && !inventory.isFetchingNextPage}>
      <ScreenHeader
        action={<IconButton icon={RefreshCw} label="Refresh minute draw availability" onPress={() => inventory.refetch()} />}
        eyebrow="SPORTYBET NIGERIA"
        leadingAction={<IconButton icon={ArrowLeft} label="Go back" onPress={() => router.back()} />}
        title="Minute Draws"
      />

      <DashboardGlassCard gradient="hero" style={styles.hero}>
        <View style={styles.heroTop}>
          <StatusBadge label="Experimental model" tone="accent" />
          <StatusBadge label={summary?.provider.status ?? 'Checking'} tone={providerTone} />
        </View>
        <Text style={[styles.heroTitle, { color: theme.foregroundStrong }]}>Find the draw. Verify the exact market.</Text>
        <Text style={[styles.heroCopy, { color: theme.mutedLight }]}>Browse SportyBet’s exact 1–5 and 1–10 minute Draw markets, then separate availability from genuine model value.</Text>
      </DashboardGlassCard>

      <View accessibilityRole="tablist" style={[styles.segmentGroup, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Segment active={mode === 'recommended'} label="Recommended" onPress={() => setMode('recommended')} />
        <Segment active={mode === 'all'} label="All available" onPress={() => setMode('all')} />
      </View>

      <DashboardGlassCard style={styles.filters}>
        <Text style={[styles.cardTitle, { color: theme.foregroundStrong }]}>Search filters</Text>
        <Text style={[styles.filterLabel, { color: theme.muted }]}>MATCH DAY · AFRICA/LAGOS</Text>
        <ScrollView contentContainerStyle={styles.horizontalChips} horizontal showsHorizontalScrollIndicator={false}>
          {dateOptions.map((option) => (
            <DashboardChip
              active={dayOffset === option.value}
              icon={dayOffset === option.value ? Check : undefined}
              key={option.value}
              label={option.label}
              onPress={() => {
                setDayOffset(option.value);
                setLeagueKeys([]);
              }}
            />
          ))}
        </ScrollView>
        <Text style={[styles.filterLabel, { color: theme.muted }]}>INTERVAL</Text>
        <View style={styles.wrap}>
          {([5, 10] as const).map((interval) => (
            <DashboardChip
              active={intervals.includes(interval)}
              icon={Clock3}
              key={interval}
              label={`${interval} minutes`}
              onPress={() => toggleInterval(interval)}
            />
          ))}
        </View>
        {mode === 'recommended' ? (
          <>
            <Text style={[styles.filterLabel, { color: theme.muted }]}>MAXIMUM GAMES</Text>
            <View style={[styles.stepper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <PressableScale
                accessibilityLabel="Fewer recommended games"
                accessibilityRole="button"
                onPress={() => setGameCount((value) => Math.max(1, value - 1))}
                style={[styles.stepperButton, { backgroundColor: theme.primarySubtle }]}>
                <Minus color={theme.primary} size={17} />
              </PressableScale>
              <View style={styles.stepperCopy}>
                <Text style={[styles.stepperValue, { color: theme.foregroundStrong }]}>{gameCount}</Text>
                <Text style={[styles.stepperLabel, { color: theme.muted }]}>up to 25 qualified games</Text>
              </View>
              <PressableScale
                accessibilityLabel="More recommended games"
                accessibilityRole="button"
                onPress={() => setGameCount((value) => Math.min(25, value + 1))}
                style={[styles.stepperButton, { backgroundColor: theme.primarySubtle }]}>
                <Plus color={theme.primary} size={17} />
              </PressableScale>
            </View>
          </>
        ) : null}
        {leagues.length ? (
          <>
            <View style={styles.filterHeader}>
              <Text style={[styles.filterLabel, { color: theme.muted }]}>LEAGUES</Text>
              {leagueKeys.length ? (
                <PressableScale accessibilityLabel="Clear league filters" accessibilityRole="button" onPress={() => setLeagueKeys([])} style={styles.clearButton}>
                  <Text style={[styles.clearText, { color: theme.primary }]}>Clear</Text>
                </PressableScale>
              ) : null}
            </View>
            <View style={styles.wrap}>
              {leagues.map((league) => (
                <DashboardChip
                  active={leagueKeys.includes(league.key)}
                  count={league.matchCount}
                  key={league.key}
                  label={league.name}
                  onPress={() => toggleLeague(league.key)}
                />
              ))}
            </View>
          </>
        ) : null}
      </DashboardGlassCard>

      {summary ? (
        <View style={styles.notices}>
          <View style={[styles.notice, { backgroundColor: summary.coverage.complete ? theme.successSoft : theme.warningSoft, borderColor: summary.coverage.complete ? theme.success : theme.warning }]}>
            {summary.coverage.complete ? <ShieldCheck color={theme.success} size={18} /> : <Info color={theme.warning} size={18} />}
            <Text style={[styles.noticeText, { color: theme.mutedLight }]}>{summary.coverage.message}</Text>
          </View>
          {summary.provider.error ? (
            <View style={[styles.notice, { backgroundColor: theme.dangerSoft, borderColor: theme.danger }]}>
              <TriangleAlert color={theme.danger} size={18} />
              <Text style={[styles.noticeText, { color: theme.danger }]}>{summary.provider.error} Cached rows are labelled stale.</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={styles.resultsHeader}>
        <View style={styles.flex}>
          <Text style={[styles.resultsTitle, { color: theme.foregroundStrong }]}>{mode === 'recommended' ? 'Qualified games' : 'Available markets'}</Text>
          <Text style={[styles.resultsCopy, { color: theme.mutedLight }]}>
            {summary ? `${summary.total} result${summary.total === 1 ? '' : 's'} · at most one interval per recommended fixture` : 'Checking exact SportyBet markets'}
          </Text>
        </View>
      </View>

      {inventory.isLoading ? (
        <DashboardGlassCard style={styles.loadingCard}>
          <ActivityIndicator color={theme.primary} size="small" />
          <Text style={[styles.loadingText, { color: theme.mutedLight }]}>Verifying SportyBet markets and scoring available fixtures…</Text>
        </DashboardGlassCard>
      ) : inventory.error ? (
        <DashboardGlassCard style={styles.emptyCard}>
          <TriangleAlert color={theme.danger} size={24} />
          <Text style={[styles.emptyTitle, { color: theme.foregroundStrong }]}>Minute draws could not load</Text>
          <Text style={[styles.emptyCopy, { color: theme.mutedLight }]}>Pull to refresh. No alternative bookmaker data will be substituted.</Text>
        </DashboardGlassCard>
      ) : results.length ? (
        results.map((result) => (
          <ResultCard
            key={`${result.eventId}:${result.marketId}:${result.specifier}`}
            nowMs={nowMs}
            result={result}
            staleAfterSeconds={summary?.staleAfterSeconds ?? 600}
          />
        ))
      ) : (
        <DashboardGlassCard style={styles.emptyCard}>
          <Clock3 color={theme.muted} size={26} />
          <Text style={[styles.emptyTitle, { color: theme.foregroundStrong }]}>{mode === 'recommended' ? 'No games passed every gate' : 'No verified markets found'}</Text>
          <Text style={[styles.emptyCopy, { color: theme.mutedLight }]}>{mode === 'recommended' ? 'Try both intervals or more leagues. BetClaw will not weaken the 1.03 EV, data-quality, or freshness gates to fill the list.' : 'Try another date or remove league filters.'}</Text>
        </DashboardGlassCard>
      )}

      {inventory.hasNextPage ? (
        <PressableScale
          accessibilityLabel="Load more available minute draws"
          accessibilityRole="button"
          disabled={inventory.isFetchingNextPage}
          onPress={() => inventory.fetchNextPage()}
          style={[styles.loadMore, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {inventory.isFetchingNextPage ? <ActivityIndicator color={theme.primary} size="small" /> : <Plus color={theme.primary} size={17} />}
          <Text style={[styles.loadMoreText, { color: theme.primary }]}>{inventory.isFetchingNextPage ? 'Loading…' : 'Load more'}</Text>
        </PressableScale>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  cardTitle: { fontFamily: fonts.display, fontSize: 18 },
  clearButton: { alignItems: 'center', justifyContent: 'center', minHeight: 44, paddingHorizontal: spacing.sm },
  clearText: { fontFamily: fonts.bold, fontSize: 12 },
  clockIcon: { alignItems: 'center', borderRadius: radius.md, height: 42, justifyContent: 'center', width: 42 },
  copyButton: { alignItems: 'center', borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', minHeight: 48, paddingHorizontal: spacing.md },
  copyButtonText: { fontFamily: fonts.bold, fontSize: 13 },
  emptyCard: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyCopy: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 20, maxWidth: 360, textAlign: 'center' },
  emptyTitle: { fontFamily: fonts.display, fontSize: 17, textAlign: 'center' },
  explanation: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18 },
  filterHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  filterLabel: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 0.75, marginTop: spacing.xs },
  filters: { gap: spacing.md },
  fixture: { fontFamily: fonts.display, fontSize: 17, lineHeight: 23, marginTop: 2 },
  flex: { flex: 1, minWidth: 0 },
  hero: { gap: spacing.sm },
  heroCopy: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 20, maxWidth: 430 },
  heroTitle: { fontFamily: fonts.displayExtraBold, fontSize: 23, letterSpacing: -0.45, lineHeight: 29 },
  heroTop: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'space-between' },
  horizontalChips: { gap: spacing.sm, paddingRight: spacing.lg },
  kickoff: { fontFamily: fonts.regular, fontSize: 11, marginTop: 4 },
  league: { fontFamily: fonts.bold, fontSize: 9, letterSpacing: 0.7, textTransform: 'uppercase' },
  loadMore: { alignItems: 'center', borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', minHeight: 48 },
  loadMoreText: { fontFamily: fonts.bold, fontSize: 13 },
  loadingCard: { alignItems: 'center', flexDirection: 'row', minHeight: 88 },
  loadingText: { flex: 1, fontFamily: fonts.regular, fontSize: 13, lineHeight: 20 },
  marketMeta: { fontFamily: fonts.regular, fontSize: 10, marginTop: 3 },
  marketRow: { alignItems: 'center', borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', gap: spacing.md, padding: spacing.md },
  marketTitle: { fontFamily: fonts.semibold, fontSize: 13 },
  metric: { borderRadius: radius.md, borderWidth: 1, flexGrow: 1, minWidth: 98, padding: spacing.md },
  metricLabel: { fontFamily: fonts.bold, fontSize: 8, letterSpacing: 0.6 },
  metricValue: { fontFamily: fonts.bold, fontSize: 15, fontVariant: ['tabular-nums'], marginTop: 3 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  notice: { alignItems: 'flex-start', borderLeftWidth: 3, borderRadius: radius.md, flexDirection: 'row', gap: spacing.sm, padding: spacing.md },
  noticeText: { flex: 1, fontFamily: fonts.regular, fontSize: 12, lineHeight: 18 },
  notices: { gap: spacing.sm },
  odds: { fontFamily: fonts.extraBold, fontSize: 19, fontVariant: ['tabular-nums'] },
  resultCard: { gap: spacing.md },
  resultHeader: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.md },
  resultsCopy: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, marginTop: 3 },
  resultsHeader: { alignItems: 'flex-end', flexDirection: 'row' },
  resultsTitle: { fontFamily: fonts.displayExtraBold, fontSize: 21, letterSpacing: -0.35 },
  segment: { alignItems: 'center', borderRadius: radius.md, borderWidth: 1, flex: 1, justifyContent: 'center', minHeight: 48 },
  segmentGroup: { borderRadius: radius.lg, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, padding: spacing.xs },
  segmentText: { fontFamily: fonts.bold, fontSize: 13 },
  stepper: { alignItems: 'center', borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', gap: spacing.md, justifyContent: 'space-between', minHeight: 64, padding: spacing.sm },
  stepperButton: { alignItems: 'center', borderRadius: radius.md, height: 48, justifyContent: 'center', width: 48 },
  stepperCopy: { alignItems: 'center', flex: 1 },
  stepperLabel: { fontFamily: fonts.regular, fontSize: 10, marginTop: 2 },
  stepperValue: { fontFamily: fonts.extraBold, fontSize: 20, fontVariant: ['tabular-nums'] },
  verificationRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
  verificationText: { fontFamily: fonts.semibold, fontSize: 11 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
