import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme, type ColorSchemeName } from 'react-native';

export const colorPalettes = {
  light: {
    mode: 'light',
    background: '#f8f8f5',
    backgroundAlt: '#eff1ec',
    panel: '#ffffff',
    panelElevated: '#fcfcf8',
    card: '#ffffff',
    cardMuted: '#f3f4f0',
    surface: '#ffffff',
    surfaceHover: '#f1f2ec',
    input: '#f6f6f2',
    field: '#ffffff',
    border: '#e0e4dc',
    borderStrong: '#ced8c9',
    borderAccent: 'rgba(169,232,40,0.26)',
    selectionBorder: 'rgba(169,232,40,0.34)',
    foreground: '#252a25',
    foregroundStrong: '#101510',
    muted: '#777e73',
    mutedLight: '#8f968b',
    primary: '#A9E828',
    primaryDark: '#12180b',
    primarySoft: '#93D51F',
    primarySubtle: 'rgba(169,232,40,0.08)',
    primaryMuted: 'rgba(169,232,40,0.10)',
    accent: '#ff7a1a',
    accentMuted: 'rgba(255,122,26,0.14)',
    success: '#22c55e',
    successSoft: 'rgba(34,197,94,0.14)',
    warning: '#f59e0b',
    warningSoft: 'rgba(245,158,11,0.16)',
    danger: '#ef4444',
    dangerSoft: 'rgba(239,68,68,0.13)',
    live: '#f43f5e',
    progressFill: '#93D51F',
    statTrack: '#e8ece4',
    statHome: '#2c1034',
    statAway: '#93D51F',
    tabBar: 'rgba(255,255,255,0.92)',
    overlay: 'rgba(0,0,0,0.34)',
    shadow: '#8a9385',
    white: '#ffffff',
    black: '#000000',
    inverse: '#050706',
  },
  dark: {
    mode: 'dark',
    background: '#070807',
    backgroundAlt: '#10110f',
    panel: '#141512',
    panelElevated: '#1a1b18',
    card: '#171815',
    cardMuted: '#10110f',
    surface: 'rgba(255,255,255,0.07)',
    surfaceHover: 'rgba(255,255,255,0.10)',
    input: 'rgba(255,255,255,0.07)',
    field: '#111210',
    border: 'rgba(255,255,255,0.10)',
    borderStrong: 'rgba(255,255,255,0.16)',
    borderAccent: 'rgba(169,232,40,0.28)',
    selectionBorder: 'rgba(169,232,40,0.30)',
    foreground: '#e9efe6',
    foregroundStrong: '#ffffff',
    muted: '#828a7e',
    mutedLight: '#b5bdb1',
    primary: '#A9E828',
    primaryDark: '#0b0d08',
    primarySoft: '#93D51F',
    primarySubtle: 'rgba(169,232,40,0.08)',
    primaryMuted: 'rgba(169,232,40,0.10)',
    accent: '#ff8a2a',
    accentMuted: 'rgba(255,138,42,0.16)',
    success: '#4ade80',
    successSoft: 'rgba(74,222,128,0.14)',
    warning: '#fbbf24',
    warningSoft: 'rgba(251,191,36,0.14)',
    danger: '#ff4b4b',
    dangerSoft: 'rgba(255,75,75,0.13)',
    live: '#fb2f6b',
    progressFill: '#93D51F',
    statTrack: 'rgba(255,255,255,0.10)',
    statHome: '#43164a',
    statAway: '#93D51F',
    tabBar: 'rgba(17,20,15,0.94)',
    overlay: 'rgba(0,0,0,0.56)',
    shadow: '#000000',
    white: '#ffffff',
    black: '#000000',
    inverse: '#ffffff',
  },
} as const;

export type ThemeMode = keyof typeof colorPalettes;
export type AppTheme = (typeof colorPalettes)[ThemeMode];
export type AppColor = keyof AppTheme;
export type ThemePreference = ThemeMode | 'system';

type ThemeController = {
  mode: ThemeMode;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  setThemeMode: (mode: ThemeMode) => void;
  systemMode: ThemeMode;
  toggleTheme: () => void;
};

const ThemeControllerContext = createContext<ThemeController | null>(null);
const THEME_PREFERENCE_KEY = 'betclaw.theme.preference';

export function getThemeMode(scheme: ColorSchemeName): ThemeMode {
  return scheme === 'light' ? 'light' : 'dark';
}

export function getAppTheme(scheme: ColorSchemeName): AppTheme {
  return colorPalettes[getThemeMode(scheme)];
}

function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

export function ThemeControllerProvider({ children }: { children: ReactNode }) {
  const systemMode = getThemeMode(useColorScheme());
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const mode = preference === 'system' ? systemMode : preference;

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(THEME_PREFERENCE_KEY)
      .then((storedPreference) => {
        if (mounted && isThemePreference(storedPreference)) {
          setPreferenceState(storedPreference);
        }
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, []);

  const setPreference = useCallback((nextPreference: ThemePreference) => {
    setPreferenceState(nextPreference);
    AsyncStorage.setItem(THEME_PREFERENCE_KEY, nextPreference).catch(() => undefined);
  }, []);

  const setThemeMode = useCallback((nextMode: ThemeMode) => {
    setPreference(nextMode);
  }, [setPreference]);

  const toggleTheme = useCallback(() => {
    setPreferenceState((currentPreference) => {
      const currentMode = currentPreference === 'system' ? systemMode : currentPreference;
      const nextPreference = currentMode === 'dark' ? 'light' : 'dark';
      AsyncStorage.setItem(THEME_PREFERENCE_KEY, nextPreference).catch(() => undefined);
      return nextPreference;
    });
  }, [systemMode]);

  const value = useMemo(
    () => ({
      mode,
      preference,
      setPreference,
      setThemeMode,
      systemMode,
      toggleTheme,
    }),
    [mode, preference, setPreference, setThemeMode, systemMode, toggleTheme],
  );

  return createElement(ThemeControllerContext.Provider, { value }, children);
}

export function useThemeController(): ThemeController {
  const systemMode = getThemeMode(useColorScheme());
  const context = useContext(ThemeControllerContext);

  return useMemo(
    () =>
      context ?? {
        mode: systemMode,
        preference: 'system' as const,
        setPreference: () => undefined,
        setThemeMode: () => undefined,
        systemMode,
        toggleTheme: () => undefined,
      },
    [context, systemMode],
  );
}

export function useAppTheme(): AppTheme {
  return colorPalettes[useThemeController().mode];
}

export const colors = colorPalettes.dark;
