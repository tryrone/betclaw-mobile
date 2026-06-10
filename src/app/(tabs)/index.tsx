import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Bell, Search, Star, Calendar, ChevronUp, ChevronDown } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { enterUp, GlassCard, PressableScale, Screen, SPRING_LAYOUT, TeamLogo } from '@/components/ui';
import {
  liveMatch,
  matches,
  sports,
  wallet,
  type MatchCardData,
  type MatchOdds,
} from '@/data/mock';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

const userAvatar = require('@/../assets/images/user_avatar.png');

function BalanceHeader() {
  return (
    <View style={styles.headerRow}>
      <View style={styles.headerLeft}>
        <Image
          source={userAvatar}
          style={styles.profileAvatar}
          contentFit="cover"
        />
        <View style={styles.balanceInfo}>
          <Text style={styles.balanceLabel}>Balance</Text>
          <Text style={styles.balanceValue}>{wallet.balance}</Text>
        </View>
      </View>
      <View style={styles.headerActions}>
        <PressableScale accessibilityLabel="Search" accessibilityRole="button" style={styles.circleButton}>
          <Search color={colors.foreground} size={18} strokeWidth={2.4} />
        </PressableScale>
        <PressableScale accessibilityLabel="Notifications" accessibilityRole="button" style={styles.circleButton}>
          <Bell color={colors.foreground} size={18} strokeWidth={2.4} />
        </PressableScale>
      </View>
    </View>
  );
}

