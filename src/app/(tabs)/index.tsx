import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ArrowRightLeft, Bell, Bot, CalendarDays, ChevronRight, Gift, History, Search } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { enterUp, GlassCard, PressableScale, ProgressBar, Screen, SPRING_LAYOUT, StatusBadge, TeamLogo } from '@/components/ui';
import { getSportLabel, sports, type MatchCardData } from '@/data/mock';
import { useHomeFeed, useLeagues, useMe, useNotificationSummary, useSubscriptionCurrent } from '@/lib/api/hooks';
import { flattenHomeFeed } from '@/lib/mobile-mappers';
import { useAppTheme } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

const userAvatar = require('@/../assets/images/user_avatar.png');

type LeaguePillOption = {
  id: string;
  label: string;
};

function HomeHeader({ name, unreadCount = 0 }: { name?: string | null; unreadCount?: number }) {
  const router = useRouter();
  const theme = useAppTheme();

  return (
    <View style={styles.headerRow}>
      <View style={styles.headerLeft}>
        <Image source={userAvatar} style={styles.profileAvatar} contentFit="cover" />
        <View>
          <Text style={[styles.kicker, { color: theme.muted }]}>{name ? `Hi, ${name.split(' ')[0]}` : 'BetClaw'}</Text>
          <Text style={[styles.headerTitle, { color: theme.foregroundStrong }]}>Matchday</Text>
        </View>
      </View>
      <View style={styles.headerActions}>
        <PressableScale accessibilityLabel="Search" accessibilityRole="button" style={[styles.circleButton, { backgroundColor: theme.field, borderColor: theme.border }]}>
          <Search color={theme.foreground} size={18} strokeWidth={2.4} />
        </PressableScale>
        <PressableScale accessibilityLabel="Notifications" accessibilityRole="button" onPress={() => router.push('/notifications' as any)} style={[styles.circleButton, { backgroundColor: theme.field, borderColor: theme.border }]}>
          <Bell color={theme.foreground} size={18} strokeWidth={2.4} />
          {unreadCount > 0 ? <View style={[styles.unreadDot, { backgroundColor: theme.danger }]} /> : null}
        </PressableScale>
      </View>
    </View>
  );
}

function SportPills({
  onSelect,
  selected,
}: {
  onSelect: (sportId: string) => void;
  selected: string;
}) {
  const theme = useAppTheme();

  return (
    <ScrollView contentContainerStyle={styles.pillRow} horizontal showsHorizontalScrollIndicator={false} style={styles.horizontal}>
      {sports.map((sport) => {
        const active = sport.id === selected;
        return (
          <Animated.View key={sport.id} layout={SPRING_LAYOUT}>
            <PressableScale
              accessibilityLabel={sport.label}
              accessibilityRole="button"
              onPress={() => onSelect(sport.id)}
              style={[
                active ? styles.sportPillActive : styles.sportPillCircle,
                {
                  backgroundColor: theme.field,
                  borderColor: active ? theme.selectionBorder : theme.border,
                },
              ]}>
              {active ? <View style={[styles.pillIndicator, { backgroundColor: theme.primarySoft }]} /> : null}
              <Text style={[styles.sportShort, { color: active ? theme.foregroundStrong : theme.muted }]}>{sport.short}</Text>
              {active ? (
                <Animated.Text entering={FadeIn.duration(180)} style={[styles.sportLabel, { color: theme.foregroundStrong }]}>
                  {sport.label}
                </Animated.Text>
              ) : null}
            </PressableScale>
          </Animated.View>
        );
      })}
    </ScrollView>
  );
}

function LeaguePills({
  onSelect,
  options,
  selected,
}: {
  onSelect: (leagueId: string) => void;
  options: LeaguePillOption[];
  selected: string;
}) {
  const theme = useAppTheme();

  return (
    <ScrollView contentContainerStyle={styles.pillRow} horizontal showsHorizontalScrollIndicator={false} style={styles.horizontal}>
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
              {
                backgroundColor: theme.card,
                borderColor: active ? theme.selectionBorder : theme.border,
              },
            ]}>
            {active ? <View style={[styles.pillIndicator, { backgroundColor: theme.primarySoft }]} /> : null}
            <Text style={[styles.leaguePillText, { color: active ? theme.foregroundStrong : theme.mutedLight }]}>{league.label}</Text>
          </PressableScale>
        );
      })}
    </ScrollView>
  );
}

