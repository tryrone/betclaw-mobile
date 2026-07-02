import { Link, useRouter } from 'expo-router';
import { Fingerprint, Lock, Mail } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { BrandLogo, enterUp, FormErrorBanner, FormField, GradientButton, PressableScale, Screen, StatusBadge } from '@/components/ui';
import { getErrorMessage } from '@/lib/api/client';
import { useLoginMutation, useOAuthLoginMutation } from '@/lib/api/hooks';
import type { MobileOAuthProvider } from '@/lib/api/types';
import { useAuthStore } from '@/store/auth-store';
import { useAppTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

export default function LoginScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const authStatus = useAuthStore((state) => state.status);
  const login = useLoginMutation();
  const oauthLogin = useOAuthLoginMutation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (authStatus === 'authenticated') {
      router.replace('/(tabs)');
    }
  }, [authStatus, router]);

  const handleLogin = () => {
    login.mutate(
      { email: email.trim(), password },
      {
        onSuccess: () => router.replace('/(tabs)'),
      },
    );
  };

  const handleOAuthLogin = (provider: MobileOAuthProvider) => {
    oauthLogin.mutate(provider, {
      onSuccess: () => router.replace('/(tabs)'),
    });
  };

  return (
    <Screen scroll={false}>
      <View style={styles.root}>
        <View>
          <Animated.View entering={enterUp(0)} style={styles.topRow}>
            <BrandLogo markSize={52} textSize={24} />
            <StatusBadge label="Mobile MVP" tone="accent" />
          </Animated.View>

          <Animated.View entering={enterUp(1)} style={styles.hero}>
            <Text style={[styles.title, { color: theme.foregroundStrong }]}>Sign in to your matchday workspace.</Text>
            <Text style={[styles.copy, { color: theme.mutedLight }]}>Ticket research, match signals, and wallet tokens in one mobile flow.</Text>
          </Animated.View>

          <Animated.View entering={enterUp(2)} style={styles.form}>
            <FormField icon={Mail} keyboardType="email-address" label="Email" onChangeText={setEmail} placeholder="you@example.com" value={email} />
            <FormField icon={Lock} label="Password" onChangeText={setPassword} placeholder="Your password" secure value={password} />
            {login.error ? <FormErrorBanner message={getErrorMessage(login.error)} /> : null}
            {oauthLogin.error ? <FormErrorBanner message={getErrorMessage(oauthLogin.error)} /> : null}
            <GradientButton icon={Fingerprint} onPress={handleLogin}>
              {login.isPending ? 'Signing In...' : 'Sign In'}
            </GradientButton>
          </Animated.View>

          <Animated.View entering={enterUp(3)} style={styles.dividerRow}>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <Text style={[styles.dividerText, { color: theme.muted }]}>or</Text>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
          </Animated.View>

          <Animated.View entering={enterUp(4)} style={styles.oauthRow}>
            <PressableScale
              accessibilityLabel="Continue with Google"
              accessibilityRole="button"
              disabled={oauthLogin.isPending}
              onPress={() => handleOAuthLogin('google')}
              style={[styles.oauthButton, { backgroundColor: theme.field, borderColor: theme.border, opacity: oauthLogin.isPending ? 0.64 : 1 }]}>
              <Text style={[styles.oauthText, { color: theme.foreground }]}>{oauthLogin.isPending ? 'Opening...' : 'Google'}</Text>
            </PressableScale>
            <PressableScale
              accessibilityLabel="Continue with GitHub"
              accessibilityRole="button"
              disabled={oauthLogin.isPending}
              onPress={() => handleOAuthLogin('github')}
              style={[styles.oauthButton, { backgroundColor: theme.field, borderColor: theme.border, opacity: oauthLogin.isPending ? 0.64 : 1 }]}>
              <Text style={[styles.oauthText, { color: theme.foreground }]}>GitHub</Text>
            </PressableScale>
          </Animated.View>
        </View>

        <Animated.View entering={enterUp(5)} style={styles.footerRow}>
          <Link href="/(auth)/forgot-password" asChild>
            <Pressable>
              <Text style={[styles.link, { color: theme.primarySoft }]}>Forgot password</Text>
            </Pressable>
          </Link>
          <Link href="/(auth)/signup" asChild>
            <Pressable>
              <Text style={[styles.secondaryLink, { color: theme.mutedLight }]}>Create account</Text>
            </Pressable>
          </Link>
        </Animated.View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  copy: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 24,
    marginTop: 12,
  },
  divider: {
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
    fontFamily: fonts.bold,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  errorText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    lineHeight: 18,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  form: {
    gap: spacing.md,
  },
  hero: {
    marginBottom: spacing.xl,
  },
  link: {
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  oauthButton: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    flex: 1,
    height: 44,
    justifyContent: 'center',
  },
  oauthRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  oauthText: {
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  root: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
    paddingTop: spacing.xl,
  },
  secondaryLink: {
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 30,
    letterSpacing: 0,
    lineHeight: 35,
    marginTop: 10,
    maxWidth: 315,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 36,
  },
});
