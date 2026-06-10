import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { X, Pause, Tv, Info, Calendar, Star } from 'lucide-react-native';
import { View, StyleSheet, Text, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassCard, PressableScale, TeamLogo } from '@/components/ui';
import { liveMatch } from '@/data/mock';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

const liveStreamImage = require('@/../assets/images/live_stream_match.png');

export default function LiveMatchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      {/* Video Stream Area (Top half) */}
      <View style={styles.videoContainer}>
        <Image source={liveStreamImage} style={styles.videoPlayer} contentFit="cover" />

        {/* Video Overlay Dark Mask */}
        <View style={styles.videoOverlay} />

        {/* Control Bar (Top) */}
        <View style={[styles.controlHeader, { paddingTop: Math.max(insets.top, 12) }]}>
          <PressableScale
            accessibilityLabel="Close live match"
            accessibilityRole="button"
            onPress={() => router.back()}
            style={styles.controlCircleBtn}>
            <X color={colors.foregroundStrong} size={20} strokeWidth={2.4} />
          </PressableScale>

          <View style={styles.controlHeaderRight}>
            <View style={styles.liveBadge}>
              <View style={styles.liveRedDot} />
              <Text style={styles.liveBadgeText}>Live</Text>
            </View>

            <PressableScale accessibilityLabel="Cast stream" accessibilityRole="button" style={styles.controlCircleBtn}>
              <Tv color={colors.foregroundStrong} size={16} strokeWidth={2.4} />
            </PressableScale>

            <PressableScale accessibilityLabel="Match info" accessibilityRole="button" style={styles.controlCircleBtn}>
              <Info color={colors.foregroundStrong} size={16} strokeWidth={2.4} />
            </PressableScale>
          </View>
        </View>

        {/* Play/Pause Button in Center */}
        <View style={styles.playPauseWrap}>
          <PressableScale
            accessibilityLabel="Pause stream"
            accessibilityRole="button"
            scaleTo={0.88}
            style={styles.playPauseBtn}>
            <Pause color={colors.black} size={24} fill={colors.black} />
          </PressableScale>
        </View>
      </View>

      {/* Match Details Card Section (Bottom half) */}
      <View style={styles.detailsContainer}>
        <ScrollView
          bounces={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          <GlassCard style={styles.detailsCard}>
            {/* Card Header */}
            <View style={styles.cardHeader}>
              <Text style={styles.cardEyebrow}>Match day 1</Text>
              <View style={styles.cardHeaderActions}>
                <Calendar color={colors.muted} size={15} strokeWidth={2.4} />
                <Star color={colors.muted} size={15} strokeWidth={2.4} style={styles.starIcon} />
              </View>
            </View>

            {/* Teams & Score State */}
            <View style={styles.matchTeamsRow}>
              {/* Home Team */}
              <View style={styles.teamCol}>
                <TeamLogo name={liveMatch.home} size={48} />
                <Text numberOfLines={1} style={styles.teamName}>
                  {liveMatch.home}
                </Text>
              </View>

              {/* Center Scoring & Clock */}
              <View style={styles.scoreCenterCol}>
                <Text style={styles.leagueText}>{liveMatch.league}</Text>
                <Text style={styles.groupText}>{liveMatch.stage}</Text>

                <View style={styles.scoreRow}>
                  <Text style={styles.scoreText}>{liveMatch.homeScore}</Text>

                  <View style={styles.clockPill}>
                    <View style={styles.liveIndicator}>
                      <View style={styles.redDot} />
                      <Text style={styles.liveText}>Live</Text>
                    </View>
                    <Text style={styles.clockText}>{liveMatch.clock}</Text>
                    <Text style={styles.periodText}>{liveMatch.period}</Text>
                  </View>

                  <Text style={styles.scoreText}>{liveMatch.awayScore}</Text>
                </View>
              </View>

              {/* Away Team */}
              <View style={styles.teamCol}>
                <TeamLogo name={liveMatch.away} size={48} />
                <Text numberOfLines={1} style={styles.teamName}>
                  {liveMatch.away}
                </Text>
              </View>
            </View>

            {/* Betting Odds line buttons */}
            <View style={styles.oddsLineRow}>
              <PressableScale accessibilityLabel="Home win" accessibilityRole="button" style={styles.oddsItem}>
                <Text style={styles.oddsLabel}>1</Text>
                <Text style={styles.oddsValue}>{liveMatch.odds.home.toFixed(2)}</Text>
              </PressableScale>

              <PressableScale accessibilityLabel="Draw" accessibilityRole="button" style={styles.oddsItem}>
                <Text style={styles.oddsLabel}>x</Text>
                <Text style={styles.oddsValue}>{liveMatch.odds.draw.toFixed(2)}</Text>
              </PressableScale>

              <PressableScale accessibilityLabel="Away win" accessibilityRole="button" style={styles.oddsItem}>
                <Text style={styles.oddsLabel}>2</Text>
                <Text style={styles.oddsValue}>{liveMatch.odds.away.toFixed(2)}</Text>
              </PressableScale>
            </View>
          </GlassCard>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardEyebrow: {
    color: colors.mutedLight,
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
  },
  cardHeaderActions: {
    flexDirection: 'row',
  },
  clockPill: {
    alignItems: 'center',
    backgroundColor: '#0a0b0b',
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    width: 90,
  },
  clockText: {
    color: colors.foregroundStrong,
    fontFamily: fonts.extraBold,
    fontSize: 14,
    marginTop: 2,
  },
  controlCircleBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: radius.pill,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  controlHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: 0,
    paddingHorizontal: spacing.lg,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 10,
  },
  controlHeaderRight: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  detailsCard: {
    backgroundColor: '#151718',
    borderColor: '#202123',
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.lg,
    padding: spacing.lg,
  },
  detailsContainer: {
    flex: 1,
    marginTop: -28, // Pull the card up to overlap the video player
  },
  groupText: {
    color: colors.muted,
    fontFamily: fonts.medium,
    fontSize: 10,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  leagueText: {
    color: colors.foreground,
    fontFamily: fonts.bold,
    fontSize: 11,
    textAlign: 'center',
  },
  liveBadge: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: 4,
    height: 30,
    paddingHorizontal: 12,
  },
  liveBadgeText: {
    color: colors.black,
    fontFamily: fonts.bold,
    fontSize: 11,
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
  matchTeamsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  oddsItem: {
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
  oddsLabel: {
    color: colors.muted,
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  oddsLineRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  oddsValue: {
    color: colors.foregroundStrong,
    fontFamily: fonts.extraBold,
    fontSize: 13,
  },
  periodText: {
    color: colors.muted,
    fontFamily: fonts.medium,
    fontSize: 10,
    marginTop: 1,
  },
  playPauseBtn: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    height: 60,
    justifyContent: 'center',
    width: 60,
  },
  playPauseWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    ...StyleSheet.absoluteFill,
  },
  redDot: {
    backgroundColor: colors.danger,
    borderRadius: radius.pill,
    height: 5,
    width: 5,
  },
  root: {
    backgroundColor: colors.black,
    flex: 1,
  },
  scoreCenterCol: {
    alignItems: 'center',
    flex: 1,
  },
  scoreRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  scoreText: {
    color: colors.foregroundStrong,
    fontFamily: fonts.extraBold,
    fontSize: 36,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.sm,
  },
  starIcon: {
    marginLeft: spacing.sm,
  },
  teamCol: {
    alignItems: 'center',
    width: 80,
  },
  teamName: {
    color: colors.foregroundStrong,
    fontFamily: fonts.bold,
    fontSize: 12,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  videoContainer: {
    backgroundColor: colors.black,
    height: 380,
    overflow: 'hidden',
    width: '100%',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  videoPlayer: {
    height: '100%',
    width: '100%',
  },
});
