import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { Link, useRouter } from 'expo-router';
import {
  Activity,
  ArrowRight,
  Bell,
  CalendarDays,
  Gift,
  LoaderCircle,
  MessageCircle,
  Radio,
  Search,
  ShieldCheck,
  Trophy,
  UsersRound,
  Wallet,
} from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { FeedMatchCard } from '@/components/home/FeedMatchCard';
import {
  DashboardButton,
  DashboardChip,
  DashboardGlassCard,
  DashboardMetric,
  DashboardPillField,
  DashboardSectionHeader,
  DashboardStatePanel,
  PressableScale,
  Screen,
  StatusBadge,
  TeamLogo,
  useToast,
} from '@/components/ui';
import {
  useCreateTelegramCommunityInviteMutation,
  useInfiniteHomeFeed,
  useLeagues,
  useMe,
  useNotificationSummary,
  useSubscriptionCurrent,
  useTelegramCommunityStatus,
} from '@/lib/api/hooks';
import type {
  FeedMatch,
  HomeFeed,
  LeagueOption,
  TelegramCommunityInvite,
  TelegramCommunityStatus,
} from '@/lib/api/types';
import { useAppTheme } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

const userAvatar = require('@/../assets/images/user_avatar.png');
const ALL_LEAGUES_KEY = '__all_leagues__';
const COMMUNITY_BANNER_HIDDEN_PREFIX = 'betclaw.community-banner.hidden.';

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

function communityBannerHiddenKey(userId: string) {
  return `${COMMUNITY_BANNER_HIDDEN_PREFIX}${userId}`;
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

function dateStripKeys(todayKey: string) {
  return Array.from({ length: 7 }, (_, index) => shiftDateKey(todayKey, index - 3));
}

function formatDateStripMain(date: Date, todayKey = dateKey(0)) {
  const value = dateKeyFromDate(date);
  if (value === todayKey) return 'Today';
  if (value === shiftDateKey(todayKey, -1)) return 'Yesterday';
  if (value === shiftDateKey(todayKey, 1)) return 'Tomorrow';
  return date.toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'short' });
}

function formatDateStripSub(date: Date) {
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

function formatSelectedDateLabel(key: string) {
  return dateFromKey(key).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
    weekday: 'short',
    year: 'numeric',
  });
}

