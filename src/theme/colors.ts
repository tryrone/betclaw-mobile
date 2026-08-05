import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme, type ColorSchemeName } from 'react-native';

/**
 * Two palettes share the same token contract (identical keys) so every component
 * that reads `useAppTheme()` recolors automatically. `light` and `dark` are wired
 * to the theme controller (system / light / dark preference + Settings toggle).
 */
const darkPalette = {
  background: '#0d1030',
  backgroundAlt: '#11143b',
  panel: 'rgba(20,23,61,0.86)',
  panelElevated: 'rgba(24,28,70,0.94)',
  authSheet: '#24285a',
  card: '#171b46',
  cardMuted: '#13163a',
  surface: 'rgba(255,255,255,0.06)',
  surfaceHover: 'rgba(255,255,255,0.10)',
  input: 'rgba(255,255,255,0.065)',
  field: 'rgba(255,255,255,0.065)',
  border: 'rgba(231,232,246,0.11)',
  borderStrong: 'rgba(231,232,246,0.20)',
  borderAccent: 'rgba(145,150,231,0.38)',
  selectionBorder: 'rgba(145,150,231,0.64)',
  foreground: '#e3e4ef',
  foregroundStrong: '#ffffff',
  muted: '#9294a7',
  mutedLight: '#c6c7d3',
  primary: '#7479d6',
  primaryDark: '#0d1030',
  primarySoft: '#a3a7f0',
  primarySubtle: 'rgba(116,121,214,0.16)',
  primaryMuted: 'rgba(116,121,214,0.22)',
  primaryGlowStrong: 'rgba(116,121,214,0.25)',
  primaryGlowSoft: 'rgba(116,121,214,0.08)',
  accent: '#f06b75',
  accentMuted: 'rgba(240,107,117,0.15)',
  accentGlowSoft: 'rgba(240,107,117,0.07)',
  success: '#45ce98',
  successSoft: 'rgba(69,206,152,0.15)',
  warning: '#efb85e',
  warningSoft: 'rgba(239,184,94,0.15)',
  danger: '#f27a87',
  dangerSoft: 'rgba(242,122,135,0.14)',
  live: '#45ce98',
  progressFill: '#8d92e5',
  statTrack: 'rgba(255,255,255,0.10)',
  statHome: '#8d92e5',
  statAway: '#f06b75',
  tabBar: 'rgba(17,20,59,0.76)',
  overlay: 'rgba(5,7,26,0.68)',
  shadow: '#05071b',
  white: '#ffffff',
  black: '#000000',
  inverse: '#ffffff',
} as const;

const lightPalette: Record<keyof typeof darkPalette, string> = {
  background: '#f5f6f9',
  backgroundAlt: '#eef0f5',
  panel: 'rgba(255,255,255,0.86)',
  panelElevated: 'rgba(255,255,255,0.95)',
  authSheet: '#ffffff',
  card: '#ffffff',
  cardMuted: '#fafafa',
  surface: '#f5f5f7',
  surfaceHover: '#eeeef2',
  input: '#f5f5f7',
  field: '#f5f5f7',
  border: '#e8e9ee',
  borderStrong: '#d7d8df',
  borderAccent: 'rgba(24,25,65,0.30)',
  selectionBorder: 'rgba(24,25,65,0.48)',
  foreground: '#35374d',
  foregroundStrong: '#17193e',
  muted: '#8b8d9d',
  mutedLight: '#626477',
  primary: '#11143b',
  primaryDark: '#ffffff',
  primarySoft: '#2b2f68',
  primarySubtle: 'rgba(17,20,59,0.07)',
  primaryMuted: 'rgba(17,20,59,0.11)',
  primaryGlowStrong: 'rgba(17,20,59,0.16)',
  primaryGlowSoft: 'rgba(17,20,59,0.04)',
  accent: '#cf3442',
  accentMuted: 'rgba(207,52,66,0.11)',
  accentGlowSoft: 'rgba(207,52,66,0.05)',
  success: '#0f8055',
  successSoft: 'rgba(15,128,85,0.12)',
  warning: '#a26208',
  warningSoft: 'rgba(162,98,8,0.12)',
  danger: '#c9364e',
  dangerSoft: 'rgba(201,54,78,0.11)',
  live: '#0f8055',
  progressFill: '#11143b',
  statTrack: 'rgba(17,20,59,0.09)',
  statHome: '#1855a5',
  statAway: '#e5454f',
  tabBar: 'rgba(255,255,255,0.76)',
  overlay: 'rgba(17,18,46,0.40)',
  shadow: 'rgba(17,20,59,0.12)',
  white: '#ffffff',
  black: '#000000',
  inverse: '#ffffff',
};

export const colorPalettes = {
  light: { mode: 'light', ...lightPalette },
  dark: { mode: 'dark', ...darkPalette },
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
  return scheme === 'dark' ? 'dark' : 'light';
}

export function getAppTheme(scheme: ColorSchemeName): AppTheme {
  return colorPalettes[getThemeMode(scheme)];
}

function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

export function ThemeControllerProvider({ children }: { children: ReactNode }) {
  const systemMode = getThemeMode(useColorScheme());
  const [preference, setPreferenceState] = useState<ThemePreference>('light');
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

export const colors = colorPalettes.light;
