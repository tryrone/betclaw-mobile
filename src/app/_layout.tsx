import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold, useFonts } from '@expo-google-fonts/inter';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { AuthBootstrap } from '@/components/bootstrap/AuthBootstrap';
import { NotificationBootstrap } from '@/components/bootstrap/NotificationBootstrap';
import { ApiProvider } from '@/lib/api/provider';
import { useAuthStore } from '@/store/auth-store';
import { ThemeControllerProvider, useAppTheme, useThemeController } from '@/theme/colors';
import '@/global.css';

SplashScreen.setOptions({ duration: 360, fade: true });
void SplashScreen.preventAutoHideAsync();

const splashMark = require('@/../assets/images/splash-mark.png');

/**
 * Animated hand-off from the static native splash: the bare claw mark pulses
 * once and rotates slightly, then the overlay fades away to reveal the app.
 */
function AnimatedSplashOverlay({ onDone }: { onDone: () => void }) {
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);

  useEffect(() => {
    scale.value = withSequence(
      withTiming(1.18, { duration: 420, easing: Easing.out(Easing.cubic) }),
      withTiming(1.05, { duration: 260, easing: Easing.inOut(Easing.quad) }),
    );
    rotate.value = withTiming(-6, { duration: 680, easing: Easing.out(Easing.cubic) });
    opacity.value = withDelay(
      620,
      withTiming(0, { duration: 380, easing: Easing.in(Easing.quad) }, (finished) => {
        if (finished) runOnJS(onDone)();
      }),
    );
  }, [onDone, opacity, rotate, scale]);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
  }));

  return (
    <Animated.View pointerEvents="none" style={[styles.splashOverlay, overlayStyle]}>
      <Animated.Image resizeMode="contain" source={splashMark} style={[styles.splashLogo, logoStyle]} />
    </Animated.View>
  );
}

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
  const [introDone, setIntroDone] = useState(false);

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
          <Stack.Screen name="matches" />
          <Stack.Screen name="match/[id]" />
          <Stack.Screen name="notifications" />
          <Stack.Screen name="ticket/[id]" />
          <Stack.Screen name="live-match" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="+not-found" />
        </Stack>
      </ThemeProvider>
      {!introDone ? <AnimatedSplashOverlay onDone={() => setIntroDone(true)} /> : null}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  splashLogo: {
    height: 150,
    width: 150,
  },
  splashOverlay: {
    alignItems: 'center',
    backgroundColor: '#020605',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 99,
  },
});