function formatCompact(value?: number | null) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return 'Wallet';
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 1, notation: 'compact' }).format(value)} tokens`;
}

function matchKickoffTime(match: FeedMatch) {
  const time = new Date(match.kickoffTime).getTime();
  return Number.isFinite(time) ? time : Number.MAX_SAFE_INTEGER;
}






function getConfidence(match: FeedMatch) {
  return Math.max(
    0,
    Math.min(
      99,
      Math.round(
        match.predictionView?.confidence ??
          match.bestMarket?.confidence ??
          match.predictionView?.edgeScore ??
          match.bestMarket?.edgeScore ??
          match.dataReadiness?.score ??
          match.dataSnapshot?.readiness?.score ??
          62,
      ),
    ),
  );
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

      existing.matches.sort((left, right) => matchKickoffTime(left) - matchKickoffTime(right));
      sections.set(key, existing);
      seenMatches.set(key, seen);
    }
  }

  return Array.from(sections.values()).filter((section) => section.matches.length > 0).sort(compareLeagues);
}

function DashboardUtilityBar({
  image,
  name,
  query,
  tokenBalance,
  unreadCount,
  onQueryChange,
}: {
  image?: string | null;
  name?: string | null;
  query: string;
  tokenBalance?: number | null;
  unreadCount: number;
  onQueryChange: (value: string) => void;
}) {
  const router = useRouter();
  const theme = useAppTheme();

  return (
    <View style={styles.utility}>
      <DashboardPillField icon={Search} placeholder="Search teams or leagues" value={query} onChangeText={onQueryChange} />
      <View style={styles.utilityActions}>
        <Link href="/(tabs)/wallet" asChild>
          <PressableScale
            accessibilityRole="button"
            style={StyleSheet.flatten([styles.walletPill, { backgroundColor: theme.surface, borderColor: theme.border }])}>
            <Text numberOfLines={1} style={[styles.walletText, { color: theme.foregroundStrong }]}>
              {formatCompact(tokenBalance)}
            </Text>
            <Wallet color={theme.primary} size={15} />
          </PressableScale>
        </Link>
        <PressableScale
          accessibilityLabel="Notifications"
          accessibilityRole="button"
          onPress={() => router.push('/notifications' as any)}
          style={[styles.iconPill, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Bell color={theme.foregroundStrong} size={17} />
          {unreadCount > 0 ? <View style={[styles.unreadDot, { backgroundColor: theme.live }]} /> : null}
        </PressableScale>
        {image ? (
          <Image source={{ uri: image }} style={[styles.avatar, { borderColor: theme.border }]} contentFit="cover" />
        ) : (
          <Image source={userAvatar} style={[styles.avatar, { borderColor: theme.border }]} contentFit="cover" />
        )}
        <Text numberOfLines={1} style={[styles.userName, { color: theme.mutedLight }]}>
          {name?.split(' ')[0] ?? 'there'}
        </Text>
      </View>
    </View>
  );
}

function PredictionHero({
  bestAccuracy,
  isLoading,
  matchCount,
  selectedDateLabel,
}: {
  bestAccuracy: number;
  isLoading: boolean;
  matchCount: number;
  selectedDateLabel: string;
}) {
  const router = useRouter();
  const theme = useAppTheme();

  return (
    <DashboardGlassCard gradient="hero" style={styles.hero}>
      <View style={styles.heroGlow} pointerEvents="none" />
      <View style={styles.heroContent}>
        <Text style={[styles.heroTitle, { color: theme.foregroundStrong }]}>
          <Text style={{ color: theme.primary }}>AI</Text> Matchday Agent
        </Text>
        <Text style={[styles.heroCopy, { color: theme.mutedLight }]}>
          Browse every verified fixture for the selected day, including live scores, final results, and available match context.
        </Text>
        <View style={styles.heroActions}>
          <DashboardButton icon={ArrowRight} iconChip onPress={() => router.push('/(tabs)/build-ticket' as any)}>
            Build Slip
          </DashboardButton>
          <View style={[styles.datePill, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <CalendarDays color={theme.primary} size={16} />
            <Text style={[styles.datePillText, { color: theme.foregroundStrong }]}>{selectedDateLabel}</Text>
          </View>
        </View>
      </View>
      <View style={styles.metricsRow}>
        <DashboardMetric icon={CalendarDays} label="Matches" value={isLoading ? '...' : String(matchCount)} />
        <DashboardMetric icon={ShieldCheck} label="Accuracy" value={bestAccuracy ? `${bestAccuracy}%` : 'Pending'} />
        <DashboardMetric icon={Trophy} label="Mode" value="Live" />
      </View>
    </DashboardGlassCard>
  );
}

function TelegramCommunityCard({
  invite,
  isCreating,
  isLoading,
  onJoin,
  status,
}: {
  invite: TelegramCommunityInvite | null;
  isCreating: boolean;
  isLoading: boolean;
  onJoin: () => void;
  status?: TelegramCommunityStatus;
}) {
  const theme = useAppTheme();
  const ready = Boolean(status?.enabled && status.configured);
  const communityName = status?.communityName ?? 'BetsClaw Community';
  const inviteExpiry = invite
    ? new Date(invite.expiresAt).toLocaleString(undefined, { day: 'numeric', hour: 'numeric', minute: '2-digit', month: 'short' })
    : null;

  return (
    <DashboardGlassCard gradient="matchHero" style={styles.communityCard}>
      <View style={styles.communityTop}>
        <View style={[styles.communityIcon, { backgroundColor: theme.primarySubtle, borderColor: theme.selectionBorder }]}>
          <MessageCircle color={theme.primary} size={22} />
        </View>
        <View style={styles.communityCopy}>
          <View style={styles.communityTitleRow}>
            <Text numberOfLines={2} style={[styles.communityTitle, { color: theme.foregroundStrong }]}>
              {communityName}
            </Text>
            <View style={[styles.privateBadge, { borderColor: theme.border, backgroundColor: theme.surface }]}>
              <UsersRound color={theme.mutedLight} size={12} />
              <Text style={[styles.privateBadgeText, { color: theme.mutedLight }]}>Community</Text>
            </View>
          </View>
          <Text style={[styles.communityText, { color: theme.mutedLight }]}>Talk slips, match context, and live reactions with other BetsClaw users.</Text>
        </View>
      </View>
      <View style={styles.communityFooter}>
        <DashboardButton icon={isCreating || isLoading ? LoaderCircle : MessageCircle} onPress={onJoin} style={styles.communityButton}>
          {ready ? 'Join Community' : 'Setup Pending'}
        </DashboardButton>
        {inviteExpiry ? (
          <Text numberOfLines={1} style={[styles.communityStatus, { color: theme.muted }]}>Expires {inviteExpiry}</Text>
        ) : null}
      </View>
    </DashboardGlassCard>
  );
}

function ReferralPrompt() {
  const theme = useAppTheme();

  return (
    <Link href="/referrals" asChild>
      <PressableScale
        accessibilityRole="button"
        style={StyleSheet.flatten([styles.referralCard, { backgroundColor: theme.surface, borderColor: theme.border }])}>
        <View style={styles.referralLeft}>
          <View style={[styles.referralIcon, { backgroundColor: theme.primarySubtle, borderColor: theme.selectionBorder }]}>
            <Gift color={theme.primary} size={17} />
          </View>
          <Text numberOfLines={2} style={[styles.referralText, { color: theme.mutedLight }]}>
            <Text style={{ color: theme.foregroundStrong, fontFamily: fonts.extraBold }}>Invite friends, earn 20%</Text> commission on every first payment.
          </Text>
        </View>
        <View style={styles.referralAction}>
          <Text style={[styles.referralActionText, { color: theme.primary }]}>Get link</Text>
          <ArrowRight color={theme.primary} size={15} />
        </View>
      </PressableScale>
    </Link>
  );
}

function DateStrip({ dates, selectedDate, onSelect }: { dates: DateOption[]; selectedDate: string; onSelect: (date: string) => void }) {
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
  );
}

type OngoingMatch = {
  league: LeagueSection;
  match: FeedMatch;
};

function normalizedStatus(match: FeedMatch) {
  return String(match.status ?? match.dataSnapshot?.status ?? '').toUpperCase();
}

function isFinished(match: FeedMatch) {
  return ['FT', 'AET', 'PEN', 'FINISHED'].includes(normalizedStatus(match)) || match.dataSnapshot?.phase === 'finished';
}

function isOngoingMatch(match: FeedMatch) {
  const status = normalizedStatus(match);
  return !isFinished(match) && (['LIVE', '1H', '2H', 'HT', 'ET', 'BT', 'P', 'SUSP', 'INT'].includes(status) || Boolean(match.elapsedMinute ?? match.dataSnapshot?.elapsedMinute));
}

function buildOngoingMatches(sections: LeagueSection[]) {
  return sections.flatMap((league) =>
    league.matches.filter(isOngoingMatch).map((match) => ({
      league,
      match,
    })),
  );
}

function parseLiveScore(score?: string | null) {
  const parsed = /(\d+)\D+(\d+)/.exec(score ?? '');
  if (!parsed) return { away: null, home: null } as const;
  return { away: Number(parsed[2]), home: Number(parsed[1]) } as const;
}

function liveTimeLabel(match: FeedMatch) {
  const minute = match.elapsedMinute ?? match.dataSnapshot?.elapsedMinute;
  if (minute) return `${minute}'`;
  const status = normalizedStatus(match);
  return status === 'HT' ? 'HT' : 'Live';
}

