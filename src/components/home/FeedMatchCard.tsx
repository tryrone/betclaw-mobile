import { useRouter } from 'expo-router';
import { BarChart3, Star } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { DashboardOddsButton, PressableScale, TeamLogo } from '@/components/ui';
import type { FeedMatch } from '@/lib/api/types';
import { useAppTheme } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

function normalizedStatus(match: FeedMatch) {
  return String(match.status ?? '').toUpperCase();
}

function isFinished(match: FeedMatch) {
  return ['FT', 'AET', 'PEN', 'FINISHED'].includes(normalizedStatus(match));
}

function isLive(match: FeedMatch) {
  const status = normalizedStatus(match);
  return !isFinished(match) && (['LIVE', '1H', '2H', 'HT', 'ET', 'BT', 'P', 'SUSP', 'INT'].includes(status) || Boolean(match.elapsedMinute));
}

function parseScore(score?: string | null) {
  const parsed = /(\d+)\D+(\d+)/.exec(score ?? '');
  if (!parsed) return { away: null, home: null } as const;
  return { away: Number(parsed[2]), home: Number(parsed[1]) } as const;
}

function phaseLabel(match: FeedMatch) {
  const status = normalizedStatus(match);
  if (status === '1H') return '1st half';
  if (status === '2H') return '2nd half';
  if (status === 'HT') return 'Half time';
  if (status === 'ET') return 'Extra time';
  if (status === 'P' || status === 'PEN') return 'Penalties';
  if (isFinished(match)) return 'Full time';
  return 'In play';
}

function formatKickoffDate(value: string | Date) {
  return new Date(value).toLocaleDateString('en-US', { day: 'numeric', month: 'long' });
}

function formatKickoffTime(value: string | Date) {
  return new Date(value).toLocaleTimeString('en-US', { hour: '2-digit', hour12: false, minute: '2-digit' });
}

function formatOdd(value?: number | null) {
  return typeof value === 'number' && Number.isFinite(value) ? value.toFixed(2) : null;
}

function IconChip({ icon: Icon, label, onPress }: { icon: typeof Star; label: string; onPress?: () => void }) {
  const theme = useAppTheme();
  return (
    <PressableScale
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={[cardStyles.iconChip, { borderColor: theme.border }]}>
      <Icon color={theme.mutedLight} size={16} strokeWidth={1.9} />
    </PressableScale>
  );
}

function TeamColumn({ alignRight, logoUrl, name }: { alignRight?: boolean; logoUrl?: string | null; name: string }) {
  const theme = useAppTheme();
  return (
    <View style={[cardStyles.teamColumn, alignRight ? cardStyles.teamColumnRight : null]}>
      <TeamLogo logoUrl={logoUrl} name={name} size={56} />
      <Text
        numberOfLines={2}
        style={[cardStyles.teamName, alignRight ? cardStyles.teamNameRight : null, { color: theme.foregroundStrong }]}>
        {name}
      </Text>
    </View>
  );
}

/**
 * Reference-style feed card: black shell, logo columns, centered league copy.
 * Live/finished matches show big scores flanking a time pill; upcoming matches
 * show a date/time pill plus a 1-X-2 odds row (best-market fallback).
 */
