/* eslint-disable react-hooks/immutability -- Reanimated shared values are mutable by design. */
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from 'lucide-react-native';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { type AppTheme, useAppTheme } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

export type ToastTone = 'error' | 'info' | 'success' | 'warning';

export type ToastInput = {
  durationMs?: number;
  message?: string | null;
  title: string;
  tone?: ToastTone;
};

type Toast = Required<Pick<ToastInput, 'title' | 'tone'>> & {
  durationMs: number;
  id: number;
  message?: string | null;
};

type ToastContextValue = {
  dismissToast: () => void;
  showToast: (toast: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function toneStyles(theme: AppTheme, tone: ToastTone) {
  if (tone === 'success') return { color: theme.success, icon: CircleCheck, soft: theme.successSoft };
  if (tone === 'warning') return { color: theme.warning, icon: TriangleAlert, soft: theme.warningSoft };
  if (tone === 'error') return { color: theme.danger, icon: CircleAlert, soft: theme.dangerSoft };
  return { color: theme.primary, icon: Info, soft: theme.primarySubtle };
}

/**
 * Single animated toast card: springs down from the top edge on a solid,
 * elevated surface, auto-dismisses by floating back up, and can be dismissed
 * by tapping anywhere on it or the close button.
 */
function ToastCard({ onDone, toast }: { onDone: () => void; toast: Toast }) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-140);
  const opacity = useSharedValue(0);
  const dismissed = useRef(false);
  const palette = toneStyles(theme, toast.tone);
  const Icon = palette.icon;

  const animateOut = useCallback(() => {
    if (dismissed.current) return;
    dismissed.current = true;
    opacity.value = withTiming(0, { duration: 200, easing: Easing.in(Easing.quad) });
    translateY.value = withTiming(-120, { duration: 220, easing: Easing.in(Easing.quad) }, (finished) => {
      if (finished) runOnJS(onDone)();
    });
  }, [onDone, opacity, translateY]);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 160 });
    translateY.value = withSpring(0, { damping: 18, mass: 0.9, stiffness: 220 });

    if (toast.durationMs > 0) {
      const timer = setTimeout(animateOut, toast.durationMs);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [animateOut, opacity, toast.durationMs, translateY]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View pointerEvents="box-none" style={[toastStyles.host, { paddingTop: insets.top + spacing.sm }]}>
      <Animated.View
        accessibilityLiveRegion="polite"
        accessibilityRole="alert"
        style={[
          toastStyles.card,
          {
            backgroundColor: theme.backgroundAlt,
            borderColor: theme.borderStrong,
            shadowColor: theme.black,
          },
          cardStyle,
        ]}>
        <View style={[toastStyles.accent, { backgroundColor: palette.color }]} />
        <Pressable accessibilityLabel="Dismiss notification" onPress={animateOut} style={toastStyles.body}>
          <View style={[toastStyles.iconChip, { backgroundColor: palette.soft }]}>
            <Icon color={palette.color} size={16} />
          </View>
          <View style={toastStyles.copy}>
            <Text numberOfLines={1} style={[toastStyles.title, { color: theme.foregroundStrong }]}>
              {toast.title}
            </Text>
            {toast.message
              ? toast.message
                  .split('\n')
                  .filter(Boolean)
                  .slice(0, 3)
                  .map((line, index) => (
                    <Text key={`${line}-${index}`} numberOfLines={2} style={[toastStyles.message, { color: theme.mutedLight }]}>
                      {line}
                    </Text>
                  ))
              : null}
          </View>
          <Pressable
            accessibilityLabel="Dismiss toast"
            accessibilityRole="button"
            hitSlop={8}
            onPress={animateOut}
            style={[toastStyles.dismiss, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <X color={theme.mutedLight} size={14} />
          </Pressable>
        </Pressable>
      </Animated.View>
    </View>
  );
}

export function FloatingToastProvider({ children }: { children: ReactNode }) {
  const idRef = useRef(0);
  const [toast, setToast] = useState<Toast | null>(null);

  const dismissToast = useCallback(() => {
    setToast(null);
  }, []);

  const showToast = useCallback((next: ToastInput) => {
    const message = next.message?.trim();
    if (!message && !next.title.trim()) return;
    idRef.current += 1;
    setToast({
      durationMs: next.durationMs ?? 4200,
      id: idRef.current,
      message,
      title: next.title.trim(),
      tone: next.tone ?? 'info',
    });
  }, []);

  const value = useMemo(() => ({ dismissToast, showToast }), [dismissToast, showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? <ToastCard key={toast.id} onDone={dismissToast} toast={toast} /> : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const value = useContext(ToastContext);
  if (!value) {
    throw new Error('useToast must be used inside FloatingToastProvider');
  }
  return value;
}

export type FloatingAlertTone = ToastTone;
export type FloatingAlertInput = ToastInput;
export const FloatingAlertProvider = FloatingToastProvider;
export const useFloatingAlert = useToast;

const toastStyles = StyleSheet.create({
  accent: {
    borderBottomLeftRadius: radius.lg,
    borderTopLeftRadius: radius.lg,
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 4,
  },
  body: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    paddingLeft: spacing.md + 4,
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    elevation: 24,
    marginHorizontal: spacing.md,
    overflow: 'hidden',
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
  },
  copy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  dismiss: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
  host: {
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 1000,
  },
  iconChip: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  message: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 17,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 13,
    lineHeight: 18,
  },
});
