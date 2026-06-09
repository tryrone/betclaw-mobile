import { Link, useRouter } from 'expo-router';
import { Fingerprint, Lock, Mail } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { BrandMark, enterUp, FormField, GradientButton, PressableScale, Screen, StatusBadge } from '@/components/ui';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

export default function LoginScreen() {
  const router = useRouter();

  return (
    <Screen scroll={false}>
      <View style={styles.root}>
        <View>
          <Animated.View entering={enterUp(0)} style={styles.topRow}>
            <BrandMark size={52} />
            <StatusBadge label="Mobile MVP" tone="accent" />
          </Animated.View>

          <Animated.View entering={enterUp(1)} style={styles.hero}>
            <Text style={styles.eyebrow}>BetClaw</Text>
            <Text style={styles.title}>Sign in to your matchday edge.</Text>
            <Text style={styles.copy}>AI ticket research, wallet tokens, and verified picks in one mobile workspace.</Text>
          </Animated.View>

          <Animated.View entering={enterUp(2)} style={styles.form}>
            <FormField icon={Mail} label="Email" value="tega@betsclaw.win" />
            <FormField icon={Lock} label="Password" secure value="password123" />
            <GradientButton icon={Fingerprint} onPress={() => router.replace('/(tabs)')}>
              Sign In
            </GradientButton>
          </Animated.View>

          <Animated.View entering={enterUp(3)} style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.divider} />
          </Animated.View>

          <Animated.View entering={enterUp(4)} style={styles.oauthRow}>
            <PressableScale accessibilityLabel="Continue with Google" accessibilityRole="button" style={styles.oauthButton}>
              <Text style={styles.oauthText}>Google</Text>
            </PressableScale>
            <PressableScale accessibilityLabel="Continue with GitHub" accessibilityRole="button" style={styles.oauthButton}>
              <Text style={styles.oauthText}>GitHub</Text>
            </PressableScale>
          </Animated.View>
        </View>

        <Animated.View entering={enterUp(5)} style={styles.footerRow}>
          <Link href="/(auth)/forgot-password" asChild>
            <Pressable>
              <Text style={styles.link}>Forgot password</Text>
            </Pressable>
          </Link>
          <Link href="/(auth)/signup" asChild>
            <Pressable>
              <Text style={styles.secondaryLink}>Create account</Text>
            </Pressable>
          </Link>
        </Animated.View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  copy: {
    color: colors.mutedLight,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 24,
    marginTop: 12,
  },
  divider: {
    backgroundColor: colors.border,
    flex: 1,
    height: 1,
  },
  dividerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginVertical: spacing.lg,
  },
  dividerText: {
    color: colors.muted,
    fontFamily: fonts.bold,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  eyebrow: {
    color: colors.primary,
    fontFamily: fonts.extraBold,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  form: {
    gap: spacing.md,
  },
  hero: {
    marginBottom: spacing.xxl,
  },
  link: {
    color: colors.primary,
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  oauthButton: {
    alignItems: 'center',
    backgroundColor: colors.input,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    flex: 1,
    height: 46,
    justifyContent: 'center',
  },
  oauthRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  oauthText: {
    color: colors.foreground,
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  root: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: spacing.lg,
    paddingTop: spacing.xxl,
  },
  secondaryLink: {
    color: colors.mutedLight,
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  title: {
    color: colors.foregroundStrong,
    fontFamily: fonts.extraBold,
    fontSize: 34,
    letterSpacing: 0,
    lineHeight: 38,
    marginTop: 10,
    maxWidth: 300,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 52,
  },
});
