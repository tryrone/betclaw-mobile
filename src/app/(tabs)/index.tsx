import { Bell, Search, Sparkles, Star } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { enterUp, GlassCard, LiveDot, PressableScale, Screen, SPRING_LAYOUT, StatusBadge } from '@/components/ui';
import {
  dateChips,
  leagues,
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

function TeamAvatar({ name, size = 40 }: { name: string; size?: number }) {
  return (
    <View style={[styles.avatar, { borderRadius: size / 2, height: size, width: size }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.28 }]}>{name.slice(0, 3).toUpperCase()}</Text>
    </View>
  );
}

function BalanceHeader() {
  return (
    <View style={styles.headerRow}>
      <View style={styles.headerLeft}>
        <View style={styles.profileAvatar}>
          <Text style={styles.profileInitial}>T</Text>
        </View>
        <View>
          <Text style={styles.balanceLabel}>Balance</Text>
          <Text style={styles.balanceValue}>{wallet.balance}</Text>
        </View>
      </View>
      <View style={styles.headerActions}>
        <PressableScale accessibilityLabel="Search" accessibilityRole="button" style={styles.circleButton}>
          <Search color={colors.mutedLight} size={18} strokeWidth={2.2} />
        </PressableScale>
        <PressableScale accessibilityLabel="Notifications" accessibilityRole="button" style={styles.circleButton}>
          <Bell color={colors.mutedLight} size={18} strokeWidth={2.2} />
          <View style={styles.unreadDot} />
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
              style={[styles.sportPill, active && styles.sportPillActive]}>
              <Text style={styles.sportEmoji}>{sport.emoji}</Text>
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
      scaleTo={0.93}
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
      <OddsChip highlighted={recommended === 'draw'} label="X" value={odds.draw} />
      <OddsChip highlighted={recommended === 'away'} label="2" value={odds.away} />
    </View>
  );
}

function LiveMatchHero() {
  return (
    <GlassCard gradient="hero" style={styles.heroCard}>
      <View style={styles.heroTop}>
        <Text style={styles.heroEyebrow}>Match day 1</Text>
        <View style={styles.heroTopRight}>
          <LiveDot label="Live" />
          <PressableScale accessibilityLabel="Favorite match" accessibilityRole="button" style={styles.starButton}>
            <Star color={colors.accent} size={15} strokeWidth={2.4} />
          </PressableScale>
        </View>
      </View>

      <View style={styles.heroTeams}>
        <View style={styles.heroTeam}>
          <TeamAvatar name={liveMatch.home} size={52} />
          <Text numberOfLines={1} style={styles.heroTeamName}>
            {liveMatch.home}
          </Text>
        </View>
        <View style={styles.heroCenter}>
          <Text style={styles.heroLeague}>{liveMatch.league}</Text>
          <Text style={styles.heroStage}>{liveMatch.stage}</Text>
        </View>
        <View style={styles.heroTeam}>
          <TeamAvatar name={liveMatch.away} size={52} />
          <Text numberOfLines={1} style={styles.heroTeamName}>
            {liveMatch.away}
          </Text>
        </View>
      </View>

      <View style={styles.scoreRow}>
        <Text style={styles.score}>{liveMatch.homeScore}</Text>
        <View style={styles.clockChip}>
          <Text style={styles.clock}>{liveMatch.clock}</Text>
          <Text style={styles.period}>{liveMatch.period}</Text>
        </View>
        <Text style={styles.score}>{liveMatch.awayScore}</Text>
      </View>

      <OddsRow odds={liveMatch.odds} />
    </GlassCard>
  );
}

function MatchCard({ match }: { match: MatchCardData }) {
  const confidenceTone = match.confidence >= 70 ? 'success' : match.confidence >= 55 ? 'warning' : 'danger';

  return (
    <GlassCard style={styles.matchCard}>
      <View style={styles.matchTop}>
        <View style={styles.matchTeam}>
          <TeamAvatar name={match.home} />
          <Text numberOfLines={1} style={styles.matchTeamName}>
            {match.home}
          </Text>
        </View>
        <View style={styles.matchTimeChip}>
          <Text style={styles.matchTime}>{match.time}</Text>
          <Text numberOfLines={1} style={styles.matchLeague}>
            {match.league}
          </Text>
        </View>
        <View style={[styles.matchTeam, styles.matchTeamRight]}>
          <TeamAvatar name={match.away} />
          <Text numberOfLines={1} style={styles.matchTeamName}>
            {match.away}
          </Text>
        </View>
      </View>

      <OddsRow odds={match.odds} recommended={match.recommended} />

      <View style={styles.pickBox}>
        <View style={styles.pickCopy}>
          <Text numberOfLines={1} style={styles.pick}>
            {match.pick}
          </Text>
          <Text style={styles.readiness}>{match.readiness} data · edge {match.edge}</Text>
        </View>
        <StatusBadge label={`${match.confidence}%`} tone={confidenceTone} />
      </View>
    </GlassCard>
  );
}

