import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme, type ColorSchemeName } from 'react-native';

/**
 * The dashboard redesign is dark-only. A single palette is defined and mapped to
 * both scheme keys so existing theme plumbing (system/light/dark preference,
 * settings toggle) keeps working. If a real light theme ships later, replace the
 * `light` mapping with its own palette.
 */
const darkPalette = {
  background: '#020605',
  backgroundAlt: '#04100e',
  panel: 'rgba(2, 6, 5, 0.9)',
  panelElevated: 'rgba(4, 16, 14, 0.88)',
  card: '#0b1210',
  cardMuted: '#0a0f0d',
  surface: 'rgba(255,255,255,0.07)',
  surfaceHover: 'rgba(255,255,255,0.10)',
  input: 'rgba(255,255,255,0.07)',
  field: 'rgba(255,255,255,0.07)',
  border: 'rgba(255,255,255,0.06)',
  borderStrong: 'rgba(255,255,255,0.12)',
  borderAccent: 'rgba(46,242,208,0.28)',
  selectionBorder: 'rgba(46,242,208,0.45)',
  foreground: '#e6f4f1',
  foregroundStrong: '#ffffff',
  muted: '#8fa09d',
  mutedLight: '#c9d4d2',
  primary: '#2ef2d0',
  primaryDark: '#02110f',
  primarySoft: '#5ff7dd',
  primarySubtle: 'rgba(46,242,208,0.12)',
  primaryMuted: 'rgba(46,242,208,0.16)',
  primaryGlowStrong: 'rgba(46,242,208,0.22)',
  primaryGlowSoft: 'rgba(46,242,208,0.06)',
  accent: '#ffd34d',
  accentMuted: 'rgba(255,211,77,0.14)',
  accentGlowSoft: 'rgba(255,211,77,0.06)',
  success: '#86efac',
  successSoft: 'rgba(74,222,128,0.14)',
  warning: '#fbbf24',
  warningSoft: 'rgba(251,191,36,0.14)',
  danger: '#fca5a5',
  dangerSoft: 'rgba(248,113,113,0.14)',
  live: '#ff3f75',
  progressFill: '#2ef2d0',
  statTrack: 'rgba(255,255,255,0.10)',
  statHome: '#2ef2d0',
  statAway: '#ffd34d',
  tabBar: 'rgba(4,16,14,0.95)',
  overlay: 'rgba(0,0,0,0.55)',
  shadow: '#000000',
  white: '#ffffff',
  black: '#000000',
  inverse: '#02110f',
} as const;

export const colorPalettes = {
  light: { mode: 'light', ...darkPalette },
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
