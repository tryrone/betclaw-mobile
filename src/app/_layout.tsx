import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold, useFonts } from '@expo-google-fonts/inter';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AuthBootstrap } from '@/components/bootstrap/AuthBootstrap';
import { NotificationBootstrap } from '@/components/bootstrap/NotificationBootstrap';
import { ApiProvider } from '@/lib/api/provider';
import { useAuthStore } from '@/store/auth-store';
import { ThemeControllerProvider, useAppTheme, useThemeController } from '@/theme/colors';
import '@/global.css';

SplashScreen.setOptions({ duration: 360, fade: true });
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const authStatus = useAuthStore((state) => state.status);
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });
  const appReady = (loaded || Boolean(error)) && authStatus !== 'hydrating';

  useEffect(() => {
    if (appReady) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [appReady]);

  return (
    <ThemeControllerProvider>
      <ApiProvider>
        <AuthBootstrap />
        {appReady ? <RootLayoutContent /> : null}
      </ApiProvider>
    </ThemeControllerProvider>
  );
}

function RootLayoutContent() {
  const palette = useAppTheme();
  const { mode } = useThemeController();

  return (
    <GestureHandlerRootView style={[styles.root, { backgroundColor: palette.background }]}>
      <ThemeProvider value={mode === 'light' ? DefaultTheme : DarkTheme}>
        <NotificationBootstrap />
        <StatusBar style={mode === 'light' ? 'dark' : 'light'} />
        <Stack
          screenOptions={{
            contentStyle: { backgroundColor: palette.background },
            headerShown: false,
          }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="oauth/callback" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="build-ticket" />
          <Stack.Screen name="convert-ticket" />
          <Stack.Screen name="history" />
          <Stack.Screen name="matches" />
          <Stack.Screen name="match/[id]" />
          <Stack.Screen name="notifications" />
          <Stack.Screen name="referrals" />
          <Stack.Screen name="ticket/[id]" />
          <Stack.Screen name="live-match" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="+not-found" />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
