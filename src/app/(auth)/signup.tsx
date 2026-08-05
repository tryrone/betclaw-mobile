import { Link, useRouter } from 'expo-router';
import { Lock, Mail, UserRound } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ScoreSyncAuthScreen } from '@/components/auth/ScoreSyncAuth';
import { FormErrorBanner, FormField, GradientButton } from '@/components/ui';
import { getErrorMessage } from '@/lib/api/client';
import { useSignupMutation } from '@/lib/api/hooks';
import { useAppTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

export default function SignupScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const signup = useSignupMutation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');

  const handleSignup = () => {
    signup.mutate(
      { email: email.trim(), name: name.trim() || undefined, password, referralCode: referralCode.trim() || undefined },
      { onSuccess: () => router.replace('/(tabs)') },
    );
  };

  return (
    <ScoreSyncAuthScreen
      subtitle="Create one account for match intelligence, ticket tools, and BetClaw tokens."
      title="Create account"
      footer={
        <Link href="/(auth)/login" asChild>
          <Pressable accessibilityRole="button" style={styles.footerLink}>
            <Text style={[styles.footerText, { color: theme.muted }]}>Already have an account? <Text style={[styles.footerStrong, { color: theme.primary }]}>Sign in</Text></Text>
          </Pressable>
        </Link>
      }>
      <View style={styles.form}>
        <FormField autoCapitalize="words" icon={UserRound} label="Name" onChangeText={setName} placeholder="Your name" value={name} />
        <FormField icon={Mail} keyboardType="email-address" label="Email" onChangeText={setEmail} placeholder="you@example.com" value={email} />
        <FormField icon={Lock} label="Password" onChangeText={setPassword} placeholder="8+ characters" secure value={password} />
        <FormField autoCapitalize="characters" icon={UserRound} label="Referral code" onChangeText={setReferralCode} placeholder="Optional" value={referralCode} />
        {signup.error ? <FormErrorBanner message={getErrorMessage(signup.error)} /> : null}
        <GradientButton disabled={signup.isPending || !email.trim() || password.length < 8} onPress={handleSignup} variant="reference">
          {signup.isPending ? 'Creating account...' : 'Create account'}
        </GradientButton>
        <Text style={[styles.helper, { color: theme.muted }]}>By creating an account, you agree to the Terms of Service and Privacy Policy.</Text>
      </View>
    </ScoreSyncAuthScreen>
  );
}

const styles = StyleSheet.create({
  footerLink: { minHeight: 44, justifyContent: 'center' },
  footerStrong: { fontFamily: fonts.bold },
  footerText: { fontFamily: fonts.regular, fontSize: 13 },
  form: { gap: spacing.md },
  helper: { fontFamily: fonts.regular, fontSize: 11, lineHeight: 17, textAlign: 'center' },
});