export function FeedMatchCard({
  caption,
  league,
  match,
}: {
  caption?: string | null;
  league: { country?: string | null; name: string };
  match: FeedMatch;
}) {
  const router = useRouter();
  const theme = useAppTheme();
  const live = isLive(match);
  const finished = isFinished(match);
  const showScore = live || finished;
  const score = parseScore(match.score);
  const odds = match.matchOdds;
  const bestOdd = formatOdd(match.bestMarket?.odds);
  const hasTripleOdds = Boolean(formatOdd(odds?.home) ?? formatOdd(odds?.draw) ?? formatOdd(odds?.away));

  const openMatch = () => router.push(`/match/${match.fixtureId}` as any);

  return (
    <PressableScale
      accessibilityLabel={`${match.homeTeam.name} vs ${match.awayTeam.name}`}
      accessibilityRole="button"
      onPress={openMatch}
      scaleTo={0.99}
      style={[cardStyles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={cardStyles.header}>
        <Text numberOfLines={1} style={[cardStyles.caption, { color: theme.muted }]}>
          {caption ?? formatKickoffDate(match.kickoffTime)}
        </Text>
        <View style={cardStyles.headerActions}>
          <IconChip icon={BarChart3} label="Open match stats" onPress={openMatch} />
          <IconChip icon={Star} label="Favorite match" />
        </View>
      </View>

      <View style={cardStyles.teamsRow}>
        <TeamColumn logoUrl={match.homeTeam.logoUrl} name={match.homeTeam.name} />
        <View style={cardStyles.centerColumn}>
          <Text numberOfLines={2} style={[cardStyles.leagueName, { color: theme.foregroundStrong }]}>{league.name}</Text>
          {league.country ? (
            <Text numberOfLines={1} style={[cardStyles.leagueMeta, { color: theme.muted }]}>{league.country}</Text>
          ) : null}
        </View>
        <TeamColumn alignRight logoUrl={match.awayTeam.logoUrl} name={match.awayTeam.name} />
      </View>

      {showScore ? (
        <View style={cardStyles.scoreRow}>
          <Text style={[cardStyles.scoreDigit, { color: theme.foregroundStrong }]}>{score.home ?? '-'}</Text>
          <View style={cardStyles.centerColumn}>
            <View style={cardStyles.liveRow}>
              <View style={[cardStyles.liveDot, { backgroundColor: finished ? theme.muted : theme.live }]} />
              <Text style={[cardStyles.liveText, { color: finished ? theme.mutedLight : theme.live }]}>
                {finished ? 'Final' : 'Live'}
              </Text>
            </View>
            <View style={[cardStyles.centerPill, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[cardStyles.pillPrimary, { color: theme.foregroundStrong }]}>
                {match.elapsedMinute ? `${match.elapsedMinute}'` : normalizedStatus(match)}
              </Text>
              <Text style={[cardStyles.pillSecondary, { color: theme.muted }]}>{phaseLabel(match)}</Text>
            </View>
          </View>
          <Text style={[cardStyles.scoreDigit, cardStyles.scoreDigitRight, { color: theme.foregroundStrong }]}>
            {score.away ?? '-'}
          </Text>
        </View>
      ) : (
        <>
          <View style={cardStyles.kickoffRow}>
            <View style={[cardStyles.centerPill, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[cardStyles.pillSecondary, { color: theme.mutedLight }]}>{formatKickoffDate(match.kickoffTime)}</Text>
              <Text style={[cardStyles.pillPrimary, { color: theme.foregroundStrong }]}>{formatKickoffTime(match.kickoffTime)}</Text>
            </View>
          </View>
          {hasTripleOdds ? (
            <View style={cardStyles.oddsRow}>
              <DashboardOddsButton label="1" onPress={openMatch} value={formatOdd(odds?.home) ?? '--'} />
              <DashboardOddsButton label="x" onPress={openMatch} value={formatOdd(odds?.draw) ?? '--'} />
              <DashboardOddsButton label="2" onPress={openMatch} value={formatOdd(odds?.away) ?? '--'} />
            </View>
          ) : bestOdd ? (
            <View style={cardStyles.oddsRow}>
              <DashboardOddsButton
                label={match.bestMarket?.label ?? 'Best market'}
                onPress={openMatch}
                value={bestOdd}
              />
            </View>
          ) : null}
        </>
      )}
    </PressableScale>
  );
}

const cardStyles = StyleSheet.create({
  caption: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.lg,
    padding: spacing.lg,
  },
  centerColumn: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  centerPill: {
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 2,
    minWidth: 108,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconChip: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  kickoffRow: {
    alignItems: 'center',
  },
  leagueMeta: {
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  leagueName: {
    fontFamily: fonts.bold,
    fontSize: 15,
    textAlign: 'center',
  },
  liveDot: {
    borderRadius: radius.pill,
    height: 8,
    width: 8,
  },
  liveRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  liveText: {
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  oddsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pillPrimary: {
    fontFamily: fonts.extraBold,
    fontSize: 17,
    fontVariant: ['tabular-nums'],
  },
  pillSecondary: {
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  scoreDigit: {
    fontFamily: fonts.extraBold,
    fontSize: 48,
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
    lineHeight: 54,
    minWidth: 44,
  },
  scoreDigitRight: {
    textAlign: 'right',
  },
  scoreRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  teamColumn: {
    alignItems: 'flex-start',
    flex: 1,
    gap: spacing.sm,
    minWidth: 0,
  },
  teamColumnRight: {
    alignItems: 'flex-end',
  },
  teamName: {
    fontFamily: fonts.bold,
    fontSize: 14,
    lineHeight: 18,
  },
  teamNameRight: {
    textAlign: 'right',
  },
  teamsRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
