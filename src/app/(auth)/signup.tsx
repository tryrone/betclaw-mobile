import { Link, useRouter } from 'expo-router';
import { Lock, Mail, UserRound } from 'lucide-react-native';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated from 'react-native-reanimated';

import { BrandLogo, enterUp, FormField, GlassCard, GradientButton, Screen } from '@/components/ui';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

export default function SignupScreen() {
  const router = useRouter();

  return (
    <Screen>
      <Animated.View entering={enterUp(0)}>
        <BrandLogo />
      </Animated.View>
      <Animated.View entering={enterUp(1)} style={styles.header}>
        <Text style={styles.title}>Create your BetClaw account</Text>
        <Text style={styles.copy}>Start with the mobile MVP flow and keep your ticket research in one place.</Text>
      </Animated.View>
      <Animated.View entering={enterUp(2)}>
        <GlassCard>
          <FormField icon={UserRound} label="Name" value="Tega Oboraruvwe" />
          <FormField icon={Mail} label="Email" value="tega@betsclaw.win" />
          <FormField icon={Lock} label="Password" secure value="password123" />
          <FormField icon={UserRound} label="Referral code" placeholder="Optional" />
          <GradientButton onPress={() => router.replace('/(tabs)')}>Create Account</GradientButton>
        </GlassCard>
      </Animated.View>
      <Animated.View entering={enterUp(3)}>
        <Link href="/(auth)/login" asChild>
          <Pressable style={styles.centerLink}>
            <Text style={styles.link}>Already have an account? Sign in</Text>
          </Pressable>
        </Link>
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centerLink: {
    alignItems: 'center',
  },
  copy: {
    color: colors.mutedLight,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 24,
  },
  header: {
    gap: spacing.sm,
  },
  link: {
    color: colors.primary,
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  title: {
    color: colors.foregroundStrong,
    fontFamily: fonts.extraBold,
    fontSize: 31,
    lineHeight: 36,
  },
});
