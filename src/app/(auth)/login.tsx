import { Link, useRouter } from 'expo-router';
import { Fingerprint, Lock, Mail } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ScoreSyncAuthScreen } from '@/components/auth/ScoreSyncAuth';
import { FormErrorBanner, FormField, GradientButton, PressableScale } from '@/components/ui';
import { getErrorMessage } from '@/lib/api/client';
import { useLoginMutation, useOAuthLoginMutation } from '@/lib/api/hooks';
import type { MobileOAuthProvider } from '@/lib/api/types';
import { useAuthStore } from '@/store/auth-store';
import { useAppTheme } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
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
    if (authStatus === 'authenticated') router.replace('/(tabs)');
  }, [authStatus, router]);

  const handleLogin = () => {
    login.mutate({ email: email.trim(), password }, { onSuccess: () => router.replace('/(tabs)') });
  };

  const handleOAuthLogin = (provider: MobileOAuthProvider) => {
    oauthLogin.mutate(provider, { onSuccess: () => router.replace('/(tabs)') });
  };

  return (
    <ScoreSyncAuthScreen
      subtitle="Use your account to continue to live fixtures, ticket research, and your wallet."
      title="Welcome back"
      footer={
        <Link href="/(auth)/signup" asChild>
          <Pressable accessibilityRole="button" style={styles.footerLink}>
            <Text style={[styles.footerText, { color: theme.muted }]}>New to BetClaw? <Text style={[styles.footerStrong, { color: theme.primary }]}>Create account</Text></Text>
          </Pressable>
        </Link>
      }>
      <View style={styles.form}>
        <FormField icon={Mail} keyboardType="email-address" label="Email" onChangeText={setEmail} placeholder="you@example.com" value={email} />
        <FormField icon={Lock} label="Password" onChangeText={setPassword} placeholder="Your password" secure value={password} />
        <View style={styles.forgotRow}>
          <Link href="/(auth)/forgot-password" asChild>
            <Pressable accessibilityRole="button"><Text style={[styles.textLink, { color: theme.primarySoft }]}>Forgot password?</Text></Pressable>
          </Link>
        </View>
        {login.error ? <FormErrorBanner message={getErrorMessage(login.error)} /> : null}
        {oauthLogin.error ? <FormErrorBanner message={getErrorMessage(oauthLogin.error)} /> : null}
        <GradientButton disabled={login.isPending || !email.trim() || !password} icon={Fingerprint} onPress={handleLogin} variant="reference">
          {login.isPending ? 'Signing in...' : 'Sign in'}
        </GradientButton>
      </View>

      <View style={styles.dividerRow}>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <Text style={[styles.dividerText, { color: theme.muted }]}>or continue with</Text>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
      </View>

      <View style={styles.oauthRow}>
        {(['google', 'github'] as const).map((provider) => (
          <PressableScale
            accessibilityLabel={`Continue with ${provider}`}
            accessibilityRole="button"
            disabled={oauthLogin.isPending}
            key={provider}
            onPress={() => handleOAuthLogin(provider)}
            style={[styles.oauthButton, { backgroundColor: theme.field, borderColor: theme.border }, oauthLogin.isPending ? styles.disabled : null]}>
            <Text style={[styles.oauthText, { color: theme.foregroundStrong }]}>{provider === 'google' ? 'Google' : 'GitHub'}</Text>
          </PressableScale>
        ))}
      </View>
    </ScoreSyncAuthScreen>
  );
}

const styles = StyleSheet.create({
  disabled: { opacity: 0.48 },
  divider: { flex: 1, height: 1 },
  dividerRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  dividerText: { fontFamily: fonts.medium, fontSize: 11 },
  footerLink: { minHeight: 44, justifyContent: 'center' },
  footerStrong: { fontFamily: fonts.bold },
  footerText: { fontFamily: fonts.regular, fontSize: 13 },
  forgotRow: { alignItems: 'flex-end' },
  form: { gap: spacing.md },
  oauthButton: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    height: 50,
    justifyContent: 'center',
  },
  oauthRow: { flexDirection: 'row', gap: spacing.md },
  oauthText: { fontFamily: fonts.bold, fontSize: 13 },
  textLink: { fontFamily: fonts.bold, fontSize: 12 },
});
