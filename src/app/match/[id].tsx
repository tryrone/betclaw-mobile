import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, MoreVertical } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View, type DimensionValue } from 'react-native';
import Animated from 'react-native-reanimated';

import { enterUp, GlassCard, IconButton, PressableScale, ProgressBar, Screen, StatusBadge, TeamLogo } from '@/components/ui';
import type { MatchStatData } from '@/data/mock';
import { useFixtureInsight, useHomeFeed } from '@/lib/api/hooks';
import type { FixtureInsight, StandingsRow } from '@/lib/api/types';
import { formatDate } from '@/lib/mobile-format';
import { flattenHomeFeed, insightSummary, mapInsightStats } from '@/lib/mobile-mappers';
import { useAppTheme } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

const tabs = ['Stats', 'Line-up', 'Summary'] as const;
type DetailTab = (typeof tabs)[number];

function formatStatValue(value: number, suffix?: string) {
  return `${value}${suffix ?? ''}`;
}

function formatInsightMetric(value?: number | null, suffix = '') {
  if (value == null || Number.isNaN(Number(value))) return '-';
  const rounded = Math.round(Number(value) * 10) / 10;
  return `${rounded}${suffix}`;
}

function readinessTone(status?: string | null) {
  if (status && /ready|verified/i.test(status)) return 'success' as const;
  if (status && /partial|limited/i.test(status)) return 'warning' as const;
  return 'neutral' as const;
}

function standingLine(row?: StandingsRow) {
  if (!row) return 'Standing unavailable';
  const team = row.team?.name ?? 'Team';
  const rank = row.rank ? `#${row.rank}` : 'Unranked';
  const points = row.points != null ? `${row.points} pts` : 'points n/a';
  return `${team} ${rank} · ${points}`;
}

function coverageCount(insight?: FixtureInsight) {
  const providerCount = insight?.providerLinks?.length ?? 0;
  const coverageKeys = Object.keys(insight?.sourceCoverage ?? {}).length;
  return Math.max(providerCount, coverageKeys);
}

