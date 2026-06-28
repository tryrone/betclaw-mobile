import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold, useFonts } from '@expo-google-fonts/inter';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ThemeControllerProvider, useAppTheme, useThemeController } from '@/theme/colors';
import '@/global.css';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <ThemeControllerProvider>
      <RootLayoutContent />
    </ThemeControllerProvider>
  );
}

function RootLayoutContent() {
  const palette = useAppTheme();
  const { mode } = useThemeController();

  return (
    <GestureHandlerRootView style={[styles.root, { backgroundColor: palette.background }]}>
      <ThemeProvider value={mode === 'light' ? DefaultTheme : DarkTheme}>
        <StatusBar style={mode === 'light' ? 'dark' : 'light'} />
        <Stack
          screenOptions={{
            contentStyle: { backgroundColor: palette.background },
            headerShown: false,
          }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="matches" />
          <Stack.Screen name="match/[id]" />
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
