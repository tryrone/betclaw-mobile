import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { Bell, ChevronLeft, ChevronRight, LoaderCircle, Search } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { FeedMatchCard } from '@/components/home/FeedMatchCard';
import { DashboardStatePanel, PressableScale, TeamLogo } from '@/components/ui';
import { useInfiniteHomeFeed, useMe, useNotificationSummary } from '@/lib/api/hooks';
import type { FeedMatch, HomeFeed, LeagueOption } from '@/lib/api/types';
import { useAppTheme } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

const NAVY = '#11143b';
const NAVY_DEEP = '#090d2d';
const WHITE = '#ffffff';

type DateOption = {
  day: string;
  label: string;
  value: string;
};

type LeagueSection = LeagueOption & {
  matches: FeedMatch[];
};

type ScoreFilter = 'score' | 'live' | 'upcoming' | 'leagues';

function dateKeyFromDate(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateKey(offset = 0) {
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

function buildDateOptions(anchor: string, today: string): DateOption[] {
  return Array.from({ length: 5 }, (_, index) => {
    const value = shiftDateKey(anchor, index - 2);
    const date = dateFromKey(value);
    return {
      day: date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', timeZone: 'UTC' }),
      label: value === today ? 'Today' : date.toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'short' }),
      value,
    };
  });
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
      const current =
        sections.get(league.key) ?? ({
          country: league.country ?? null,
          key: league.key,
          logoUrl: league.logoUrl ?? null,
          matchCount: league.matchCount ?? 0,
          matches: [],
          name: league.name,
        } satisfies LeagueSection);
      const seen = seenMatches.get(league.key) ?? new Set<string>();

      current.logoUrl ??= league.logoUrl ?? null;
      current.matchCount = Math.max(current.matchCount ?? 0, league.matchCount ?? 0);
      for (const match of league.matches ?? []) {
        if (seen.has(match.fixtureId)) continue;
        seen.add(match.fixtureId);
        current.matches.push(match);
      }

      current.matches.sort((left, right) => matchKickoffTime(left) - matchKickoffTime(right));
      sections.set(league.key, current);
      seenMatches.set(league.key, seen);
    }
  }

  return Array.from(sections.values()).filter((section) => section.matches.length > 0).sort(compareLeagues);
}

function normalizedStatus(match: FeedMatch) {
  return String(match.dataSnapshot?.status ?? match.status ?? '').toUpperCase();
}

function isFinished(match: FeedMatch) {
  return ['FT', 'AET', 'PEN', 'FINISHED'].includes(normalizedStatus(match)) || match.dataSnapshot?.phase === 'finished';
}

function isLive(match: FeedMatch) {
  const minute = match.elapsedMinute ?? match.dataSnapshot?.elapsedMinute;
  return (
    !isFinished(match) &&
    (match.dataSnapshot?.phase === 'live' ||
      ['LIVE', '1H', '2H', 'HT', 'ET', 'BT', 'P', 'SUSP', 'INT'].includes(normalizedStatus(match)) ||
      (typeof minute === 'number' && Number.isFinite(minute)))
  );
}

function parseScore(match: FeedMatch) {
  const parsed = /(\d+)\D+(\d+)/.exec(match.score ?? match.dataSnapshot?.score ?? '');
  return parsed ? { away: parsed[2], home: parsed[1] } : { away: '-', home: '-' };
}

function matchTime(match: FeedMatch) {
  return new Date(match.kickoffTime).toLocaleTimeString('en-US', { hour: '2-digit', hour12: false, minute: '2-digit' });
}

function countdownLabel(match: FeedMatch, now: number) {
  if (isLive(match)) {
    const score = parseScore(match);
    return `${score.home} – ${score.away}`;
  }
  if (isFinished(match)) return 'Full time';
  const remaining = new Date(match.kickoffTime).getTime() - now;
  if (remaining <= 0) return 'Starts soon';
  const hours = Math.floor(remaining / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1000);
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
}