function DateChips() {
  const [selected, setSelected] = useState('today');

  return (
    <ScrollView
      contentContainerStyle={styles.chipRow}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.horizontal}>
      {dateChips.map((chip) => {
        const active = chip.id === selected;
        return (
          <PressableScale
            accessibilityLabel={`${chip.day} ${chip.date}`}
            accessibilityRole="button"
            key={chip.id}
            onPress={() => setSelected(chip.id)}
            style={[styles.dateChip, active && styles.selectedChip]}>
            <Text style={[styles.dateDay, active && styles.selectedText]}>{chip.day}</Text>
            <Text style={styles.dateValue}>{chip.date}</Text>
          </PressableScale>
        );
      })}
    </ScrollView>
  );
}

export default function DashboardScreen() {
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

      <Animated.View entering={enterUp(3)}>
        <GlassCard gradient="card" style={styles.dailyCard}>
          <View style={styles.dailyTop}>
            <StatusBadge label="Daily ticket" tone="accent" />
            <Text style={styles.legs}>5 legs</Text>
          </View>
          <View style={styles.statsGrid}>
            <View>
              <Text style={styles.statLabel}>Total odds</Text>
              <Text style={styles.statValue}>8.42</Text>
            </View>
            <View>
              <Text style={styles.statLabel}>Avg conf.</Text>
              <Text style={[styles.statValue, styles.successText]}>71%</Text>
            </View>
            <View>
              <Text style={styles.statLabel}>Edge</Text>
              <Text style={[styles.statValue, styles.primaryText]}>+7.1</Text>
            </View>
          </View>
          <View style={styles.heroSummary}>
            <Sparkles color={colors.primary} size={17} />
            <Text style={styles.heroSummaryText}>
              AI-curated slip favors resilient markets and verified source coverage.
            </Text>
          </View>
        </GlassCard>
      </Animated.View>

      <Animated.View entering={enterUp(4)}>
        <DateChips />
      </Animated.View>

      <Animated.View entering={enterUp(5)} style={styles.leagueWrap}>
        <ScrollView
          contentContainerStyle={styles.leagueRow}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.horizontal}>
          {leagues.map((league) => (
            <StatusBadge key={league} label={league} tone={league === 'All' ? 'accent' : 'neutral'} />
          ))}
        </ScrollView>
      </Animated.View>

      <Animated.View entering={enterUp(6)} style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Matchday feed</Text>
        <Text style={styles.sectionAction}>Today</Text>
      </Animated.View>

      {matches.map((match, index) => (
        <Animated.View entering={enterUp(7 + index)} key={match.id}>
          <MatchCard match={match} />
        </Animated.View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.primaryMuted,
    borderColor: colors.borderAccent,
    borderWidth: 1,
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.primary,
    fontFamily: fonts.extraBold,
  },
  balanceLabel: {
    color: colors.muted,
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
  balanceValue: {
    color: colors.foregroundStrong,
    fontFamily: fonts.extraBold,
    fontSize: 19,
    marginTop: 1,
  },
  chipRow: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  circleButton: {
    alignItems: 'center',
    backgroundColor: colors.input,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  clock: {
    color: colors.foregroundStrong,
    fontFamily: fonts.extraBold,
    fontSize: 15,
  },
  clockChip: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    minWidth: 86,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  dailyCard: {
    overflow: 'hidden',
  },
  dailyTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateChip: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    height: 58,
    justifyContent: 'center',
    width: 70,
  },
  dateDay: {
    color: colors.mutedLight,
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  dateValue: {
    color: colors.muted,
    fontFamily: fonts.semibold,
    fontSize: 10,
    marginTop: 3,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroCard: {
    gap: spacing.lg,
    overflow: 'hidden',
  },
  heroCenter: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  heroEyebrow: {
    color: colors.mutedLight,
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: 0.3,
  },
  heroLeague: {
    color: colors.foreground,
    fontFamily: fonts.bold,
    fontSize: 12,
    textAlign: 'center',
  },
  heroStage: {
    color: colors.muted,
    fontFamily: fonts.semibold,
    fontSize: 10,
    marginTop: 2,
  },
  heroSummary: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.16)',
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  heroSummaryText: {
    color: colors.mutedLight,
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
  },
  heroTeam: {
    alignItems: 'center',
    gap: spacing.xs,
    width: 84,
  },
  heroTeamName: {
    color: colors.foreground,
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  heroTeams: {
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
    gap: spacing.sm,
  },
  horizontal: {
    marginRight: -spacing.lg,
  },
  leagueRow: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  leagueWrap: {
    marginTop: -spacing.xs,
  },
  legs: {
    color: colors.accent,
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  matchCard: {
    gap: spacing.md,
    padding: spacing.md,
  },
  matchLeague: {
    color: colors.muted,
    fontFamily: fonts.semibold,
    fontSize: 9,
    marginTop: 1,
    maxWidth: 110,
  },
  matchTeam: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.xs,
  },
  matchTeamName: {
    color: colors.foreground,
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  matchTeamRight: {},
  matchTime: {
    color: colors.foregroundStrong,
    fontFamily: fonts.extraBold,
    fontSize: 13,
  },
  matchTimeChip: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  matchTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  oddsChip: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    paddingVertical: spacing.sm + 2,
  },
  oddsChipActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.borderAccent,
  },
  oddsLabel: {
    color: colors.muted,
    fontFamily: fonts.bold,
    fontSize: 11,
  },
  oddsLabelActive: {
    color: colors.primary,
  },
  oddsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  oddsValue: {
    color: colors.foreground,
    fontFamily: fonts.extraBold,
    fontSize: 13,
  },
  oddsValueActive: {
    color: colors.primary,
  },
  period: {
    color: colors.muted,
    fontFamily: fonts.semibold,
    fontSize: 10,
    marginTop: 1,
  },
  pick: {
    color: colors.foreground,
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  pickBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.16)',
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  pickCopy: {
    flex: 1,
    minWidth: 0,
  },
  pillRow: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  primaryText: {
    color: colors.primary,
  },
  profileAvatar: {
    alignItems: 'center',
    backgroundColor: colors.primaryMuted,
    borderColor: colors.borderAccent,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  profileInitial: {
    color: colors.primary,
    fontFamily: fonts.extraBold,
    fontSize: 17,
  },
  readiness: {
    color: colors.muted,
    fontFamily: fonts.semibold,
    fontSize: 10,
    marginTop: 2,
  },
  score: {
    color: colors.foregroundStrong,
    fontFamily: fonts.extraBold,
    fontSize: 44,
  },
  scoreRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
  },
  sectionAction: {
    color: colors.primary,
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: colors.foregroundStrong,
    fontFamily: fonts.extraBold,
    fontSize: 17,
  },
  selectedChip: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.borderAccent,
  },
  selectedText: {
    color: colors.primary,
  },
  sportEmoji: {
    fontSize: 15,
  },
  sportLabel: {
    color: colors.foregroundStrong,
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  sportPill: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    height: 44,
    justifyContent: 'center',
    minWidth: 44,
    paddingHorizontal: spacing.md,
  },
  sportPillActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.borderAccent,
    paddingHorizontal: spacing.lg,
  },
  starButton: {
    alignItems: 'center',
    backgroundColor: colors.accentMuted,
    borderColor: 'rgba(255,211,77,0.35)',
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  statLabel: {
    color: colors.muted,
    fontFamily: fonts.bold,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  statValue: {
    color: colors.foregroundStrong,
    fontFamily: fonts.extraBold,
    fontSize: 25,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  successText: {
    color: '#86efac',
  },
  unreadDot: {
    backgroundColor: colors.accent,
    borderColor: colors.backgroundAlt,
    borderRadius: radius.pill,
    borderWidth: 2,
    height: 11,
    position: 'absolute',
    right: 9,
    top: 9,
    width: 11,
  },
});
