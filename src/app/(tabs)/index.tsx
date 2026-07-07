import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Search,
  Trophy,
  Zap,
} from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { FeedMatchCard } from '@/components/home/FeedMatchCard';
import { LiveNowCarousel } from '@/components/home/LiveNowCarousel';
import {
  DashboardChip,
  DashboardGlassCard,
  DashboardStatePanel,
  PressableScale,
  Screen,
} from '@/components/ui';
import {
  useInfiniteHomeFeed,
  useLeagues,
  useMe,
  useNotificationSummary,
} from '@/lib/api/hooks';
import type { FeedMatch, HomeFeed, LeagueOption } from '@/lib/api/types';
import { useAppTheme } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

const userAvatar = require('@/../assets/images/user_avatar.png');
const ALL_LEAGUES_KEY = '__all_leagues__';

type DateOption = {
  main: string;
  sub: string;
  value: string;
};

type LeagueSection = LeagueOption & {
  matches: FeedMatch[];
};

function dateKeyFromDate(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateKey(offset: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offset);
  return dateKeyFromDate(date);
}

function dateFromKey(key: string) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function shiftDateKey(key: string, offset: number) {
  const date = dateFromKey(key);
  date.setUTCDate(date.getUTCDate() + offset);
  return dateKeyFromDate(date);
}

/** Seven-day window centered on the anchor so the selected day stays in the middle. */
function dateStripKeys(anchorKey: string) {
  return Array.from({ length: 7 }, (_, index) => shiftDateKey(anchorKey, index - 3));
}

function formatDateStripMain(date: Date, todayKey: string) {
  const value = dateKeyFromDate(date);
  if (value === todayKey) return 'Today';
  if (value === shiftDateKey(todayKey, -1)) return 'Yest';
  if (value === shiftDateKey(todayKey, 1)) return 'Tmrw';
  return date.toLocaleDateString('en-US', { day: 'numeric', timeZone: 'UTC' });
}

function formatDateStripSub(date: Date) {
  return date.toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'short' });
}

function formatMonthLabel(key: string) {
  return dateFromKey(key).toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC', year: 'numeric' });
}

function matchKickoffTime(match: FeedMatch) {
  const time = new Date(match.kickoffTime).getTime();
  return Number.isFinite(time) ? time : Number.MAX_SAFE_INTEGER;
}

function compareLeagues(left: LeagueOption, right: LeagueOption) {
  return (right.matchCount ?? 0) - (left.matchCount ?? 0) || left.name.localeCompare(right.name);
}

function buildLeagueSections(feedPages: HomeFeed[]) {
  const sections = new Map<string, LeagueSection>();
  const seenMatches = new Map<string, Set<string>>();

  for (const page of feedPages) {
    for (const league of page.leagues ?? []) {
      const key = league.key;
      const existing =
        sections.get(key) ?? ({
          country: league.country ?? null,
          key,
          logoUrl: league.logoUrl ?? null,
          matchCount: league.matchCount ?? 0,
          matches: [],
          name: league.name,
        } satisfies LeagueSection);
      const seen = seenMatches.get(key) ?? new Set<string>();

      existing.matchCount = Math.max(existing.matchCount ?? 0, league.matchCount ?? 0);
      existing.logoUrl ??= league.logoUrl ?? null;

      for (const match of league.matches ?? []) {
        if (seen.has(match.fixtureId)) continue;
        seen.add(match.fixtureId);
        existing.matches.push(match);
      }

      sections.set(key, existing);
      seenMatches.set(key, seen);
    }
  }

  return Array.from(sections.values()).filter((section) => section.matches.length > 0).sort(compareLeagues);
}

