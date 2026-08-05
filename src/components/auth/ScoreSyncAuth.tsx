import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, Radio } from 'lucide-react-native';
import { type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandLogo } from '@/components/ui/BrandLogo';
import { PressableScale } from '@/components/ui/PressableScale';
import { useAppTheme } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

export const scoreSyncColors = {
  navy: '#11143b',
  navySoft: '#272a61',
  blue: '#1855a5',
  red: '#e5454f',
  green: '#12a96e',
  ink: '#17193e',
  muted: '#8b8d9d',
  border: '#e8e9ee',
  field: '#f5f5f7',
  white: '#ffffff',
  canvas: '#f2f3f7',
} as const;

const clubs = [
  { code: 'BC', color: '#11143b' },
  { code: 'PL', color: '#3d185f' },
  { code: 'FC', color: '#d9424f' },
  { code: 'UT', color: '#b88922' },
  { code: 'XI', color: '#1855a5' },
  { code: 'AI', color: '#0e875b' },
  { code: 'GO', color: '#e45a3d' },
  { code: 'PRO', color: '#263963' },
] as const;

function ClubToken({ code, color, size = 44 }: { code: string; color: string; size?: number }) {
  const theme = useAppTheme();

  return (
    <View style={[styles.clubHalo, { backgroundColor: theme.mode === 'light' ? 'rgba(255,255,255,0.84)' : theme.surfaceHover, borderColor: theme.border, height: size, width: size }]}>
      <View style={[styles.clubMark, { backgroundColor: color, height: size * 0.62, width: size * 0.62 }]}>
        <Text adjustsFontSizeToFit numberOfLines={1} style={[styles.clubCode, { fontSize: Math.max(8, size * 0.2) }]}>{code}</Text>
      </View>
    </View>
  );
}

export function ScoreSyncOrbit({ compact = false }: { compact?: boolean }) {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const orbitWidth = Math.min(width + 72, 560);
  const orbitHeight = compact ? 160 : Math.min(390, width * 0.96);
  const tokenSize = compact ? 38 : 46;

  return (
    <View pointerEvents="none" style={[styles.orbit, { height: orbitHeight, width: orbitWidth }]}>
      <Svg height="100%" style={StyleSheet.absoluteFill} viewBox="0 0 420 360" width="100%">
        {[56, 94, 132, 170].map((r) => (
          <Circle cx="210" cy={compact ? '270' : '230'} fill="none" key={r} opacity="0.18" r={r} stroke={theme.primarySoft} strokeWidth="1" />
        ))}
        <Path d="M15 78 C110 16 310 16 405 78" fill="none" opacity="0.12" stroke={theme.primarySoft} strokeWidth="1" />
        <Path d="M6 148 C112 72 308 72 414 148" fill="none" opacity="0.11" stroke={theme.primarySoft} strokeWidth="1" />
      </Svg>
      <View style={[styles.clubRow, compact ? styles.clubRowCompact : null]}>
        {clubs.slice(0, 5).map((club) => <ClubToken {...club} key={club.code} size={tokenSize} />)}
      </View>
      {!compact ? (
        <View style={[styles.clubRow, styles.clubRowSecond]}>
          {clubs.slice(5).map((club) => <ClubToken {...club} key={club.code} size={tokenSize} />)}
        </View>
      ) : null}
    </View>
  );
}

export function ScoreSyncMatchPreview({ compact = false }: { compact?: boolean }) {
  const theme = useAppTheme();

  return (
    <View style={[styles.previewCard, { backgroundColor: theme.card, borderColor: theme.border }, compact ? styles.previewCardCompact : null]}>
      <View style={styles.previewLeagueRow}>
        <View style={styles.previewLeagueIdentity}>
          <View style={styles.leagueMark}><Text style={styles.leagueMarkText}>B</Text></View>
          <Text style={[styles.previewLeague, { color: theme.foregroundStrong }]}>Premier League</Text>
        </View>
        <View style={[styles.livePill, { backgroundColor: theme.successSoft }]}>
          <View style={[styles.liveDot, { backgroundColor: theme.success }]} />
          <Text style={[styles.liveText, { color: theme.success }]}>LIVE</Text>
        </View>
      </View>
      <View style={styles.previewTeams}>
        <View style={styles.previewTeam}>
          <ClubToken code="AR" color="#db2f3a" size={compact ? 38 : 44} />
          <Text numberOfLines={1} style={[styles.previewTeamName, { color: theme.foregroundStrong }]}>North London</Text>
        </View>
        <View style={styles.previewScoreWrap}>
          <Text style={[styles.previewScore, { color: theme.foregroundStrong }]}>1 - 2</Text>
          <Text style={[styles.previewClock, { color: theme.accent }]}>72&apos;</Text>
        </View>
        <View style={styles.previewTeam}>
          <ClubToken code="BL" color="#1855a5" size={compact ? 38 : 44} />
          <Text numberOfLines={1} style={[styles.previewTeamName, { color: theme.foregroundStrong }]}>West London</Text>
        </View>
      </View>
    </View>
  );
}

