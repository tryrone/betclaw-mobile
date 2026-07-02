import { Link, useRouter } from 'expo-router';
import { Lock, Mail, UserRound } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated from 'react-native-reanimated';

import { BrandLogo, enterUp, FormErrorBanner, FormField, GradientButton, Screen } from '@/components/ui';
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
      {
        email: email.trim(),
        name: name.trim() || undefined,
        password,
        referralCode: referralCode.trim() || undefined,
      },
      {
        onSuccess: () => router.replace('/(tabs)'),
      },
    );
  };

  return (
    <Screen>
      <Animated.View entering={enterUp(0)}>
        <BrandLogo />
      </Animated.View>
      <Animated.View entering={enterUp(1)} style={styles.header}>
        <Text style={[styles.title, { color: theme.foregroundStrong }]}>Create your BetClaw account</Text>
        <Text style={[styles.copy, { color: theme.mutedLight }]}>Keep match research, ticket fixes, and tokens in one place.</Text>
      </Animated.View>
      <Animated.View entering={enterUp(2)} style={styles.form}>
        <FormField autoCapitalize="words" icon={UserRound} label="Name" onChangeText={setName} placeholder="Your name" value={name} />
        <FormField icon={Mail} keyboardType="email-address" label="Email" onChangeText={setEmail} placeholder="you@example.com" value={email} />
        <FormField icon={Lock} label="Password" onChangeText={setPassword} placeholder="8+ characters" secure value={password} />
        <FormField autoCapitalize="characters" icon={UserRound} label="Referral code" onChangeText={setReferralCode} placeholder="Optional" value={referralCode} />
        {signup.error ? <FormErrorBanner message={getErrorMessage(signup.error)} /> : null}
        <GradientButton onPress={handleSignup}>{signup.isPending ? 'Creating Account...' : 'Create Account'}</GradientButton>
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
  errorText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    lineHeight: 18,
  },
  form: {
    gap: spacing.md,
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