function OngoingMatchCard({ league, match }: OngoingMatch) {
  const router = useRouter();
  const theme = useAppTheme();
  const score = parseLiveScore(match.score ?? match.dataSnapshot?.score);
  const openMatch = () => router.push(`/match/${match.fixtureId}` as any);

  return (
    <PressableScale
      accessibilityLabel={`${match.homeTeam.name} vs ${match.awayTeam.name}, ongoing match`}
      accessibilityRole="button"
      onPress={openMatch}
      scaleTo={0.98}
      style={[styles.ongoingMatchCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.ongoingCardTop}>
        <StatusBadge label={liveTimeLabel(match)} tone="danger" />
        <View style={styles.ongoingLiveMark}>
          <View style={[styles.ongoingLiveDot, { backgroundColor: theme.live }]} />
          <Text style={[styles.ongoingLiveText, { color: theme.live }]}>In play</Text>
        </View>
      </View>
      <View style={styles.ongoingTeams}>
        <View style={styles.ongoingTeam}>
          <TeamLogo logoUrl={match.homeTeam.logoUrl} name={match.homeTeam.name} size={38} />
          <Text numberOfLines={2} style={[styles.ongoingTeamName, { color: theme.foregroundStrong }]}>
            {match.homeTeam.name}
          </Text>
        </View>
        <View style={[styles.ongoingScore, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.ongoingScoreText, { color: theme.foregroundStrong }]}>{score.home ?? '-'}</Text>
          <Text style={[styles.ongoingScoreDivider, { color: theme.muted }]}>:</Text>
          <Text style={[styles.ongoingScoreText, { color: theme.foregroundStrong }]}>{score.away ?? '-'}</Text>
        </View>
        <View style={[styles.ongoingTeam, styles.ongoingTeamRight]}>
          <TeamLogo logoUrl={match.awayTeam.logoUrl} name={match.awayTeam.name} size={38} />
          <Text numberOfLines={2} style={[styles.ongoingTeamName, styles.ongoingTeamNameRight, { color: theme.foregroundStrong }]}>
            {match.awayTeam.name}
          </Text>
        </View>
      </View>
      <Text numberOfLines={1} style={[styles.ongoingLeague, { color: theme.mutedLight }]}>
        {league.name}
      </Text>
    </PressableScale>
  );
}

function OngoingMatchesRail({ isLoading, matches }: { isLoading: boolean; matches: OngoingMatch[] }) {
  const theme = useAppTheme();

  if (isLoading) {
    return (
      <DashboardGlassCard>
        <DashboardStatePanel icon={LoaderCircle} title="Checking live matches">
          Looking for ongoing fixtures in the selected slate.
        </DashboardStatePanel>
      </DashboardGlassCard>
    );
  }

  if (matches.length === 0) {
    return (
      <DashboardGlassCard>
        <DashboardStatePanel icon={Radio} title="No ongoing matches" tone="warning">
          Live fixtures will appear here as soon as the slate kicks off.
        </DashboardStatePanel>
      </DashboardGlassCard>
    );
  }

  return (
    <DashboardGlassCard gradient="matchHero" style={styles.ongoingCard}>
      <DashboardSectionHeader
        action={<StatusBadge label={`${matches.length} live`} tone="danger" />}
        eyebrow="Live"
        title="Ongoing matches"
        description="Swipe through fixtures currently in play"
      />
      <ScrollView
        contentContainerStyle={styles.ongoingRail}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.horizontalBleed}>
        {matches.map((item) => (
          <OngoingMatchCard key={`${item.league.key}-${item.match.fixtureId}`} league={item.league} match={item.match} />
        ))}
      </ScrollView>
      <View style={[styles.ongoingHint, { backgroundColor: theme.primarySubtle, borderColor: theme.selectionBorder }]}>
        <Activity color={theme.primary} size={14} />
        <Text style={[styles.ongoingHintText, { color: theme.primary }]}>Tap a card for full match context</Text>
      </View>
    </DashboardGlassCard>
  );
}

