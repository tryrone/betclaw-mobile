import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { ArrowRightLeft, Bell, Bot, ChevronRight, ExternalLink, Gift, History, LoaderCircle, MessageCircle, Search, UsersRound, Video } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { enterUp, GlassCard, PressableScale, Screen, SPRING_LAYOUT, StatusBadge, TeamLogo } from '@/components/ui';
import { getSportLabel, sports, type MatchCardData } from '@/data/mock';
import { useCreateTelegramCommunityInviteMutation, useHomeFeed, useLeagues, useMe, useNotificationSummary, useSubscriptionCurrent, useTelegramCommunityStatus } from '@/lib/api/hooks';
import type { TelegramCommunityInvite, TelegramCommunityStatus } from '@/lib/api/types';
import { flattenHomeFeed } from '@/lib/mobile-mappers';
import { useAppTheme } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

const userAvatar = require('@/../assets/images/user_avatar.png');

type LeaguePillOption = {
  id: string;
  label: string;
  logoUrl?: string | null;
};

function scoreLabel(match: MatchCardData) {
  if (match.homeScore != null && match.awayScore != null) return `${match.homeScore} : ${match.awayScore}`;
  return match.status === 'Live' ? 'Live' : match.time;
}

function HomeHeader({ name, tokenBalance, unreadCount = 0 }: { name?: string | null; tokenBalance: number; unreadCount?: number }) {
  const router = useRouter();
  const theme = useAppTheme();

  return (
    <View style={styles.headerRow}>
      <View style={styles.headerLeft}>
        <Image source={userAvatar} style={styles.profileAvatar} contentFit="cover" />
        <View>
          <Text style={[styles.kicker, { color: theme.primarySoft }]}>{name ? `Hi, ${name.split(' ')[0]}` : 'Matchday'}</Text>
          <Text style={styles.brandTitle}>BETSCLAW</Text>
        </View>
      </View>
      <View style={styles.headerActions}>
        <View style={[styles.tokenPill, { borderColor: theme.border, backgroundColor: theme.field }]}>
          <Text style={[styles.tokenValue, { color: theme.foregroundStrong }]}>{Number(tokenBalance).toLocaleString()}</Text>
          <Text style={[styles.tokenLabel, { color: theme.muted }]}>tokens</Text>
        </View>
        <PressableScale accessibilityLabel="Search" accessibilityRole="button" style={[styles.circleButton, { backgroundColor: theme.field, borderColor: theme.borderStrong }]}>
          <Search color={theme.foregroundStrong} size={18} strokeWidth={2.4} />
        </PressableScale>
        <PressableScale accessibilityLabel="Notifications" accessibilityRole="button" onPress={() => router.push('/notifications' as any)} style={[styles.circleButton, { backgroundColor: theme.field, borderColor: theme.borderStrong }]}>
          <Bell color={theme.foregroundStrong} size={18} strokeWidth={2.4} />
          {unreadCount > 0 ? <View style={[styles.unreadDot, { backgroundColor: theme.live }]} /> : null}
        </PressableScale>
      </View>
    </View>
  );
}

function SportPills({ onSelect, selected }: { onSelect: (sportId: string) => void; selected: string }) {
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
                styles.sportPill,
                {
                  backgroundColor: active ? 'transparent' : theme.field,
                  borderColor: active ? 'transparent' : theme.border,
                },
              ]}>
              {active ? <LinearGradient colors={['#bdf14a', '#93D51F']} end={{ x: 1, y: 1 }} start={{ x: 0, y: 0 }} style={StyleSheet.absoluteFill} /> : null}
              <Text style={[styles.sportLabel, { color: active ? theme.primaryDark : theme.mutedLight }]}>{sport.label}</Text>
            </PressableScale>
          </Animated.View>
        );
      })}
    </ScrollView>
  );
}

