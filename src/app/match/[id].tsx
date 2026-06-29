import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, MoreVertical } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View, type DimensionValue } from 'react-native';
import Animated from 'react-native-reanimated';

import { enterUp, GlassCard, IconButton, PressableScale, ProgressBar, Screen, StatusBadge, TeamLogo } from '@/components/ui';
import type { MatchStatData } from '@/data/mock';
import { useFixtureInsight, useHomeFeed } from '@/lib/api/hooks';
import { flattenHomeFeed, insightSummary, mapInsightStats } from '@/lib/mobile-mappers';
import { useAppTheme } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

const tabs = ['Stats', 'Line-up', 'Summary'] as const;
type DetailTab = (typeof tabs)[number];

function formatStatValue(value: number, suffix?: string) {
  return `${value}${suffix ?? ''}`;
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
        <Animated.View entering={enterUp(4)}>
          <GlassCard style={styles.statsCard}>
            {match.stats.map((stat) => (
              <StatComparison key={stat.id} stat={stat} />
            ))}
          </GlassCard>
        </Animated.View>
      ) : null}

      {activeTab === 'Line-up' ? (
        <Animated.View entering={enterUp(4)}>
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
        <Animated.View entering={enterUp(4)}>
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
