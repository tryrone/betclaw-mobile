import { formatSelectionChance } from "@/lib/selection-display";
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Bell,
  CalendarDays,
  ChevronRight,
  Clock3,
  MapPin,
  Radio,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  Video,
  Zap,
} from '@/components/modern-icons';
import { useEffect, useMemo, useState, type ComponentType } from 'react';
import { ScrollView, StyleSheet, Text, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import {
  enterUp,
  GlassCard,
  IconButton,
  PressableScale,
  ProgressBar,
  Screen,
  StatusBadge,
  TeamLogo,
  type BadgeTone,
} from '@/components/ui';
import type { MatchCardData, MatchStatData, Readiness } from '@/data/mock';
import { useFixtureInsight, useHomeFeed } from '@/lib/api/hooks';
import type {
  FixtureInsight,
  MatchLineupSide,
  MatchPlayerSummary,
  MatchStatRow,
  PredictionView,
  RecentMatchTeam,
  StandingsRow,
} from '@/lib/api/types';
import { formatDate } from '@/lib/mobile-format';
import { flattenHomeFeed, insightSummary, mapInsightStats } from '@/lib/mobile-mappers';
import { useAppTheme } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

const sections = ['Overview', 'Analysis', 'Lineups'] as const;
type DetailSection = (typeof sections)[number];
type LineupSideKey = 'home' | 'away';
type IconComponent = ComponentType<{ color?: string; size?: number; strokeWidth?: number }>;

function parseScore(score?: string | null) {
  if (!score) return {};
  const match = score.match(/(\d+)\D+(\d+)/);
  if (!match) return {};
  return {
    homeScore: Number(match[1]),
    awayScore: Number(match[2]),
  };
}

function formatTime(value?: string | Date | null) {
  if (!value) return 'TBD';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'TBD';
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function dateId(value?: string | Date | null) {
  if (!value) return 'upcoming';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'upcoming';
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const key = (input: Date) => input.toISOString().slice(0, 10);
  if (key(date) === key(today)) return 'today';
  if (key(date) === key(tomorrow)) return 'tomorrow';
  return 'upcoming';
}

function statusFromInsight(insight?: FixtureInsight | null): MatchCardData['status'] {
  const status = insight?.status ?? '';
  if (insight?.elapsedMinute || /live|1h|2h|halftime|ht/i.test(status)) return 'Live';
  if (/finished|final|ft|aet|pen/i.test(status)) return 'Upcoming';
  const id = dateId(insight?.kickoffTime);
  if (id === 'today') return 'Today';
  if (id === 'tomorrow') return 'Tomorrow';
  return 'Upcoming';
}

function readinessLabel(status?: string | null): Readiness {
  if (status && /ready|verified/i.test(status)) return 'Verified';
  if (status && /limited|missing|unavailable/i.test(status)) return 'Limited';
  return 'Partial';
}

function buildMatchFromInsight(insight?: FixtureInsight | null, fixtureId?: string | null): MatchCardData | null {
  if (!insight || !fixtureId) return null;
  const scores = parseScore(insight.score);
  const status = statusFromInsight(insight);
  const summary =
    insight.recommendation?.summary ??
    insight.apiFootballContext?.predictionSummary ??
    insight.h2h?.summary ??
    'Fixture analysis is being prepared.';

  return {
    id: fixtureId,
    away: insight.awayTeam?.name ?? 'Away',
    awayLogoUrl: insight.awayTeam?.logoUrl ?? null,
    clock: insight.elapsedMinute ? `${insight.elapsedMinute}'` : undefined,
    confidence: Math.round(insight.dataReadiness?.score ?? 0),
    date: formatDate(insight.kickoffTime),
    dateId: dateId(insight.kickoffTime),
    home: insight.homeTeam?.name ?? 'Home',
    homeLogoUrl: insight.homeTeam?.logoUrl ?? null,
    league: insight.league?.name ?? 'League',
    leagueId: insight.league?.key ?? String(insight.league?.id ?? 'league'),
    leagueLogoUrl: insight.league?.logoUrl ?? null,
    lineup: [],
    period: status === 'Live' ? 'Live' : undefined,
    readiness: readinessLabel(insight.dataReadiness?.status),
    signal: summary,
    sportId: 'football',
    stats: [],
    status,
    summary: [summary],
    time: status === 'Live' ? 'Live now' : formatTime(insight.kickoffTime),
    trend: insight.recommendation?.label ?? 'Analysis pending',
    venue: insight.venue ?? insight.round ?? 'Fixture analysis',
    ...scores,
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

function readinessTone(status?: string | null): BadgeTone {
  if (status && /ready|verified/i.test(status)) return 'success';
  if (status && /partial|limited|pending|missing/i.test(status)) return 'warning';
  return 'neutral';
}

function statusLabel(match: MatchCardData, insight?: FixtureInsight | null) {
  if (isFinished(insight)) return 'Full time';
  if (insight?.elapsedMinute) return `${insight.elapsedMinute}'`;
  if (insight?.status) return insight.status;
  return match.clock ?? match.status;
}

function findStandingRow(rows?: StandingsRow[], teamName?: string | null) {
  if (!rows || !teamName) return undefined;
  const target = teamName.toLowerCase();
  return rows.find((row) => {
    const name = (row.teamName ?? '').toLowerCase();
    return Boolean(name) && (name.includes(target) || target.includes(name));
  });
}


function coverageCount(insight?: FixtureInsight | null) {
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
  const live = Boolean(insight?.elapsedMinute);
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
    period: live ? 'Live' : baseMatch.period,
    signal: insight?.recommendation?.summary ?? insight?.apiFootballContext?.predictionSummary ?? baseMatch.signal,
    status: insight ? statusFromInsight(insight) : baseMatch.status,
    time: live ? 'Live now' : insight?.kickoffTime ? formatTime(insight.kickoffTime) : baseMatch.time,
    trend: insight?.recommendation?.label ?? baseMatch.trend,
    venue: insight?.venue ?? insight?.round ?? baseMatch.venue,
  };
}

function isLiveMatch(match: MatchCardData, insight?: FixtureInsight | null) {
  return match.status === 'Live' || Boolean(insight?.elapsedMinute) || /live|1h|2h/i.test(insight?.status ?? '');
}

function isFinished(insight?: FixtureInsight | null) {
  return /finished|final|ft/i.test(insight?.status ?? '');
}

function statListFromAverageStats(insight?: FixtureInsight | null) {
  const averageStats = insight?.averageStats;
  return [
    { label: 'Home GF', value: formatInsightMetric(averageStats?.home?.goalsForPerMatch) },
    { label: 'Away GF', value: formatInsightMetric(averageStats?.away?.goalsForPerMatch) },
    { label: 'Home GA', value: formatInsightMetric(averageStats?.home?.goalsAgainstPerMatch) },
    { label: 'Away GA', value: formatInsightMetric(averageStats?.away?.goalsAgainstPerMatch) },
    { label: 'Cards', value: `${formatInsightMetric(averageStats?.home?.cardsPerMatch)} / ${formatInsightMetric(averageStats?.away?.cardsPerMatch)}` },
    { label: 'Ref cards', value: formatInsightMetric(averageStats?.referee?.cardsPerMatch) },
    { label: 'Ref pens', value: formatInsightMetric(averageStats?.referee?.penaltiesPerMatch) },
  ].filter((row) => !row.value.includes('- / -') && row.value !== '-');
}

function formValues(row?: StandingsRow, recent?: RecentMatchTeam | null) {
  const value = row?.form ?? recent?.summary ?? '';
  let compact = value.replace(/[^WDL]/gi, '').slice(0, 5).toUpperCase();
  if (!compact) {
    // Fall back to deriving form from the recent-match results themselves.
    compact = (recent?.matches ?? [])
      .map((match) => resultLetter(match.result) ?? '')
      .join('')
      .slice(0, 5);
  }
  return compact.length > 0 ? compact.split('') : [];
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

function SectionHeader({
  icon: Icon,
  kicker,
  title,
}: {
  icon?: IconComponent;
  kicker?: string;
  title: string;
}) {
  const theme = useAppTheme();
  return (
    <View style={styles.sectionHeader}>
      {Icon ? (
        <View style={[styles.sectionIcon, { backgroundColor: theme.primarySubtle }]}>
          <Icon color={theme.primary} size={15} />
        </View>
      ) : null}
      <View style={styles.sectionTitleWrap}>
        {kicker ? <Text style={[styles.kicker, { color: theme.primary }]}>{kicker}</Text> : null}
        <Text style={[styles.sectionTitle, { color: theme.foregroundStrong }]}>{title}</Text>
      </View>
    </View>
  );
}

function MetricTile({ label, tone = 'neutral', value }: { label: string; tone?: BadgeTone; value: string }) {
  const theme = useAppTheme();
  const color = tone === 'accent' ? theme.primary : tone === 'warning' ? theme.warning : tone === 'success' ? theme.success : theme.foregroundStrong;
  return (
    <View style={[styles.metricTile, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Text numberOfLines={1} style={[styles.metricValue, { color }]}>{value}</Text>
      <Text numberOfLines={1} style={[styles.metricLabel, { color: theme.muted }]}>{label}</Text>
    </View>
  );
}

function HeroMetaPill({ icon: Icon, label, tone = 'neutral' }: { icon?: IconComponent; label: string; tone?: BadgeTone }) {
  const theme = useAppTheme();
  const color = tone === 'accent' ? theme.primarySoft : tone === 'warning' ? theme.warning : theme.mutedLight;
  return (
    <View style={[styles.heroMetaPill, { backgroundColor: theme.field, borderColor: theme.border }]}>
      {Icon ? <Icon color={color} size={13} /> : null}
      <Text numberOfLines={1} style={[styles.heroMetaText, { color }]}>{label}</Text>
    </View>
  );
}

function FormPills({ values, alignRight }: { alignRight?: boolean; values: string[] }) {
  const theme = useAppTheme();
  if (values.length === 0) {
    return (
      <View style={[styles.formRow, alignRight ? styles.formRowRight : null]}>
        <Text style={[styles.formPending, { color: theme.muted }]}>Form pending</Text>
      </View>
    );
  }
  return (
    <View style={[styles.formRow, alignRight ? styles.formRowRight : null]}>
      {values.map((item, index) => {
        const color = item === 'W' ? theme.success : item === 'D' ? theme.warning : theme.danger;
        return (
          <View key={`${item}-${index}`} style={[styles.formPill, { backgroundColor: `${color}22`, borderColor: `${color}66` }]}>
            <Text style={[styles.formText, { color }]}>{item}</Text>
          </View>
        );
      })}
    </View>
  );
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

function PitchLineup({ side }: { side?: MatchLineupSide }) {
  const rows = lineupRows(side?.players ?? [], side?.formation);
  const theme = useAppTheme();

  if (!side || rows.length === 0) {
    return <LineupPendingCard />;
  }

  return (
    <GlassCard gradient="matchHero" style={styles.pitchCard}>
      <View style={styles.pitchHeader}>
        <Text numberOfLines={1} style={styles.pitchTitle}>{side.teamName}</Text>
        <View style={styles.pitchBadges}>
          {side.formation ? <Text style={styles.pitchBadge}>Formation {side.formation}</Text> : null}
          {side.confirmed ? <Text style={styles.pitchBadge}>Confirmed</Text> : null}
          {side.unavailableCount ? <Text style={[styles.pitchBadge, { color: theme.warning }]}>{side.unavailableCount} out</Text> : null}
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

function LineupPendingCard() {
  const theme = useAppTheme();
  return (
    <GlassCard style={styles.pendingCard}>
      <View style={[styles.pendingIcon, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Users color={theme.primary} size={20} />
      </View>
      <Text style={[styles.emptyTitle, { color: theme.foregroundStrong }]}>Lineups not yet released</Text>
      <Text style={[styles.emptyText, { color: theme.muted }]}>Confirmed elevens typically appear close to kickoff. Player context will update as provider coverage lands.</Text>
    </GlassCard>
  );
}

function SkeletonBlock({
  height,
  radiusValue = radius.lg,
  style,
  width = '100%',
}: {
  height: number;
  radiusValue?: number;
  style?: StyleProp<ViewStyle>;
  width?: DimensionValue;
}) {
  const theme = useAppTheme();
  const pulse = useSharedValue(0.55);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 850, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [pulse]);

  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Animated.View
      style={[
        styles.skeletonBlock,
        {
          backgroundColor: theme.surfaceHover,
          borderColor: theme.borderStrong,
          borderRadius: radiusValue,
          height,
          width,
        },
        pulseStyle,
        style,
      ]}
    />
  );
}

function MatchLoadingSkeleton() {
  const theme = useAppTheme();

  return (
    <View style={styles.loadingSkeletonWrap}>
      <Animated.View entering={enterUp(1)}>
        <GlassCard gradient="matchHero" style={styles.heroCard}>
          <View style={styles.leagueRibbon}>
            <SkeletonBlock height={18} width="54%" />
            <SkeletonBlock height={24} radiusValue={radius.pill} width={78} />
          </View>

          <View style={styles.heroTeamsRow}>
            <View style={styles.heroTeam}>
              <SkeletonBlock height={58} radiusValue={radius.pill} width={58} />
              <SkeletonBlock height={16} width="84%" />
              <SkeletonBlock height={18} radiusValue={radius.pill} width="70%" />
            </View>
            <View style={styles.heroCenter}>
              <SkeletonBlock height={44} width={92} />
              <SkeletonBlock height={58} radiusValue={radius.pill} width={58} />
            </View>
            <View style={[styles.heroTeam, styles.heroTeamAway]}>
              <SkeletonBlock height={58} radiusValue={radius.pill} width={58} />
              <SkeletonBlock height={16} width="84%" />
              <SkeletonBlock height={18} radiusValue={radius.pill} width="70%" />
            </View>
          </View>
          <View style={styles.heroMetaRow}>
            <SkeletonBlock height={31} radiusValue={radius.pill} width="32%" />
            <SkeletonBlock height={31} radiusValue={radius.pill} width="28%" />
            <SkeletonBlock height={31} radiusValue={radius.pill} width="34%" />
          </View>
        </GlassCard>
      </Animated.View>

      <Animated.View entering={enterUp(2)}>
        <View style={[styles.contextStrip, { backgroundColor: theme.cardMuted, borderColor: theme.border }]}>
          {Array.from({ length: 3 }).map((_, index) => (
            <View key={index} style={styles.contextTile}>
              <SkeletonBlock height={20} width="58%" />
              <SkeletonBlock height={10} width="74%" />
            </View>
          ))}
          <SkeletonBlock height={28} radiusValue={radius.pill} width={82} />
        </View>
      </Animated.View>

      <Animated.View entering={enterUp(3)}>
        <View style={[styles.sectionSwitcher, { backgroundColor: theme.cardMuted, borderColor: theme.border }]}>
          {sections.map((section) => (
            <View key={section} style={[styles.sectionTab, { backgroundColor: theme.field, borderColor: theme.border }]}>
              <SkeletonBlock height={11} width="70%" />
            </View>
          ))}
        </View>
      </Animated.View>

      <Animated.View entering={enterUp(4)} style={styles.tabContent}>
        <GlassCard style={styles.listCard}>
          {Array.from({ length: 4 }).map((_, index) => (
            <View key={index} style={styles.summaryRow}>
              <SkeletonBlock height={8} radiusValue={radius.pill} width={8} />
              <SkeletonBlock height={16} width={`${84 - index * 8}%` as DimensionValue} />
            </View>
          ))}
        </GlassCard>
        <GlassCard style={styles.statsCard}>
          {Array.from({ length: 3 }).map((_, index) => (
            <View key={index} style={styles.skeletonStatRow}>
              <View style={styles.statNumbers}>
                <SkeletonBlock height={16} width={34} />
                <SkeletonBlock height={14} width="38%" />
                <SkeletonBlock height={16} width={34} />
              </View>
              <SkeletonBlock height={8} radiusValue={radius.pill} width="100%" />
            </View>
          ))}
        </GlassCard>
      </Animated.View>
    </View>
  );
}

function SectionSwitcher({ activeSection, onSelect }: { activeSection: DetailSection; onSelect: (tab: DetailSection) => void }) {
  const theme = useAppTheme();
  return (
    <View style={[styles.sectionSwitcher, { backgroundColor: theme.cardMuted, borderColor: theme.border }]}>
      {sections.map((section) => {
        const active = section === activeSection;
        return (
          <PressableScale
            accessibilityLabel={section}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            key={section}
            onPress={() => onSelect(section)}
            style={[
              styles.sectionTab,
              {
                backgroundColor: active ? theme.card : 'transparent',
                borderColor: active ? theme.borderStrong : 'transparent',
              },
            ]}>
            <Text numberOfLines={1} style={[styles.sectionTabText, { color: active ? theme.primary : theme.muted }]}>{section}</Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

function MatchHero({
  awayForm,
  homeForm,
  insight,
  match,
  readinessScore,
}: {
  awayForm: string[];
  homeForm: string[];
  insight?: FixtureInsight | null;
  match: MatchCardData;
  readinessScore: number;
}) {
  const theme = useAppTheme();
  const live = isLiveMatch(match, insight);
  const finished = isFinished(insight);
  const score = match.homeScore !== undefined && match.awayScore !== undefined ? `${match.homeScore} : ${match.awayScore}` : match.time;
  const statusColor = live ? theme.live : finished ? theme.mutedLight : theme.primarySoft;
  const statusBackground = live ? theme.successSoft : finished ? theme.surface : theme.primarySubtle;

  return (
    <GlassCard style={[styles.heroCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={[styles.leagueRibbon, { backgroundColor: theme.primarySubtle, borderColor: theme.border }]}>
        <View style={styles.leagueIdentity}>
          {match.leagueLogoUrl ? <TeamLogo logoUrl={match.leagueLogoUrl} name={match.league} size={20} /> : null}
          <Text numberOfLines={1} style={[styles.leagueText, { color: theme.foregroundStrong }]}>{match.league}</Text>
          {insight?.league?.country ? <Text numberOfLines={1} style={[styles.countryText, { color: theme.muted }]}>/ {insight.league.country}</Text> : null}
        </View>
        {insight?.round ? <StatusBadge label={insight.round} tone="neutral" /> : null}
      </View>

      <View style={styles.heroTeamsRow}>
        <View style={styles.heroTeam}>
          <View style={[styles.heroLogoWell, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <TeamLogo logoUrl={match.homeLogoUrl} name={match.home} size={54} />
          </View>
          <Text numberOfLines={2} style={[styles.heroTeamName, { color: theme.foregroundStrong }]}>{match.home}</Text>
          <Text style={[styles.sideLabel, { color: theme.muted }]}>Home</Text>
          <FormPills values={homeForm} />
        </View>

        <View style={styles.heroCenter}>
          <View style={[styles.heroStatusPill, { backgroundColor: statusBackground }]}>
            {!finished ? <View style={[styles.liveDot, { backgroundColor: live ? theme.live : theme.primary }]} /> : null}
            <Text numberOfLines={1} style={[styles.heroStatusText, { color: statusColor }]}>{statusLabel(match, insight)}</Text>
          </View>
          <Text adjustsFontSizeToFit minimumFontScale={0.72} numberOfLines={1} style={[styles.scoreText, { color: theme.foregroundStrong }]}>{score}</Text>
          <Text style={[styles.weekLabel, { color: theme.muted }]}>{finished ? 'Final score' : live ? 'Live score' : match.date}</Text>
        </View>

        <View style={[styles.heroTeam, styles.heroTeamAway]}>
          <View style={[styles.heroLogoWell, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <TeamLogo logoUrl={match.awayLogoUrl} name={match.away} size={54} />
          </View>
          <Text numberOfLines={2} style={[styles.heroTeamName, styles.heroAwayName, { color: theme.foregroundStrong }]}>{match.away}</Text>
          <Text style={[styles.sideLabel, { color: theme.muted }]}>Away</Text>
          <FormPills values={awayForm} />
        </View>
      </View>

      <View style={[styles.heroMetaRow, { borderTopColor: theme.border }]}>
        <HeroMetaPill icon={CalendarDays} label={match.date} tone="accent" />
        <HeroMetaPill icon={Clock3} label={match.time} />
        <HeroMetaPill icon={MapPin} label={match.venue} />
        <HeroMetaPill icon={ShieldCheck} label={`${readinessScore}% data ready`} tone="accent" />
        {insight?.apiFootballContext?.standingsSummary && insight.apiFootballContext.standingsSummary !== insight.round ? (
          <HeroMetaPill icon={Trophy} label={insight.apiFootballContext.standingsSummary} />
        ) : null}
      </View>
    </GlassCard>
  );
}

function ContextStrip({
  h2hCount,
  readinessScore,
  readinessStatus,
  sourceCount,
}: {
  h2hCount: number;
  readinessScore: number;
  readinessStatus?: string | null;
  sourceCount: number;
}) {
  const theme = useAppTheme();
  const tone = readinessTone(readinessStatus);
  return (
    <View style={[styles.contextStrip, { backgroundColor: theme.cardMuted, borderColor: theme.border }]}>
      <View style={styles.contextHeader}>
        <Text style={[styles.contextTitle, { color: theme.muted }]}>Match coverage</Text>
        <StatusBadge label={readinessStatus ?? 'Coverage'} tone={tone} />
      </View>
      <View style={styles.contextScoreRow}>
        <Text style={[styles.contextScore, { color: tone === 'success' ? theme.primary : theme.warning }]}>{readinessScore}%</Text>
        <View style={styles.contextBar}>
          <ProgressBar tone={tone === 'success' ? 'success' : 'warning'} value={readinessScore} />
        </View>
      </View>
      <View style={styles.contextStatsRow}>
        <View style={styles.contextTile}>
          <Text style={[styles.contextValue, { color: theme.foregroundStrong }]}>{h2hCount}</Text>
          <Text style={[styles.contextLabel, { color: theme.muted }]}>H2H meetings</Text>
        </View>
        <View style={[styles.contextDivider, { backgroundColor: theme.border }]} />
        <View style={styles.contextTile}>
          <Text style={[styles.contextValue, { color: theme.foregroundStrong }]}>{sourceCount}</Text>
          <Text style={[styles.contextLabel, { color: theme.muted }]}>Data sources</Text>
        </View>
      </View>
    </View>
  );
}

function resultLetter(value?: string | null) {
  const letter = value?.trim().charAt(0).toUpperCase();
  return letter === 'W' || letter === 'D' || letter === 'L' ? letter : null;
}

function formTally(team?: RecentMatchTeam | null) {
  if (team && team.wins != null) {
    return `${team.wins ?? 0}W ${team.draws ?? 0}D ${team.losses ?? 0}L`;
  }
  let wins = 0;
  let draws = 0;
  let losses = 0;
  (team?.matches ?? []).forEach((row) => {
    const letter = resultLetter(row.result);
    if (letter === 'W') wins += 1;
    else if (letter === 'D') draws += 1;
    else if (letter === 'L') losses += 1;
  });
  return `${wins}W ${draws}D ${losses}L`;
}

function shortDate(value?: string | Date | null) {
  if (!value) return '--';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

function ProbabilityBar({ label, value }: { label: string; value: number }) {
  const theme = useAppTheme();
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <View style={styles.probRow}>
      <Text numberOfLines={1} style={[styles.probLabel, { color: theme.mutedLight }]}>{label}</Text>
      <View style={[styles.probTrack, { backgroundColor: theme.statTrack }]}>
        <View style={[styles.probFill, { backgroundColor: theme.primary, width: `${clamped}%` as DimensionValue }]} />
      </View>
      <Text style={[styles.probValue, { color: theme.foregroundStrong }]}>{Math.round(value)}%</Text>
    </View>
  );
}

function RecentMatchRows({ accent, rows }: { accent?: string; rows: NonNullable<RecentMatchTeam['matches']> }) {
  const theme = useAppTheme();
  return (
    <View style={styles.recentList}>
      {rows.map((row, index) => {
        const letter = resultLetter(row.result);
        const color = letter === 'W' ? theme.success : letter === 'D' ? theme.warning : letter === 'L' ? theme.danger : theme.muted;
        return (
          <View
            key={`${row.date ?? index}-${index}`}
            style={[
              styles.recentRow,
              { backgroundColor: theme.surface, borderColor: theme.border },
              accent ? { borderLeftColor: accent, borderLeftWidth: 3 } : null,
            ]}>
            <View style={[styles.resultPill, { backgroundColor: `${color}22`, borderColor: `${color}66` }]}>
              <Text style={[styles.resultPillText, { color }]}>{letter ?? '?'}</Text>
            </View>
            <View style={[styles.venueChip, { backgroundColor: theme.field }]}>
              <Text style={[styles.venueChipText, { color: theme.muted }]}>{row.venue === 'home' ? 'H' : 'A'}</Text>
            </View>
            <Text numberOfLines={1} style={[styles.recentTeams, { color: row.opponent ? theme.foreground : theme.muted }]}>
              {row.opponent ?? 'Opponent pending'}
            </Text>
            <View style={[styles.recentScoreChip, { backgroundColor: theme.field }]}>
              <Text style={[styles.recentScoreText, { color: theme.foregroundStrong }]}>
                {row.teamScore ?? '—'} - {row.opponentScore ?? '—'}
              </Text>
            </View>
            <Text style={[styles.recentDate, { color: theme.muted }]}>{shortDate(row.date)}</Text>
          </View>
        );
      })}
    </View>
  );
}

function miniForm(value?: string | null) {
  return (value ?? '').replace(/[^WDL]/gi, '').toUpperCase().slice(-3).split('');
}

function matchesTeam(name: string, teamName?: string | null) {
  if (!teamName) return false;
  const target = teamName.toLowerCase();
  const candidate = name.toLowerCase();
  return Boolean(candidate) && (candidate.includes(target) || target.includes(candidate));
}

function formatGoalDiff(value?: number | null) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '-';
  return value > 0 ? `+${value}` : `${value}`;
}

function StandingsMiniTable({
  awayTeam,
  homeTeam,
  rows,
  title,
}: {
  awayTeam?: string | null;
  homeTeam?: string | null;
  rows: StandingsRow[];
  title?: string;
}) {
  const theme = useAppTheme();
  return (
    <View style={styles.standingsTable}>
      {title ? <Text style={[styles.standingsTitle, { color: theme.muted }]}>{title}</Text> : null}
      <View style={styles.standingsHeadRow}>
        <Text style={[styles.standingsRank, styles.standingsHead, { color: theme.muted }]}>#</Text>
        <Text style={[styles.standingsTeam, styles.standingsHead, { color: theme.muted }]}>Team</Text>
        <Text style={[styles.standingsNum, styles.standingsHead, { color: theme.muted }]}>P</Text>
        <Text style={[styles.standingsWdl, styles.standingsHead, { color: theme.muted }]}>GD</Text>
        <Text style={[styles.standingsNum, styles.standingsHead, { color: theme.muted }]}>Pts</Text>
        <Text style={[styles.standingsFormCol, styles.standingsHead, { color: theme.muted }]}>Form</Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.standingsBody}
        nestedScrollEnabled
        showsVerticalScrollIndicator={rows.length > 8}
        style={styles.scrollableList}>
        {rows.map((row, index) => {
        const name = row.teamName ?? '--';
        const isHome = matchesTeam(name, homeTeam);
        const isAway = !isHome && matchesTeam(name, awayTeam);
        const rowTint = isHome
          ? { backgroundColor: theme.primarySubtle, borderColor: theme.selectionBorder }
          : isAway
            ? { backgroundColor: theme.accentMuted, borderColor: theme.warningSoft }
            : { borderColor: 'transparent' };
        const nameColor = isHome ? theme.primary : isAway ? theme.accent : theme.foreground;
        const formLetters = miniForm(row.form);
        return (
          <View key={`${name}-${index}`} style={[styles.standingsRow, rowTint]}>
            <Text style={[styles.standingsRank, { color: theme.muted }]}>{row.rank ?? '-'}</Text>
            <Text numberOfLines={1} style={[styles.standingsTeam, { color: nameColor }]}>{name}</Text>
            <Text style={[styles.standingsNum, { color: theme.mutedLight }]}>{row.played ?? '-'}</Text>
            <Text style={[styles.standingsWdl, { color: theme.mutedLight }]}>{formatGoalDiff(row.goalDiff)}</Text>
            <Text style={[styles.standingsNum, { color: theme.foregroundStrong }]}>{row.points ?? '-'}</Text>
            <View style={styles.standingsFormCol}>
              {formLetters.length > 0 ? (
                formLetters.map((letter, letterIndex) => (
                  <Text
                    key={`${letter}-${letterIndex}`}
                    style={[
                      styles.standingsFormLetter,
                      { color: letter === 'W' ? theme.success : letter === 'D' ? theme.warning : theme.danger },
                    ]}>
                    {letter}
                  </Text>
                ))
              ) : (
                <Text style={[styles.standingsFormLetter, { color: theme.muted }]}>-</Text>
              )}
            </View>
          </View>
        );
      })}
      </ScrollView>
    </View>
  );
}

function OverviewSection({
  awayForm,
  awayRecentMatches,
  awayStandings,
  displayStatus,
  h2h,
  homeForm,
  homeRecentMatches,
  homeStandings,
  match,
  prediction,
  predictionItems,
  probabilities,
  venue,
}: {
  awayForm: string[];
  awayRecentMatches?: RecentMatchTeam | null;
  awayStandings?: StandingsRow[];
  displayStatus: string;
  h2h?: FixtureInsight['h2h'];

  homeForm: string[];
  homeRecentMatches?: RecentMatchTeam | null;
  homeStandings?: StandingsRow[];
  match: MatchCardData;
  prediction?: PredictionView | null;
  predictionItems: string[];
  probabilities: { label: string; value: number }[];
  venue?: string | null;
}) {
  const theme = useAppTheme();
  const h2hSample = h2h?.sampleSize ?? 0;
  const total = Math.max(h2hSample, 1);
  const homePct = ((h2h?.homeWins ?? 0) / total) * 100;
  const drawPct = ((h2h?.draws ?? 0) / total) * 100;
  const awayPct = ((h2h?.awayWins ?? 0) / total) * 100;
  const meetings = h2h?.meetings ?? [];
  const homeRecentRows = (homeRecentMatches?.matches ?? []).slice(0, 5);
  const awayRecentRows = (awayRecentMatches?.matches ?? []).slice(0, 5);
  const homeTable = homeStandings ?? [];
  const awayTable = awayStandings ?? [];
  const sameGroup = homeTable.length > 0 && JSON.stringify(homeTable) === JSON.stringify(awayTable);

  return (
    <Animated.View entering={enterUp(0)} style={styles.tabContent}>
      <GlassCard gradient="hero" style={styles.outlookCard}>
        <SectionHeader icon={Sparkles} kicker="Match Analysis Outlook" title={`Likely outcome: ${prediction?.label ?? match.trend}`} />
        {prediction ? (
          <View style={styles.outlookBadges}>
            <StatusBadge
              label={prediction.kind === 'lean' ? 'Market lean' : 'Analysis prediction'}
              tone={prediction.kind === 'lean' ? 'warning' : 'accent'}
            />
            {prediction.sourceLabel ? <StatusBadge label={prediction.sourceLabel} tone="neutral" /> : null}
          </View>
        ) : null}
        <Text style={[styles.outlookText, { color: theme.foreground }]}>
          {prediction?.summary ?? predictionItems[0] ?? match.signal ?? 'Analysis context is being prepared for this fixture.'}
        </Text>
        <View style={styles.outlookMetrics}>
          {typeof prediction?.confidence === 'number' ? (
            <MetricTile label="Estimated win chance" tone="accent" value={formatSelectionChance(null)} />
          ) : null}
          {typeof prediction?.odds === 'number' ? (
            <MetricTile label="Odds" value={prediction.odds.toFixed(2)} />
          ) : null}
          <MetricTile label="Status" tone={match.status === 'Live' ? 'warning' : 'accent'} value={displayStatus} />
          {venue ? <MetricTile label="Venue" value={venue} /> : null}
        </View>
        {probabilities.length > 0 ? (
          <View style={styles.probList}>
            <Text style={[styles.probHeading, { color: theme.muted }]}>Provider outcome probabilities</Text>
            {probabilities.map((item) => (
              <ProbabilityBar key={item.label} label={item.label} value={item.value} />
            ))}
          </View>
        ) : null}
      </GlassCard>

      <GlassCard style={styles.listCard}>
        <SectionHeader icon={Zap} title="Snapshot" />
        {predictionItems.length > 0 ? (
          predictionItems.slice(0, 4).map((item, index) => (
            <View key={`${item}-${index}`} style={styles.summaryRow}>
              <View style={[styles.summaryDot, { backgroundColor: theme.primarySoft }]} />
              <Text style={[styles.summaryText, { color: theme.foreground }]}>{item}</Text>
            </View>
          ))
        ) : (
          <Text style={[styles.emptyText, { color: theme.muted }]}>Analysis summary is pending for this fixture.</Text>
        )}
      </GlassCard>

      <GlassCard style={styles.listCard}>
        <SectionHeader icon={Trophy} title="Head to head and table" />
        <View style={styles.h2hBarHeader}>
          <Text numberOfLines={1} style={[styles.h2hLabel, { color: theme.primary }]}>{h2h?.homeWins ?? 0}W · {match.home}</Text>
          <Text style={[styles.h2hDrawLabel, { color: theme.warning }]}>{h2h?.draws ?? 0}D</Text>
          <Text ellipsizeMode="head" numberOfLines={1} style={[styles.h2hLabel, styles.h2hAwayLabel, { color: theme.danger }]}>{match.away} · {h2h?.awayWins ?? 0}W</Text>
        </View>
        <View style={[styles.h2hTrack, { backgroundColor: theme.statTrack }]}>
          <View style={[styles.h2hSegment, { backgroundColor: theme.primary, width: `${homePct}%` as DimensionValue }]} />
          <View style={[styles.h2hSegment, { backgroundColor: theme.warning, width: `${drawPct}%` as DimensionValue }]} />
          <View style={[styles.h2hSegment, { backgroundColor: theme.danger, width: `${awayPct}%` as DimensionValue }]} />
        </View>
        <Text style={[styles.mutedLine, { color: theme.muted }]}>
          {h2hSample > 0 ? `Sample: ${h2hSample} API-Football meetings` : 'No prior meetings on record yet.'}
        </Text>
        {meetings.length > 0 ? (
          <ScrollView
            contentContainerStyle={styles.recentList}
            nestedScrollEnabled
            showsVerticalScrollIndicator={meetings.length > 6}
            style={styles.scrollableList}>
            {meetings.map((meeting, index) => {
              const winner = meeting.winnerForCurrentFixture;
              const color = winner === 'home' ? theme.primary : winner === 'away' ? theme.danger : theme.warning;
              return (
                <View key={`${meeting.date ?? index}-${index}`} style={[styles.recentRow, { borderColor: theme.border }]}>
                  <Text style={[styles.recentDate, { color: theme.muted }]}>{meeting.date ? formatDate(meeting.date) : '--'}</Text>
                  <Text numberOfLines={1} style={[styles.meetingTeam, { color: theme.foreground }]}>{meeting.homeTeam ?? 'Home'}</Text>
                  <View style={[styles.meetingScore, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Text style={[styles.meetingScoreText, { color: theme.foregroundStrong }]}>
                      {meeting.homeScore ?? '-'} – {meeting.awayScore ?? '-'}
                    </Text>
                  </View>
                  <Text numberOfLines={1} style={[styles.meetingTeam, styles.meetingTeamAway, { color: theme.foreground }]}>{meeting.awayTeam ?? 'Away'}</Text>
                  <View style={[styles.meetingDot, { backgroundColor: color }]} />
                </View>
              );
            })}
            <Text style={[styles.mutedLine, { color: theme.muted }]}>
              Showing {meetings.length} of {Math.max(h2hSample, meetings.length)} meetings
            </Text>
          </ScrollView>
        ) : null}
      </GlassCard>

      <GlassCard style={styles.listCard}>
        <SectionHeader icon={Activity} title="Recent form" />
        <View style={styles.formBlock}>
          <View style={styles.formTeamRow}>
            <Text numberOfLines={1} style={[styles.formTeamName, { color: theme.primary }]}>{match.home}</Text>
            {homeRecentRows.length > 0 ? <Text style={[styles.formTally, { color: theme.mutedLight }]}>{formTally(homeRecentMatches)}</Text> : null}
          </View>
          {homeForm.length > 0 ? <FormPills values={homeForm} /> : null}
          {homeRecentRows.length > 0 ? (
            <RecentMatchRows accent={theme.primary} rows={homeRecentRows} />
          ) : (
            <Text style={[styles.insightText, { color: theme.muted }]}>Recent matches pending for {match.home}.</Text>
          )}
        </View>
        <View style={[styles.formDivider, { backgroundColor: theme.border }]} />
        <View style={styles.formBlock}>
          <View style={styles.formTeamRow}>
            <Text numberOfLines={1} style={[styles.formTeamName, { color: theme.accent }]}>{match.away}</Text>
            {awayRecentRows.length > 0 ? <Text style={[styles.formTally, { color: theme.mutedLight }]}>{formTally(awayRecentMatches)}</Text> : null}
          </View>
          {awayForm.length > 0 ? <FormPills values={awayForm} /> : null}
          {awayRecentRows.length > 0 ? (
            <RecentMatchRows accent={theme.accent} rows={awayRecentRows} />
          ) : (
            <Text style={[styles.insightText, { color: theme.muted }]}>Recent matches pending for {match.away}.</Text>
          )}
        </View>
      </GlassCard>

      {homeTable.length > 0 || awayTable.length > 0 ? (
        <GlassCard style={styles.listCard}>
          <SectionHeader icon={Trophy} title="Standings" />
          {sameGroup ? (
            <StandingsMiniTable awayTeam={match.away} homeTeam={match.home} rows={homeTable} />
          ) : (
            <>
              {homeTable.length > 0 ? <StandingsMiniTable homeTeam={match.home} rows={homeTable} title={`${match.home} group`} /> : null}
              {awayTable.length > 0 ? (
                <>
                  <View style={[styles.formDivider, { backgroundColor: theme.border }]} />
                  <StandingsMiniTable awayTeam={match.away} rows={awayTable} title={`${match.away} group`} />
                </>
              ) : null}
            </>
          )}
        </GlassCard>
      ) : null}
    </Animated.View>
  );
}

function AnalysisSection({
  averageRows,
  insight,
  stats,
}: {
  averageRows: { label: string; value: string }[];
  insight?: FixtureInsight | null;
  stats: MatchStatData[];
}) {
  const theme = useAppTheme();
  return (
    <Animated.View entering={enterUp(0)} style={styles.tabContent}>
      <GlassCard style={styles.statsCard}>
        <SectionHeader icon={Activity} kicker={insight?.matchStats?.status ?? 'Pre-match'} title="Important match stats" />
        {stats.length > 0 ? stats.map((stat) => <StatComparison key={stat.id} stat={stat} />) : <Text style={[styles.emptyText, { color: theme.muted }]}>Stats are pending for this fixture.</Text>}
      </GlassCard>

      <GlassCard style={styles.averageCard}>
        <SectionHeader icon={ShieldCheck} title="Averages and tendencies" />
        <View style={styles.averageGrid}>
          {averageRows.length > 0 ? averageRows.slice(0, 8).map((row) => (
            <View key={row.label} style={[styles.averageTile, { backgroundColor: theme.field, borderColor: theme.border }]}>
              <Text numberOfLines={1} style={[styles.averageValue, { color: theme.foregroundStrong }]}>{row.value}</Text>
              <Text numberOfLines={2} style={[styles.averageLabel, { color: theme.muted }]}>{row.label}</Text>
            </View>
          )) : (
            <Text style={[styles.emptyText, { color: theme.muted }]}>Season averages are still being gathered.</Text>
          )}
        </View>
        <View style={[styles.unavailableNotice, { backgroundColor: theme.warningSoft, borderColor: theme.warningSoft }]}>
          <AlertTriangle color={theme.warning} size={15} />
          <Text style={[styles.noticeText, { color: theme.warning }]}>Average corners stay unavailable until historical corner samples are stored locally.</Text>
        </View>
      </GlassCard>
    </Animated.View>
  );
}

function LineupsSection({
  activeLineup,
  lineupSide,
  match,
  players,
  setLineupSide,
}: {
  activeLineup?: MatchLineupSide;
  lineupSide: LineupSideKey;
  match: MatchCardData;
  players?: FixtureInsight['players'];
  setLineupSide: (side: LineupSideKey) => void;
}) {
  const theme = useAppTheme();
  const keyPlayers = players?.keyPlayers ?? [];

  return (
    <Animated.View entering={enterUp(0)} style={styles.tabContent}>
      <GlassCard style={styles.listCard}>
        <View style={styles.lineupHeader}>
          <View style={styles.lineupHeaderCopy}>
            <SectionHeader icon={Users} title="Lineups" />
          </View>
          <View style={styles.headerBadges}>
            <StatusBadge label={players?.lineupStatus ?? (players?.hasLineups ? 'Available' : 'Pending')} tone={players?.hasLineups ? 'success' : 'neutral'} />
            {players?.lineupUnavailableCount ? (
              <StatusBadge label={`${players.lineupUnavailableCount} unavailable`} tone="warning" />
            ) : null}
          </View>
        </View>
        <View style={[styles.teamSwitch, { backgroundColor: theme.cardMuted, borderColor: theme.border }]}>
          {(['home', 'away'] as const).map((side) => {
            const active = lineupSide === side;
            return (
              <PressableScale
                accessibilityLabel={`${side} lineup`}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                key={side}
                onPress={() => setLineupSide(side)}
                style={[styles.teamSwitchButton, { backgroundColor: active ? theme.field : 'transparent', borderColor: active ? theme.selectionBorder : 'transparent' }]}>
                <Text numberOfLines={1} style={[styles.teamSwitchText, { color: active ? theme.foregroundStrong : theme.mutedLight }]}>
                  {side === 'home' ? match.home : match.away}
                </Text>
              </PressableScale>
            );
          })}
        </View>
      </GlassCard>

      {players?.hasLineups ? <PitchLineup side={activeLineup} /> : <LineupPendingCard />}

      {keyPlayers.length > 0 ? (
        <GlassCard style={styles.listCard}>
          <SectionHeader icon={Sparkles} title="Players to watch" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.playerRail}>
            {keyPlayers.slice(0, 12).map((player, index) => (
              <View
                key={`${player.name}-${index}`}
                style={[
                  styles.playerCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    borderTopColor: player.team === 'away' ? theme.accent : theme.primary,
                    borderTopWidth: 2,
                  },
                ]}>
                <TeamLogo logoUrl={player.photoUrl} name={player.name} size={40} />
                <Text numberOfLines={1} style={[styles.playerCardName, { color: theme.foregroundStrong }]}>{player.name}</Text>
                <Text numberOfLines={1} style={[styles.playerCardMeta, { color: theme.muted }]}>{player.position ?? player.role ?? player.team ?? 'Player'}</Text>
                {player.statLine ? <Text numberOfLines={2} style={[styles.playerCardStat, { color: theme.primary }]}>{player.statLine}</Text> : null}
              </View>
            ))}
          </ScrollView>
        </GlassCard>
      ) : null}
    </Animated.View>
  );
}


export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const theme = useAppTheme();
  const [activeSection, setActiveSection] = useState<DetailSection>('Overview');
  const [lineupSide, setLineupSide] = useState<LineupSideKey>('home');
  const fixtureId = Array.isArray(id) ? id[0] : id;
  const homeFeed = useHomeFeed({ limit: 48, windowDays: 3 });
  const insight = useFixtureInsight(fixtureId);
  const fixtureInsight = insight.data;
  const baseMatch = useMemo(() => flattenHomeFeed(homeFeed.data).find((item) => item.id === fixtureId) ?? null, [fixtureId, homeFeed.data]);
  const match = useMemo(() => {
    if (baseMatch) return enrichMatch(baseMatch, fixtureInsight);
    return buildMatchFromInsight(fixtureInsight, fixtureId);
  }, [baseMatch, fixtureId, fixtureInsight]);
  const serverStats = mapServerStats(fixtureInsight?.matchStats?.rows);
  const insightStats = mapInsightStats(fixtureInsight).filter((stat) => !/corner/i.test(`${stat.id} ${stat.label}`));
  const stats = serverStats.length > 0 ? serverStats : insightStats.length > 0 ? insightStats : match?.stats ?? [];
  const readinessStatus = fixtureInsight?.dataReadiness?.status ?? match?.readiness;
  const readinessScore = Math.round(fixtureInsight?.dataReadiness?.score ?? match?.confidence ?? 0);
  const h2h = fixtureInsight?.h2h;
  const homeStanding = findStandingRow(fixtureInsight?.standings?.home, match?.home);
  const awayStanding = findStandingRow(fixtureInsight?.standings?.away, match?.away);
  const standingsSummaryText = fixtureInsight?.apiFootballContext?.standingsSummary ?? null;
  const predictionItems = Array.from(
    new Set(
      [
        fixtureInsight?.recommendation?.summary,
        fixtureInsight?.apiFootballContext?.predictionSummary,
        ...insightSummary(fixtureInsight),
        ...(match?.summary ?? []),
      ].filter(Boolean) as string[],
    ),
    // The standings line already renders as a hero meta pill — drop the duplicate bullet.
  ).filter((item) => item !== standingsSummaryText);
  const averageRows = statListFromAverageStats(fixtureInsight);
  const activeLineup = lineupSide === 'home' ? fixtureInsight?.players?.lineups?.home : fixtureInsight?.players?.lineups?.away;
  const isLoadingMatch = !match && (homeFeed.isLoading || homeFeed.isFetching || insight.isLoading || insight.isFetching);
  const homeForm = formValues(homeStanding, fixtureInsight?.recentMatches?.home);
  const awayForm = formValues(awayStanding, fixtureInsight?.recentMatches?.away);

  const goBack = () => {
    const canGoBack = (router as { canGoBack?: () => boolean }).canGoBack?.() ?? true;
    if (canGoBack) {
      router.back();
      return;
    }
    router.replace('/matches' as any);
  };

  if (isLoadingMatch) {
    return (
      <Screen>
        <Animated.View entering={enterUp(0)} style={styles.header}>
          <IconButton icon={ArrowLeft} label="Go back" onPress={goBack} />
          <Text numberOfLines={1} style={[styles.title, { color: theme.foregroundStrong }]}>Match</Text>
          <IconButton icon={Bell} label="Match alerts" />
        </Animated.View>

        <MatchLoadingSkeleton />
      </Screen>
    );
  }

  if (!match) {
    return (
      <Screen>
        <Animated.View entering={enterUp(0)} style={styles.header}>
          <IconButton icon={ArrowLeft} label="Go back" onPress={goBack} />
          <Text numberOfLines={1} style={[styles.title, { color: theme.foregroundStrong }]}>Match</Text>
          <IconButton icon={Bell} label="Match alerts" />
        </Animated.View>

        <Animated.View entering={enterUp(1)}>
          <GlassCard style={styles.emptyCard}>
            <Text style={[styles.emptyTitle, { color: theme.foregroundStrong }]}>Match unavailable</Text>
            <Text style={[styles.emptyText, { color: theme.muted }]}>This fixture is not available in the current match feed yet.</Text>
            <PressableScale accessibilityLabel="View matches" accessibilityRole="button" onPress={() => router.replace('/matches' as any)} style={[styles.emptyButton, { backgroundColor: theme.primarySubtle, borderColor: theme.borderAccent }]}>
              <Text style={[styles.emptyButtonText, { color: theme.primarySoft }]}>View matches</Text>
            </PressableScale>
          </GlassCard>
        </Animated.View>
      </Screen>
    );
  }

  const live = isLiveMatch(match, fixtureInsight);
  const headerTitle = live ? 'Live Match' : isFinished(fixtureInsight) ? 'Match Recap' : 'Match Details';
  const ctaLabel = live ? 'Watch Live' : 'Open Match Center';
  const apiPrediction = fixtureInsight?.apiFootballContext?.prediction ?? null;
  const probabilities = [
    { label: match.home, value: apiPrediction?.homePercent ?? null },
    { label: 'Draw', value: apiPrediction?.drawPercent ?? null },
    { label: match.away, value: apiPrediction?.awayPercent ?? null },
  ].filter((item): item is { label: string; value: number } => typeof item.value === 'number');

  return (
    <Screen onRefresh={() => void insight.refetch()} refreshing={insight.isRefetching}>
      <Animated.View entering={enterUp(0)} style={styles.matchStage}>
        <View style={styles.header}>
          <IconButton icon={ArrowLeft} label="Go back" onPress={goBack} />
          <View style={styles.headerTitleWrap}>
            <Text numberOfLines={1} style={[styles.stageTitle, { color: theme.foregroundStrong }]}>{headerTitle}</Text>
            <Text numberOfLines={1} style={[styles.stageSubtitle, { color: theme.muted }]}>{match.league}</Text>
          </View>
          <IconButton icon={Bell} label="Match alerts" />
        </View>
        <MatchHero awayForm={awayForm} homeForm={homeForm} insight={fixtureInsight} match={match} readinessScore={readinessScore} />
      </Animated.View>

      <Animated.View entering={enterUp(1)}>
        <PressableScale
          accessibilityLabel={ctaLabel}
          accessibilityRole="button"
          onPress={() => router.push({ pathname: '/live-match', params: { fixtureId: match.id } } as any)}
          style={[styles.watchButton, { borderColor: theme.primary, backgroundColor: theme.primary }]}>
          {live ? <Video color={theme.primaryDark} size={18} /> : <Radio color={theme.primaryDark} size={18} />}
          <Text style={[styles.watchButtonText, { color: theme.primaryDark }]}>{ctaLabel}</Text>
          <ChevronRight color={theme.primaryDark} size={18} />
        </PressableScale>
      </Animated.View>

      <Animated.View entering={enterUp(2)}>
        <ContextStrip
          h2hCount={h2h?.sampleSize ?? 0}
          readinessScore={readinessScore}
          readinessStatus={readinessStatus}
          sourceCount={coverageCount(fixtureInsight)}
        />
      </Animated.View>

      <Animated.View entering={enterUp(3)}>
        <View style={styles.detailHeader}>
          <Text style={[styles.detailEyebrow, { color: theme.primary }]}>Match intelligence</Text>
          <Text style={[styles.detailHeading, { color: theme.foregroundStrong }]}>Explore the match</Text>
          <Text style={[styles.detailCaption, { color: theme.muted }]}>Prediction context, team form and confirmed lineup data.</Text>
        </View>
        <SectionSwitcher activeSection={activeSection} onSelect={setActiveSection} />
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(220)} key={activeSection}>
        {activeSection === 'Overview' ? (
          <OverviewSection
            awayForm={awayForm}
            awayRecentMatches={fixtureInsight?.recentMatches?.away}
            awayStandings={fixtureInsight?.standings?.away}
            displayStatus={statusLabel(match, fixtureInsight)}
            h2h={h2h}
            homeForm={homeForm}
            homeRecentMatches={fixtureInsight?.recentMatches?.home}
            homeStandings={fixtureInsight?.standings?.home}
            match={match}
            prediction={fixtureInsight?.predictionView}
            predictionItems={predictionItems}
            probabilities={probabilities}
            venue={fixtureInsight?.venue}
          />
        ) : null}

        {activeSection === 'Analysis' ? <AnalysisSection averageRows={averageRows} insight={fixtureInsight} stats={stats} /> : null}

        {activeSection === 'Lineups' ? (
          <LineupsSection
            activeLineup={activeLineup}
            lineupSide={lineupSide}
            match={match}
            players={fixtureInsight?.players}
            setLineupSide={setLineupSide}
          />
        ) : null}
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  averageCard: {
    gap: spacing.md,
  },
  averageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  averageLabel: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    lineHeight: 14,
    marginTop: 3,
  },
  averageTile: {
    borderRadius: radius.lg,
    borderWidth: 1,
    flexBasis: '30%',
    flexGrow: 1,
    minHeight: 64,
    padding: spacing.sm,
  },
  averageValue: {
    fontFamily: fonts.extraBold,
    fontSize: 16,
  },
  confidenceLabel: {
    fontFamily: fonts.bold,
    fontSize: 9,
    marginTop: -2,
  },
  confidenceRing: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  confidenceValue: {
    fontFamily: fonts.extraBold,
    fontSize: 14,
  },
  contextBar: {
    flex: 1,
  },
  contextDivider: {
    height: 22,
    width: 1,
  },
  contextHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  contextLabel: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    letterSpacing: 0.4,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  contextScore: {
    fontFamily: fonts.extraBold,
    fontSize: 22,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  contextScoreRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  contextStatsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  contextStrip: {
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  contextTile: {
    flex: 1,
    minWidth: 0,
  },
  contextTitle: {
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  contextValue: {
    fontFamily: fonts.extraBold,
    fontSize: 16,
    fontVariant: ['tabular-nums'],
  },
  countryText: {
    flexShrink: 1,
    fontFamily: fonts.semibold,
    fontSize: 11,
  },
  coverageKey: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    textTransform: 'capitalize',
  },
  coveragePill: {
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  coverageValue: {
    fontFamily: fonts.bold,
    fontSize: 11,
  },
  coverageWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
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
    textAlign: 'center',
  },
  formBlock: {
    gap: spacing.sm,
  },
  formDivider: {
    height: 1,
    opacity: 0.8,
    width: '100%',
  },
  formPending: {
    fontFamily: fonts.bold,
    fontSize: 10,
  },
  formPill: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  formRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  formRowRight: {
    justifyContent: 'flex-end',
  },
  formTally: {
    fontFamily: fonts.bold,
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
  formTeamName: {
    flex: 1,
    fontFamily: fonts.extraBold,
    fontSize: 13,
  },
  formTeamRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  formText: {
    fontFamily: fonts.extraBold,
    fontSize: 10,
  },
  h2hAwayLabel: {
    textAlign: 'right',
  },
  h2hBarHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  h2hDrawLabel: {
    fontFamily: fonts.bold,
    fontSize: 11,
  },
  h2hLabel: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 11,
  },
  h2hSegment: {
    height: '100%',
  },
  h2hTrack: {
    borderRadius: radius.pill,
    flexDirection: 'row',
    height: 10,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  headerBadges: {
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  headerTitleWrap: {
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  heroAwayName: {
    textAlign: 'center',
  },
  heroCard: {
    borderRadius: radius.xl,
    gap: spacing.lg,
    overflow: 'hidden',
    padding: spacing.md,
  },
  heroCenter: {
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    minWidth: 96,
  },
  heroLogoWell: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 66,
    justifyContent: 'center',
    width: 66,
  },
  heroMetaPill: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    maxWidth: '100%',
    minHeight: 31,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  heroMetaRow: {
    borderTopWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    justifyContent: 'center',
    paddingTop: spacing.md,
  },
  heroMetaText: {
    flexShrink: 1,
    fontFamily: fonts.bold,
    fontSize: 11,
  },
  heroTeam: {
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  heroTeamAway: {
    alignItems: 'center',
  },
  heroTeamName: {
    fontFamily: fonts.extraBold,
    fontSize: 14,
    lineHeight: 18,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  heroTeamsRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  heroStatusPill: {
    alignItems: 'center',
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: 6,
    minHeight: 26,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  heroStatusText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  insightText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 19,
  },
  kicker: {
    fontFamily: fonts.extraBold,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  leagueIdentity: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    minWidth: 0,
  },
  leagueRibbon: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
  },
  leagueText: {
    flexShrink: 1,
    fontFamily: fonts.extraBold,
    fontSize: 12,
  },
  lineupHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  lineupHeaderCopy: {
    flex: 1,
    minWidth: 0,
  },
  listCard: {
    gap: spacing.md,
    padding: spacing.md,
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
  loadingSkeletonWrap: {
    gap: spacing.lg,
  },
  meetingDot: {
    borderRadius: radius.pill,
    height: 8,
    width: 8,
  },
  meetingScore: {
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  meetingScoreText: {
    fontFamily: fonts.extraBold,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
  meetingTeam: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 13,
    textAlign: 'right',
  },
  meetingTeamAway: {
    textAlign: 'left',
  },
  metricLabel: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    marginTop: 3,
  },
  metricTile: {
    borderRadius: radius.lg,
    borderWidth: 1,
    flex: 1,
    minHeight: 62,
    minWidth: 118,
    padding: spacing.sm,
  },
  metricValue: {
    fontFamily: fonts.extraBold,
    fontSize: 15,
  },
  mutedLine: {
    fontFamily: fonts.medium,
    fontSize: 12,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  noticeText: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 11,
    lineHeight: 16,
  },
  outlookBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  outlookCard: {
    gap: spacing.md,
    padding: spacing.md,
  },
  outlookMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  outlookText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 20,
  },
  pendingCard: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  pendingIcon: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
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
  playerCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    minHeight: 92,
    padding: spacing.md,
    width: 154,
  },
  playerCardMeta: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    marginTop: 3,
  },
  playerCardName: {
    fontFamily: fonts.extraBold,
    fontSize: 13,
  },
  playerCardStat: {
    fontFamily: fonts.bold,
    fontSize: 11,
    lineHeight: 16,
    marginTop: spacing.sm,
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
  playerRail: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  probFill: {
    borderRadius: radius.pill,
    height: '100%',
  },
  probHeading: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  probLabel: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    width: 88,
  },
  probList: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  probRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  probTrack: {
    borderRadius: radius.pill,
    flex: 1,
    height: 6,
    overflow: 'hidden',
  },
  probValue: {
    fontFamily: fonts.extraBold,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
    width: 38,
  },
  providerDate: {
    fontFamily: fonts.medium,
    fontSize: 10,
    marginTop: 2,
  },
  providerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  providerName: {
    fontFamily: fonts.extraBold,
    fontSize: 12,
  },
  providerTile: {
    borderRadius: radius.lg,
    borderWidth: 1,
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 58,
    padding: spacing.sm,
  },
  recentDate: {
    fontFamily: fonts.medium,
    fontSize: 11,
  },
  recentList: {
    gap: spacing.xs,
  },
  recentRow: {
    alignItems: 'center',
    borderRadius: radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
  },
  recentScoreChip: {
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  recentScoreText: {
    fontFamily: fonts.extraBold,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  recentTeams: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  resultPill: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  resultPillText: {
    fontFamily: fonts.extraBold,
    fontSize: 10,
  },
  scoreText: {
    fontFamily: fonts.extraBold,
    fontSize: 36,
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
    lineHeight: 41,
    minWidth: 82,
    textAlign: 'center',
  },
  scrollableList: {
    maxHeight: 320,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sectionIcon: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  sectionSwitcher: {
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.xs,
  },
  sectionTab: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    height: 42,
    justifyContent: 'center',
    minWidth: 0,
  },
  sectionTabText: {
    fontFamily: fonts.extraBold,
    fontSize: 13,
  },
  sectionTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 15,
  },
  sectionTitleWrap: {
    flex: 1,
    minWidth: 0,
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
    fontFamily: fonts.medium,
    fontSize: 11,
    marginTop: 3,
  },
  skeletonBlock: {
    borderWidth: 1,
    opacity: 0.74,
  },
  skeletonStatRow: {
    gap: spacing.sm,
  },
  sourceItem: {
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  sourceItemHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  sourceSnippet: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
  },
  sourceTitle: {
    flex: 1,
    fontFamily: fonts.extraBold,
    fontSize: 13,
    lineHeight: 18,
  },
  sourceType: {
    fontFamily: fonts.bold,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  standingsBody: {
    gap: 2,
  },
  standingsFormCol: {
    flexDirection: 'row',
    gap: 2,
    justifyContent: 'flex-end',
    width: 34,
  },
  standingsFormLetter: {
    fontFamily: fonts.extraBold,
    fontSize: 10,
  },
  standingsHead: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  standingsHeadRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  standingsNum: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
    width: 30,
  },
  standingsRank: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    width: 20,
  },
  standingsRow: {
    alignItems: 'center',
    borderRadius: radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  standingsTable: {
    gap: 2,
  },
  standingsTeam: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  standingsTitle: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  standingsWdl: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
    width: 34,
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
  tabContent: {
    gap: spacing.md,
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
    fontFamily: fonts.extraBold,
    fontSize: 18,
    textAlign: 'center',
  },
  detailHeading: {
    fontFamily: fonts.extraBold,
    fontSize: 21,
    lineHeight: 26,
  },
  detailCaption: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
  },
  detailEyebrow: {
    fontFamily: fonts.extraBold,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  detailHeader: {
    gap: 3,
    marginBottom: spacing.md,
  },
  matchStage: {
    gap: spacing.md,
  },
  stageSubtitle: {
    fontFamily: fonts.medium,
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
  stageTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 19,
    textAlign: 'center',
  },
  venueLabel: {
    borderRadius: radius.pill,
    maxWidth: 112,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  venueLabelText: {
    fontFamily: fonts.medium,
    fontSize: 10,
    textAlign: 'center',
  },
  weekLabel: {
    fontFamily: fonts.medium,
    fontSize: 10,
    textAlign: 'center',
  },
  unavailableNotice: {
    alignItems: 'flex-start',
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.sm,
  },
  venueChip: {
    borderRadius: radius.sm,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  venueChipText: {
    fontFamily: fonts.extraBold,
    fontSize: 9,
    textTransform: 'uppercase',
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
    fontFamily: fonts.extraBold,
    fontSize: 15,
  },
});