function StatComparison({ stat }: { stat: MatchStatData }) {
  const theme = useAppTheme();
  const max = Math.max(stat.home, stat.away, 1);
  const homeWidth: DimensionValue = `${Math.max(8, (stat.home / max) * 100)}%`;
  const awayWidth: DimensionValue = `${Math.max(8, (stat.away / max) * 100)}%`;

  return (
    <View style={styles.statRow}>
      <View style={styles.statNumbers}>
        <Text style={[styles.statValue, { color: stat.home > stat.away ? theme.primarySoft : theme.foregroundStrong }]}>
          {formatStatValue(stat.home, stat.suffix)}
        </Text>
        <Text style={[styles.statLabel, { color: theme.foreground }]}>{stat.label}</Text>
        <Text style={[styles.statValue, { color: stat.away > stat.home ? theme.primarySoft : theme.foregroundStrong }]}>
          {formatStatValue(stat.away, stat.suffix)}
        </Text>
      </View>
      <View style={[styles.statTrack, { backgroundColor: theme.statTrack }]}>
        <View style={[styles.statHalf, styles.statLeft]}>
          <View style={[styles.statFill, { alignSelf: 'flex-end', backgroundColor: theme.statHome, width: homeWidth }]} />
        </View>
        <View style={[styles.statHalf, styles.statRight]}>
          <View style={[styles.statFill, { backgroundColor: theme.statAway, width: awayWidth }]} />
        </View>
      </View>
    </View>
  );
}

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const theme = useAppTheme();
  const [activeTab, setActiveTab] = useState<DetailTab>('Stats');
  const fixtureId = Array.isArray(id) ? id[0] : id;
  const homeFeed = useHomeFeed({ limit: 48, windowDays: 3 });
  const insight = useFixtureInsight(fixtureId);
  const match = useMemo(() => {
    const baseMatch = flattenHomeFeed(homeFeed.data).find((item) => item.id === fixtureId);
    if (!baseMatch) return null;

    const insightStats = mapInsightStats(insight.data);
    const summary = insightSummary(insight.data);
    return {
      ...baseMatch,
      signal: insight.data?.recommendation?.summary ?? baseMatch.signal,
      stats: insightStats.length > 0 ? insightStats : baseMatch.stats,
      summary: summary.length > 0 ? summary : baseMatch.summary,
      trend: insight.data?.recommendation?.label ?? baseMatch.trend,
    };
  }, [fixtureId, homeFeed.data, insight.data]);
  const fixtureInsight = insight.data;
  const readinessStatus = fixtureInsight?.dataReadiness?.status ?? match?.readiness;
  const readinessScore = Math.round(fixtureInsight?.dataReadiness?.score ?? match?.confidence ?? 0);
  const missingFields = fixtureInsight?.dataReadiness?.missingFields ?? [];
  const h2h = fixtureInsight?.h2h;
  const prediction = fixtureInsight?.apiFootballContext?.prediction;
  const homeStanding = fixtureInsight?.standings?.home?.[0];
  const awayStanding = fixtureInsight?.standings?.away?.[0];
  const homeRecent = fixtureInsight?.recentMatches?.home?.summary;
  const awayRecent = fixtureInsight?.recentMatches?.away?.summary;
  const averageStats = fixtureInsight?.averageStats;
  const evidenceItems = fixtureInsight?.evidence ?? [];
  const providerLinks = fixtureInsight?.providerLinks ?? [];
  const averageRows = [
    { label: 'Home GF', value: formatInsightMetric(averageStats?.home?.goalsForPerMatch) },
    { label: 'Away GF', value: formatInsightMetric(averageStats?.away?.goalsForPerMatch) },
    { label: 'Corners', value: `${formatInsightMetric(averageStats?.home?.cornersPerMatch)} / ${formatInsightMetric(averageStats?.away?.cornersPerMatch)}` },
    { label: 'Cards', value: `${formatInsightMetric(averageStats?.home?.cardsPerMatch)} / ${formatInsightMetric(averageStats?.away?.cardsPerMatch)}` },
    { label: 'Ref cards', value: formatInsightMetric(averageStats?.referee?.cardsPerMatch) },
  ].filter((row) => !row.value.includes('- / -') && row.value !== '-');

  if (!match) {
    return (
      <Screen>
        <Animated.View entering={enterUp(0)} style={styles.header}>
          <IconButton icon={ArrowLeft} label="Go back" onPress={() => router.back()} />
          <Text numberOfLines={1} style={[styles.title, { color: theme.foregroundStrong }]}>Match</Text>
          <IconButton icon={MoreVertical} label="More match actions" />
        </Animated.View>

        <Animated.View entering={enterUp(1)}>
          <GlassCard style={styles.emptyCard}>
            <Text style={[styles.emptyTitle, { color: theme.foregroundStrong }]}>
              {homeFeed.isLoading || insight.isLoading ? 'Loading match' : 'Match unavailable'}
            </Text>
            <Text style={[styles.emptyText, { color: theme.muted }]}>
              {homeFeed.isLoading || insight.isLoading
                ? 'Fetching fixture analysis.'
                : 'This fixture is no longer in the match list.'}
            </Text>
            <PressableScale
              accessibilityLabel="View matches"
              accessibilityRole="button"
              onPress={() => router.replace('/matches' as any)}
              style={[
                styles.emptyButton,
                { backgroundColor: theme.primarySubtle, borderColor: theme.selectionBorder },
              ]}>
              <Text style={[styles.emptyButtonText, { color: theme.primarySoft }]}>View matches</Text>
            </PressableScale>
          </GlassCard>
        </Animated.View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Animated.View entering={enterUp(0)} style={styles.header}>
        <IconButton icon={ArrowLeft} label="Go back" onPress={() => router.back()} />
        <Text numberOfLines={1} style={[styles.title, { color: theme.foregroundStrong }]}>{match.league}</Text>
        <IconButton icon={MoreVertical} label="More match actions" />
      </Animated.View>

      <Animated.View entering={enterUp(1)}>
        <GlassCard gradient="matchHero" style={styles.scoreCard}>
          <Text style={styles.venue}>{match.venue}</Text>
          <Text style={styles.weekLabel}>{match.date}</Text>
          <View style={styles.scoreRow}>
            <View style={styles.teamCol}>
              <TeamLogo name={match.home} size={56} />
              <Text numberOfLines={1} style={styles.teamName}>{match.home}</Text>
              <Text style={styles.sideLabel}>Home</Text>
            </View>
            <View style={styles.scoreCenter}>
              {match.homeScore !== undefined && match.awayScore !== undefined ? (
                <Text style={styles.scoreText}>{match.homeScore} : {match.awayScore}</Text>
              ) : (
                <Text style={styles.scoreText}>{match.time}</Text>
              )}
              <StatusBadge label={match.clock ?? match.status} tone={match.status === 'Live' ? 'danger' : 'accent'} />
            </View>
            <View style={styles.teamCol}>
              <TeamLogo name={match.away} size={56} />
              <Text numberOfLines={1} style={styles.teamName}>{match.away}</Text>
              <Text style={styles.sideLabel}>Away</Text>
            </View>
          </View>
        </GlassCard>
      </Animated.View>

      <Animated.View entering={enterUp(2)}>
        <GlassCard style={styles.analysisCard}>
          <View style={styles.analysisTop}>
            <View>
              <Text style={[styles.cardTitle, { color: theme.foregroundStrong }]}>{match.trend}</Text>
              <Text style={[styles.cardCaption, { color: theme.muted }]}>{match.signal}</Text>
            </View>
            <StatusBadge label={match.readiness} tone={match.readiness === 'Verified' ? 'success' : match.readiness === 'Partial' ? 'warning' : 'neutral'} />
          </View>
          <View style={styles.confidenceRow}>
            <Text style={[styles.confidenceLabel, { color: theme.muted }]}>Confidence</Text>
            <Text style={[styles.confidenceValue, { color: theme.primarySoft }]}>{match.confidence}%</Text>
          </View>
          <ProgressBar value={match.confidence} />
        </GlassCard>
      </Animated.View>

      <Animated.View entering={enterUp(3)}>
        <GlassCard style={styles.contextCard}>
          <View style={styles.analysisTop}>
            <View>
              <Text style={[styles.cardTitle, { color: theme.foregroundStrong }]}>Fixture context</Text>
              <Text style={[styles.cardCaption, { color: theme.muted }]}>
                {match.status === 'Live' ? `Live polling · ${match.clock ?? match.period ?? 'in play'}` : `Kickoff ${match.time}`}
              </Text>
            </View>
            <StatusBadge label={readinessStatus ?? 'Coverage'} tone={readinessTone(readinessStatus)} />
          </View>
          <View style={styles.contextGrid}>
            <View style={[styles.contextTile, { backgroundColor: theme.field, borderColor: theme.border }]}>
              <Text style={[styles.contextValue, { color: theme.primarySoft }]}>{readinessScore}%</Text>
              <Text style={[styles.contextLabel, { color: theme.muted }]}>Readiness</Text>
            </View>
            <View style={[styles.contextTile, { backgroundColor: theme.field, borderColor: theme.border }]}>
              <Text style={[styles.contextValue, { color: theme.foregroundStrong }]}>{h2h?.sampleSize ?? 0}</Text>
              <Text style={[styles.contextLabel, { color: theme.muted }]}>H2H sample</Text>
            </View>
            <View style={[styles.contextTile, { backgroundColor: theme.field, borderColor: theme.border }]}>
              <Text style={[styles.contextValue, { color: theme.foregroundStrong }]}>{coverageCount(fixtureInsight)}</Text>
              <Text style={[styles.contextLabel, { color: theme.muted }]}>Sources</Text>
            </View>
          </View>
          {h2h?.summary ? (
            <View style={styles.summaryRow}>
              <View style={[styles.summaryDot, { backgroundColor: theme.primarySoft }]} />
              <Text style={[styles.summaryText, { color: theme.foreground }]}>{h2h.summary}</Text>
            </View>
          ) : null}
          {prediction ? (
            <View style={styles.oddsRow}>
              <Text style={[styles.metricPill, { backgroundColor: theme.primarySubtle, color: theme.primarySoft }]}>
                Home {prediction.homePercent ?? '-'}%
              </Text>
              <Text style={[styles.metricPill, { backgroundColor: theme.cardMuted, color: theme.mutedLight }]}>
                Draw {prediction.drawPercent ?? '-'}%
              </Text>
              <Text style={[styles.metricPill, { backgroundColor: theme.primarySubtle, color: theme.primarySoft }]}>
                Away {prediction.awayPercent ?? '-'}%
              </Text>
            </View>
          ) : null}
          <View style={styles.insightList}>
            <Text style={[styles.sectionLabel, { color: theme.muted }]}>Standings and form</Text>
            <Text style={[styles.insightText, { color: theme.foreground }]}>{standingLine(homeStanding)}</Text>
            <Text style={[styles.insightText, { color: theme.foreground }]}>{standingLine(awayStanding)}</Text>
            {homeRecent ? <Text style={[styles.insightText, { color: theme.mutedLight }]}>{match.home}: {homeRecent}</Text> : null}
            {awayRecent ? <Text style={[styles.insightText, { color: theme.mutedLight }]}>{match.away}: {awayRecent}</Text> : null}
          </View>
        </GlassCard>
      </Animated.View>

      <Animated.View entering={enterUp(4)}>
        <GlassCard style={styles.contextCard}>
          <View style={styles.analysisTop}>
            <View>
              <Text style={[styles.cardTitle, { color: theme.foregroundStrong }]}>Evidence and coverage</Text>
              <Text style={[styles.cardCaption, { color: theme.muted }]}>
                {insight.isFetching ? 'Refreshing provider evidence.' : `${providerLinks.length} provider fetches tracked`}
              </Text>
            </View>
            <StatusBadge label={missingFields.length ? `${missingFields.length} gaps` : 'Covered'} tone={missingFields.length ? 'warning' : 'success'} />
          </View>
          {averageRows.length > 0 ? (
            <View style={styles.contextGrid}>
              {averageRows.slice(0, 5).map((row) => (
                <View key={row.label} style={[styles.contextTile, { backgroundColor: theme.field, borderColor: theme.border }]}>
                  <Text style={[styles.contextValue, { color: theme.foregroundStrong }]}>{row.value}</Text>
                  <Text style={[styles.contextLabel, { color: theme.muted }]}>{row.label}</Text>
                </View>
              ))}
            </View>
          ) : null}
          {evidenceItems.slice(0, 3).map((item, index) => (
            <View key={`${item.url ?? item.title ?? index}`} style={styles.summaryRow}>
              <View style={[styles.summaryDot, { backgroundColor: theme.primarySoft }]} />
              <Text style={[styles.summaryText, { color: theme.foreground }]}>
                {item.title ? `${item.title}: ` : ''}{item.snippet ?? item.evidenceType ?? 'Evidence source'}
              </Text>
            </View>
          ))}
          {providerLinks.slice(0, 3).map((link, index) => (
            <Text key={`${link.provider ?? 'provider'}-${index}`} style={[styles.providerText, { color: theme.muted }]}>
              {link.provider ?? 'Provider'}{link.fetchedAt ? ` · fetched ${formatDate(link.fetchedAt)}` : ''}
            </Text>
          ))}
          {missingFields.length > 0 ? (
            <Text style={[styles.providerText, { color: theme.warning }]}>Missing: {missingFields.slice(0, 4).join(', ')}</Text>
          ) : null}
          {!insight.isLoading && averageRows.length === 0 && evidenceItems.length === 0 ? (
            <Text style={[styles.providerText, { color: theme.muted }]}>No additional provider evidence is available for this fixture yet.</Text>
          ) : null}
        </GlassCard>
      </Animated.View>

      <Animated.View entering={enterUp(5)}>
        <View style={[styles.tabRow, { backgroundColor: theme.cardMuted }]}>
          {tabs.map((tab) => {
            const active = tab === activeTab;
            return (
              <PressableScale
                accessibilityLabel={tab}
                accessibilityRole="button"
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[
                  styles.tab,
                  {
                    backgroundColor: active ? theme.card : 'transparent',
                    borderColor: active ? theme.selectionBorder : 'transparent',
                  },
                ]}>
                <Text style={[styles.tabText, { color: active ? theme.foregroundStrong : theme.mutedLight }]}>{tab}</Text>
              </PressableScale>
            );
          })}
        </View>
      </Animated.View>

      {activeTab === 'Stats' ? (
        <Animated.View entering={enterUp(6)}>
          <GlassCard style={styles.statsCard}>
            {match.stats.map((stat) => (
              <StatComparison key={stat.id} stat={stat} />
            ))}
          </GlassCard>
        </Animated.View>
      ) : null}

      {activeTab === 'Line-up' ? (
        <Animated.View entering={enterUp(6)}>
          <GlassCard style={styles.listCard}>
            {match.lineup.map((item) => (
              <View key={item.role} style={styles.lineupRow}>
                <Text style={[styles.lineupSide, { color: theme.foregroundStrong }]}>{item.home}</Text>
                <Text style={[styles.lineupRole, { color: theme.muted }]}>{item.role}</Text>
                <Text style={[styles.lineupSide, styles.lineupAway, { color: theme.foregroundStrong }]}>{item.away}</Text>
              </View>
            ))}
          </GlassCard>
        </Animated.View>
      ) : null}

      {activeTab === 'Summary' ? (
        <Animated.View entering={enterUp(6)}>
          <GlassCard style={styles.listCard}>
            {match.summary.map((item) => (
              <View key={item} style={styles.summaryRow}>
                <View style={[styles.summaryDot, { backgroundColor: theme.primarySoft }]} />
                <Text style={[styles.summaryText, { color: theme.foreground }]}>{item}</Text>
              </View>
            ))}
          </GlassCard>
        </Animated.View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  analysisCard: {
    gap: spacing.sm,
  },
  analysisTop: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  cardCaption: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
    maxWidth: 220,
  },
  cardTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 17,
  },
  confidenceLabel: {
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
  confidenceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  confidenceValue: {
    fontFamily: fonts.extraBold,
    fontSize: 13,
  },
  contextCard: {
    gap: spacing.md,
  },
  contextGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  contextLabel: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    marginTop: 3,
  },
  contextTile: {
    borderRadius: radius.lg,
    borderWidth: 1,
    flexBasis: '30%',
    flexGrow: 1,
    padding: spacing.sm,
  },
  contextValue: {
    fontFamily: fonts.extraBold,
    fontSize: 17,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  emptyButton: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  emptyButtonText: {
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  emptyCard: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  emptyText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    textAlign: 'center',
  },
  emptyTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 18,
  },
  lineupAway: {
    textAlign: 'right',
  },
  lineupRole: {
    fontFamily: fonts.bold,
    fontSize: 11,
    textAlign: 'center',
    width: 86,
  },
  lineupRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
    minHeight: 42,
  },
  lineupSide: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  listCard: {
    gap: spacing.sm,
  },
  scoreCard: {
    gap: spacing.md,
  },
  scoreCenter: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  scoreRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scoreText: {
    color: '#ffffff',
    fontFamily: fonts.extraBold,
    fontSize: 32,
  },
  insightList: {
    gap: 5,
  },
  insightText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
  },
  metricPill: {
    borderRadius: radius.pill,
    fontFamily: fonts.bold,
    fontSize: 11,
    overflow: 'hidden',
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  oddsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  providerText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
  },
  sectionLabel: {
    fontFamily: fonts.bold,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  sideLabel: {
    color: 'rgba(255,255,255,0.58)',
    fontFamily: fonts.medium,
    fontSize: 11,
    marginTop: 3,
  },
  statFill: {
    borderRadius: radius.pill,
    height: 5,
  },
  statHalf: {
    flex: 1,
    justifyContent: 'center',
  },
  statLabel: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 12,
    textAlign: 'center',
  },
  statLeft: {
    paddingRight: 4,
  },
  statNumbers: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statRight: {
    paddingLeft: 4,
  },
  statRow: {
    gap: spacing.sm,
  },
  statTrack: {
    borderRadius: radius.pill,
    flexDirection: 'row',
    height: 6,
    overflow: 'hidden',
  },
  statValue: {
    fontFamily: fonts.extraBold,
    fontSize: 13,
    width: 58,
  },
  statsCard: {
    gap: spacing.md,
  },
  summaryDot: {
    borderRadius: radius.pill,
    height: 7,
    marginTop: 6,
    width: 7,
  },
  summaryRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  summaryText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 20,
  },
  tab: {
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    flex: 1,
    height: 38,
    justifyContent: 'center',
  },
  tabRow: {
    borderRadius: radius.lg,
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.xs,
  },
  tabText: {
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  teamCol: {
    alignItems: 'center',
    width: 84,
  },
  teamName: {
    color: '#ffffff',
    fontFamily: fonts.extraBold,
    fontSize: 13,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  title: {
    flex: 1,
    fontFamily: fonts.extraBold,
    fontSize: 21,
    textAlign: 'center',
  },
  venue: {
    color: '#ffffff',
    fontFamily: fonts.extraBold,
    fontSize: 15,
    textAlign: 'center',
  },
  weekLabel: {
    color: 'rgba(255,255,255,0.68)',
    fontFamily: fonts.medium,
    fontSize: 12,
    marginTop: -8,
    textAlign: 'center',
  },
});