function LiveMatchHero({ match }: { match: MatchCardData }) {
  const router = useRouter();
  const theme = useAppTheme();

  return (
    <PressableScale
      accessibilityLabel="Open live match details"
      accessibilityRole="button"
      onPress={() => router.push(`/match/${match.id}` as any)}
      scaleTo={0.98}
      style={styles.heroPressable}>
      <GlassCard gradient="matchHero" style={styles.heroCard}>
        <View style={styles.heroTop}>
          <Text style={styles.heroEyebrow}>{match.league}</Text>
          <StatusBadge label={match.clock ?? match.status} tone={match.status === 'Live' ? 'danger' : 'accent'} />
        </View>

        <View style={styles.heroTeamsContainer}>
          <View style={styles.heroTeamSide}>
            <TeamLogo name={match.home} size={48} />
            <Text numberOfLines={1} style={styles.heroTeamName}>
              {match.home}
            </Text>
            <Text style={styles.heroSideLabel}>Home</Text>
          </View>

          <View style={styles.heroCenterBlock}>
            <Text style={styles.heroVenue}>{match.venue}</Text>
            <View style={styles.scoreAndClock}>
              <Text style={styles.scoreValue}>{match.homeScore ?? '-'}</Text>
              <Text style={styles.scoreDivider}>:</Text>
              <Text style={styles.scoreValue}>{match.awayScore ?? '-'}</Text>
            </View>
            <Text style={styles.heroStage}>{match.period ?? match.time}</Text>
          </View>

          <View style={styles.heroTeamSide}>
            <TeamLogo name={match.away} size={48} />
            <Text numberOfLines={1} style={styles.heroTeamName}>
              {match.away}
            </Text>
            <Text style={styles.heroSideLabel}>Away</Text>
          </View>
        </View>

        <View style={styles.heroSignal}>
          <Text style={styles.heroSignalText}>{match.trend}</Text>
          <Text style={[styles.heroConfidence, { color: theme.primarySoft }]}>{match.confidence}%</Text>
        </View>
      </GlassCard>
    </PressableScale>
  );
}

function MatchFeedCard({ match }: { match: MatchCardData }) {
  const router = useRouter();
  const theme = useAppTheme();

  return (
    <PressableScale
      accessibilityLabel={`${match.home} versus ${match.away}`}
      accessibilityRole="button"
      onPress={() => router.push(`/match/${match.id}` as any)}
      scaleTo={0.98}>
      <GlassCard style={styles.matchFeedCard}>
        <View style={styles.matchTeamsRow}>
          <View style={styles.matchTeamNameWrap}>
            <Text numberOfLines={1} style={[styles.matchTeamLabel, { color: theme.foregroundStrong }]}>
              {match.home}
            </Text>
            <Text numberOfLines={1} style={[styles.matchMeta, { color: theme.muted }]}>
              {match.venue}
            </Text>
          </View>

          <View style={styles.matchCenter}>
            <Text style={[styles.matchTimeText, { color: theme.accent }]}>{match.time}</Text>
            <Text style={[styles.matchDateText, { color: theme.muted }]}>{match.date}</Text>
          </View>

          <View style={[styles.matchTeamNameWrap, styles.matchAwayWrap]}>
            <Text numberOfLines={1} style={[styles.matchTeamLabel, { color: theme.foregroundStrong }]}>
              {match.away}
            </Text>
            <StatusBadge label={match.readiness} tone={match.readiness === 'Verified' ? 'success' : match.readiness === 'Partial' ? 'warning' : 'neutral'} />
          </View>
        </View>

        <Text numberOfLines={2} style={[styles.signalText, { color: theme.mutedLight }]}>
          {match.signal}
        </Text>
        <View style={styles.confidenceRow}>
          <Text style={[styles.confidenceLabel, { color: theme.muted }]}>Confidence</Text>
          <Text style={[styles.confidenceValue, { color: theme.primarySoft }]}>{match.confidence}%</Text>
        </View>
        <ProgressBar value={match.confidence} />
      </GlassCard>
    </PressableScale>
  );
}

const shortcuts = [
  { href: '/build-ticket', icon: Bot, label: 'Build', meta: 'AI slip' },
  { href: '/convert-ticket', icon: ArrowRightLeft, label: 'Convert', meta: 'Codes' },
  { href: '/history', icon: History, label: 'History', meta: 'Saved' },
  { href: '/referrals', icon: Gift, label: 'Referrals', meta: 'Earn' },
] as const;