function LeagueFilterBar({
  isLoading,
  leagues,
  selectedLeagueKey,
  totalMatches,
  onSelect,
}: {
  isLoading: boolean;
  leagues: LeagueOption[];
  selectedLeagueKey: string;
  totalMatches: number;
  onSelect: (value: string) => void;
}) {
  return (
    <View style={styles.filterBlock}>
      <DashboardSectionHeader eyebrow="Leagues" title="Fixture slate" description={`${leagues.length} leagues available`} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.leagueRail} style={styles.horizontalBleed}>
        <DashboardChip active={selectedLeagueKey === ALL_LEAGUES_KEY} count={totalMatches} icon={Trophy} label="All leagues" onPress={() => onSelect(ALL_LEAGUES_KEY)} />
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => <View key={index} style={styles.leagueSkeleton} />)
          : leagues.map((league) => (
              <DashboardChip
                active={selectedLeagueKey === league.key}
                count={league.matchCount ?? 0}
                key={league.key}
                label={league.name}
                onPress={() => onSelect(league.key)}
              />
            ))}
      </ScrollView>
    </View>
  );
}

function LeagueLogoMark({ league }: { league: LeagueOption }) {
  const theme = useAppTheme();

  if (league.logoUrl) {
    return (
      <View style={[styles.leagueLogo, { backgroundColor: theme.white, borderColor: theme.border }]}>
        <Image source={{ uri: league.logoUrl }} contentFit="contain" style={styles.leagueLogoImage} />
      </View>
    );
  }

  return (
    <View style={[styles.leagueLogo, { backgroundColor: theme.primarySubtle, borderColor: theme.border }]}>
      <Text style={[styles.leagueInitials, { color: theme.primary }]}>{league.name.slice(0, 2).toUpperCase()}</Text>
    </View>
  );
}