function SportPills() {
  const [selected, setSelected] = useState('football');

  return (
    <ScrollView
      contentContainerStyle={styles.pillRow}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.horizontal}>
      {sports.map((sport) => {
        const active = sport.id === selected;
        return (
          <Animated.View key={sport.id} layout={SPRING_LAYOUT}>
            <PressableScale
              accessibilityLabel={sport.label}
              accessibilityRole="button"
              onPress={() => setSelected(sport.id)}
              style={active ? styles.sportPillActive : styles.sportPillCircle}>
              <Text style={[styles.sportEmoji, active && styles.sportEmojiActive]}>
                {sport.emoji}
              </Text>
              {active ? (
                <Animated.Text entering={FadeIn.duration(180)} style={styles.sportLabel}>
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

function OddsChip({
  highlighted,
  label,
  value,
}: {
  highlighted?: boolean;
  label: string;
  value: number;
}) {
  return (
    <PressableScale
      accessibilityLabel={`${label} at ${value}`}
      accessibilityRole="button"
      scaleTo={0.94}
      style={[styles.oddsChip, highlighted && styles.oddsChipActive]}>
      <Text style={[styles.oddsLabel, highlighted && styles.oddsLabelActive]}>{label}</Text>
      <Text style={[styles.oddsValue, highlighted && styles.oddsValueActive]}>{value.toFixed(2)}</Text>
    </PressableScale>
  );
}

function OddsRow({ odds, recommended }: { odds: MatchOdds; recommended?: keyof MatchOdds }) {
  return (
    <View style={styles.oddsRow}>
      <OddsChip highlighted={recommended === 'home'} label="1" value={odds.home} />
      <OddsChip highlighted={recommended === 'draw'} label="x" value={odds.draw} />
      <OddsChip highlighted={recommended === 'away'} label="2" value={odds.away} />
    </View>
  );
}

function LiveMatchHero() {
  const router = useRouter();

  return (
    <PressableScale
      accessibilityLabel="Open live match details"
      accessibilityRole="button"
      onPress={() => router.push('/live-match' as any)}
      scaleTo={0.98}
      style={styles.heroPressable}>
      <GlassCard style={styles.heroCard}>
        {/* Top Header */}
        <View style={styles.heroTop}>
          <Text style={styles.heroEyebrow}>Match day 1</Text>
          <View style={styles.heroTopRight}>
            <Calendar color={colors.muted} size={15} strokeWidth={2.4} />
            <Star color={colors.muted} size={15} strokeWidth={2.4} style={styles.starIcon} />
          </View>
        </View>

        {/* Teams, Crests, Scores & Live Clock */}
        <View style={styles.heroTeamsContainer}>
          {/* Home Team */}
          <View style={styles.heroTeamSide}>
            <TeamLogo name={liveMatch.home} size={48} />
            <Text numberOfLines={1} style={styles.heroTeamName}>
              {liveMatch.home}
            </Text>
          </View>

          {/* Center Info: UCL, Live dot, Time and score numbers */}
          <View style={styles.heroCenterBlock}>
            <Text style={styles.heroLeague}>{liveMatch.league}</Text>
            <Text style={styles.heroStage}>{liveMatch.stage}</Text>

            <View style={styles.scoreAndClock}>
              <Text style={styles.scoreValue}>{liveMatch.homeScore}</Text>

              <View style={styles.centerClockPill}>
                <View style={styles.liveIndicator}>
                  <View style={styles.liveRedDot} />
                  <Text style={styles.liveText}>Live</Text>
                </View>
                <Text style={styles.clockTime}>{liveMatch.clock}</Text>
                <Text style={styles.periodLabel}>{liveMatch.period}</Text>
              </View>

              <Text style={styles.scoreValue}>{liveMatch.awayScore}</Text>
            </View>
          </View>

          {/* Away Team */}
          <View style={styles.heroTeamSide}>
            <TeamLogo name={liveMatch.away} size={48} />
            <Text numberOfLines={1} style={styles.heroTeamName}>
              {liveMatch.away}
            </Text>
          </View>
        </View>
      </GlassCard>

      {/* Pagination indicators under the card */}
      <View style={styles.cardPagination}>
        <View style={[styles.paginationDot, styles.paginationDotActive]} />
        <View style={styles.paginationDot} />
        <View style={styles.paginationDot} />
      </View>
    </PressableScale>
  );
}

function MatchFeedCard({ match }: { match: MatchCardData }) {
  return (
    <GlassCard style={styles.matchFeedCard}>
      {/* Teams Row with time in between */}
      <View style={styles.matchTeamsRow}>
        {/* Home */}
        <View style={styles.matchTeamCol}>
          <TeamLogo name={match.home} size={44} />
          <Text numberOfLines={1} style={styles.matchTeamLabel}>
            {match.home}
          </Text>
        </View>

        {/* Center Date */}
        <View style={styles.matchDateCol}>
          <Text style={styles.matchDateText}>{match.time.split(' ')[0]} {match.time.split(' ')[1]}</Text>
          <Text style={styles.matchTimeText}>{match.time.split(' ')[2]}</Text>
        </View>

        {/* Away */}
        <View style={styles.matchTeamCol}>
          <TeamLogo name={match.away} size={44} />
          <Text numberOfLines={1} style={styles.matchTeamLabel}>
            {match.away}
          </Text>
        </View>
      </View>

      {/* Odds Row at the bottom */}
      <OddsRow odds={match.odds} recommended={match.recommended} />
    </GlassCard>
  );
}

export default function DashboardScreen() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Screen hasTabs>
      <Animated.View entering={enterUp(0)}>
        <BalanceHeader />
      </Animated.View>

      <Animated.View entering={enterUp(1)}>
        <SportPills />
      </Animated.View>

      <Animated.View entering={enterUp(2)}>
        <LiveMatchHero />
      </Animated.View>

      {/* UCL Section Header */}
      <Animated.View entering={enterUp(3)} style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          <Text style={styles.sectionTitle}>UEFA Champions League</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>4</Text>
          </View>
        </View>
        <PressableScale
          accessibilityLabel="Toggle league feed"
          accessibilityRole="button"
          onPress={() => setCollapsed(!collapsed)}>
          {collapsed ? (
            <ChevronDown color={colors.foreground} size={18} strokeWidth={2.4} />
          ) : (
            <ChevronUp color={colors.foreground} size={18} strokeWidth={2.4} />
          )}
        </PressableScale>
      </Animated.View>

      {/* UCL Matches Feed */}
      {!collapsed &&
        matches.map((match, index) => (
          <Animated.View entering={enterUp(4 + index)} key={match.id}>
            <MatchFeedCard match={match} />
          </Animated.View>
        ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  balanceInfo: {
    marginLeft: spacing.sm,
  },
  balanceLabel: {
    color: colors.muted,
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  balanceValue: {
    color: colors.foregroundStrong,
    fontFamily: fonts.extraBold,
    fontSize: 20,
    marginTop: 1,
  },
  cardPagination: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  centerClockPill: {
    alignItems: 'center',
    backgroundColor: '#0a0b0b',
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    width: 90,
  },
  circleButton: {
    alignItems: 'center',
    backgroundColor: colors.panel,
    borderColor: colors.borderStrong,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  clockTime: {
    color: colors.foregroundStrong,
    fontFamily: fonts.extraBold,
    fontSize: 14,
    marginTop: 2,
  },
  countBadge: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countText: {
    color: colors.mutedLight,
    fontFamily: fonts.bold,
    fontSize: 11,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerLeft: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  heroCard: {
    backgroundColor: '#151718',
    borderColor: '#202123',
    borderWidth: 1,
    gap: spacing.lg,
    padding: spacing.lg,
  },
  heroCenterBlock: {
    alignItems: 'center',
    flex: 1,
  },
  heroEyebrow: {
    color: colors.mutedLight,
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  heroLeague: {
    color: colors.foreground,
    fontFamily: fonts.bold,
    fontSize: 11,
    textAlign: 'center',
  },
  heroPressable: {
    width: '100%',
  },
  heroStage: {
    color: colors.muted,
    fontFamily: fonts.medium,
    fontSize: 10,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  heroTeamName: {
    color: colors.foregroundStrong,
    fontFamily: fonts.bold,
    fontSize: 12,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  heroTeamSide: {
    alignItems: 'center',
    width: 80,
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
  heroTopRight: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  horizontal: {
    marginRight: -spacing.lg,
  },
  liveIndicator: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  liveRedDot: {
    backgroundColor: colors.danger,
    borderRadius: radius.pill,
    height: 6,
    width: 6,
  },
  liveText: {
    color: colors.danger,
    fontFamily: fonts.bold,
    fontSize: 9,
    textTransform: 'uppercase',
  },
  matchDateCol: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchDateText: {
    color: colors.foregroundStrong,
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  matchFeedCard: {
    backgroundColor: '#151718',
    borderColor: '#202123',
    borderWidth: 1,
    gap: spacing.lg,
    padding: spacing.md + 2,
  },
  matchTeamCol: {
    alignItems: 'center',
    width: 80,
  },
  matchTeamLabel: {
    color: colors.foreground,
    fontFamily: fonts.bold,
    fontSize: 11,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  matchTeamsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
  },
  matchTimeText: {
    color: colors.muted,
    fontFamily: fonts.medium,
    fontSize: 11,
    marginTop: 2,
  },
  oddsChip: {
    alignItems: 'center',
    backgroundColor: '#0a0b0b',
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    paddingVertical: 12,
  },
  oddsChipActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  oddsLabel: {
    color: colors.muted,
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  oddsLabelActive: {
    color: colors.primary,
  },
  oddsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  oddsValue: {
    color: colors.foregroundStrong,
    fontFamily: fonts.extraBold,
    fontSize: 13,
  },
  oddsValueActive: {
    color: colors.primary,
  },
  paginationDot: {
    backgroundColor: '#3a3f3e',
    borderRadius: radius.pill,
    height: 6,
    width: 6,
  },
  paginationDotActive: {
    backgroundColor: colors.primary,
    width: 20,
  },
  periodLabel: {
    color: colors.muted,
    fontFamily: fonts.medium,
    fontSize: 10,
    marginTop: 1,
  },
  pillRow: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  profileAvatar: {
    borderRadius: radius.pill,
    height: 44,
    width: 44,
  },
  scoreAndClock: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  scoreValue: {
    color: colors.foregroundStrong,
    fontFamily: fonts.extraBold,
    fontSize: 36,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  sectionHeaderLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.foregroundStrong,
    fontFamily: fonts.extraBold,
    fontSize: 16,
  },
  sportEmoji: {
    fontSize: 15,
  },
  sportEmojiActive: {},
  sportLabel: {
    color: colors.black,
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  sportPillActive: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: spacing.sm,
    height: 40,
    justifyContent: 'center',
    paddingHorizontal: spacing.md + 4,
  },
  sportPillCircle: {
    alignItems: 'center',
    backgroundColor: '#151718',
    borderColor: '#202123',
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  starIcon: {
    marginLeft: spacing.sm,
  },
});
