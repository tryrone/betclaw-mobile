import { Link, useRouter } from 'expo-router';
import { Lock, Mail, UserRound } from 'lucide-react-native';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated from 'react-native-reanimated';

import { BrandLogo, enterUp, FormField, GlassCard, GradientButton, Screen } from '@/components/ui';
import { useAppTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

export default function SignupScreen() {
  const router = useRouter();
  const theme = useAppTheme();

  return (
    <Screen>
      <Animated.View entering={enterUp(0)}>
        <BrandLogo />
      </Animated.View>
      <Animated.View entering={enterUp(1)} style={styles.header}>
        <Text style={[styles.title, { color: theme.foregroundStrong }]}>Create your BetClaw account</Text>
        <Text style={[styles.copy, { color: theme.mutedLight }]}>Keep match research, ticket fixes, and tokens in one place.</Text>
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
            <Text style={[styles.link, { color: theme.primarySoft }]}>Already have an account? Sign in</Text>
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
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 22,
  },
  header: {
    gap: spacing.sm,
  },
  link: {
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 29,
    lineHeight: 34,
  },
});
