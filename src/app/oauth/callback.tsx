import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ScoreSyncAuthScreen } from '@/components/auth/ScoreSyncAuth';
import { mobileSessionFromOAuthUrl } from '@/lib/api/oauth';
import { useAuthStore } from '@/store/auth-store';
import { useAppTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

export default function OAuthCallbackScreen() {
  const theme = useAppTheme();
  const params = useLocalSearchParams();
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);

  useEffect(() => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      const firstValue = Array.isArray(value) ? value[0] : value;
      if (firstValue) query.set(key, firstValue);
    }

    try {
      const session = mobileSessionFromOAuthUrl(`betclaw://oauth/callback?${query.toString()}`);
      setSession(session)
        .then(() => router.replace('/(tabs)'))
        .catch(() => router.replace('/(auth)/login'));
    } catch {
      router.replace('/(auth)/login');
    }
  }, [params, router, setSession]);

  return (
    <ScoreSyncAuthScreen back={false} subtitle="Your secure session is being prepared." title="Finishing sign in">
      <View style={styles.root}>
        <View style={[styles.loaderDot, { backgroundColor: theme.success }]} />
        <Text style={[styles.copy, { color: theme.muted }]}>Connecting your BetClaw account...</Text>
      </View>
    </ScoreSyncAuthScreen>
  );
}

const styles = StyleSheet.create({
  copy: {
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  root: {
    alignItems: 'center',
    gap: spacing.lg,
    minHeight: 160,
    justifyContent: 'center',
  },
  loaderDot: {
    borderRadius: 999,
    height: 12,
    width: 12,
  },
});
