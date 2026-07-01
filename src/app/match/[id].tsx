import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Bell, CalendarDays, MapPin, Video } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View, type DimensionValue } from 'react-native';
import Animated from 'react-native-reanimated';

import { enterUp, GlassCard, IconButton, PressableScale, Screen, StatusBadge, TeamLogo } from '@/components/ui';
import type { MatchCardData, MatchStatData } from '@/data/mock';
import { useFixtureInsight, useHomeFeed } from '@/lib/api/hooks';
import type { FixtureInsight, MatchLineupSide, MatchPlayerSummary, MatchStatRow, StandingsRow } from '@/lib/api/types';
import { formatDate } from '@/lib/mobile-format';
import { flattenHomeFeed, insightSummary, mapInsightStats } from '@/lib/mobile-mappers';
import { useAppTheme } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

const tabs = ['Stats', 'Lineups', 'Summary', 'Events'] as const;
type DetailTab = (typeof tabs)[number];
type LineupSideKey = 'home' | 'away';

function parseScore(score?: string | null) {
  if (!score) return {};
  const match = score.match(/(\d+)\D+(\d+)/);
  if (!match) return {};
  return {
    homeScore: Number(match[1]),
    awayScore: Number(match[2]),
  };
}

function formatStatValue(value: number, suffix?: string) {
  return `${Number.isInteger(value) ? value : value.toFixed(1)}${suffix ?? ''}`;
}

function formatInsightMetric(value?: number | null, suffix = '') {
  if (value == null || Number.isNaN(Number(value))) return '-';
  const rounded = Math.round(Number(value) * 10) / 10;
  return `${rounded}${suffix}`;
}

function readinessTone(status?: string | null) {
  if (status && /ready|verified/i.test(status)) return 'success' as const;
  if (status && /partial|limited|pending/i.test(status)) return 'warning' as const;
  return 'neutral' as const;
}

function statusLabel(match: MatchCardData, insight?: FixtureInsight) {
  if (insight?.elapsedMinute) return `${insight.elapsedMinute}'`;
  return match.clock ?? match.status;
}

function standingLine(row?: StandingsRow) {
  if (!row) return 'Standing unavailable';
  const team = row.teamName ?? row.team?.name ?? 'Team';
  const rank = row.rank ? `#${row.rank}` : 'Unranked';
  const points = row.points != null ? `${row.points} pts` : 'points n/a';
  const form = row.form ? ` · ${row.form}` : '';
  return `${team} ${rank} · ${points}${form}`;
}

function coverageCount(insight?: FixtureInsight) {
  const providerCount = insight?.providerLinks?.length ?? 0;
  const coverageKeys = Object.keys(insight?.sourceCoverage ?? {}).length;
  return Math.max(providerCount, coverageKeys);
}

