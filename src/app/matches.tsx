import { useRouter } from 'expo-router';
import { ArrowLeft, Search } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { enterUp, GlassCard, IconButton, PressableScale, ProgressBar, Screen, StatusBadge, TeamLogo } from '@/components/ui';
import { dateChips, type MatchCardData } from '@/data/mock';
import { useHomeFeed, useLeagues } from '@/lib/api/hooks';
import { flattenHomeFeed } from '@/lib/mobile-mappers';
import { useAppTheme } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

type LeagueRailOption = {
  id: string;
  label: string;
};

function LeagueRail({
  onSelect,
  options,
  selected,
}: {
  onSelect: (leagueId: string) => void;
  options: LeagueRailOption[];
  selected: string;
}) {
  const theme = useAppTheme();

  return (
    <ScrollView contentContainerStyle={styles.railContent} horizontal showsHorizontalScrollIndicator={false} style={styles.rail}>
      {options.map((league) => {
        const active = league.id === selected;
        return (
          <PressableScale
            accessibilityLabel={league.label}
            accessibilityRole="button"
            key={league.id}
            onPress={() => onSelect(league.id)}
            style={[
              styles.leaguePill,
              { backgroundColor: theme.card, borderColor: active ? theme.selectionBorder : theme.border },
            ]}>
            {active ? <View style={[styles.pillIndicator, { backgroundColor: theme.primarySoft }]} /> : null}
            <Text style={[styles.leagueText, { color: active ? theme.foregroundStrong : theme.mutedLight }]}>{league.label}</Text>
          </PressableScale>
        );
      })}
    </ScrollView>
  );
}

function DateRail({
  onSelect,
  selected,
}: {
  onSelect: (dateId: string) => void;
  selected: string;
}) {
  const theme = useAppTheme();

  return (
    <ScrollView contentContainerStyle={styles.railContent} horizontal showsHorizontalScrollIndicator={false} style={styles.rail}>
      {dateChips.map((chip) => {
        const active = chip.id === selected;
        return (
          <PressableScale
            accessibilityLabel={`${chip.day} ${chip.date}`}
            accessibilityRole="button"
            key={chip.id}
            onPress={() => onSelect(chip.id)}
            style={[
              styles.datePill,
              { backgroundColor: active ? theme.primarySubtle : theme.field, borderColor: active ? theme.selectionBorder : theme.border },
            ]}>
            <Text style={[styles.dateDay, { color: active ? theme.primarySoft : theme.foregroundStrong }]}>{chip.day}</Text>
            <Text style={[styles.dateMeta, { color: theme.muted }]}>{chip.date}</Text>
          </PressableScale>
        );
      })}
    </ScrollView>
  );
}

function MatchRow({ match }: { match: MatchCardData }) {
  const router = useRouter();
  const theme = useAppTheme();

  return (
    <PressableScale accessibilityLabel={`${match.home} versus ${match.away}`} accessibilityRole="button" onPress={() => router.push(`/match/${match.id}` as any)} scaleTo={0.98}>
      <GlassCard style={styles.matchRow}>
        <View style={styles.matchTop}>
          <View style={styles.teamSide}>
            <Text numberOfLines={1} style={[styles.teamName, { color: theme.foregroundStrong }]}>{match.home}</Text>
            <TeamLogo name={match.home} size={34} />
          </View>
          <View style={styles.timeBlock}>
            <Text style={[styles.matchTime, { color: match.status === 'Live' ? theme.live : theme.accent }]}>{match.clock ?? match.time}</Text>
            <Text style={[styles.matchDate, { color: theme.muted }]}>{match.date}</Text>
          </View>
          <View style={[styles.teamSide, styles.awaySide]}>
            <TeamLogo name={match.away} size={34} />
            <Text numberOfLines={1} style={[styles.teamName, { color: theme.foregroundStrong }]}>{match.away}</Text>
          </View>
        </View>

        <View style={styles.rowMeta}>
          <StatusBadge label={match.readiness} tone={match.readiness === 'Verified' ? 'success' : match.readiness === 'Partial' ? 'warning' : 'neutral'} />
          <Text numberOfLines={1} style={[styles.trend, { color: theme.mutedLight }]}>{match.trend}</Text>
          <Text style={[styles.confidence, { color: theme.primarySoft }]}>{match.confidence}%</Text>
        </View>
        <ProgressBar value={match.confidence} />
      </GlassCard>
    </PressableScale>
  );
}

