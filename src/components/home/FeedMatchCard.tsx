import { useRouter } from 'expo-router';
import { ArrowRight, BarChart3, Sparkles, Star } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { DashboardOddsButton, PressableScale, TeamLogo } from '@/components/ui';
import type { FeedMatch } from '@/lib/api/types';
import {
  formatMatchDate,
  formatMatchTime,
  isFinishedMatch,
  isLiveMatch,
  matchConfidence,
  matchPhaseLabel,
  matchReadinessLabel,
  matchSignalLabel,
  normalizedMatchStatus,
  parseMatchScore,
} from '@/lib/match-display';
import { useAppTheme } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

export type FeedMatchCardVariant = 'featured' | 'compact';

type LeagueIdentity = {
  country?: string | null;
  logoUrl?: string | null;
  name: string;
};

type FeedMatchCardProps = {
  caption?: string | null;
  league: LeagueIdentity;
  match: FeedMatch;
  onPress?: () => void;
  showCompetition?: boolean;
  showSignal?: boolean;
  variant: FeedMatchCardVariant;
};

function formatOdd(value?: number | null) {
  return typeof value === 'number' && Number.isFinite(value) ? value.toFixed(2) : null;
}

function IconChip({ icon: Icon, label, onPress }: { icon: typeof Star; label: string; onPress?: () => void }) {
  const theme = useAppTheme();
  return (
    <PressableScale
      accessibilityLabel={label}
      accessibilityRole="button"
      hitSlop={5}
      onPress={onPress}
      style={[styles.iconChip, { borderColor: theme.border }]}>
      <Icon color={theme.mutedLight} size={16} strokeWidth={1.9} />
    </PressableScale>
  );
}

function SignalRow({ match }: { match: FeedMatch }) {
  const theme = useAppTheme();
  const confidence = matchConfidence(match);
  const signal = matchSignalLabel(match);
  const readiness = matchReadinessLabel(match);

  return (
    <View style={[styles.signalRow, { borderTopColor: theme.border }]}>
      <View style={[styles.signalIcon, { backgroundColor: theme.primarySubtle }]}>
        <Sparkles color={theme.primarySoft} size={14} strokeWidth={2} />
      </View>
      <View style={styles.signalCopy}>
        <Text numberOfLines={1} style={[styles.signalText, { color: theme.foregroundStrong }]}>{signal}</Text>
        <Text numberOfLines={1} style={[styles.readinessText, { color: theme.muted }]}>{readiness}</Text>
      </View>
      {confidence !== null ? (
        <View style={[styles.confidencePill, { backgroundColor: theme.primarySubtle, borderColor: theme.borderAccent }]}>
          <Text style={[styles.confidenceText, { color: theme.primarySoft }]}>{confidence}%</Text>
        </View>
      ) : null}
    </View>
  );
}

function CompactTeam({ logoUrl, name }: { logoUrl?: string | null; name: string }) {
  const theme = useAppTheme();
  return (
    <View style={styles.compactTeam}>
      <TeamLogo logoUrl={logoUrl} name={name} size={42} />
      <Text numberOfLines={2} style={[styles.compactTeamName, { color: theme.foregroundStrong }]}>{name}</Text>
    </View>
  );
}