function LeagueMatchSection({ league }: { league: LeagueSection }) {
  const theme = useAppTheme();

  return (
    <View style={styles.leagueSection}>
      <View style={[styles.leagueHeader, { borderColor: theme.border }]}>
        <View style={styles.leagueHeaderLeft}>
          <LeagueLogoMark league={league} />
          <View style={styles.leagueTitleCopy}>
            <Text numberOfLines={1} style={[styles.leagueTitle, { color: theme.foregroundStrong }]}>{league.name}</Text>
            {league.country ? <Text style={[styles.leagueCountry, { color: theme.muted }]}>{league.country}</Text> : null}
          </View>
        </View>
        <View style={[styles.leagueCount, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.leagueCountText, { color: theme.mutedLight }]}>{league.matches.length} matches</Text>
        </View>
      </View>
      <View style={styles.matchList}>
        {league.matches.map((match) => (
          <FeedMatchCard key={`${league.key}-${match.fixtureId}`} league={league} match={match} />
        ))}
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const theme = useAppTheme();
  const { showToast } = useToast();
  const initialDate = dateKey(0);
  const [todayKey, setTodayKey] = useState(initialDate);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedLeagueKey, setSelectedLeagueKey] = useState(ALL_LEAGUES_KEY);
  const [query, setQuery] = useState('');
  const [communityInvite, setCommunityInvite] = useState<TelegramCommunityInvite | null>(null);
  const [communityBannerPreference, setCommunityBannerPreference] = useState<{
    hidden: boolean;
    key: string | null;
  }>({ hidden: false, key: null });

  useEffect(() => {
    const interval = setInterval(() => {
      const nextToday = dateKey(0);
      setTodayKey(nextToday);
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const dateOptions = useMemo(
    () =>
      dateStripKeys(todayKey).map((value) => {
        const date = dateFromKey(value);
        return { main: formatDateStripMain(date, todayKey), sub: formatDateStripSub(date), value };
      }),
    [todayKey],
  );
  const selectedDateLabel = useMemo(() => formatSelectedDateLabel(selectedDate), [selectedDate]);
  const debouncedQuery = query.trim();
  const activeLeagueKey = selectedLeagueKey === ALL_LEAGUES_KEY ? undefined : selectedLeagueKey;

  const me = useMe();
  const subscription = useSubscriptionCurrent();
  const notificationSummary = useNotificationSummary();
  const communityStatus = useTelegramCommunityStatus();
  const createCommunityInvite = useCreateTelegramCommunityInviteMutation();
  const leagues = useLeagues({ date: selectedDate, windowDays: 1 });
  const feed = useInfiniteHomeFeed({
    date: selectedDate,
    leagueKey: activeLeagueKey,
    limit: 24,
    query: debouncedQuery || undefined,
    windowDays: 1,
  });

  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.allSettled([
      feed.refetch(),
      leagues.refetch(),
      notificationSummary.refetch(),
      subscription.refetch(),
    ]);
    setRefreshing(false);
  };

  const leagueOptions = useMemo(() => ((leagues.data ?? []).slice().sort(compareLeagues)), [leagues.data]);
  const feedPages = useMemo(() => feed.data?.pages ?? [], [feed.data?.pages]);
  const leagueSections = useMemo(() => buildLeagueSections(feedPages), [feedPages]);
  const flatMatches = useMemo(() => leagueSections.flatMap((league) => league.matches), [leagueSections]);
  const ongoingMatches = useMemo(() => buildOngoingMatches(leagueSections), [leagueSections]);
  const totalMatches = feedPages[0]?.totalMatches ?? flatMatches.length;
  const bestAccuracy = flatMatches.reduce((max, match) => Math.max(max, getConfidence(match)), 0);
  const tokenBalance = subscription.data?.researchTokensRemaining ?? me.data?.researchTokensRemaining ?? 0;
  const communityPreferenceKey = me.data?.id ? communityBannerHiddenKey(me.data.id) : null;
  const communityBannerPreferenceReady =
    !me.isLoading && (!communityPreferenceKey || communityBannerPreference.key === communityPreferenceKey);
  const communityBannerHidden = communityBannerPreference.key === communityPreferenceKey && communityBannerPreference.hidden;

  useEffect(() => {
    let mounted = true;

    if (!communityPreferenceKey) {
      return () => {
        mounted = false;
      };
    }

    AsyncStorage.getItem(communityPreferenceKey)
      .then((value) => {
        if (!mounted) return;
        setCommunityBannerPreference({ hidden: value === '1', key: communityPreferenceKey });
      })
      .catch(() => {
        if (!mounted) return;
        setCommunityBannerPreference({ hidden: false, key: communityPreferenceKey });
      });

    return () => {
      mounted = false;
    };
  }, [communityPreferenceKey]);

  const hideCommunityBanner = useCallback(() => {
    setCommunityBannerPreference({ hidden: true, key: communityPreferenceKey });
    if (!communityPreferenceKey) return;
    AsyncStorage.setItem(communityPreferenceKey, '1').catch(() => undefined);
  }, [communityPreferenceKey]);

  const handleDateSelect = (value: string) => {
    setSelectedDate(value);
    setSelectedLeagueKey(ALL_LEAGUES_KEY);
  };

  const handleTelegramJoin = () => {
    createCommunityInvite.mutate(undefined, {
      onError: (error) =>
        showToast({
          message: error.message,
          title: 'Community invite failed',
          tone: 'error',
        }),
      onSuccess: (invite) => {
        setCommunityInvite(invite);
        Linking.openURL(invite.inviteLink)
          .then(() => {
            hideCommunityBanner();
            showToast({
              message: 'Invite ready. Opening Telegram.',
              title: 'Community invite',
              tone: 'success',
            });
          })
          .catch(() => {
            showToast({
              message: 'Open Telegram from the invite link.',
              title: 'Could not open Telegram',
              tone: 'error',
            });
          });
      },
    });
  };

  return (
    <Screen hasTabs onRefresh={handleRefresh} refreshing={refreshing} safeTop={false}>
      <DashboardUtilityBar
        image={me.data?.image}
        name={me.data?.name}
        query={query}
        tokenBalance={tokenBalance}
        unreadCount={notificationSummary.data?.unreadCount ?? 0}
        onQueryChange={setQuery}
      />

      <PredictionHero
        bestAccuracy={bestAccuracy}
        isLoading={feed.isLoading && feedPages.length === 0}
        matchCount={totalMatches}
        selectedDateLabel={selectedDateLabel}
      />

      {communityBannerPreferenceReady && !communityBannerHidden ? (
        <TelegramCommunityCard
          invite={communityInvite}
          isCreating={createCommunityInvite.isPending}
          isLoading={communityStatus.isLoading}
          status={communityStatus.data}
          onJoin={handleTelegramJoin}
        />
      ) : null}

      <ReferralPrompt />

      <DateStrip dates={dateOptions} selectedDate={selectedDate} onSelect={handleDateSelect} />

      <OngoingMatchesRail isLoading={feed.isLoading && feedPages.length === 0} matches={ongoingMatches} />

      <LeagueFilterBar
        isLoading={leagues.isLoading}
        leagues={leagueOptions}
        selectedLeagueKey={selectedLeagueKey}
        totalMatches={totalMatches}
        onSelect={setSelectedLeagueKey}
      />

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
        <View style={styles.sections}>
          {leagueSections.map((league) => (
            <LeagueMatchSection key={league.key} league={league} />
          ))}
          <View style={styles.loadMoreWrap}>
            <View style={[styles.loadMorePill, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              {feed.isFetchingNextPage ? <LoaderCircle color={theme.primary} size={15} /> : null}
              <Text style={[styles.loadMoreText, { color: theme.mutedLight }]}>
                Showing {Math.min(flatMatches.length, totalMatches)} of {totalMatches} matches
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
          {debouncedQuery ? `No fixtures match ${debouncedQuery}.` : 'Try another date or league for the next slate.'}
        </DashboardStatePanel>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  accuracyPill: {
    alignItems: 'center',
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  accuracyText: {
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  avatar: {
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 34,
    width: 34,
  },
  bookingCode: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  bookingLabel: {
    fontFamily: fonts.bold,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  bookingValue: {
    fontFamily: fonts.extraBold,
    fontSize: 20,
    letterSpacing: 0,
    marginTop: 4,
  },
  communityButton: {
    minWidth: 170,
  },
  communityCard: {
    gap: spacing.lg,
  },
  communityCopy: {
    flex: 1,
    minWidth: 0,
  },
  communityFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  communityIcon: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  communityStatus: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 12,
    minWidth: 110,
  },
  communityText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
  },
  communityTitle: {
    flex: 1,
    fontFamily: fonts.extraBold,
    fontSize: 18,
  },
  communityTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  communityTop: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
  },
  dateChip: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 62,
    justifyContent: 'center',
    minWidth: 118,
    paddingHorizontal: spacing.lg,
  },
  dateChipMain: {
    fontFamily: fonts.extraBold,
    fontSize: 14,
  },
  dateChipSub: {
    fontFamily: fonts.medium,
    fontSize: 12,
    marginTop: 2,
  },
  datePill: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    height: 44,
    paddingHorizontal: spacing.lg,
  },
  datePillText: {
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  dateStripContent: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  filterBlock: {
    gap: spacing.md,
  },
  hero: {
    gap: spacing.xl,
    paddingVertical: spacing.xl,
  },
  heroActions: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  heroContent: {
    gap: spacing.sm,
  },
  heroCopy: {
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 23,
  },
  heroGlow: {
    backgroundColor: 'rgba(46,242,208,0.04)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  heroTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 32,
    lineHeight: 38,
  },
  horizontalBleed: {
    marginRight: -spacing.md,
  },
  iconPill: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  leagueCount: {
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  leagueCountText: {
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  leagueCountry: {
    fontFamily: fonts.medium,
    fontSize: 12,
    marginTop: 2,
  },
  leagueHeader: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
  },
  leagueHeaderLeft: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minWidth: 0,
  },
  leagueInitials: {
    fontFamily: fonts.extraBold,
    fontSize: 12,
  },
  leagueLogo: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 44,
  },
  leagueLogoImage: {
    height: 32,
    width: 32,
  },
  leagueRail: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  leagueSection: {
    gap: spacing.md,
  },
  leagueSkeleton: {
    borderRadius: radius.pill,
    height: 46,
    opacity: 0.5,
    width: 150,
  },
  leagueTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 18,
  },
  leagueTitleCopy: {
    flex: 1,
    minWidth: 0,
  },
  legCopy: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  legMarket: {
    fontFamily: fonts.bold,
    fontSize: 12,
    marginTop: 5,
  },
  legMeta: {
    fontFamily: fonts.semibold,
    fontSize: 11,
  },
  legReason: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
  },
  legRow: {
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  legStat: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    minWidth: 62,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  legStatLabel: {
    fontFamily: fonts.bold,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  legStatValue: {
    fontFamily: fonts.extraBold,
    fontSize: 16,
    marginTop: 2,
  },
  legStats: {
    gap: spacing.sm,
  },
  legTeams: {
    fontFamily: fonts.extraBold,
    fontSize: 14,
  },
  legsList: {
    gap: spacing.sm,
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
  },
  loadingList: {
    gap: spacing.md,
  },
  lockPreview: {
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 92,
  },
  lockPreviewText: {
    fontFamily: fonts.extraBold,
    fontSize: 13,
  },
  matchCard: {
    gap: spacing.lg,
  },
  matchCenter: {
    alignItems: 'center',
    flex: 0.72,
    gap: spacing.sm,
    minWidth: 72,
  },
  matchCenterText: {
    fontFamily: fonts.extraBold,
    fontSize: 18,
  },
  matchDate: {
    fontFamily: fonts.medium,
    fontSize: 12,
    marginTop: 3,
  },
  matchDetailsButton: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    height: 44,
    justifyContent: 'center',
    minWidth: 190,
    paddingHorizontal: spacing.lg,
  },
  matchDetailsIcon: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  matchDetailsText: {
    fontFamily: fonts.extraBold,
    fontSize: 13,
  },
  matchLeague: {
    fontFamily: fonts.extraBold,
    fontSize: 14,
  },
  matchLeagueCopy: {
    flex: 1,
    minWidth: 0,
  },
  matchList: {
    gap: spacing.md,
  },
  matchSummary: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 19,
  },
  matchTeams: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  matchTop: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  ongoingCard: {
    gap: spacing.md,
  },
  ongoingCardTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ongoingHint: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  ongoingHintText: {
    fontFamily: fonts.bold,
    fontSize: 11,
  },
  ongoingLeague: {
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  ongoingLiveDot: {
    borderRadius: radius.pill,
    height: 7,
    width: 7,
  },
  ongoingLiveMark: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  ongoingLiveText: {
    fontFamily: fonts.extraBold,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  ongoingMatchCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.md,
    minHeight: 184,
    padding: spacing.md,
    width: 278,
  },
  ongoingRail: {
    gap: spacing.md,
    paddingRight: spacing.md,
  },
  ongoingScore: {
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'center',
    minWidth: 76,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  ongoingScoreDivider: {
    fontFamily: fonts.extraBold,
    fontSize: 18,
  },
  ongoingScoreText: {
    fontFamily: fonts.extraBold,
    fontSize: 26,
    fontVariant: ['tabular-nums'],
  },
  ongoingTeam: {
    alignItems: 'flex-start',
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  ongoingTeamName: {
    fontFamily: fonts.bold,
    fontSize: 12,
    lineHeight: 16,
  },
  ongoingTeamNameRight: {
    textAlign: 'right',
  },
  ongoingTeamRight: {
    alignItems: 'flex-end',
  },
  ongoingTeams: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pick: {
    borderRadius: radius.lg,
    borderWidth: 1,
    flex: 1,
    minHeight: 72,
    padding: spacing.md,
  },
  pickGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  pickLabel: {
    fontFamily: fonts.bold,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  pickValue: {
    fontFamily: fonts.extraBold,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 5,
  },
  privateBadge: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  privateBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 10,
  },
  referralAction: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  referralActionText: {
    fontFamily: fonts.extraBold,
    fontSize: 12,
  },
  referralCard: {
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  referralIcon: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  referralLeft: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minWidth: 0,
  },
  referralText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
  },
  scoreBadge: {
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  scoreBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  sections: {
    gap: spacing.xl,
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
  teamName: {
    fontFamily: fonts.extraBold,
    fontSize: 13,
    lineHeight: 18,
    marginTop: spacing.sm,
    textAlign: 'left',
  },
  teamNameRight: {
    textAlign: 'right',
  },
  teamSide: {
    flex: 1,
    minWidth: 0,
  },
  teamSideRight: {
    alignItems: 'flex-end',
  },
  ticketCopy: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 22,
  },
  ticketHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  ticketMetrics: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  ticketTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 24,
    lineHeight: 30,
  },
  unreadDot: {
    borderRadius: radius.pill,
    height: 8,
    position: 'absolute',
    right: 8,
    top: 8,
    width: 8,
  },
  userName: {
    display: 'none',
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  utility: {
    gap: spacing.md,
  },
  utilityActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  walletPill: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    height: 40,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  walletText: {
    fontFamily: fonts.extraBold,
    fontSize: 13,
  },
});
