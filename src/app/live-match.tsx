import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Bell, ChevronLeft, Pause, Video } from '@/components/modern-icons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressableScale, TeamLogo } from '@/components/ui';
import { useHomeFeed } from '@/lib/api/hooks';
import { flattenHomeFeed } from '@/lib/mobile-mappers';
import { useAppTheme } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

const broadcastImage = require('@/../assets/images/live_stream_match.png');
const LIVE_SCREEN_HORIZONTAL_PADDING = spacing.md / 2;

function scoreText(match?: ReturnType<typeof flattenHomeFeed>[number]) {
  if (!match) return 'Match center';
  if (match.homeScore != null && match.awayScore != null) return `${match.homeScore}  VS  ${match.awayScore}`;
  return `${match.home}  VS  ${match.away}`;
}

export default function LiveMatchScreen() {
  const { fixtureId } = useLocalSearchParams<{ fixtureId?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const homeFeed = useHomeFeed({ limit: 48, windowDays: 3 });
  const matches = useMemo(() => flattenHomeFeed(homeFeed.data), [homeFeed.data]);
  const match = matches.find((item) => item.id === fixtureId) ?? matches.find((item) => item.status === 'Live') ?? matches[0];

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <Image source={broadcastImage} style={StyleSheet.absoluteFill} contentFit="cover" />
      <LinearGradient colors={['rgba(4,9,20,0.20)', 'rgba(4,9,20,0.34)', 'rgba(4,9,20,0.92)']} locations={[0, 0.42, 1]} style={StyleSheet.absoluteFill} />

      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.topBar}>
          <PressableScale accessibilityLabel="Go back" accessibilityRole="button" onPress={() => router.back()} style={styles.circleButton}>
            <ChevronLeft color="#ffffff" size={23} />
          </PressableScale>
          <View style={styles.livePill}>
            <LinearGradient colors={[theme.primary, theme.primary]} end={{ x: 1, y: 1 }} start={{ x: 0, y: 0 }} style={StyleSheet.absoluteFill} />
            <Video color={theme.primaryDark} size={15} />
            <Text style={[styles.livePillText, { color: theme.primaryDark }]}>Live</Text>
          </View>
          <PressableScale accessibilityLabel="Notifications" accessibilityRole="button" style={styles.circleButton}>
            <Bell color="#ffffff" size={20} />
          </PressableScale>
        </View>

        <View style={styles.pauseWrap}>
          <View style={styles.pauseButton}>
            <Pause color="#ffffff" fill="#ffffff" size={34} />
          </View>
        </View>

        <View style={[styles.bottomPanel, { bottom: Math.max(insets.bottom, 18) }]}>
          <LinearGradient colors={['rgba(255,255,255,0.20)', 'rgba(255,255,255,0.08)']} end={{ x: 1, y: 1 }} start={{ x: 0, y: 0 }} style={StyleSheet.absoluteFill} />
          <View style={styles.dragHandle} />
          <View style={styles.bottomHeader}>
            <View style={styles.bottomTitleWrap}>
              <Text numberOfLines={1} style={styles.competition}>{match?.league ?? 'Live Match'}</Text>
              <Text numberOfLines={1} style={styles.matchTitle}>{match ? `${match.home} vs ${match.away}` : 'Broadcast preview'}</Text>
            </View>
            {match ? (
              <View style={styles.logoScore}>
                <TeamLogo logoUrl={match.homeLogoUrl} name={match.home} size={34} />
                <Text style={styles.score}>{scoreText(match)}</Text>
                <TeamLogo logoUrl={match.awayLogoUrl} name={match.away} size={34} />
              </View>
            ) : null}
          </View>
          <Text style={styles.clock}>{match?.clock ?? match?.time ?? '00:43:43'}</Text>
          <View style={styles.progressTrack}>
            <LinearGradient colors={[theme.primary, theme.primary]} end={{ x: 1, y: 0 }} start={{ x: 0, y: 0 }} style={styles.progressFill} />
            <View style={[styles.progressThumb, { borderColor: theme.primary }]} />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  bottomPanel: {
    borderColor: 'rgba(255,255,255,0.20)',
    borderRadius: 24,
    borderWidth: 1,
    gap: spacing.sm,
    left: LIVE_SCREEN_HORIZONTAL_PADDING,
    overflow: 'hidden',
    padding: spacing.md,
    position: 'absolute',
    right: LIVE_SCREEN_HORIZONTAL_PADDING,
  },
  bottomTitleWrap: {
    flex: 1,
    minWidth: 0,
  },
  circleButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(17,20,59,0.58)',
    borderRadius: radius.pill,
    borderColor: 'rgba(255,255,255,0.28)',
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  clock: {
    color: '#ffffff',
    fontFamily: fonts.extraBold,
    fontSize: 20,
    fontVariant: ['tabular-nums'],
  },
  competition: {
    color: '#ffffff',
    fontFamily: fonts.extraBold,
    fontSize: 18,
  },
  dragHandle: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderRadius: radius.pill,
    height: 3,
    width: 42,
  },
  livePill: {
    alignItems: 'center',
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: 7,
    height: 40,
    justifyContent: 'center',
    minWidth: 96,
    overflow: 'hidden',
    paddingHorizontal: spacing.md,
  },
  livePillText: {
    color: '#ffffff',
    fontFamily: fonts.extraBold,
    fontSize: 14,
  },
  logoScore: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  matchTitle: {
    color: 'rgba(255,255,255,0.74)',
    fontFamily: fonts.medium,
    fontSize: 12,
    marginTop: 3,
  },
  pauseButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(17,20,59,0.68)',
    borderColor: 'rgba(255,255,255,0.32)',
    borderRadius: 46,
    borderWidth: 1,
    height: 92,
    justifyContent: 'center',
    width: 92,
  },
  pauseWrap: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  progressFill: {
    borderRadius: radius.pill,
    height: 7,
    width: '54%',
  },
  progressThumb: {
    backgroundColor: '#ffffff',
    borderRadius: radius.pill,
    borderWidth: 3,
    height: 22,
    left: '51%',
    position: 'absolute',
    top: -7,
    width: 22,
  },
  progressTrack: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: radius.pill,
    height: 7,
    marginTop: spacing.xs,
  },
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  score: {
    color: '#ffffff',
    fontFamily: fonts.extraBold,
    fontSize: 13,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: LIVE_SCREEN_HORIZONTAL_PADDING,
    paddingTop: spacing.sm,
  },
});