function CompactMatchCard({ league, match, onPress, showCompetition = false, showSignal = true }: FeedMatchCardProps) {
  const router = useRouter();
  const theme = useAppTheme();
  const live = isLiveMatch(match);
  const finished = isFinishedMatch(match);
  const score = parseMatchScore(match);
  const elapsedMinute = match.elapsedMinute ?? match.dataSnapshot?.elapsedMinute;
  const openMatch = onPress ?? (() => router.push(`/match/${match.fixtureId}` as any));

  return (
    <PressableScale
      accessibilityHint="Opens match details"
      accessibilityLabel={`${match.homeTeam.name} versus ${match.awayTeam.name}`}
      accessibilityRole="button"
      onPress={openMatch}
      scaleTo={0.985}
      style={[styles.compactCard, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}>
      {showCompetition ? (
        <View style={styles.competitionRow}>
          <TeamLogo logoUrl={league.logoUrl} name={league.name} size={20} />
          <View style={styles.competitionCopy}>
            <Text numberOfLines={1} style={[styles.competitionName, { color: theme.foregroundStrong }]}>{league.name}</Text>
            {league.country ? <Text numberOfLines={1} style={[styles.competitionCountry, { color: theme.muted }]}>{league.country}</Text> : null}
          </View>
        </View>
      ) : null}

      <View style={styles.compactMatchup}>
        <CompactTeam logoUrl={match.homeTeam.logoUrl} name={match.homeTeam.name} />
        <View style={styles.compactCenter}>
          {live || finished ? (
            <>
              <Text style={[styles.compactScore, { color: theme.foregroundStrong }]}>{score.home ?? '–'} : {score.away ?? '–'}</Text>
              <View style={styles.statusLine}>
                {!finished ? <View style={[styles.liveDot, { backgroundColor: theme.live }]} /> : null}
                <Text style={[styles.statusText, { color: finished ? theme.mutedLight : theme.live }]}>
                  {finished ? 'Full time' : typeof elapsedMinute === 'number' ? `${elapsedMinute}'` : matchPhaseLabel(match)}
                </Text>
              </View>
            </>
          ) : (
            <>
              <Text style={[styles.compactTime, { color: theme.accent }]}>{formatMatchTime(match.kickoffTime)}</Text>
              <Text style={[styles.compactDate, { color: theme.muted }]}>{formatMatchDate(match.kickoffTime)}</Text>
            </>
          )}
        </View>
        <CompactTeam logoUrl={match.awayTeam.logoUrl} name={match.awayTeam.name} />
      </View>

      {showSignal ? <SignalRow match={match} /> : null}
    </PressableScale>
  );
}

function FeaturedTeam({ alignRight, logoUrl, name }: { alignRight?: boolean; logoUrl?: string | null; name: string }) {
  const theme = useAppTheme();
  return (
    <View style={[styles.featuredTeam, alignRight ? styles.featuredTeamRight : null]}>
      <TeamLogo logoUrl={logoUrl} name={name} size={50} />
      <Text numberOfLines={2} style={[styles.featuredTeamName, alignRight ? styles.featuredTeamNameRight : null, { color: theme.foregroundStrong }]}>{name}</Text>
    </View>
  );
}

function FeaturedMatchCard({ caption, league, match, onPress, showCompetition = true, showSignal = true }: FeedMatchCardProps) {
  const router = useRouter();
  const theme = useAppTheme();
  const live = isLiveMatch(match);
  const finished = isFinishedMatch(match);
  const showScore = live || finished;
  const score = parseMatchScore(match);
  const elapsedMinute = match.elapsedMinute ?? match.dataSnapshot?.elapsedMinute;
  const odds = match.matchOdds;
  const bestOdd = formatOdd(match.bestMarket?.odds);
  const hasTripleOdds = Boolean(formatOdd(odds?.home) ?? formatOdd(odds?.draw) ?? formatOdd(odds?.away));
  const openMatch = onPress ?? (() => router.push(`/match/${match.fixtureId}` as any));

  return (
    <PressableScale
      accessibilityHint="Opens match details"
      accessibilityLabel={`${match.homeTeam.name} versus ${match.awayTeam.name}`}
      accessibilityRole="button"
      onPress={openMatch}
      scaleTo={0.99}
      style={[styles.featuredCard, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}>
      <View style={styles.featuredHeader}>
        <Text numberOfLines={1} style={[styles.caption, { color: theme.muted }]}>{caption ?? formatMatchDate(match.kickoffTime, true)}</Text>
        <View style={styles.headerActions}>
          <IconChip icon={BarChart3} label="Open match stats" onPress={openMatch} />
          <IconChip icon={Star} label="Favorite match" />
        </View>
      </View>

      <View style={styles.featuredTeamsRow}>
        <FeaturedTeam logoUrl={match.homeTeam.logoUrl} name={match.homeTeam.name} />
        <View style={styles.featuredCenter}>
          {showCompetition ? <Text numberOfLines={2} style={[styles.leagueName, { color: theme.foregroundStrong }]}>{league.name}</Text> : null}
          {showCompetition && league.country ? <Text numberOfLines={1} style={[styles.leagueMeta, { color: theme.muted }]}>{league.country}</Text> : null}
          {showScore ? (
            <>
              <Text style={[styles.featuredScore, { color: theme.foregroundStrong }]}>{score.home ?? '–'} : {score.away ?? '–'}</Text>
              <View style={styles.statusLine}>
                {!finished ? <View style={[styles.liveDot, { backgroundColor: theme.live }]} /> : null}
                <Text style={[styles.statusText, { color: finished ? theme.mutedLight : theme.live }]}>
                  {finished ? 'Final' : typeof elapsedMinute === 'number' ? `${elapsedMinute}'` : normalizedMatchStatus(match)}
                </Text>
              </View>
            </>
          ) : (
            <View style={[styles.kickoffPill, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.kickoffDate, { color: theme.muted }]}>{formatMatchDate(match.kickoffTime, true)}</Text>
              <Text style={[styles.kickoffTime, { color: theme.foregroundStrong }]}>{formatMatchTime(match.kickoffTime)}</Text>
            </View>
          )}
        </View>
        <FeaturedTeam alignRight logoUrl={match.awayTeam.logoUrl} name={match.awayTeam.name} />
      </View>

      {!showScore && hasTripleOdds ? (
        <View style={styles.oddsRow}>
          <DashboardOddsButton label="1" onPress={openMatch} value={formatOdd(odds?.home) ?? '--'} />
          <DashboardOddsButton label="x" onPress={openMatch} value={formatOdd(odds?.draw) ?? '--'} />
          <DashboardOddsButton label="2" onPress={openMatch} value={formatOdd(odds?.away) ?? '--'} />
        </View>
      ) : !showScore && bestOdd ? (
        <View style={styles.oddsRow}>
          <DashboardOddsButton label={match.bestMarket?.label ?? 'Best market'} onPress={openMatch} value={bestOdd} />
        </View>
      ) : null}

      {showSignal ? <SignalRow match={match} /> : null}
      <View style={[styles.detailsBar, { backgroundColor: theme.primary }]}>
        <Text style={[styles.detailsText, { color: theme.primaryDark }]}>Match details</Text>
        <ArrowRight color={theme.primaryDark} size={15} strokeWidth={2.3} />
      </View>
    </PressableScale>
  );
}

export function FeedMatchCard(props: FeedMatchCardProps) {
  return props.variant === 'compact' ? <CompactMatchCard {...props} /> : <FeaturedMatchCard {...props} />;
}

const styles = StyleSheet.create({
  caption: { flex: 1, fontFamily: fonts.semibold, fontSize: 13 },
  compactCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    elevation: 1,
    gap: spacing.md,
    padding: spacing.md,
    shadowOffset: { height: 5, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  compactCenter: { alignItems: 'center', justifyContent: 'center', minWidth: 72 },
  compactDate: { fontFamily: fonts.medium, fontSize: 11, marginTop: 2 },
  compactMatchup: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between' },
  compactScore: { fontFamily: fonts.extraBold, fontSize: 20, fontVariant: ['tabular-nums'], letterSpacing: -0.4 },
  compactTeam: { alignItems: 'center', flex: 1, gap: 7, minWidth: 0 },
  compactTeamName: { fontFamily: fonts.bold, fontSize: 12, lineHeight: 15, textAlign: 'center' },
  compactTime: { fontFamily: fonts.extraBold, fontSize: 17, fontVariant: ['tabular-nums'] },
  competitionCopy: { flex: 1, minWidth: 0 },
  competitionCountry: { fontFamily: fonts.medium, fontSize: 10, marginTop: 1 },
  competitionName: { fontFamily: fonts.bold, fontSize: 12 },
  competitionRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  confidencePill: { borderRadius: radius.pill, borderWidth: 1, minWidth: 48, paddingHorizontal: 9, paddingVertical: 6 },
  confidenceText: { fontFamily: fonts.extraBold, fontSize: 11, fontVariant: ['tabular-nums'], textAlign: 'center' },
  detailsBar: { alignItems: 'center', borderRadius: radius.md, flexDirection: 'row', gap: spacing.sm, height: 42, justifyContent: 'center' },
  detailsText: { fontFamily: fonts.bold, fontSize: 13 },
  featuredCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    elevation: 2,
    gap: spacing.md,
    padding: spacing.lg,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
  },
  featuredCenter: { alignItems: 'center', flex: 1, gap: 5, justifyContent: 'center', minWidth: 92 },
  featuredHeader: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  featuredScore: { fontFamily: fonts.extraBold, fontSize: 27, fontVariant: ['tabular-nums'], letterSpacing: -0.6 },
  featuredTeam: { alignItems: 'flex-start', flex: 1, gap: spacing.sm, minWidth: 0 },
  featuredTeamName: { fontFamily: fonts.bold, fontSize: 13, lineHeight: 17 },
  featuredTeamNameRight: { textAlign: 'right' },
  featuredTeamRight: { alignItems: 'flex-end' },
  featuredTeamsRow: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.sm },
  headerActions: { flexDirection: 'row', gap: spacing.sm },
  iconChip: { alignItems: 'center', borderRadius: radius.md, borderWidth: 1, height: 36, justifyContent: 'center', width: 36 },
  kickoffDate: { fontFamily: fonts.medium, fontSize: 11 },
  kickoffPill: { alignItems: 'center', borderRadius: radius.lg, borderWidth: 1, gap: 2, minWidth: 92, paddingHorizontal: spacing.md, paddingVertical: 7 },
  kickoffTime: { fontFamily: fonts.extraBold, fontSize: 17, fontVariant: ['tabular-nums'] },
  leagueMeta: { fontFamily: fonts.medium, fontSize: 11 },
  leagueName: { fontFamily: fonts.bold, fontSize: 14, textAlign: 'center' },
  liveDot: { borderRadius: radius.pill, height: 7, width: 7 },
  oddsRow: { flexDirection: 'row', gap: spacing.sm },
  readinessText: { fontFamily: fonts.medium, fontSize: 10, marginTop: 2 },
  signalCopy: { flex: 1, minWidth: 0 },
  signalIcon: { alignItems: 'center', borderRadius: radius.pill, height: 28, justifyContent: 'center', width: 28 },
  signalRow: { alignItems: 'center', borderTopWidth: 1, flexDirection: 'row', gap: spacing.sm, paddingTop: spacing.sm },
  signalText: { fontFamily: fonts.bold, fontSize: 11 },
  statusLine: { alignItems: 'center', flexDirection: 'row', gap: 5, marginTop: 3 },
  statusText: { fontFamily: fonts.bold, fontSize: 11 },
});
