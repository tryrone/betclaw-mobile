import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Activity,
  ArrowRight,
  Bell,
  Bot,
  CalendarClock,
  ChartNoAxesCombined,
  CheckCircle2,
  CircleAlert,
  Clock3,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trophy,
} from '@/components/modern-icons';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  DashboardGlassCard,
  DashboardSectionHeader,
  PressableScale,
  ProgressBar,
  Screen,
  StatusBadge,
} from '@/components/ui';
import { getTrpcErrorCode } from '@/lib/api/client';
import {
  useDailyTicket,
  useHomeFeed,
  useNotificationSummary,
  useRecentPublished,
  useTicketStats,
  useTopEdgesToday,
  useWinRateTrend,
} from '@/lib/api/hooks';
import type { DailyTicketData, PublishedPrediction, ProviderStatus } from '@/lib/api/types';
import {
  clampPercent,
  formatPercent,
  formatRelativeTime,
  formatSignedPercent,
  selectSettledPredictions,
  selectVerifiedEdges,
} from '@/lib/today-intelligence';
import { useAppTheme } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

function predictionTone(prediction: PublishedPrediction) {
  if (prediction.staleFlag || prediction.decisionMode === 'SHADOW') return 'warning' as const;
  if (prediction.decisionMode === 'ACTIVE') return 'success' as const;
  return 'neutral' as const;
}

function modeLabel(prediction: PublishedPrediction) {
  if (prediction.staleFlag) return 'STALE';
  if (prediction.decisionMode === 'SHADOW') return 'RESEARCH ONLY';
  if (prediction.decisionMode === 'ACTIVE') return 'ACTIVE MODEL';
  return 'VERIFIED BASELINE';
}

function dataCoverage(prediction: PublishedPrediction) {
  const status = prediction.dataReadiness?.status?.trim();
  if (status) return status.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  return prediction.dataReadiness?.score == null ? 'Coverage unavailable' : `${formatPercent(prediction.dataReadiness.score)} coverage`;
}