export function ScoreSyncAuthScreen({
  back = true,
  children,
  footer,
  subtitle,
  title,
}: {
  back?: boolean;
  children: ReactNode;
  footer?: ReactNode;
  subtitle: string;
  title: string;
}) {
  const router = useRouter();
  const theme = useAppTheme();

  return (
    <View style={styles.authRoot}>
      <LinearGradient colors={['#171a4a', scoreSyncColors.navy]} style={StyleSheet.absoluteFill} />
      <SafeAreaView edges={['top']} style={styles.authSafe}>
        <View style={styles.authHero}>
          <BrandLogo color={scoreSyncColors.white} markSize={30} textSize={19} />
          <ScoreSyncOrbit compact />
          <View style={styles.authSignal}>
            <Radio color={scoreSyncColors.white} size={13} strokeWidth={2.2} />
            <Text style={styles.authSignalText}>MATCHDAY, CONNECTED</Text>
          </View>
        </View>
        <View
          style={[
            styles.authSheet,
            {
              backgroundColor: theme.authSheet,
              borderTopColor: theme.mode === 'dark' ? theme.borderAccent : theme.border,
              shadowColor: theme.shadow,
              shadowOpacity: theme.mode === 'dark' ? 0.42 : 0.12,
            },
          ]}>
          <View style={[styles.handle, { backgroundColor: theme.borderStrong }]} />
          <ScrollView
            contentContainerStyle={styles.authContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {back ? (
              <PressableScale accessibilityLabel="Go back" accessibilityRole="button" onPress={() => router.back()} scaleTo={0.92} style={styles.backButton}>
                <ArrowLeft color={theme.foregroundStrong} size={21} />
              </PressableScale>
            ) : null}
            <View style={styles.authHeading}>
              <Text style={[styles.authTitle, { color: theme.foregroundStrong }]}>{title}</Text>
              <Text style={[styles.authSubtitle, { color: theme.muted }]}>{subtitle}</Text>
            </View>
            {children}
            {footer ? <View style={styles.authFooter}>{footer}</View> : null}
          </ScrollView>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  authContent: {
    gap: spacing.xl,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.xxl,
  },
  authFooter: {
    alignItems: 'center',
    paddingBottom: spacing.sm,
  },
  authHeading: {
    gap: spacing.sm,
  },
  authHero: {
    height: 176,
    overflow: 'hidden',
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.sm,
  },
  authRoot: {
    flex: 1,
  },
  authSafe: {
    flex: 1,
  },
  authSheet: {
    backgroundColor: scoreSyncColors.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderTopWidth: 1,
    elevation: 18,
    flex: 1,
    overflow: 'hidden',
    shadowOffset: { height: -8, width: 0 },
    shadowRadius: 24,
  },
  authSignal: {
    alignItems: 'center',
    bottom: 20,
    flexDirection: 'row',
    gap: 7,
    left: spacing.xxl,
    position: 'absolute',
  },
  authSignalText: {
    color: 'rgba(255,255,255,0.78)',
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  authSubtitle: {
    color: scoreSyncColors.muted,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
  },
  authTitle: {
    color: scoreSyncColors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 25,
    letterSpacing: -0.3,
    lineHeight: 31,
  },
  backButton: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 44,
    justifyContent: 'center',
    marginBottom: -spacing.sm,
    marginLeft: -spacing.md,
    width: 44,
  },
  clubCode: {
    color: scoreSyncColors.white,
    fontFamily: fonts.extraBold,
    textAlign: 'center',
  },
  clubHalo: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderColor: 'rgba(17,20,59,0.08)',
    borderRadius: radius.pill,
    borderWidth: 1,
    justifyContent: 'center',
  },
  clubMark: {
    alignItems: 'center',
    borderRadius: radius.pill,
    justifyContent: 'center',
  },
  clubRow: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 34,
  },
  clubRowCompact: {
    top: 22,
  },
  clubRowSecond: {
    top: 100,
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: '#d9dae0',
    borderRadius: radius.pill,
    height: 4,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
    width: 44,
  },
  leagueMark: {
    alignItems: 'center',
    backgroundColor: '#3d185f',
    borderRadius: radius.pill,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  leagueMarkText: {
    color: scoreSyncColors.white,
    fontFamily: fonts.extraBold,
    fontSize: 10,
  },
  liveDot: {
    backgroundColor: scoreSyncColors.green,
    borderRadius: radius.pill,
    height: 6,
    width: 6,
  },
  livePill: {
    alignItems: 'center',
    backgroundColor: '#eaf9f2',
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: 5,
    minHeight: 26,
    paddingHorizontal: 9,
  },
  liveText: {
    color: scoreSyncColors.green,
    fontFamily: fonts.extraBold,
    fontSize: 10,
  },
  orbit: {
    alignSelf: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  previewCard: {
    backgroundColor: scoreSyncColors.white,
    borderColor: scoreSyncColors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
    width: '100%',
  },
  previewCardCompact: {
    padding: spacing.md,
  },
  previewClock: {
    color: scoreSyncColors.red,
    fontFamily: fonts.bold,
    fontSize: 11,
    marginTop: 3,
  },
  previewLeague: {
    color: scoreSyncColors.ink,
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  previewLeagueIdentity: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  previewLeagueRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  previewScore: {
    color: scoreSyncColors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 25,
    fontVariant: ['tabular-nums'],
  },
  previewScoreWrap: {
    alignItems: 'center',
    minWidth: 70,
  },
  previewTeam: {
    alignItems: 'center',
    flex: 1,
    gap: 5,
    minWidth: 0,
  },
  previewTeamName: {
    color: scoreSyncColors.ink,
    fontFamily: fonts.semibold,
    fontSize: 11,
    textAlign: 'center',
  },
  previewTeams: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