function HeroPattern() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[styles.heroStripe, styles.heroStripeOne]} />
      <View style={[styles.heroStripe, styles.heroStripeTwo]} />
      <View style={[styles.heroStripe, styles.heroStripeThree]} />
    </View>
  );
}

function FavoriteTeamHero({
  entry,
  now,
  onBell,
  onOpenMatch,
  onSearch,
  unreadCount,
}: {
  entry?: { league: LeagueSection; match: FeedMatch };
  now: number;
  onBell: () => void;
  onOpenMatch: () => void;
  onSearch: () => void;
  unreadCount: number;
}) {
  const theme = useAppTheme();

  return (
    <LinearGradient colors={['#171b50', NAVY, NAVY_DEEP]} end={{ x: 1, y: 1 }} start={{ x: 0, y: 0 }} style={styles.hero}>
      <HeroPattern />
      <SafeAreaView edges={['top']} style={styles.heroSafe}>
        <View style={styles.heroTopRow}>
          <Text style={styles.heroTitle}>Your Favorite Team</Text>
          <View style={styles.heroActions}>
            <PressableScale accessibilityLabel="Search matches" accessibilityRole="button" onPress={onSearch} style={styles.heroIconButton}>
              <Search color={WHITE} size={18} strokeWidth={1.8} />
            </PressableScale>
            <PressableScale accessibilityLabel="Notifications" accessibilityRole="button" onPress={onBell} style={styles.heroIconButton}>
              <Bell color={WHITE} size={18} strokeWidth={1.8} />
              {unreadCount > 0 ? <View style={[styles.notificationDot, { backgroundColor: theme.accent }]} /> : null}
            </PressableScale>
          </View>
        </View>

        {entry ? (
          <>
            <View style={styles.heroLeagueRow}>
              <TeamLogo logoUrl={entry.league.logoUrl} name={entry.league.name} size={32} />
              <View style={styles.heroLeagueCopy}>
                <Text numberOfLines={1} style={styles.heroLeague}>{entry.league.name}</Text>
                <Text numberOfLines={1} style={styles.heroCountry}>{entry.league.country ?? 'Today’s featured competition'}</Text>
              </View>
              <ChevronRight color={WHITE} size={22} strokeWidth={1.7} />
            </View>

            <View style={styles.heroMatchRow}>
              <View style={styles.heroTeam}>
                <TeamLogo logoUrl={entry.match.homeTeam.logoUrl} name={entry.match.homeTeam.name} size={54} />
                <Text numberOfLines={1} style={styles.heroTeamName}>{entry.match.homeTeam.name}</Text>
                <Text style={styles.heroSide}>Home</Text>
              </View>
              <View style={styles.heroClockWrap}>
                <Text adjustsFontSizeToFit numberOfLines={1} style={styles.heroClock}>{countdownLabel(entry.match, now)}</Text>
                <Text style={styles.heroKickoff}>{matchTime(entry.match)}</Text>
              </View>
              <View style={[styles.heroTeam, styles.heroTeamAway]}>
                <TeamLogo logoUrl={entry.match.awayTeam.logoUrl} name={entry.match.awayTeam.name} size={54} />
                <Text numberOfLines={1} style={[styles.heroTeamName, styles.heroTeamNameAway]}>{entry.match.awayTeam.name}</Text>
                <Text style={styles.heroSide}>Away</Text>
              </View>
            </View>

            <View style={styles.heroFooter}>
              <View style={styles.heroInsightPill}>
                <Text numberOfLines={1} style={styles.heroInsightText}>
                  {entry.match.bestMarket?.confidence
                    ? `${Math.round(entry.match.bestMarket.confidence)}% BetClaw confidence`
                    : 'BetClaw match of the day'}
                </Text>
              </View>
              <PressableScale
                accessibilityLabel="Open favorite match"
                accessibilityRole="button"
                onPress={onOpenMatch}
                style={styles.heroArrowButton}>
                <ChevronRight color={NAVY} size={22} strokeWidth={2.2} />
              </PressableScale>
            </View>
          </>
        ) : (
          <View style={styles.heroEmpty}>
            <LoaderCircle color={WHITE} size={28} />
            <Text style={styles.heroEmptyTitle}>Finding today’s featured matchup</Text>
            <Text style={styles.heroEmptyCopy}>Live production fixtures will appear here.</Text>
          </View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

function DateStrip({
  dates,
  onSelect,
  onShift,
  selectedDate,
}: {
  dates: DateOption[];
  onSelect: (value: string) => void;
  onShift: (offset: number) => void;
  selectedDate: string;
}) {
  const theme = useAppTheme();

  return (
    <View style={[styles.dateStrip, { borderBottomColor: theme.border }]}>
      <PressableScale accessibilityLabel="Previous day" accessibilityRole="button" onPress={() => onShift(-1)} style={styles.dateArrow}>
        <ChevronLeft color={theme.muted} size={20} />
      </PressableScale>
      {dates.map((date) => {
        const active = date.value === selectedDate;
        return (
          <PressableScale
            accessibilityLabel={`${date.label} ${date.day}`}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            key={date.value}
            onPress={() => onSelect(date.value)}
            style={styles.dateItem}>
            <Text style={[styles.dateLabel, { color: active ? theme.primary : theme.muted }, active ? styles.dateLabelActive : null]}>{date.label}</Text>
            <Text style={[styles.dateDay, { color: active ? theme.primary : theme.muted }, active ? styles.dateDayActive : null]}>{date.day}</Text>
            <View style={[styles.dateUnderline, active ? { backgroundColor: theme.primary } : null]} />
          </PressableScale>
        );
      })}
      <PressableScale accessibilityLabel="Next day" accessibilityRole="button" onPress={() => onShift(1)} style={styles.dateArrow}>
        <ChevronRight color={theme.muted} size={20} />
      </PressableScale>
    </View>
  );
}

function LiveMatchCard({ entry, onPress }: { entry: { league: LeagueSection; match: FeedMatch }; onPress: () => void }) {
  const theme = useAppTheme();
  const live = isLive(entry.match);
  const score = parseScore(entry.match);

  return (
    <PressableScale
      accessibilityLabel={`${entry.match.homeTeam.name} versus ${entry.match.awayTeam.name}`}
      accessibilityRole="button"
      onPress={onPress}
      scaleTo={0.985}
      style={[styles.liveCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.liveCardHeader}>
        <View style={styles.liveLeagueCopy}>
          <TeamLogo logoUrl={entry.league.logoUrl} name={entry.league.name} size={22} />
          <Text numberOfLines={1} style={[styles.liveLeague, { color: theme.foregroundStrong }]}>{entry.league.name}</Text>
        </View>
        <View style={[styles.liveBadge, { backgroundColor: live ? theme.successSoft : theme.field }]}>
          <View style={[styles.liveBadgeDot, { backgroundColor: live ? theme.success : theme.muted }]} />
          <Text style={[styles.liveBadgeText, { color: live ? theme.success : theme.mutedLight }]}>
            {live ? entry.match.elapsedMinute ?? entry.match.dataSnapshot?.elapsedMinute ?? 'LIVE' : matchTime(entry.match)}
          </Text>
        </View>
      </View>
      <View style={styles.liveTeamsRow}>
        <View style={styles.liveTeam}>
          <TeamLogo logoUrl={entry.match.homeTeam.logoUrl} name={entry.match.homeTeam.name} size={42} />
          <Text numberOfLines={2} style={[styles.liveTeamName, { color: theme.foregroundStrong }]}>{entry.match.homeTeam.name}</Text>
        </View>
        <Text style={[styles.liveScore, { color: theme.foregroundStrong }]}>{live || isFinished(entry.match) ? `${score.home} - ${score.away}` : 'VS'}</Text>
        <View style={styles.liveTeam}>
          <TeamLogo logoUrl={entry.match.awayTeam.logoUrl} name={entry.match.awayTeam.name} size={42} />
          <Text numberOfLines={2} style={[styles.liveTeamName, { color: theme.foregroundStrong }]}>{entry.match.awayTeam.name}</Text>
        </View>
      </View>
      <View style={[styles.detailsButton, { backgroundColor: theme.primary }]}>
        <Text style={[styles.detailsButtonText, { color: theme.primaryDark }]}>Details</Text>
      </View>
    </PressableScale>
  );
}

function ScoreTabs({ filter, onChange }: { filter: ScoreFilter; onChange: (filter: ScoreFilter) => void }) {
  const theme = useAppTheme();
  const tabs: { key: ScoreFilter; label: string }[] = [
    { key: 'score', label: 'Score' },
    { key: 'live', label: 'Live' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'leagues', label: 'Leagues' },
  ];
  return (
    <View style={[styles.scoreTabs, { borderBottomColor: theme.border, borderTopColor: theme.border }]}>
      {tabs.map((tab) => {
        const active = tab.key === filter;
        return (
          <PressableScale
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={styles.scoreTab}>
            <Text style={[styles.scoreTabText, { color: active ? theme.primary : theme.muted }, active ? styles.scoreTabTextActive : null]}>{tab.label}</Text>
            <View style={[styles.scoreTabUnderline, active ? { backgroundColor: theme.primary } : null]} />
          </PressableScale>
        );
      })}
    </View>
  );
}

function LeagueScoreSection({ league, onOpenMatch }: { league: LeagueSection; onOpenMatch: (match: FeedMatch) => void }) {
  const theme = useAppTheme();

  return (
    <View style={styles.leagueSection}>
      <View style={styles.leagueHeading}>
        <TeamLogo logoUrl={league.logoUrl} name={league.name} size={25} />
        <View style={styles.leagueHeadingCopy}>
          <Text numberOfLines={1} style={[styles.leagueHeadingName, { color: theme.foregroundStrong }]}>{league.name}</Text>
          {league.country ? <Text numberOfLines={1} style={[styles.leagueHeadingCountry, { color: theme.muted }]}>{league.country}</Text> : null}
        </View>
        <ChevronRight color={theme.muted} size={18} />
      </View>
      <View style={styles.leagueMatches}>
        {league.matches.map((match) => (
          <FeedMatchCard
            key={match.fixtureId}
            league={league}
            match={match}
            onPress={() => onOpenMatch(match)}
            showCompetition={false}
            variant="compact"
          />
        ))}
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { height } = useWindowDimensions();
  const heroHeight = Math.max(372, height * 0.42);
  const initialDate = dateKey();
  const [todayKey, setTodayKey] = useState(initialDate);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [filter, setFilter] = useState<ScoreFilter>('score');
  const [now, setNow] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const me = useMe();
  const notificationSummary = useNotificationSummary();
  const feed = useInfiniteHomeFeed({ date: selectedDate, limit: 32, windowDays: 1 });

  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('light', true);
      return () => setStatusBarStyle(theme.mode === 'light' ? 'dark' : 'light', true);
    }, [theme.mode]),
  );

  useEffect(() => {
    const initialTick = setTimeout(() => setNow(Date.now()), 0);
    const interval = setInterval(() => {
      setNow(Date.now());
      setTodayKey(dateKey());
    }, 1000);
    return () => {
      clearTimeout(initialTick);
      clearInterval(interval);
    };
  }, []);

  const feedPages = useMemo(() => feed.data?.pages ?? [], [feed.data?.pages]);
  const leagueSections = useMemo(() => buildLeagueSections(feedPages), [feedPages]);
  const flatEntries = useMemo(
    () =>
      leagueSections
        .flatMap((league) => league.matches.map((match) => ({ league, match })))
        .sort((left, right) => matchKickoffTime(left.match) - matchKickoffTime(right.match)),
    [leagueSections],
  );
  const featuredEntry =
    flatEntries.find(({ match }) => isLive(match)) ??
    flatEntries.find(({ match }) => !isFinished(match) && matchKickoffTime(match) > now) ??
    flatEntries.find(({ match }) => !isFinished(match)) ??
    flatEntries[0];
  const liveEntries = flatEntries.filter(({ match }) => isLive(match));
  const carouselEntries = liveEntries.length > 0 ? liveEntries : flatEntries.filter(({ match }) => !isFinished(match)).slice(0, 5);
  const dates = useMemo(() => buildDateOptions(selectedDate, todayKey), [selectedDate, todayKey]);
  const visibleSections = useMemo(
    () =>
      leagueSections
        .map((league) => ({
          ...league,
          matches: league.matches.filter((match) => {
            if (filter === 'live') return isLive(match);
            if (filter === 'upcoming') return !isLive(match) && !isFinished(match);
            return true;
          }),
        }))
        .filter((league) => league.matches.length > 0),
    [filter, leagueSections],
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.allSettled([feed.refetch(), me.refetch(), notificationSummary.refetch()]);
    setRefreshing(false);
  };

  const openMatch = (match: FeedMatch) => router.push(`/match/${match.fixtureId}` as never);

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <View pointerEvents="none" style={[styles.overscrollBackdrop, { height: heroHeight }]} />
      <ScrollView
        bounces
        contentContainerStyle={{ paddingBottom: 112 + insets.bottom }}
        refreshControl={<RefreshControl onRefresh={handleRefresh} refreshing={refreshing} tintColor={WHITE} />}
        showsVerticalScrollIndicator={false}>
        <View style={{ minHeight: heroHeight }}>
          <FavoriteTeamHero
            entry={featuredEntry}
            now={now}
            onBell={() => router.push('/notifications' as never)}
            onOpenMatch={() => featuredEntry && openMatch(featuredEntry.match)}
            onSearch={() => router.push('/matches' as never)}
            unreadCount={notificationSummary.data?.unreadCount ?? 0}
          />
        </View>

        <View style={[styles.bodySheet, { backgroundColor: theme.background }]}>
          <DateStrip
            dates={dates}
            onSelect={setSelectedDate}
            onShift={(offset) => setSelectedDate(shiftDateKey(selectedDate, offset))}
            selectedDate={selectedDate}
          />

          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.foregroundStrong }]}>Live Now</Text>
            <PressableScale accessibilityLabel="See all matches" accessibilityRole="button" onPress={() => router.push('/matches' as never)}>
              <Text style={[styles.seeMore, { color: theme.primary }]}>See More</Text>
            </PressableScale>
          </View>

          {carouselEntries.length > 0 ? (
            <ScrollView
              contentContainerStyle={styles.liveRailContent}
              decelerationRate="fast"
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={314}>
              {carouselEntries.map((entry) => (
                <LiveMatchCard entry={entry} key={entry.match.fixtureId} onPress={() => openMatch(entry.match)} />
              ))}
            </ScrollView>
          ) : (
            <View style={[styles.emptyLiveCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.emptyLiveTitle, { color: theme.foregroundStrong }]}>{feed.isLoading ? 'Checking today’s fixtures' : 'No matches live right now'}</Text>
              <Text style={[styles.emptyLiveCopy, { color: theme.muted }]}>Upcoming fixtures will appear here before kickoff.</Text>
            </View>
          )}

          <ScoreTabs filter={filter} onChange={setFilter} />

          {feed.isLoading && feedPages.length === 0 ? (
            <View style={styles.loadingList}>
              {Array.from({ length: 3 }).map((_, index) => <View key={index} style={[styles.loadingCard, { backgroundColor: theme.surfaceHover }]} />)}
            </View>
          ) : visibleSections.length > 0 ? (
            <View style={styles.scoreList}>
              {visibleSections.map((league) => (
                <LeagueScoreSection key={league.key} league={league} onOpenMatch={openMatch} />
              ))}
              {feed.hasNextPage ? (
                <PressableScale
                  accessibilityRole="button"
                  disabled={feed.isFetchingNextPage}
                  onPress={() => feed.fetchNextPage()}
                  style={[styles.loadMoreButton, { backgroundColor: theme.primary }]}>
                  {feed.isFetchingNextPage ? <LoaderCircle color={theme.primaryDark} size={16} /> : null}
                  <Text style={[styles.loadMoreText, { color: theme.primaryDark }]}>{feed.isFetchingNextPage ? 'Loading…' : 'Load more matches'}</Text>
                </PressableScale>
              ) : null}
            </View>
          ) : (
            <DashboardStatePanel icon={Search} title="No fixtures found">
              Try another date or score filter.
            </DashboardStatePanel>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bodySheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    gap: spacing.lg,
    marginTop: -22,
    minHeight: 620,
    paddingBottom: spacing.xxl,
    paddingTop: 12,
  },
  dateArrow: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 27,
  },
  dateDay: {
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 16,
  },
  dateDayActive: {
    fontFamily: fonts.bold,
  },
  dateItem: {
    alignItems: 'center',
    flex: 1,
    gap: 1,
    minWidth: 52,
    paddingTop: 9,
  },
  dateLabel: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 17,
  },
  dateLabelActive: {
    fontFamily: fonts.bold,
  },
  dateStrip: {
    alignItems: 'stretch',
    flexDirection: 'row',
    minHeight: 68,
    paddingHorizontal: spacing.sm,
  },
  dateUnderline: {
    backgroundColor: 'transparent',
    height: 2,
    marginTop: 7,
    width: 38,
  },
  detailsButton: {
    alignItems: 'center',
    borderRadius: radius.md,
    height: 38,
    justifyContent: 'center',
    marginTop: 3,
  },
  detailsButtonText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  emptyLiveCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 5,
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
  },
  emptyLiveCopy: {
    fontFamily: fonts.regular,
    fontSize: 12,
  },
  emptyLiveTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  hero: {
    bottom: 0,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
    top: 0,
  },
  heroActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  heroArrowButton: {
    alignItems: 'center',
    backgroundColor: WHITE,
    borderRadius: radius.pill,
    height: 42,
    justifyContent: 'center',
    width: 72,
  },
  heroClock: {
    color: WHITE,
    fontFamily: fonts.semibold,
    fontSize: 22,
    fontVariant: ['tabular-nums'],
  },
  heroClockWrap: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: radius.pill,
    gap: 2,
    minWidth: 108,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  heroCountry: {
    color: 'rgba(255,255,255,0.62)',
    fontFamily: fonts.regular,
    fontSize: 12,
    marginTop: 2,
  },
  heroEmpty: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
    justifyContent: 'center',
  },
  heroEmptyCopy: {
    color: 'rgba(255,255,255,0.58)',
    fontFamily: fonts.regular,
    fontSize: 12,
  },
  heroEmptyTitle: {
    color: WHITE,
    fontFamily: fonts.bold,
    fontSize: 16,
  },
  heroFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  heroIconButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  heroInsightPill: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: radius.pill,
    maxWidth: '70%',
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  heroInsightText: {
    color: 'rgba(255,255,255,0.82)',
    fontFamily: fonts.regular,
    fontSize: 12,
  },
  heroKickoff: {
    color: 'rgba(255,255,255,0.76)',
    fontFamily: fonts.regular,
    fontSize: 11,
  },
  heroLeague: {
    color: WHITE,
    fontFamily: fonts.bold,
    fontSize: 15,
  },
  heroLeagueCopy: {
    flex: 1,
    minWidth: 0,
  },
  heroLeagueRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  heroMatchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  heroSafe: {
    flex: 1,
    gap: spacing.lg,
    paddingBottom: 38,
    paddingHorizontal: spacing.lg,
    paddingTop: 4,
  },
  heroSide: {
    color: 'rgba(255,255,255,0.48)',
    fontFamily: fonts.regular,
    fontSize: 11,
  },
  heroStripe: {
    backgroundColor: 'rgba(255,255,255,0.025)',
    height: 72,
    position: 'absolute',
    transform: [{ rotate: '-33deg' }],
    width: 520,
  },
  heroStripeOne: {
    left: -180,
    top: 34,
  },
  heroStripeThree: {
    left: 40,
    top: 305,
  },
  heroStripeTwo: {
    left: -70,
    top: 170,
  },
  heroTeam: {
    alignItems: 'flex-start',
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  heroTeamAway: {
    alignItems: 'flex-end',
  },
  heroTeamName: {
    color: WHITE,
    fontFamily: fonts.semibold,
    fontSize: 14,
    marginTop: 3,
    maxWidth: '100%',
  },
  heroTeamNameAway: {
    textAlign: 'right',
  },
  heroTitle: {
    color: WHITE,
    flex: 1,
    fontFamily: fonts.extraBold,
    fontSize: 22,
  },
  heroTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  leagueHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: 3,
  },
  leagueHeadingCopy: {
    flex: 1,
    minWidth: 0,
  },
  leagueHeadingCountry: {
    fontFamily: fonts.regular,
    fontSize: 10,
    marginTop: 1,
  },
  leagueHeadingName: {
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  leagueMatches: {
    gap: spacing.sm,
  },
  leagueSection: {
    gap: spacing.sm,
  },
  liveBadge: {
    alignItems: 'center',
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  liveBadgeDot: {
    borderRadius: radius.pill,
    height: 7,
    width: 7,
  },
  liveBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 11,
  },
  liveCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
    width: 306,
  },
  liveCardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  liveLeague: {
    flexShrink: 1,
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
  liveLeagueCopy: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 7,
    minWidth: 0,
  },
  liveRailContent: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  liveScore: {
    fontFamily: fonts.extraBold,
    fontSize: 20,
    minWidth: 58,
    textAlign: 'center',
  },
  liveTeam: {
    alignItems: 'center',
    flex: 1,
    gap: 6,
    minWidth: 0,
  },
  liveTeamName: {
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 14,
    textAlign: 'center',
  },
  liveTeamsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  loadMoreButton: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 44,
    paddingHorizontal: spacing.lg,
  },
  loadMoreText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
  loadingCard: {
    borderRadius: radius.lg,
    height: 130,
    opacity: 0.65,
  },
  loadingList: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  matchDate: {
    fontFamily: fonts.regular,
    fontSize: 10,
  },
  matchDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 36,
  },
  matchMeta: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 42,
  },
  matchPair: {
    alignItems: 'stretch',
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 94,
    padding: spacing.sm,
  },
  matchStatus: {
    fontFamily: fonts.bold,
    fontSize: 11,
  },
  matchTeamName: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  matchTeamRow: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  matchTeamScore: {
    fontFamily: fonts.bold,
    fontSize: 13,
    minWidth: 18,
    textAlign: 'right',
  },
  matchTeams: {
    flex: 1,
    gap: 4,
    paddingLeft: spacing.sm,
  },
  notificationDot: {
    borderColor: NAVY,
    borderRadius: radius.pill,
    borderWidth: 2,
    height: 9,
    position: 'absolute',
    right: 8,
    top: 7,
    width: 9,
  },
  overscrollBackdrop: {
    backgroundColor: '#171b50',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  root: {
    flex: 1,
  },
  scoreList: {
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  scoreTab: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
  },
  scoreTabText: {
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  scoreTabTextActive: {
    fontFamily: fonts.bold,
  },
  scoreTabUnderline: {
    backgroundColor: 'transparent',
    bottom: 0,
    height: 2,
    left: 12,
    position: 'absolute',
    right: 12,
  },
  scoreTabs: {
    borderBottomWidth: 1,
    borderTopWidth: 1,
    flexDirection: 'row',
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 20,
  },
  seeMore: {
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
});