function Header({ unreadCount }: { unreadCount: number }) {
  const router = useRouter();
  const theme = useAppTheme();
  const today = new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'long', weekday: 'long' });

  return (
    <View style={styles.header}>
      <View style={styles.headerCopy}>
        <Text style={[styles.eyebrow, { color: theme.primary }]}>BETCLAW INTELLIGENCE</Text>
        <Text style={[styles.pageTitle, { color: theme.foregroundStrong }]}>Today&apos;s edge</Text>
        <Text style={[styles.date, { color: theme.mutedLight }]}>{today}</Text>
      </View>
      <PressableScale
        accessibilityLabel={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
        accessibilityRole="button"
        onPress={() => router.push('/notifications')}
        style={[styles.iconButton, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Bell color={theme.foregroundStrong} size={20} />
        {unreadCount ? <View style={[styles.notificationDot, { backgroundColor: theme.accent }]} /> : null}
      </PressableScale>
    </View>
  );
}

function FreshnessStrip({ providerStatus, error, onRetry }: { providerStatus?: ProviderStatus; error: boolean; onRetry: () => void }) {
  const theme = useAppTheme();
  const [renderedAt] = useState(() => Date.now());
  const freshAt = providerStatus?.lastEvidenceAt ?? providerStatus?.lastCanonicalUpdateAt ?? providerStatus?.checkedAt;
  const stale = freshAt ? renderedAt - new Date(freshAt).getTime() > 30 * 60_000 : true;

  if (error) {
    return <InlineLoadError label="Provider freshness unavailable" onRetry={onRetry} />;
  }

  return (
    <View
      accessibilityLabel={`${stale ? 'Limited' : 'Current'} match evidence. ${formatRelativeTime(freshAt)}`}
      style={[styles.freshness, { backgroundColor: stale ? theme.warningSoft : theme.successSoft }]}>
      {stale ? <CircleAlert color={theme.warning} size={17} /> : <ShieldCheck color={theme.success} size={17} />}
      <View style={styles.flex}>
        <Text style={[styles.freshnessTitle, { color: stale ? theme.warning : theme.success }]}>
          {stale ? 'Evidence may be limited' : 'Match evidence is current'}
        </Text>
        <Text style={[styles.freshnessMeta, { color: theme.mutedLight }]}>{formatRelativeTime(freshAt)}</Text>
      </View>
      <RefreshCw color={theme.muted} size={15} />
    </View>
  );
}

function DailyTicketHero({ ticket, loading, unavailable }: { ticket?: DailyTicketData; loading: boolean; unavailable?: 'locked' | 'error' | null }) {
  const router = useRouter();
  const theme = useAppTheme();
  const ready = Boolean(ticket?.legs.length);

  return (
    <LinearGradient
      colors={theme.mode === 'dark' ? ['#242966', '#11143B'] : ['#171B50', '#0D1030']}
      end={{ x: 1, y: 1 }}
      start={{ x: 0, y: 0 }}
      style={styles.hero}>
      <View style={styles.heroTop}>
        <View style={styles.heroIcon}><Sparkles color="#FFFFFF" size={20} /></View>
        <StatusBadge label={ready ? 'VERIFIED TODAY' : loading ? 'CHECKING' : unavailable === 'locked' ? 'PREMIUM' : unavailable === 'error' ? 'UNAVAILABLE' : 'NO VERIFIED TICKET'} tone={ready ? 'success' : 'warning'} />
      </View>
      <Text style={styles.heroEyebrow}>TICKET OF THE DAY</Text>
      <Text style={styles.heroTitle}>{ready ? `${ticket?.legCount} carefully screened legs` : unavailable === 'locked' ? 'Unlock the daily ticket' : unavailable === 'error' ? 'Ticket check unavailable' : 'No forced picks'}</Text>
      <Text style={styles.heroCopy}>
        {ready
          ? 'Every leg passed lineage, price, freshness and evidence checks.'
          : unavailable === 'locked'
            ? 'Premium access includes the verified daily ticket and its full evidence.'
            : unavailable === 'error'
              ? 'We could not verify the daily ticket right now. Pull to refresh before acting.'
              : 'BetClaw will publish only when enough verified opportunities pass every gate.'}
      </Text>
      {ready ? (
        <View style={styles.heroMetrics}>
          <View><Text style={styles.heroMetricLabel}>Total odds</Text><Text style={styles.heroMetricValue}>{ticket?.totalOdds?.toFixed(2) ?? '—'}</Text></View>
          <View><Text style={styles.heroMetricLabel}>Avg confidence</Text><Text style={styles.heroMetricValue}>{formatPercent(ticket?.avgConfidence)}</Text></View>
          <View><Text style={styles.heroMetricLabel}>Target</Text><Text style={styles.heroMetricValue}>{ticket?.targetOdds.toFixed(2)}</Text></View>
        </View>
      ) : null}
      <PressableScale
        accessibilityLabel={ready && ticket?.ticketId ? 'Open verified daily ticket' : 'Open match center'}
        accessibilityRole="button"
        onPress={() => ready && ticket?.ticketId ? router.push(`/ticket/${ticket.ticketId}`) : unavailable === 'locked' ? router.push('/(tabs)/wallet') : router.push('/matches')}
        style={styles.heroButton}>
        <Text style={styles.heroButtonText}>{ready && ticket?.ticketId ? 'View ticket analysis' : unavailable === 'locked' ? 'View access options' : 'Explore match center'}</Text>
        <ArrowRight color="#11143B" size={18} />
      </PressableScale>
    </LinearGradient>
  );
}

function ProbabilityComparison({ prediction }: { prediction: PublishedPrediction }) {
  const theme = useAppTheme();
  const model = clampPercent(prediction.calibratedConfidence ?? prediction.confidence);
  const implied = clampPercent(prediction.impliedProb);

  return (
    <View style={styles.comparison}>
      <View style={styles.comparisonRow}>
        <Text style={[styles.comparisonLabel, { color: theme.mutedLight }]}>BetClaw probability</Text>
        <Text style={[styles.comparisonValue, { color: theme.foregroundStrong }]}>{model == null ? '—' : `${model.toFixed(0)}%`}</Text>
      </View>
      <ProgressBar value={model ?? 0} />
      <View style={styles.comparisonRow}>
        <Text style={[styles.comparisonLabel, { color: theme.mutedLight }]}>Market implied</Text>
        <Text style={[styles.comparisonValue, { color: theme.foregroundStrong }]}>{implied == null ? '—' : `${implied.toFixed(0)}%`}</Text>
      </View>
      <ProgressBar delay={340} tone="warning" value={implied ?? 0} />
    </View>
  );
}

function EdgeCard({ prediction }: { prediction: PublishedPrediction }) {
  const theme = useAppTheme();

  return (
    <DashboardGlassCard style={styles.edgeCard}>
      <View style={styles.edgeTop}>
        <View style={styles.flex}>
          <Text numberOfLines={1} style={[styles.league, { color: theme.muted }]}>{prediction.league}</Text>
          <Text style={[styles.fixture, { color: theme.foregroundStrong }]}>{prediction.homeTeam} vs {prediction.awayTeam}</Text>
        </View>
        <StatusBadge label={modeLabel(prediction)} tone={predictionTone(prediction)} />
      </View>
      <View style={styles.selectionRow}>
        <View style={[styles.selectionIcon, { backgroundColor: theme.primarySubtle }]}><Bot color={theme.primary} size={18} /></View>
        <View style={styles.flex}>
          <Text style={[styles.selection, { color: theme.foregroundStrong }]}>{prediction.selectionLabel ?? prediction.verdict}</Text>
          <Text style={[styles.selectionMeta, { color: theme.mutedLight }]}>Odds {prediction.odds?.toFixed(2) ?? '—'} · Edge {formatSignedPercent(prediction.expectedValue ?? prediction.edgeScore)}</Text>
        </View>
      </View>
      <ProbabilityComparison prediction={prediction} />
      <View style={[styles.evidenceRow, { borderTopColor: theme.border }]}>
        <View style={styles.evidenceItem}><CheckCircle2 color={theme.success} size={15} /><Text style={[styles.evidenceText, { color: theme.mutedLight }]}>{dataCoverage(prediction)}</Text></View>
        <View style={styles.evidenceItem}><Clock3 color={theme.muted} size={15} /><Text style={[styles.evidenceText, { color: theme.mutedLight }]}>{formatRelativeTime(prediction.publishedAt ?? prediction.createdAt)}</Text></View>
      </View>
      {prediction.edgeSummary || prediction.modelSummary ? <Text style={[styles.reason, { color: theme.mutedLight }]}>{prediction.edgeSummary ?? prediction.modelSummary}</Text> : null}
    </DashboardGlassCard>
  );
}

function PerformanceSummary({ stats, trend }: { stats?: { settledTickets: number; ticketsOptimized: number; winRate: number }; trend?: { month: string; total: number; winRate: number }[] }) {
  const router = useRouter();
  const theme = useAppTheme();
  const settled = trend?.reduce((sum, point) => sum + point.total, 0) ?? 0;

  return (
    <DashboardGlassCard>
      <View style={styles.performanceTop}>
        <View>
          <Text style={[styles.performanceTitle, { color: theme.foregroundStrong }]}>Your settled record</Text>
          <Text style={[styles.performanceMeta, { color: theme.mutedLight }]}>{settled} settled tickets in the six-month trend</Text>
        </View>
        <Trophy color={theme.primary} size={22} />
      </View>
      <View style={styles.performanceMetrics}>
        <View style={[styles.metricTile, { backgroundColor: theme.surface }]}><Text style={[styles.metricValue, { color: theme.foregroundStrong }]}>{stats?.winRate ?? 0}%</Text><Text style={[styles.metricLabel, { color: theme.muted }]}>Win rate</Text></View>
        <View style={[styles.metricTile, { backgroundColor: theme.surface }]}><Text style={[styles.metricValue, { color: theme.foregroundStrong }]}>{stats?.ticketsOptimized ?? 0}</Text><Text style={[styles.metricLabel, { color: theme.muted }]}>Tickets analyzed</Text></View>
        <View style={[styles.metricTile, { backgroundColor: theme.surface }]}><Text style={[styles.metricValue, { color: theme.foregroundStrong }]}>{stats?.settledTickets ?? 0}</Text><Text style={[styles.metricLabel, { color: theme.muted }]}>Settled all-time</Text></View>
      </View>
      <PressableScale accessibilityLabel="Open activity and settled results" accessibilityRole="button" onPress={() => router.push('/(tabs)/history')} style={styles.textButton}>
        <Text style={[styles.textButtonLabel, { color: theme.primary }]}>See the full record</Text><ArrowRight color={theme.primary} size={17} />
      </PressableScale>
    </DashboardGlassCard>
  );
}

function LockedPredictions() {
  const router = useRouter();
  const theme = useAppTheme();
  return (
    <DashboardGlassCard style={styles.lockedCard}>
      <View style={[styles.lockedIcon, { backgroundColor: theme.primarySubtle }]}><Sparkles color={theme.primary} size={22} /></View>
      <Text style={[styles.lockedTitle, { color: theme.foregroundStrong }]}>AI Picks are a premium feature</Text>
      <Text style={[styles.lockedCopy, { color: theme.mutedLight }]}>Upgrade to see today&apos;s verified edges, probability comparisons and evidence.</Text>
      <PressableScale accessibilityLabel="Open subscription options" accessibilityRole="button" onPress={() => router.push('/(tabs)/wallet')} style={[styles.upgradeButton, { backgroundColor: theme.primary }]}>
        <Text style={[styles.upgradeButtonText, { color: theme.primaryDark }]}>View access options</Text>
      </PressableScale>
    </DashboardGlassCard>
  );
}

function EmptyEdges() {
  const theme = useAppTheme();
  return (
    <DashboardGlassCard style={styles.emptyCard}>
      <CalendarClock color={theme.muted} size={24} />
      <Text style={[styles.emptyTitle, { color: theme.foregroundStrong }]}>No verified edge yet</Text>
      <Text style={[styles.emptyCopy, { color: theme.mutedLight }]}>The feed stays empty rather than weakening quality or freshness gates.</Text>
    </DashboardGlassCard>
  );
}

function EdgeLoadError({ onRetry }: { onRetry: () => void }) {
  const theme = useAppTheme();
  return (
    <DashboardGlassCard style={styles.emptyCard}>
      <CircleAlert color={theme.danger} size={24} />
      <Text style={[styles.emptyTitle, { color: theme.foregroundStrong }]}>Couldn&apos;t load verified edges</Text>
      <Text style={[styles.emptyCopy, { color: theme.mutedLight }]}>Your access has not changed. Check the connection and try again.</Text>
      <PressableScale accessibilityLabel="Retry verified edges" accessibilityRole="button" onPress={onRetry} style={[styles.retryButton, { borderColor: theme.borderStrong }]}>
        <RefreshCw color={theme.primary} size={16} />
        <Text style={[styles.retryLabel, { color: theme.primary }]}>Try again</Text>
      </PressableScale>
    </DashboardGlassCard>
  );
}

function InlineLoadError({ label, onRetry }: { label: string; onRetry: () => void }) {
  const theme = useAppTheme();
  return (
    <View style={[styles.inlineError, { borderColor: theme.danger, backgroundColor: theme.dangerSoft }]}>
      <CircleAlert color={theme.danger} size={17} />
      <Text style={[styles.inlineErrorText, { color: theme.foregroundStrong }]}>{label}</Text>
      <PressableScale accessibilityLabel={`Retry ${label.toLowerCase()}`} accessibilityRole="button" onPress={onRetry} style={styles.inlineRetry}>
        <RefreshCw color={theme.primary} size={15} />
        <Text style={[styles.retryLabel, { color: theme.primary }]}>Retry</Text>
      </PressableScale>
    </View>
  );
}

function SettledResults({ settled }: { settled: PublishedPrediction[] }) {
  const theme = useAppTheme();
  if (!settled.length) return null;
  return (
    <>
      <DashboardSectionHeader eyebrow="RECENTLY SETTLED" title="Result postmortems" />
      {settled.map((prediction) => (
        <DashboardGlassCard key={prediction.id} style={styles.resultCard}>
          <View style={styles.resultRow}>
            <View style={[styles.resultIcon, { backgroundColor: prediction.result === 'WON' ? theme.successSoft : theme.dangerSoft }]}>
              {prediction.result === 'WON' ? <CheckCircle2 color={theme.success} size={18} /> : <Activity color={theme.danger} size={18} />}
            </View>
            <View style={styles.flex}><Text style={[styles.resultFixture, { color: theme.foregroundStrong }]}>{prediction.homeTeam} vs {prediction.awayTeam}</Text><Text style={[styles.resultMeta, { color: theme.mutedLight }]}>{prediction.selectionLabel ?? prediction.verdict} · {prediction.result}</Text></View>
            <Text style={[styles.resultConfidence, { color: theme.foregroundStrong }]}>{formatPercent(prediction.calibratedConfidence ?? prediction.confidence)}</Text>
          </View>
        </DashboardGlassCard>
      ))}
    </>
  );
}

export default function TodayScreen() {
  const theme = useAppTheme();
  const home = useHomeFeed({ limit: 6 });
  const daily = useDailyTicket({ bookmakerPlatform: 'SPORTYBET', sport: 'FOOTBALL' });
  const edges = useTopEdgesToday({ limit: 5, sport: 'FOOTBALL' });
  const recent = useRecentPublished({ limit: 12, sport: 'FOOTBALL' });
  const stats = useTicketStats();
  const trend = useWinRateTrend();
  const notifications = useNotificationSummary();
  const refreshing = [home, daily, edges, recent, stats, trend].some((query) => query.isRefetching);
  const verifiedEdges = useMemo(() => selectVerifiedEdges(edges.data), [edges.data]);
  const settled = useMemo(() => selectSettledPredictions(recent.data), [recent.data]);

  const refresh = async () => {
    await Promise.all([home.refetch(), daily.refetch(), edges.refetch(), recent.refetch(), stats.refetch(), trend.refetch()]);
  };

  return (
    <Screen hasTabs onRefresh={refresh} refreshing={refreshing}>
      <Header unreadCount={notifications.data?.unreadCount ?? 0} />
      <FreshnessStrip error={Boolean(home.error)} onRetry={() => void home.refetch()} providerStatus={home.data?.providerStatus} />
      <DailyTicketHero
        loading={daily.isLoading}
        ticket={daily.data}
        unavailable={getTrpcErrorCode(daily.error) === 'FORBIDDEN' ? 'locked' : daily.error ? 'error' : null}
      />
      <DashboardSectionHeader eyebrow="VERIFIED OPPORTUNITIES" title="Top value edges" description="Model confidence, market price and evidence are shown separately." />
      {verifiedEdges.length
        ? verifiedEdges.map((prediction) => <EdgeCard key={prediction.id} prediction={prediction} />)
        : getTrpcErrorCode(edges.error) === 'FORBIDDEN'
          ? <LockedPredictions />
          : edges.error
            ? <EdgeLoadError onRetry={() => void edges.refetch()} />
            : <EmptyEdges />}
      <DashboardSectionHeader eyebrow="YOUR EVIDENCE" title="Performance" description="Settled results only; paper, live and research records never mix." />
      {stats.error || trend.error
        ? <InlineLoadError label="Performance evidence unavailable" onRetry={() => void Promise.all([stats.refetch(), trend.refetch()])} />
        : <PerformanceSummary stats={stats.data} trend={trend.data} />}
      {recent.error
        ? <InlineLoadError label="Settled results unavailable" onRetry={() => void recent.refetch()} />
        : <SettledResults settled={settled} />}
      <View style={[styles.researchNote, { borderColor: theme.border }]}>
        <ChartNoAxesCombined color={theme.muted} size={18} />
        <Text style={[styles.researchCopy, { color: theme.mutedLight }]}>Shadow, Terra and external-LLM evaluations are research-only until independently approved and activated.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  comparison: { gap: 8 },
  comparisonLabel: { fontFamily: fonts.medium, fontSize: 12 },
  comparisonRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  comparisonValue: { fontFamily: fonts.bold, fontSize: 12, fontVariant: ['tabular-nums'] },
  date: { fontFamily: fonts.medium, fontSize: 13, marginTop: 3 },
  edgeCard: { gap: spacing.lg },
  edgeTop: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.md },
  emptyCard: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxxl },
  emptyCopy: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, maxWidth: 320, textAlign: 'center' },
  emptyTitle: { fontFamily: fonts.display, fontSize: 17 },
  evidenceItem: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  evidenceRow: { borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg, paddingTop: spacing.md },
  evidenceText: { fontFamily: fonts.medium, fontSize: 11 },
  eyebrow: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 1.2 },
  fixture: { fontFamily: fonts.display, fontSize: 17, lineHeight: 23, marginTop: 3 },
  flex: { flex: 1, minWidth: 0 },
  freshness: { alignItems: 'center', borderRadius: radius.md, flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: 11 },
  freshnessMeta: { fontFamily: fonts.regular, fontSize: 11, marginTop: 1 },
  freshnessTitle: { fontFamily: fonts.semibold, fontSize: 12 },
  header: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, minHeight: 74 },
  headerCopy: { flex: 1 },
  hero: { borderRadius: radius.xl, gap: spacing.md, overflow: 'hidden', padding: spacing.xxl },
  heroButton: { alignItems: 'center', alignSelf: 'stretch', backgroundColor: '#FFFFFF', borderRadius: radius.md, flexDirection: 'row', justifyContent: 'space-between', minHeight: 52, paddingHorizontal: spacing.lg },
  heroButtonText: { color: '#11143B', fontFamily: fonts.bold, fontSize: 14 },
  heroCopy: { color: '#C9CCE5', fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, maxWidth: 340 },
  heroEyebrow: { color: '#AEB3EE', fontFamily: fonts.bold, fontSize: 10, letterSpacing: 1.3, marginTop: spacing.sm },
  heroIcon: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: radius.pill, height: 42, justifyContent: 'center', width: 42 },
  heroMetricLabel: { color: '#AEB3C9', fontFamily: fonts.medium, fontSize: 10 },
  heroMetrics: { flexDirection: 'row', gap: spacing.xxl },
  heroMetricValue: { color: '#FFFFFF', fontFamily: fonts.display, fontSize: 19, fontVariant: ['tabular-nums'], marginTop: 3 },
  heroTitle: { color: '#FFFFFF', fontFamily: fonts.displayExtraBold, fontSize: 27, letterSpacing: -0.7, lineHeight: 34 },
  heroTop: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  iconButton: { alignItems: 'center', borderRadius: radius.pill, borderWidth: 1, height: 48, justifyContent: 'center', width: 48 },
  inlineError: { alignItems: 'center', borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, minHeight: 52, paddingHorizontal: spacing.md },
  inlineErrorText: { flex: 1, fontFamily: fonts.medium, fontSize: 12 },
  inlineRetry: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs, minHeight: 44, paddingHorizontal: spacing.sm },
  league: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase' },
  lockedCard: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxl },
  lockedCopy: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, maxWidth: 320, textAlign: 'center' },
  lockedIcon: { alignItems: 'center', borderRadius: radius.pill, height: 48, justifyContent: 'center', marginBottom: spacing.xs, width: 48 },
  lockedTitle: { fontFamily: fonts.display, fontSize: 18 },
  metricLabel: { fontFamily: fonts.medium, fontSize: 10, marginTop: 2 },
  metricTile: { borderRadius: radius.md, flex: 1, minWidth: 92, padding: spacing.md },
  metricValue: { fontFamily: fonts.display, fontSize: 21, fontVariant: ['tabular-nums'] },
  notificationDot: { borderRadius: 4, height: 8, position: 'absolute', right: 9, top: 9, width: 8 },
  pageTitle: { fontFamily: fonts.displayExtraBold, fontSize: 30, letterSpacing: -0.8, lineHeight: 36 },
  performanceMeta: { fontFamily: fonts.regular, fontSize: 12, marginTop: 3 },
  performanceMetrics: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
  performanceTitle: { fontFamily: fonts.display, fontSize: 17 },
  performanceTop: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  reason: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18 },
  researchCopy: { flex: 1, fontFamily: fonts.regular, fontSize: 12, lineHeight: 18 },
  researchNote: { alignItems: 'flex-start', borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, padding: spacing.md },
  retryButton: { alignItems: 'center', borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, minHeight: 44, paddingHorizontal: spacing.lg },
  retryLabel: { fontFamily: fonts.bold, fontSize: 13 },
  resultCard: { paddingVertical: spacing.md },
  resultConfidence: { fontFamily: fonts.bold, fontSize: 13, fontVariant: ['tabular-nums'] },
  resultFixture: { fontFamily: fonts.semibold, fontSize: 13 },
  resultIcon: { alignItems: 'center', borderRadius: radius.pill, height: 38, justifyContent: 'center', width: 38 },
  resultMeta: { fontFamily: fonts.regular, fontSize: 11, marginTop: 3 },
  resultRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  selection: { fontFamily: fonts.semibold, fontSize: 14 },
  selectionIcon: { alignItems: 'center', borderRadius: radius.md, height: 40, justifyContent: 'center', width: 40 },
  selectionMeta: { fontFamily: fonts.medium, fontSize: 11, marginTop: 3 },
  selectionRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  textButton: { alignItems: 'center', alignSelf: 'flex-start', flexDirection: 'row', gap: spacing.xs, marginTop: spacing.lg, minHeight: 44 },
  textButtonLabel: { fontFamily: fonts.bold, fontSize: 13 },
  upgradeButton: { borderRadius: radius.md, justifyContent: 'center', marginTop: spacing.sm, minHeight: 48, paddingHorizontal: spacing.xl },
  upgradeButtonText: { fontFamily: fonts.bold, fontSize: 13 },
});
