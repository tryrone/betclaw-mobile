import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BrandLogo, Screen } from '@/components/ui';
import { mobileSessionFromOAuthUrl } from '@/lib/api/oauth';
import { useAuthStore } from '@/store/auth-store';
import { useAppTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

export default function OAuthCallbackScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const theme = useAppTheme();
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
    <Screen>
      <View style={styles.root}>
        <BrandLogo markSize={52} textSize={26} />
        <Text style={[styles.copy, { color: theme.mutedLight }]}>Finishing sign in...</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  copy: {
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  root: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.lg,
    justifyContent: 'center',
  },
});