function ShortcutGrid() {
  const router = useRouter();
  const theme = useAppTheme();

  return (
    <View style={styles.shortcutGrid}>
      {shortcuts.map((item) => (
        <PressableScale
          accessibilityLabel={item.label}
          accessibilityRole="button"
          key={item.href}
          onPress={() => router.push(item.href as any)}
          style={[styles.shortcutCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.shortcutIcon, { backgroundColor: theme.primarySubtle, borderColor: theme.selectionBorder }]}>
            <item.icon color={theme.primarySoft} size={17} />
          </View>
          <View style={styles.shortcutCopy}>
            <Text numberOfLines={1} style={[styles.shortcutLabel, { color: theme.foregroundStrong }]}>{item.label}</Text>
            <Text numberOfLines={1} style={[styles.shortcutMeta, { color: theme.muted }]}>{item.meta}</Text>
          </View>
          <ChevronRight color={theme.mutedLight} size={15} />
        </PressableScale>
      ))}
    </View>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const [selectedSport, setSelectedSport] = useState('football');
  const [selectedLeague, setSelectedLeague] = useState('all');
  const me = useMe();
  const subscription = useSubscriptionCurrent();
  const notificationSummary = useNotificationSummary();
  const leagueList = useLeagues({ dateRange: 'today', windowDays: 1 });
  const leagueOptions = useMemo<LeaguePillOption[]>(
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
    limit: 24,
    windowDays: 1,
  });
  const matches = useMemo(() => flattenHomeFeed(homeFeed.data), [homeFeed.data]);
  const liveMatch = matches.find((match) => match.status === 'Live') ?? matches[0];
  const feedMatches = matches.filter((match) => match.id !== liveMatch?.id).slice(0, 3);
  const sectionCaption = `${getSportLabel(selectedSport)} analysis-ready fixtures`;
  const tokenBalance = subscription.data?.researchTokensRemaining ?? me.data?.researchTokensRemaining ?? 0;

  const handleSportSelect = (sportId: string) => {
    setSelectedSport(sportId);
    if (sportId !== 'football') {
      setSelectedLeague('all');
    }
  };

  return (
    <Screen hasTabs>
      <Animated.View entering={enterUp(0)}>
        <HomeHeader name={me.data?.name} unreadCount={notificationSummary.data?.unreadCount ?? 0} />
      </Animated.View>

      <Animated.View entering={enterUp(1)}>
        <GlassCard style={styles.balanceStrip}>
          <View>
            <Text style={[styles.kicker, { color: theme.muted }]}>Research balance</Text>
            <Text style={[styles.balanceValue, { color: theme.foregroundStrong }]}>{Number(tokenBalance).toLocaleString()} tokens</Text>
          </View>
          <View style={[styles.calendarChip, { backgroundColor: theme.primarySubtle, borderColor: theme.selectionBorder }]}>
            <CalendarDays color={theme.primarySoft} size={15} />
            <Text style={[styles.calendarChipText, { color: theme.primarySoft }]}>Today</Text>
          </View>
        </GlassCard>
      </Animated.View>

      <Animated.View entering={enterUp(2)}>
        <ShortcutGrid />
      </Animated.View>

      <Animated.View entering={enterUp(3)}>
        <SportPills onSelect={handleSportSelect} selected={selectedSport} />
      </Animated.View>

      <Animated.View entering={enterUp(4)}>
        <LeaguePills onSelect={setSelectedLeague} options={leagueOptions} selected={activeLeague} />
      </Animated.View>

      <Animated.View entering={enterUp(5)}>
        {liveMatch ? (
          <LiveMatchHero match={liveMatch} />
        ) : (
          <GlassCard style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: theme.foregroundStrong }]}>
              {homeFeed.isLoading ? 'Loading fixtures' : 'No live fixture yet'}
            </Text>
            <Text style={[styles.emptyCopy, { color: theme.muted }]}>
              Matchday analysis will appear here when the feed has fixtures.
            </Text>
          </GlassCard>
        )}
      </Animated.View>

      <Animated.View entering={enterUp(6)} style={styles.sectionHeader}>
        <View>
          <Text style={[styles.sectionTitle, { color: theme.foregroundStrong }]}>Matches</Text>
          <Text style={[styles.sectionCaption, { color: theme.muted }]}>{sectionCaption}</Text>
        </View>
        <PressableScale accessibilityLabel="See all matches" accessibilityRole="button" onPress={() => router.push('/matches' as any)} style={styles.seeAll}>
          <Text style={[styles.sectionAction, { color: theme.accent }]}>See all</Text>
          <ChevronRight color={theme.accent} size={16} strokeWidth={2.6} />
        </PressableScale>
      </Animated.View>

      {feedMatches.length === 0 ? (
        <Animated.View entering={enterUp(7)}>
          <GlassCard style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: theme.foregroundStrong }]}>No fixtures found</Text>
            <Text style={[styles.emptyCopy, { color: theme.muted }]}>Switch sport or league for another slate.</Text>
          </GlassCard>
        </Animated.View>
      ) : null}

      {feedMatches.map((match, index) => (
        <Animated.View entering={enterUp(7 + index)} key={match.id}>
          <MatchFeedCard match={match} />
        </Animated.View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  balanceStrip: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  balanceValue: {
    fontFamily: fonts.extraBold,
    fontSize: 20,
    marginTop: 2,
  },
  calendarChip: {
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  calendarChipText: {
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  circleButton: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
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
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
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
  headerLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 28,
    lineHeight: 32,
  },
  heroCard: {
    gap: spacing.md,
    overflow: 'hidden',
  },
  heroCenterBlock: {
    alignItems: 'center',
    flex: 1,
  },
  heroConfidence: {
    fontFamily: fonts.extraBold,
    fontSize: 16,
  },
  heroEyebrow: {
    color: '#ffffff',
    fontFamily: fonts.extraBold,
    fontSize: 14,
  },
  heroPressable: {
    width: '100%',
  },
  heroSideLabel: {
    color: 'rgba(255,255,255,0.58)',
    fontFamily: fonts.medium,
    fontSize: 11,
    marginTop: 2,
  },
  heroSignal: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: radius.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
  },
  heroSignalText: {
    color: '#ffffff',
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  heroStage: {
    color: 'rgba(255,255,255,0.72)',
    fontFamily: fonts.medium,
    fontSize: 11,
    marginTop: 4,
    textTransform: 'capitalize',
  },
  heroTeamName: {
    color: '#ffffff',
    fontFamily: fonts.extraBold,
    fontSize: 13,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  heroTeamSide: {
    alignItems: 'center',
    width: 74,
  },
  heroTeamsContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroVenue: {
    color: 'rgba(255,255,255,0.78)',
    fontFamily: fonts.bold,
    fontSize: 12,
    textAlign: 'center',
  },
  horizontal: {
    marginRight: -spacing.md,
  },
  kicker: {
    fontFamily: fonts.bold,
    fontSize: 11,
    textTransform: 'uppercase',
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
  leaguePillText: {
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  matchAwayWrap: {
    alignItems: 'flex-end',
  },
  matchCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 68,
  },
  matchDateText: {
    fontFamily: fonts.medium,
    fontSize: 10,
    marginTop: 2,
  },
  matchFeedCard: {
    gap: spacing.sm,
    padding: spacing.md,
  },
  matchMeta: {
    fontFamily: fonts.medium,
    fontSize: 11,
    marginTop: 3,
  },
  matchTeamLabel: {
    fontFamily: fonts.extraBold,
    fontSize: 14,
  },
  matchTeamNameWrap: {
    flex: 1,
    minWidth: 0,
  },
  matchTeamsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  matchTimeText: {
    fontFamily: fonts.extraBold,
    fontSize: 13,
  },
  pillRow: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  profileAvatar: {
    borderRadius: radius.pill,
    height: 40,
    width: 40,
  },
  scoreAndClock: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: spacing.xs,
  },
  scoreDivider: {
    color: '#ffffff',
    fontFamily: fonts.extraBold,
    fontSize: 28,
  },
  scoreValue: {
    color: '#ffffff',
    fontFamily: fonts.extraBold,
    fontSize: 34,
  },
  shortcutCard: {
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    flexBasis: '47%',
    flexDirection: 'row',
    flexGrow: 1,
    gap: spacing.sm,
    minHeight: 62,
    padding: spacing.sm,
  },
  shortcutCopy: {
    flex: 1,
    minWidth: 0,
  },
  shortcutGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  shortcutIcon: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  shortcutLabel: {
    fontFamily: fonts.extraBold,
    fontSize: 13,
  },
  shortcutMeta: {
    fontFamily: fonts.medium,
    fontSize: 11,
    marginTop: 2,
  },
  sectionAction: {
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  sectionCaption: {
    fontFamily: fonts.medium,
    fontSize: 12,
    marginTop: 2,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 19,
  },
  seeAll: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
  },
  signalText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
  },
  sportLabel: {
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  sportPillActive: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    height: 36,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  sportPillCircle: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 40,
  },
  sportShort: {
    fontFamily: fonts.extraBold,
    fontSize: 12,
  },
  unreadDot: {
    borderRadius: radius.pill,
    height: 8,
    position: 'absolute',
    right: 9,
    top: 9,
    width: 8,
  },
  pillIndicator: {
    borderRadius: radius.pill,
    height: 7,
    width: 7,
  },
});