function GreetingHeader({
  image,
  name,
  unreadCount,
  onBell,
  onSearch,
}: {
  image?: string | null;
  name?: string | null;
  unreadCount: number;
  onBell: () => void;
  onSearch: () => void;
}) {
  const theme = useAppTheme();

  return (
    <View style={styles.greeting}>
      <View style={styles.greetingLeft}>
        <Image
          source={image ? { uri: image } : userAvatar}
          style={[styles.avatar, { borderColor: theme.border }]}
          contentFit="cover"
        />
        <View style={styles.greetingCopy}>
          <Text style={[styles.greetingEyebrow, { color: theme.muted }]}>Welcome Back</Text>
          <Text numberOfLines={1} style={[styles.greetingName, { color: theme.foregroundStrong }]}>
            {name?.split(' ').slice(0, 2).join(' ') ?? 'there'}
          </Text>
        </View>
      </View>
      <View style={styles.greetingActions}>
        <PressableScale
          accessibilityLabel="Search teams or leagues"
          accessibilityRole="button"
          onPress={onSearch}
          style={[styles.iconPill, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Search color={theme.foregroundStrong} size={17} />
        </PressableScale>
        <PressableScale
          accessibilityLabel="Notifications"
          accessibilityRole="button"
          onPress={onBell}
          style={[styles.iconPill, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Bell color={theme.foregroundStrong} size={17} />
          {unreadCount > 0 ? <View style={[styles.unreadDot, { backgroundColor: theme.live }]} /> : null}
        </PressableScale>
      </View>
    </View>
  );
}

function BuildSlipFab({ onPress }: { onPress: () => void }) {
  const theme = useAppTheme();

  return (
    <PressableScale
      accessibilityLabel="Build a slip with AI"
      accessibilityRole="button"
      onPress={onPress}
      scaleTo={0.96}
      style={[styles.buildFab, { backgroundColor: theme.primary, shadowColor: theme.shadow }]}>
      <Zap color={theme.primaryDark} size={17} />
      <Text style={[styles.buildFabText, { color: theme.primaryDark }]}>Build slip</Text>
    </PressableScale>
  );
}

function MonthDateStrip({
  dates,
  monthLabel,
  selectedDate,
  onSelect,
  onShift,
}: {
  dates: DateOption[];
  monthLabel: string;
  selectedDate: string;
  onSelect: (date: string) => void;
  onShift: (offset: number) => void;
}) {
  const theme = useAppTheme();
  const { width: screenWidth } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const chipLayouts = useRef<Record<string, { width: number; x: number }>>({});

  const centerOn = (value: string) => {
    const chip = chipLayouts.current[value];
    if (!chip) return;
    const target = Math.max(0, chip.x + chip.width / 2 - screenWidth / 2);
    scrollRef.current?.scrollTo({ animated: true, x: target });
  };

  return (
    <View style={styles.dateBlock}>
      <View style={styles.monthRow}>
        <Text style={[styles.monthLabel, { color: theme.foregroundStrong }]}>{monthLabel}</Text>
        <View style={styles.monthArrows}>
          <PressableScale
            accessibilityLabel="Previous day"
            accessibilityRole="button"
            onPress={() => onShift(-1)}
            style={[styles.arrowButton, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <ChevronLeft color={theme.foregroundStrong} size={16} />
          </PressableScale>
          <PressableScale
            accessibilityLabel="Next day"
            accessibilityRole="button"
            onPress={() => onShift(1)}
            style={[styles.arrowButton, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <ChevronRight color={theme.foregroundStrong} size={16} />
          </PressableScale>
        </View>
      </View>
      <ScrollView
        contentContainerStyle={styles.dateStripContent}
        horizontal
        ref={scrollRef}
        showsHorizontalScrollIndicator={false}
        style={styles.horizontalBleed}>
        {dates.map((date) => {
          const active = selectedDate === date.value;
          return (
            <PressableScale
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              key={date.value}
              onLayout={(event) => {
                chipLayouts.current[date.value] = {
                  width: event.nativeEvent.layout.width,
                  x: event.nativeEvent.layout.x,
                };
                if (active) centerOn(date.value);
              }}
              onPress={() => {
                onSelect(date.value);
                centerOn(date.value);
              }}
              style={[
                styles.dateChip,
                {
                  backgroundColor: active ? theme.primary : theme.surface,
                  borderColor: active ? theme.primary : theme.border,
                },
              ]}>
              <Text style={[styles.dateChipMain, { color: active ? theme.primaryDark : theme.foregroundStrong }]}>{date.main}</Text>
              <Text style={[styles.dateChipSub, { color: active ? theme.primaryDark : theme.muted }]}>{date.sub}</Text>
            </PressableScale>
          );
        })}
      </ScrollView>
    </View>
  );
}

function LiveMatchHeader({ onSeeAll }: { onSeeAll: () => void }) {
  const theme = useAppTheme();

  return (
    <View style={styles.sectionRow}>
      <Text style={[styles.sectionTitle, { color: theme.foregroundStrong }]}>Live Match</Text>
      <PressableScale accessibilityLabel="See all matches" accessibilityRole="button" onPress={onSeeAll}>
        <Text style={[styles.seeAll, { color: theme.mutedLight }]}>See All</Text>
      </PressableScale>
    </View>
  );
}

export default function DashboardScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const initialDate = dateKey(0);
  const [todayKey, setTodayKey] = useState(initialDate);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedLeagueKey, setSelectedLeagueKey] = useState(ALL_LEAGUES_KEY);

  useEffect(() => {
    const interval = setInterval(() => setTodayKey(dateKey(0)), 60_000);
    return () => clearInterval(interval);
  }, []);

  const dateOptions = useMemo(
    () =>
      dateStripKeys(selectedDate).map((value) => {
        const date = dateFromKey(value);
        return { main: formatDateStripMain(date, todayKey), sub: formatDateStripSub(date), value };
      }),
    [selectedDate, todayKey],
  );
  const monthLabel = useMemo(() => formatMonthLabel(selectedDate), [selectedDate]);
  const activeLeagueKey = selectedLeagueKey === ALL_LEAGUES_KEY ? undefined : selectedLeagueKey;

  const me = useMe();
  const notificationSummary = useNotificationSummary();
  const leagues = useLeagues({ date: selectedDate, windowDays: 1 });
  const feed = useInfiniteHomeFeed({
    date: selectedDate,
    leagueKey: activeLeagueKey,
    limit: 24,
    windowDays: 1,
  });

  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.allSettled([feed.refetch(), leagues.refetch(), notificationSummary.refetch()]);
    setRefreshing(false);
  };

  const leagueOptions = useMemo(() => (leagues.data ?? []).slice().sort(compareLeagues), [leagues.data]);
  const feedPages = useMemo(() => feed.data?.pages ?? [], [feed.data?.pages]);
  const leagueSections = useMemo(() => buildLeagueSections(feedPages), [feedPages]);
  const flatMatches = useMemo(
    () =>
      leagueSections
        .flatMap((league) => league.matches.map((match) => ({ league, match })))
        .sort((left, right) => matchKickoffTime(left.match) - matchKickoffTime(right.match)),
    [leagueSections],
  );
  const totalMatches = feedPages[0]?.totalMatches ?? flatMatches.length;

  const selectDate = (value: string) => {
    setSelectedDate(value);
    setSelectedLeagueKey(ALL_LEAGUES_KEY);
  };

  return (
    <Screen
      hasTabs
      floatingAction={<BuildSlipFab onPress={() => router.push('/(tabs)/build-ticket' as never)} />}
      onRefresh={handleRefresh}
      refreshing={refreshing}
      safeTop={false}>
      <GreetingHeader
        image={me.data?.image}
        name={me.data?.name}
        unreadCount={notificationSummary.data?.unreadCount ?? 0}
        onBell={() => router.push('/notifications' as never)}
        onSearch={() => router.push('/matches' as never)}
      />

      <MonthDateStrip
        dates={dateOptions}
        monthLabel={monthLabel}
        selectedDate={selectedDate}
        onSelect={selectDate}
        onShift={(offset) => selectDate(shiftDateKey(selectedDate, offset))}
      />

      <LiveMatchHeader onSeeAll={() => router.push('/matches' as never)} />
      <LiveNowCarousel showHeader={false} />

      <ScrollView contentContainerStyle={styles.leagueRail} horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalBleed}>
        <DashboardChip active={selectedLeagueKey === ALL_LEAGUES_KEY} count={totalMatches} icon={Trophy} label="All leagues" onPress={() => setSelectedLeagueKey(ALL_LEAGUES_KEY)} />
        {leagues.isLoading
          ? Array.from({ length: 4 }).map((_, index) => <View key={index} style={[styles.leagueSkeleton, { backgroundColor: theme.surface }]} />)
          : leagueOptions.map((league) => (
              <DashboardChip
                active={selectedLeagueKey === league.key}
                count={league.matchCount ?? 0}
                key={league.key}
                label={league.name}
                onPress={() => setSelectedLeagueKey(league.key)}
              />
            ))}
      </ScrollView>

      {feed.isLoading && feedPages.length === 0 ? (
        <View style={styles.loadingList}>
          {Array.from({ length: 3 }).map((_, index) => (
            <DashboardGlassCard key={index}>
              <View style={[styles.skeletonLine, { backgroundColor: theme.surface }]} />
              <View style={[styles.skeletonBlock, { backgroundColor: theme.surface }]} />
              <View style={[styles.skeletonLineShort, { backgroundColor: theme.surface }]} />
            </DashboardGlassCard>
          ))}
        </View>
      ) : flatMatches.length > 0 ? (
        <View style={styles.matchList}>
          {flatMatches.map(({ league, match }) => (
            <FeedMatchCard caption={league.name} key={`${league.key}-${match.fixtureId}`} league={league} match={match} />
          ))}
          <View style={styles.loadMoreWrap}>
            <View style={[styles.loadMorePill, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              {feed.isFetchingNextPage ? <LoaderCircle color={theme.primary} size={15} /> : null}
              <Text style={[styles.loadMoreText, { color: theme.mutedLight }]}>
                Showing {flatMatches.length} of {totalMatches} matches
              </Text>
              {feed.hasNextPage ? (
                <PressableScale accessibilityRole="button" disabled={feed.isFetchingNextPage} onPress={() => feed.fetchNextPage()} style={styles.loadMoreButton}>
                  <Text style={[styles.loadMoreButtonText, { color: theme.primary }]}>Load more</Text>
                </PressableScale>
              ) : (
                <Text style={[styles.loadMoreButtonText, { color: theme.muted }]}>All loaded</Text>
              )}
            </View>
          </View>
        </View>
      ) : (
        <DashboardStatePanel icon={Search} title="No fixtures found">
          Try another date or league for the next slate.
        </DashboardStatePanel>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  arrowButton: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  avatar: {
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 44,
    width: 44,
  },
  buildFab: {
    alignItems: 'center',
    borderRadius: radius.pill,
    elevation: 8,
    flexDirection: 'row',
    gap: spacing.sm,
    height: 52,
    paddingHorizontal: spacing.lg,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.34,
    shadowRadius: 16,
  },
  buildFabText: {
    fontFamily: fonts.extraBold,
    fontSize: 15,
  },
  dateBlock: {
    gap: spacing.md,
  },
  dateChip: {
    alignItems: 'center',
    borderRadius: radius.xl,
    borderWidth: 1,
    height: 68,
    justifyContent: 'center',
    minWidth: 62,
    paddingHorizontal: spacing.sm,
  },
  dateChipMain: {
    fontFamily: fonts.extraBold,
    fontSize: 18,
  },
  dateChipSub: {
    fontFamily: fonts.medium,
    fontSize: 12,
    marginTop: 4,
  },
  dateStripContent: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  greeting: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  greetingActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  greetingCopy: {
    flex: 1,
    minWidth: 0,
  },
  greetingEyebrow: {
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  greetingLeft: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minWidth: 0,
  },
  greetingName: {
    fontFamily: fonts.extraBold,
    fontSize: 20,
    marginTop: 2,
  },
  horizontalBleed: {
    marginRight: -spacing.md,
  },
  iconPill: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  leagueRail: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  leagueSkeleton: {
    borderRadius: radius.pill,
    height: 46,
    opacity: 0.5,
    width: 140,
  },
  loadMoreButton: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  loadMoreButtonText: {
    fontFamily: fonts.extraBold,
    fontSize: 12,
  },
  loadMorePill: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  loadMoreText: {
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  loadMoreWrap: {
    alignItems: 'center',
    paddingBottom: spacing.sm,
    paddingTop: spacing.sm,
  },
  loadingList: {
    gap: spacing.md,
  },
  matchList: {
    gap: spacing.md,
  },
  monthArrows: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  monthLabel: {
    fontFamily: fonts.extraBold,
    fontSize: 16,
  },
  monthRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 20,
  },
  seeAll: {
    fontFamily: fonts.bold,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  skeletonBlock: {
    borderRadius: radius.lg,
    height: 110,
  },
  skeletonLine: {
    borderRadius: radius.pill,
    height: 18,
    width: '64%',
  },
  skeletonLineShort: {
    borderRadius: radius.pill,
    height: 14,
    width: '44%',
  },
  unreadDot: {
    borderRadius: radius.pill,
    height: 8,
    position: 'absolute',
    right: 9,
    top: 9,
    width: 8,
  },
});