function numericFromDisplay(value?: string | null) {
  if (!value) return null;
  const parsed = Number.parseFloat(value.replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function mapServerStats(rows?: MatchStatRow[]): MatchStatData[] {
  if (!rows?.length) return [];
  return rows.map((row) => ({
    id: row.key,
    away: Number(row.awayValue ?? numericFromDisplay(row.awayDisplay) ?? 0),
    home: Number(row.homeValue ?? numericFromDisplay(row.homeDisplay) ?? 0),
    label: row.label,
    suffix: row.suffix ?? undefined,
  }));
}

function enrichMatch(baseMatch: MatchCardData, insight?: FixtureInsight | null): MatchCardData {
  const scores = parseScore(insight?.score);
  return {
    ...baseMatch,
    ...scores,
    away: insight?.awayTeam?.name ?? baseMatch.away,
    awayLogoUrl: insight?.awayTeam?.logoUrl ?? baseMatch.awayLogoUrl,
    clock: insight?.elapsedMinute ? `${insight.elapsedMinute}'` : baseMatch.clock,
    date: insight?.kickoffTime ? formatDate(insight.kickoffTime) : baseMatch.date,
    home: insight?.homeTeam?.name ?? baseMatch.home,
    homeLogoUrl: insight?.homeTeam?.logoUrl ?? baseMatch.homeLogoUrl,
    league: insight?.league?.name ?? baseMatch.league,
    leagueLogoUrl: insight?.league?.logoUrl ?? baseMatch.leagueLogoUrl,
    period: insight?.elapsedMinute ? 'Live' : baseMatch.period,
    signal: insight?.recommendation?.summary ?? insight?.apiFootballContext?.predictionSummary ?? baseMatch.signal,
    trend: insight?.recommendation?.label ?? baseMatch.trend,
    venue: insight?.venue ?? insight?.round ?? baseMatch.venue,
  };
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
        <Text style={[styles.statValue, styles.statAwayValue, { color: stat.away > stat.home ? theme.accent : theme.foregroundStrong }]}>
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

function lineupRows(players: MatchPlayerSummary[], formation?: string | null) {
  if (players.length === 0) return [];
  const formationParts = formation?.split('-').map((part) => Number.parseInt(part, 10)).filter((part) => Number.isFinite(part) && part > 0) ?? [];
  const counts = players.length >= 11 && formationParts.length > 0 ? [1, ...formationParts] : [Math.min(1, players.length), 3, 3, 4];
  const rows: MatchPlayerSummary[][] = [];
  let cursor = 0;

  counts.forEach((count) => {
    if (cursor >= players.length) return;
    rows.push(players.slice(cursor, cursor + count));
    cursor += count;
  });

  if (cursor < players.length) {
    rows.push(players.slice(cursor));
  }

  return rows.filter((row) => row.length > 0);
}

function PlayerMarker({ player }: { player: MatchPlayerSummary }) {
  const theme = useAppTheme();
  return (
    <View style={styles.playerMarker}>
      <View style={[styles.shirt, { backgroundColor: theme.accentMuted, borderColor: theme.selectionBorder }]}>
        <Text style={styles.shirtNumber}>{player.number ?? player.position?.slice(0, 2).toUpperCase() ?? '-'}</Text>
      </View>
      <Text numberOfLines={1} style={styles.playerName}>{player.name}</Text>
    </View>
  );
}

function FallbackLineup({ match }: { match: MatchCardData }) {
  const theme = useAppTheme();
  return (
    <GlassCard style={styles.fallbackCard}>
      {match.lineup.map((item) => (
        <View key={item.role} style={styles.fallbackRow}>
          <Text style={[styles.fallbackSide, { color: theme.foregroundStrong }]}>{item.home}</Text>
          <Text style={[styles.fallbackRole, { color: theme.muted }]}>{item.role}</Text>
          <Text style={[styles.fallbackSide, styles.fallbackAway, { color: theme.foregroundStrong }]}>{item.away}</Text>
        </View>
      ))}
    </GlassCard>
  );
}

function PitchLineup({ side }: { side?: MatchLineupSide }) {
  const rows = lineupRows(side?.players ?? [], side?.formation);
  const theme = useAppTheme();

  if (!side || rows.length === 0) {
    return (
      <GlassCard style={styles.fallbackCard}>
        <Text style={[styles.emptyTitle, { color: theme.foregroundStrong }]}>Lineups not released</Text>
        <Text style={[styles.emptyText, { color: theme.muted }]}>The visual formation will appear when provider lineup data is available.</Text>
      </GlassCard>
    );
  }

  return (
    <GlassCard gradient="matchHero" style={styles.pitchCard}>
      <View style={styles.pitchHeader}>
        <Text numberOfLines={1} style={styles.pitchTitle}>{side.teamName}</Text>
        <View style={styles.pitchBadges}>
          {side.formation ? <Text style={styles.pitchBadge}>Formation {side.formation}</Text> : null}
          {side.confirmed ? <Text style={styles.pitchBadge}>Confirmed</Text> : null}
        </View>
      </View>
      <View style={styles.pitch}>
        <View style={styles.pitchBoxTop} />
        <View style={styles.pitchMidLine} />
        <View style={styles.pitchCircle} />
        <View style={styles.pitchBoxBottom} />
        {rows.map((row, index) => (
          <View key={`row-${index}`} style={styles.pitchRow}>
            {row.map((player) => (
              <PlayerMarker key={`${player.name}-${player.number ?? 'n'}`} player={player} />
            ))}
          </View>
        ))}
      </View>
    </GlassCard>
  );
}

function SummaryList({ items }: { items: string[] }) {
  const theme = useAppTheme();
  return (
    <GlassCard style={styles.listCard}>
      {items.map((item, index) => (
        <View key={`${item}-${index}`} style={styles.summaryRow}>
          <View style={[styles.summaryDot, { backgroundColor: index % 2 === 0 ? theme.primarySoft : theme.accent }]} />
          <Text style={[styles.summaryText, { color: theme.foreground }]}>{item}</Text>
        </View>
      ))}
    </GlassCard>
  );
}

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const theme = useAppTheme();
  const [activeTab, setActiveTab] = useState<DetailTab>('Lineups');
  const [lineupSide, setLineupSide] = useState<LineupSideKey>('home');
  const fixtureId = Array.isArray(id) ? id[0] : id;
  const homeFeed = useHomeFeed({ limit: 48, windowDays: 3 });
  const insight = useFixtureInsight(fixtureId);
  const baseMatch = useMemo(() => flattenHomeFeed(homeFeed.data).find((item) => item.id === fixtureId) ?? null, [fixtureId, homeFeed.data]);
  const match = useMemo(() => (baseMatch ? enrichMatch(baseMatch, insight.data) : null), [baseMatch, insight.data]);
  const fixtureInsight = insight.data;
  const serverStats = mapServerStats(fixtureInsight?.matchStats?.rows);
  const insightStats = mapInsightStats(fixtureInsight);
  const stats = serverStats.length > 0 ? serverStats : insightStats.length > 0 ? insightStats : match?.stats ?? [];
  const readinessStatus = fixtureInsight?.dataReadiness?.status ?? match?.readiness;
  const readinessScore = Math.round(fixtureInsight?.dataReadiness?.score ?? match?.confidence ?? 0);
  const h2h = fixtureInsight?.h2h;
  const homeStanding = fixtureInsight?.standings?.home?.[0];
  const awayStanding = fixtureInsight?.standings?.away?.[0];
  const homeRecent = fixtureInsight?.recentMatches?.home?.summary;
  const awayRecent = fixtureInsight?.recentMatches?.away?.summary;
  const averageStats = fixtureInsight?.averageStats;
  const providerLinks = fixtureInsight?.providerLinks ?? [];
  const summaryItems = [
    ...insightSummary(fixtureInsight),
    ...(match?.summary ?? []),
  ].filter(Boolean);
  const averageRows = [
    { label: 'Home GF', value: formatInsightMetric(averageStats?.home?.goalsForPerMatch) },
    { label: 'Away GF', value: formatInsightMetric(averageStats?.away?.goalsForPerMatch) },
    { label: 'Corners', value: `${formatInsightMetric(averageStats?.home?.cornersPerMatch)} / ${formatInsightMetric(averageStats?.away?.cornersPerMatch)}` },
    { label: 'Cards', value: `${formatInsightMetric(averageStats?.home?.cardsPerMatch)} / ${formatInsightMetric(averageStats?.away?.cardsPerMatch)}` },
    { label: 'Ref cards', value: formatInsightMetric(averageStats?.referee?.cardsPerMatch) },
  ].filter((row) => !row.value.includes('- / -') && row.value !== '-');
  const activeLineup = lineupSide === 'home' ? fixtureInsight?.players?.lineups?.home : fixtureInsight?.players?.lineups?.away;
  const eventRows = [
    ...(h2h?.meetings ?? []).slice(0, 4).map((meeting) => `${meeting.homeTeam ?? 'Home'} ${meeting.homeScore ?? '-'} - ${meeting.awayScore ?? '-'} ${meeting.awayTeam ?? 'Away'}`),
    ...(providerLinks.slice(0, 3).map((link) => `${link.provider ?? 'Provider'}${link.fetchedAt ? ` · ${formatDate(link.fetchedAt)}` : ''}`)),
  ];

  if (!match) {
    return (
      <Screen>
        <Animated.View entering={enterUp(0)} style={styles.header}>
          <IconButton icon={ArrowLeft} label="Go back" onPress={() => router.back()} />
          <Text numberOfLines={1} style={[styles.title, { color: theme.foregroundStrong }]}>Match</Text>
          <IconButton icon={Bell} label="Match alerts" />
        </Animated.View>

        <Animated.View entering={enterUp(1)}>
          <GlassCard style={styles.emptyCard}>
            <Text style={[styles.emptyTitle, { color: theme.foregroundStrong }]}>
              {homeFeed.isLoading || insight.isLoading ? 'Loading match' : 'Match unavailable'}
            </Text>
            <Text style={[styles.emptyText, { color: theme.muted }]}>
              {homeFeed.isLoading || insight.isLoading ? 'Fetching fixture analysis.' : 'This fixture is no longer in the match list.'}
            </Text>
            <PressableScale accessibilityLabel="View matches" accessibilityRole="button" onPress={() => router.replace('/matches' as any)} style={[styles.emptyButton, { backgroundColor: theme.primarySubtle, borderColor: theme.borderAccent }]}>
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
        <Text numberOfLines={1} style={[styles.title, { color: theme.foregroundStrong }]}>Live Match</Text>
        <IconButton icon={Bell} label="Match alerts" />
      </Animated.View>

      <Animated.View entering={enterUp(1)}>
        <GlassCard gradient="matchHero" style={styles.scoreCard}>
          <View style={styles.scoreMetaRow}>
            <View style={styles.scoreMetaPill}>
              <MapPin color="#ffffff" size={13} />
              <Text numberOfLines={1} style={styles.venue}>{match.venue}</Text>
            </View>
            <View style={styles.scoreMetaPill}>
              <CalendarDays color="#ffffff" size={13} />
              <Text numberOfLines={1} style={styles.weekLabel}>{match.date}</Text>
            </View>
          </View>

          <View style={styles.scoreRow}>
            <View style={styles.teamCol}>
              <TeamLogo logoUrl={match.homeLogoUrl} name={match.home} size={64} />
              <Text numberOfLines={1} style={styles.teamName}>{match.home}</Text>
              <Text style={styles.sideLabel}>Home</Text>
            </View>
            <View style={styles.scoreCenter}>
              <Text adjustsFontSizeToFit numberOfLines={1} style={styles.scoreText}>
                {match.homeScore !== undefined && match.awayScore !== undefined ? `${match.homeScore} : ${match.awayScore}` : match.time}
              </Text>
              <View style={styles.liveTimeRow}>
                <View style={[styles.liveDot, { backgroundColor: theme.live }]} />
                <Text style={styles.liveClock}>{statusLabel(match, fixtureInsight)}</Text>
              </View>
            </View>
            <View style={styles.teamCol}>
              <TeamLogo logoUrl={match.awayLogoUrl} name={match.away} size={64} />
              <Text numberOfLines={1} style={styles.teamName}>{match.away}</Text>
              <Text style={styles.sideLabel}>Away</Text>
            </View>
          </View>
        </GlassCard>
      </Animated.View>

      <Animated.View entering={enterUp(2)}>
        <PressableScale
          accessibilityLabel="Watch live match center"
          accessibilityRole="button"
          onPress={() => router.push({ pathname: '/live-match', params: { fixtureId: match.id } } as any)}
          style={[styles.watchButton, { borderColor: theme.selectionBorder, backgroundColor: theme.field }]}>
          <LinearGradient colors={['rgba(169,232,40,0.18)', 'rgba(255,138,42,0.12)']} end={{ x: 1, y: 1 }} start={{ x: 0, y: 0 }} style={StyleSheet.absoluteFill} />
          <Video color={theme.accent} size={18} />
          <Text style={styles.watchButtonText}>Watch Live</Text>
        </PressableScale>
      </Animated.View>

      <Animated.View entering={enterUp(3)}>
        <View style={[styles.contextStrip, { backgroundColor: theme.cardMuted, borderColor: theme.border }]}>
          <View style={styles.contextTile}>
            <Text style={[styles.contextValue, { color: theme.primarySoft }]}>{readinessScore}%</Text>
            <Text style={[styles.contextLabel, { color: theme.muted }]}>Readiness</Text>
          </View>
          <View style={styles.contextTile}>
            <Text style={[styles.contextValue, { color: theme.foregroundStrong }]}>{h2h?.sampleSize ?? 0}</Text>
            <Text style={[styles.contextLabel, { color: theme.muted }]}>H2H</Text>
          </View>
          <View style={styles.contextTile}>
            <Text style={[styles.contextValue, { color: theme.foregroundStrong }]}>{coverageCount(fixtureInsight)}</Text>
            <Text style={[styles.contextLabel, { color: theme.muted }]}>Sources</Text>
          </View>
          <StatusBadge label={readinessStatus ?? 'Coverage'} tone={readinessTone(readinessStatus)} />
        </View>
      </Animated.View>

      <Animated.View entering={enterUp(4)}>
        <ScrollTabs activeTab={activeTab} onSelect={setActiveTab} />
      </Animated.View>

      {activeTab === 'Stats' ? (
        <Animated.View entering={enterUp(5)} style={styles.tabContent}>
          <GlassCard style={styles.statsCard}>
            {stats.length > 0 ? stats.map((stat) => <StatComparison key={stat.id} stat={stat} />) : <Text style={[styles.emptyText, { color: theme.muted }]}>Stats are pending for this fixture.</Text>}
          </GlassCard>
          {averageRows.length > 0 ? (
            <GlassCard style={styles.averageCard}>
              {averageRows.slice(0, 5).map((row) => (
                <View key={row.label} style={[styles.averageTile, { backgroundColor: theme.field, borderColor: theme.border }]}>
                  <Text style={[styles.averageValue, { color: theme.foregroundStrong }]}>{row.value}</Text>
                  <Text style={[styles.averageLabel, { color: theme.muted }]}>{row.label}</Text>
                </View>
              ))}
            </GlassCard>
          ) : null}
        </Animated.View>
      ) : null}

      {activeTab === 'Lineups' ? (
        <Animated.View entering={enterUp(5)} style={styles.tabContent}>
          <View style={[styles.teamSwitch, { backgroundColor: theme.cardMuted, borderColor: theme.border }]}>
            {(['home', 'away'] as const).map((side) => {
              const active = lineupSide === side;
              return (
                <PressableScale key={side} accessibilityLabel={`${side} lineup`} accessibilityRole="button" onPress={() => setLineupSide(side)} style={[styles.teamSwitchButton, { backgroundColor: active ? theme.field : 'transparent', borderColor: active ? theme.selectionBorder : 'transparent' }]}>
                  <Text numberOfLines={1} style={[styles.teamSwitchText, { color: active ? theme.foregroundStrong : theme.mutedLight }]}>
                    {side === 'home' ? match.home : match.away}
                  </Text>
                </PressableScale>
              );
            })}
          </View>
          {fixtureInsight?.players?.hasLineups ? <PitchLineup side={activeLineup} /> : <FallbackLineup match={match} />}
        </Animated.View>
      ) : null}

      {activeTab === 'Summary' ? (
        <Animated.View entering={enterUp(5)} style={styles.tabContent}>
          <SummaryList items={summaryItems.length > 0 ? summaryItems : ['Analysis summary is pending for this fixture.']} />
          <GlassCard style={styles.listCard}>
            <Text style={[styles.sectionLabel, { color: theme.muted }]}>Standings and form</Text>
            <Text style={[styles.insightText, { color: theme.foreground }]}>{standingLine(homeStanding)}</Text>
            <Text style={[styles.insightText, { color: theme.foreground }]}>{standingLine(awayStanding)}</Text>
            {homeRecent ? <Text style={[styles.insightText, { color: theme.mutedLight }]}>{match.home}: {homeRecent}</Text> : null}
            {awayRecent ? <Text style={[styles.insightText, { color: theme.mutedLight }]}>{match.away}: {awayRecent}</Text> : null}
          </GlassCard>
        </Animated.View>
      ) : null}

      {activeTab === 'Events' ? (
        <Animated.View entering={enterUp(5)}>
          <SummaryList items={eventRows.length > 0 ? eventRows : ['Live events and provider fetches will appear here as coverage updates.']} />
        </Animated.View>
      ) : null}
    </Screen>
  );
}

function ScrollTabs({ activeTab, onSelect }: { activeTab: DetailTab; onSelect: (tab: DetailTab) => void }) {
  const theme = useAppTheme();
  return (
    <View style={[styles.tabRow, { backgroundColor: theme.cardMuted, borderColor: theme.border }]}>
      {tabs.map((tab) => {
        const active = tab === activeTab;
        return (
          <PressableScale
            accessibilityLabel={tab}
            accessibilityRole="button"
            key={tab}
            onPress={() => onSelect(tab)}
            style={[styles.tab, { backgroundColor: active ? 'transparent' : theme.field, borderColor: active ? 'transparent' : theme.border }]}>
            {active ? <LinearGradient colors={['#bdf14a', '#93D51F']} end={{ x: 1, y: 1 }} start={{ x: 0, y: 0 }} style={StyleSheet.absoluteFill} /> : null}
            <Text numberOfLines={1} style={[styles.tabText, { color: active ? theme.primaryDark : theme.mutedLight }]}>{tab}</Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  averageCard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  averageLabel: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    marginTop: 3,
  },
  averageTile: {
    borderRadius: radius.lg,
    borderWidth: 1,
    flexBasis: '30%',
    flexGrow: 1,
    padding: spacing.sm,
  },
  averageValue: {
    fontFamily: fonts.extraBold,
    fontSize: 16,
  },
  contextLabel: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    marginTop: 2,
  },
  contextStrip: {
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.sm,
  },
  contextTile: {
    flex: 1,
    minWidth: 0,
  },
  contextValue: {
    fontFamily: fonts.extraBold,
    fontSize: 16,
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
    lineHeight: 19,
    textAlign: 'center',
  },
  emptyTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 18,
  },
  fallbackAway: {
    textAlign: 'right',
  },
  fallbackCard: {
    gap: spacing.sm,
  },
  fallbackRole: {
    fontFamily: fonts.bold,
    fontSize: 11,
    textAlign: 'center',
    width: 82,
  },
  fallbackRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
    minHeight: 42,
  },
  fallbackSide: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  insightText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
  },
  listCard: {
    gap: spacing.sm,
  },
  liveClock: {
    color: 'rgba(255,255,255,0.78)',
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  liveDot: {
    borderRadius: radius.pill,
    height: 8,
    width: 8,
  },
  liveTimeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  pitch: {
    aspectRatio: 0.74,
    borderColor: 'rgba(255,255,255,0.64)',
    borderRadius: 8,
    borderWidth: 2,
    gap: spacing.sm,
    justifyContent: 'space-between',
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
  },
  pitchBadge: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: radius.pill,
    color: '#ffffff',
    fontFamily: fonts.bold,
    fontSize: 10,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pitchBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  pitchBoxBottom: {
    alignSelf: 'center',
    borderColor: 'rgba(255,255,255,0.55)',
    borderTopWidth: 2,
    bottom: 0,
    height: '16%',
    position: 'absolute',
    width: '48%',
  },
  pitchBoxTop: {
    alignSelf: 'center',
    borderBottomWidth: 2,
    borderColor: 'rgba(255,255,255,0.55)',
    height: '16%',
    position: 'absolute',
    top: 0,
    width: '48%',
  },
  pitchCard: {
    gap: spacing.md,
  },
  pitchCircle: {
    alignSelf: 'center',
    borderColor: 'rgba(255,255,255,0.45)',
    borderRadius: 44,
    borderWidth: 2,
    height: 88,
    position: 'absolute',
    top: '42%',
    width: 88,
  },
  pitchHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  pitchMidLine: {
    backgroundColor: 'rgba(255,255,255,0.45)',
    height: 2,
    left: 0,
    position: 'absolute',
    right: 0,
    top: '50%',
  },
  pitchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-around',
    zIndex: 1,
  },
  pitchTitle: {
    color: '#ffffff',
    flex: 1,
    fontFamily: fonts.extraBold,
    fontSize: 15,
  },
  playerMarker: {
    alignItems: 'center',
    flex: 1,
    maxWidth: 74,
    minWidth: 42,
  },
  playerName: {
    color: '#ffffff',
    fontFamily: fonts.extraBold,
    fontSize: 9,
    marginTop: 3,
    textAlign: 'center',
  },
  scoreCard: {
    gap: spacing.md,
    overflow: 'hidden',
  },
  scoreCenter: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.xs,
    minWidth: 92,
  },
  scoreMetaPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: 6,
    maxWidth: '48%',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  scoreMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
  },
  scoreRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  scoreText: {
    color: '#ffffff',
    fontFamily: fonts.extraBold,
    fontSize: 39,
    lineHeight: 44,
    textAlign: 'center',
  },
  sectionLabel: {
    fontFamily: fonts.bold,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  shirt: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  shirtNumber: {
    color: '#ffffff',
    fontFamily: fonts.extraBold,
    fontSize: 12,
  },
  sideLabel: {
    color: 'rgba(255,255,255,0.62)',
    fontFamily: fonts.medium,
    fontSize: 11,
    marginTop: 3,
  },
  statAwayValue: {
    textAlign: 'right',
  },
  statFill: {
    borderRadius: radius.pill,
    height: 6,
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
    height: 7,
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
    borderRadius: radius.pill,
    borderWidth: 1,
    flex: 1,
    height: 44,
    justifyContent: 'center',
    minWidth: 0,
    overflow: 'hidden',
  },
  tabContent: {
    gap: spacing.md,
  },
  tabRow: {
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.xs,
  },
  tabText: {
    fontFamily: fonts.extraBold,
    fontSize: 11,
  },
  teamCol: {
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  teamName: {
    color: '#ffffff',
    fontFamily: fonts.extraBold,
    fontSize: 13,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  teamSwitch: {
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.xs,
  },
  teamSwitchButton: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    flex: 1,
    height: 38,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  teamSwitchText: {
    fontFamily: fonts.extraBold,
    fontSize: 12,
  },
  title: {
    flex: 1,
    fontFamily: fonts.extraBold,
    fontSize: 20,
    textAlign: 'center',
  },
  venue: {
    color: '#ffffff',
    flexShrink: 1,
    fontFamily: fonts.extraBold,
    fontSize: 12,
  },
  watchButton: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    height: 54,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  watchButtonText: {
    color: '#ffffff',
    fontFamily: fonts.extraBold,
    fontSize: 15,
  },
  weekLabel: {
    color: '#ffffff',
    flexShrink: 1,
    fontFamily: fonts.bold,
    fontSize: 12,
  },
});