function LeagueRail({ onSelect, options, selected }: { onSelect: (leagueId: string) => void; options: LeaguePillOption[]; selected: string }) {
  const theme = useAppTheme();

  return (
    <ScrollView contentContainerStyle={styles.leagueRail} horizontal showsHorizontalScrollIndicator={false} style={styles.horizontal}>
      {options.map((league) => {
        const active = league.id === selected;
        return (
          <PressableScale
            accessibilityLabel={league.label}
            accessibilityRole="button"
            key={league.id}
            onPress={() => onSelect(league.id)}
            style={styles.leagueItem}>
            <View style={[styles.leagueLogoWrap, { backgroundColor: theme.field, borderColor: active ? theme.selectionBorder : theme.border }]}>
              {league.logoUrl ? (
                <Image source={{ uri: league.logoUrl }} style={styles.leagueLogoImage} contentFit="contain" />
              ) : (
                <Text style={[styles.leagueInitials, { color: active ? theme.primarySoft : theme.mutedLight }]}>
                  {league.label.slice(0, 3).toUpperCase()}
                </Text>
              )}
            </View>
            <Text numberOfLines={1} style={[styles.leagueLabel, { color: active ? theme.foregroundStrong : theme.mutedLight }]}>
              {league.label}
            </Text>
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
    <GlassCard gradient="matchHero" style={styles.heroCard}>
      <View style={styles.heroTop}>
        <View>
          <Text style={styles.heroSectionTitle}>Live Match</Text>
          <Text numberOfLines={1} style={styles.heroLeague}>{match.league}</Text>
        </View>
        <StatusBadge label={match.clock ?? match.status} tone={match.status === 'Live' ? 'danger' : 'accent'} />
      </View>

      <PressableScale accessibilityLabel="Open live match details" accessibilityRole="button" onPress={() => router.push(`/match/${match.id}` as any)} scaleTo={0.98}>
        <View style={styles.heroScorePanel}>
          <View style={styles.heroVenuePill}>
            <Text numberOfLines={1} style={styles.heroVenue}>{match.venue}</Text>
          </View>
          <Text style={styles.heroWeek}>{match.date}</Text>

          <View style={styles.heroTeamsContainer}>
            <View style={styles.heroTeamSide}>
              <TeamLogo logoUrl={match.homeLogoUrl} name={match.home} size={58} />
              <Text numberOfLines={1} style={styles.heroTeamName}>{match.home}</Text>
              <Text style={styles.heroSideLabel}>Home</Text>
            </View>

            <View style={styles.heroCenterBlock}>
              <Text adjustsFontSizeToFit numberOfLines={1} style={styles.scoreText}>{scoreLabel(match)}</Text>
              <View style={styles.liveTimeRow}>
                <View style={[styles.liveDot, { backgroundColor: theme.live }]} />
                <Text style={styles.liveTimeText}>{match.clock ?? match.time}</Text>
              </View>
            </View>

            <View style={styles.heroTeamSide}>
              <TeamLogo logoUrl={match.awayLogoUrl} name={match.away} size={58} />
              <Text numberOfLines={1} style={styles.heroTeamName}>{match.away}</Text>
              <Text style={styles.heroSideLabel}>Away</Text>
            </View>
          </View>
        </View>
      </PressableScale>

      <View style={styles.heroActions}>
        <PressableScale
          accessibilityLabel="Watch live match center"
          accessibilityRole="button"
          onPress={() => router.push({ pathname: '/live-match', params: { fixtureId: match.id } } as any)}
          style={[styles.watchButton, { borderColor: theme.selectionBorder, backgroundColor: 'rgba(255,255,255,0.10)' }]}>
          <Video color={theme.accent} size={17} />
          <Text style={styles.watchButtonText}>Watch Live</Text>
        </PressableScale>
        <View style={styles.heroDots}>
          <View style={[styles.dot, { backgroundColor: theme.muted }]} />
          <View style={[styles.dotActive, { backgroundColor: theme.accent }]} />
          <View style={[styles.dot, { backgroundColor: theme.muted }]} />
        </View>
      </View>
    </GlassCard>
  );
}

function TelegramCommunityCard({
  invite,
  isCreating,
  isLoading,
  message,
  onJoin,
  status,
}: {
  invite: TelegramCommunityInvite | null;
  isCreating: boolean;
  isLoading: boolean;
  message: { type: 'success' | 'error'; text: string } | null;
  onJoin: () => void;
  status?: TelegramCommunityStatus;
}) {
  const theme = useAppTheme();
  const communityName = status?.communityName ?? 'BetsClaw Community';
  const ready = Boolean(status?.enabled && status.configured);
  const inviteExpiry = invite
    ? new Date(invite.expiresAt).toLocaleString(undefined, { day: 'numeric', hour: 'numeric', minute: '2-digit', month: 'short' })
    : null;

  return (
    <GlassCard gradient="hero" style={styles.communityCard}>
      <View style={styles.communityTop}>
        <View style={[styles.communityIcon, { borderColor: theme.borderStrong, backgroundColor: theme.primarySubtle }]}>
          <MessageCircle color={theme.primarySoft} size={22} />
        </View>
        <View style={styles.communityCopy}>
          <View style={styles.communityTitleRow}>
            <Text numberOfLines={1} style={styles.communityTitle}>{communityName}</Text>
            <View style={[styles.communityBadge, { borderColor: theme.border }]}>
              <UsersRound color={theme.mutedLight} size={12} />
              <Text style={[styles.communityBadgeText, { color: theme.mutedLight }]}>Private</Text>
            </View>
          </View>
          <Text numberOfLines={2} style={[styles.communityText, { color: theme.mutedLight }]}>
            Talk match context, live reactions, and analysis with other BetClaw users.
          </Text>
        </View>
      </View>

      <View style={styles.communityFooter}>
        <PressableScale
          accessibilityLabel="Join Telegram community"
          accessibilityRole="button"
          disabled={!ready || isLoading || isCreating}
          onPress={onJoin}
          style={[styles.communityButton, { opacity: !ready || isLoading || isCreating ? 0.55 : 1 }]}>
          <LinearGradient colors={['#bdf14a', '#93D51F']} end={{ x: 1, y: 1 }} start={{ x: 0, y: 0 }} style={StyleSheet.absoluteFill} />
          {isCreating || isLoading ? <LoaderCircle color={theme.primaryDark} size={16} /> : <MessageCircle color={theme.primaryDark} size={16} />}
          <Text style={[styles.communityButtonText, { color: theme.primaryDark }]}>{ready ? 'Join Community' : 'Setup Pending'}</Text>
          {invite ? <ExternalLink color={theme.primaryDark} size={14} /> : null}
        </PressableScale>
        {message ? (
          <Text numberOfLines={1} style={[styles.communityStatus, { color: message.type === 'error' ? theme.danger : theme.success }]}>
            {message.text}
          </Text>
        ) : inviteExpiry ? (
          <Text numberOfLines={1} style={[styles.communityStatus, { color: theme.muted }]}>Expires {inviteExpiry}</Text>
        ) : null}
      </View>
    </GlassCard>
  );
}

function MatchFeedCard({ match }: { match: MatchCardData }) {
  const router = useRouter();
  const theme = useAppTheme();

  return (
    <PressableScale accessibilityLabel={`${match.home} versus ${match.away}`} accessibilityRole="button" onPress={() => router.push(`/match/${match.id}` as any)} scaleTo={0.98}>
      <GlassCard style={styles.matchFeedCard}>
        <View style={styles.matchTeamsRow}>
          <View style={styles.matchTeamSide}>
            <Text numberOfLines={1} style={[styles.matchTeamLabel, { color: theme.foregroundStrong }]}>{match.home}</Text>
            <TeamLogo logoUrl={match.homeLogoUrl} name={match.home} size={28} />
          </View>
          <View style={styles.matchCenter}>
            <Text style={[styles.matchTimeText, { color: match.status === 'Live' ? theme.live : theme.primarySoft }]}>{match.clock ?? match.time}</Text>
            <Text style={[styles.matchDateText, { color: theme.muted }]}>{match.date}</Text>
          </View>
          <View style={[styles.matchTeamSide, styles.matchAwaySide]}>
            <TeamLogo logoUrl={match.awayLogoUrl} name={match.away} size={28} />
            <Text numberOfLines={1} style={[styles.matchTeamLabel, { color: theme.foregroundStrong }]}>{match.away}</Text>
          </View>
        </View>
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
          style={[styles.shortcutCard, { backgroundColor: theme.field, borderColor: theme.border }]}>
          <View style={[styles.shortcutIcon, { backgroundColor: theme.primarySubtle, borderColor: theme.borderAccent }]}>
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
  const [communityInvite, setCommunityInvite] = useState<TelegramCommunityInvite | null>(null);
  const [communityMessage, setCommunityMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const me = useMe();
  const subscription = useSubscriptionCurrent();
  const notificationSummary = useNotificationSummary();
  const communityStatus = useTelegramCommunityStatus();
  const createCommunityInvite = useCreateTelegramCommunityInviteMutation();
  const leagueList = useLeagues({ dateRange: 'today', windowDays: 1 });
  const leagueOptions = useMemo<LeaguePillOption[]>(
    () => [
      { id: 'all', label: 'All' },
      ...(leagueList.data ?? []).map((league) => ({
        id: league.key,
        label: league.name,
        logoUrl: league.logoUrl,
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

  const handleTelegramJoin = () => {
    setCommunityMessage(null);
    createCommunityInvite.mutate(undefined, {
      onError: (error) => {
        setCommunityMessage({ type: 'error', text: error.message });
      },
      onSuccess: (invite) => {
        setCommunityInvite(invite);
        setCommunityMessage({ type: 'success', text: 'Invite ready. Opening Telegram.' });
        Linking.openURL(invite.inviteLink).catch(() => {
          setCommunityMessage({ type: 'error', text: 'Open Telegram from the invite link.' });
        });
      },
    });
  };

  return (
    <Screen hasTabs>
      <Animated.View entering={enterUp(0)}>
        <HomeHeader name={me.data?.name} tokenBalance={tokenBalance} unreadCount={notificationSummary.data?.unreadCount ?? 0} />
      </Animated.View>

      <Animated.View entering={enterUp(1)}>
        <SportPills onSelect={handleSportSelect} selected={selectedSport} />
      </Animated.View>

      <Animated.View entering={enterUp(2)}>
        <LeagueRail onSelect={setSelectedLeague} options={leagueOptions} selected={activeLeague} />
      </Animated.View>

      <Animated.View entering={enterUp(3)}>
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

      <Animated.View entering={enterUp(4)}>
        <TelegramCommunityCard
          invite={communityInvite}
          isCreating={createCommunityInvite.isPending}
          isLoading={communityStatus.isLoading}
          message={communityMessage}
          status={communityStatus.data}
          onJoin={handleTelegramJoin}
        />
      </Animated.View>

      <Animated.View entering={enterUp(5)} style={styles.sectionHeader}>
        <View>
          <Text style={[styles.sectionTitle, { color: theme.foregroundStrong }]}>Today Match</Text>
          <Text style={[styles.sectionCaption, { color: theme.muted }]}>{sectionCaption}</Text>
        </View>
        <PressableScale accessibilityLabel="See all matches" accessibilityRole="button" onPress={() => router.push('/matches' as any)} style={styles.seeAll}>
          <Text style={[styles.sectionAction, { color: theme.primarySoft }]}>View all</Text>
          <ChevronRight color={theme.primarySoft} size={16} strokeWidth={2.6} />
        </PressableScale>
      </Animated.View>

      {feedMatches.length === 0 ? (
        <Animated.View entering={enterUp(6)}>
          <GlassCard style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: theme.foregroundStrong }]}>No fixtures found</Text>
            <Text style={[styles.emptyCopy, { color: theme.muted }]}>Switch sport or league for another slate.</Text>
          </GlassCard>
        </Animated.View>
      ) : null}

      {feedMatches.map((match, index) => (
        <Animated.View entering={enterUp(6 + index)} key={match.id}>
          <MatchFeedCard match={match} />
        </Animated.View>
      ))}

      <Animated.View entering={FadeIn.delay(280).duration(220)}>
        <ShortcutGrid />
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brandTitle: {
    color: '#ffffff',
    fontFamily: fonts.extraBold,
    fontSize: 27,
    letterSpacing: 0,
    lineHeight: 31,
  },
  circleButton: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  communityBadge: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  communityBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 10,
  },
  communityButton: {
    alignItems: 'center',
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: 7,
    height: 42,
    justifyContent: 'center',
    minWidth: 160,
    overflow: 'hidden',
    paddingHorizontal: spacing.md,
  },
  communityButtonText: {
    fontFamily: fonts.extraBold,
    fontSize: 13,
  },
  communityCard: {
    gap: spacing.md,
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
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  communityStatus: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 11,
    minWidth: 120,
  },
  communityText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 5,
  },
  communityTitle: {
    color: '#ffffff',
    flex: 1,
    fontFamily: fonts.extraBold,
    fontSize: 16,
  },
  communityTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  communityTop: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dot: {
    borderRadius: radius.pill,
    height: 6,
    opacity: 0.45,
    width: 6,
  },
  dotActive: {
    borderRadius: radius.pill,
    height: 6,
    width: 28,
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
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  headerLeft: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minWidth: 0,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  heroActions: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  heroCard: {
    gap: spacing.md,
    overflow: 'hidden',
    padding: spacing.md,
  },
  heroCenterBlock: {
    alignItems: 'center',
    flex: 1,
    minWidth: 92,
  },
  heroDots: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  heroLeague: {
    color: 'rgba(255,255,255,0.70)',
    fontFamily: fonts.bold,
    fontSize: 12,
    marginTop: 2,
  },
  heroScorePanel: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 22,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  heroSectionTitle: {
    color: '#ffffff',
    fontFamily: fonts.extraBold,
    fontSize: 20,
  },
  heroSideLabel: {
    color: 'rgba(255,255,255,0.64)',
    fontFamily: fonts.medium,
    fontSize: 11,
    marginTop: 2,
  },
  heroTeamName: {
    color: '#ffffff',
    fontFamily: fonts.extraBold,
    fontSize: 14,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  heroTeamSide: {
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  heroTeamsContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  heroTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroVenue: {
    color: '#ffffff',
    fontFamily: fonts.extraBold,
    fontSize: 13,
    textAlign: 'center',
  },
  heroVenuePill: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.pill,
    maxWidth: '78%',
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
  },
  heroWeek: {
    color: 'rgba(255,255,255,0.70)',
    fontFamily: fonts.medium,
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
  leagueInitials: {
    fontFamily: fonts.extraBold,
    fontSize: 12,
  },
  leagueItem: {
    alignItems: 'center',
    gap: spacing.xs,
    width: 78,
  },
  leagueLabel: {
    fontFamily: fonts.bold,
    fontSize: 11,
    maxWidth: 74,
    textAlign: 'center',
  },
  leagueLogoImage: {
    height: 38,
    width: 38,
  },
  leagueLogoWrap: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 2,
    height: 62,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 62,
  },
  leagueRail: {
    gap: spacing.sm,
    paddingRight: spacing.md,
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
    marginTop: 2,
  },
  liveTimeText: {
    color: 'rgba(255,255,255,0.78)',
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  matchAwaySide: {
    justifyContent: 'flex-end',
  },
  matchCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 72,
  },
  matchDateText: {
    fontFamily: fonts.medium,
    fontSize: 10,
    marginTop: 2,
  },
  matchFeedCard: {
    padding: spacing.md,
  },
  matchTeamLabel: {
    flexShrink: 1,
    fontFamily: fonts.extraBold,
    fontSize: 14,
  },
  matchTeamSide: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
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
    borderColor: 'rgba(255,255,255,0.24)',
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 40,
    width: 40,
  },
  scoreText: {
    color: '#ffffff',
    fontFamily: fonts.extraBold,
    fontSize: 40,
    lineHeight: 44,
    textAlign: 'center',
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
    marginTop: spacing.xs,
  },
  sectionTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 21,
  },
  seeAll: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
  },
  shortcutCard: {
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    flexBasis: '47%',
    flexDirection: 'row',
    flexGrow: 1,
    gap: spacing.sm,
    minHeight: 60,
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
  sportLabel: {
    fontFamily: fonts.extraBold,
    fontSize: 14,
  },
  sportPill: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    minWidth: 122,
    overflow: 'hidden',
    paddingHorizontal: spacing.lg,
  },
  tokenLabel: {
    fontFamily: fonts.bold,
    fontSize: 9,
    marginTop: -1,
  },
  tokenPill: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    minWidth: 58,
    paddingHorizontal: 9,
  },
  tokenValue: {
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
  watchButton: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    height: 48,
    justifyContent: 'center',
    width: '100%',
  },
  watchButtonText: {
    color: '#ffffff',
    fontFamily: fonts.extraBold,
    fontSize: 15,
  },
});