export default function MatchesScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const [selectedLeague, setSelectedLeague] = useState('all');
  const [selectedDate, setSelectedDate] = useState('today');
  const leagueDateRange = selectedDate === 'today' ? 'today' : selectedDate === 'tomorrow' ? 'tomorrow' : 'week';
  const leagueList = useLeagues({
    dateRange: leagueDateRange,
    windowDays: selectedDate === 'today' ? 1 : 3,
  });
  const leagueOptions = useMemo<LeagueRailOption[]>(
    () => [
      { id: 'all', label: 'All' },
      ...(leagueList.data ?? []).map((league) => ({
        id: league.key,
        label: league.name,
      })),
    ],
    [leagueList.data],
  );
  const activeLeague = leagueOptions.some((league) => league.id === selectedLeague) ? selectedLeague : 'all';
  const homeFeed = useHomeFeed({
    leagueKey: activeLeague !== 'all' ? activeLeague : undefined,
    limit: 48,
    windowDays: selectedDate === 'today' ? 1 : 3,
  });
  const visibleMatches = useMemo(() => flattenHomeFeed(homeFeed.data), [homeFeed.data]);
  const sectionTitle = leagueOptions.find((league) => league.id === activeLeague)?.label ?? 'All leagues';

  return (
    <Screen>
      <Animated.View entering={enterUp(0)} style={styles.header}>
        <IconButton icon={ArrowLeft} label="Go back" onPress={() => router.back()} />
        <Text style={[styles.title, { color: theme.foregroundStrong }]}>Matches</Text>
        <IconButton icon={Search} label="Search matches" />
      </Animated.View>

      <Animated.View entering={enterUp(1)}>
        <LeagueRail onSelect={setSelectedLeague} options={leagueOptions} selected={activeLeague} />
      </Animated.View>
      <Animated.View entering={enterUp(2)}>
        <DateRail onSelect={setSelectedDate} selected={selectedDate} />
      </Animated.View>

      <Animated.View entering={enterUp(3)} style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.foregroundStrong }]}>{sectionTitle}</Text>
        <StatusBadge label={`${visibleMatches.length} fixtures`} tone="accent" />
      </Animated.View>

      {visibleMatches.length === 0 ? (
        <Animated.View entering={enterUp(4)}>
          <GlassCard style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: theme.foregroundStrong }]}>
              {homeFeed.isLoading ? 'Loading fixtures' : 'No fixtures found'}
            </Text>
            <Text style={[styles.emptyCopy, { color: theme.muted }]}>
              {homeFeed.isLoading ? 'Fetching the latest matchday slate.' : 'Try another league or date.'}
            </Text>
          </GlassCard>
        </Animated.View>
      ) : null}

      {visibleMatches.map((match, index) => (
        <Animated.View entering={enterUp(4 + index)} key={match.id}>
          <MatchRow match={match} />
        </Animated.View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  awaySide: {
    justifyContent: 'flex-end',
  },
  confidence: {
    fontFamily: fonts.extraBold,
    fontSize: 13,
  },
  dateDay: {
    fontFamily: fonts.extraBold,
    fontSize: 13,
  },
  dateMeta: {
    fontFamily: fonts.medium,
    fontSize: 10,
    marginTop: 2,
  },
  datePill: {
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    justifyContent: 'center',
    minWidth: 68,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  emptyCopy: {
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  emptyState: {
    gap: 4,
    padding: spacing.md,
  },
  emptyTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 15,
  },
  leaguePill: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    height: 36,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  leagueText: {
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  matchDate: {
    fontFamily: fonts.medium,
    fontSize: 10,
    marginTop: 2,
  },
  matchRow: {
    gap: spacing.sm,
    padding: spacing.md,
  },
  matchTime: {
    fontFamily: fonts.extraBold,
    fontSize: 14,
  },
  matchTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  rail: {
    marginRight: -spacing.md,
  },
  railContent: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  rowMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 18,
  },
  teamName: {
    flexShrink: 1,
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  teamSide: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minWidth: 0,
  },
  timeBlock: {
    alignItems: 'center',
    width: 58,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 24,
  },
  trend: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  pillIndicator: {
    borderRadius: radius.pill,
    height: 7,
    width: 7,
  },
});
