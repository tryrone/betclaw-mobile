import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from 'lucide-react-native';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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
  if (tone === 'success') {
    return {
      backgroundColor: theme.successSoft,
      borderColor: theme.successSoft,
      color: theme.success,
      icon: CircleCheck,
    };
  }
  if (tone === 'warning') {
    return {
      backgroundColor: theme.warningSoft,
      borderColor: theme.warningSoft,
      color: theme.warning,
      icon: TriangleAlert,
    };
  }
  if (tone === 'error') {
    return {
      backgroundColor: theme.dangerSoft,
      borderColor: theme.dangerSoft,
      color: theme.danger,
      icon: CircleAlert,
    };
  }
  return {
    backgroundColor: theme.primarySubtle,
    borderColor: theme.selectionBorder,
    color: theme.primarySoft,
    icon: Info,
  };
}

export function FloatingToastProvider({ children }: { children: ReactNode }) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
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
      durationMs: next.durationMs ?? 3600,
      id: idRef.current,
      message,
      title: next.title.trim(),
      tone: next.tone ?? 'info',
    });
  }, []);

  useEffect(() => {
    if (!toast || toast.durationMs <= 0) return;
    const timer = setTimeout(() => setToast(null), toast.durationMs);
    return () => clearTimeout(timer);
  }, [toast]);

  const value = useMemo(() => ({ dismissToast, showToast }), [dismissToast, showToast]);
  const palette = toast ? toneStyles(theme, toast.tone) : null;
  const Icon = palette?.icon;

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && palette && Icon ? (
        <View pointerEvents="box-none" style={[styles.host, { paddingTop: insets.top + spacing.sm }]}>
          <View
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
            style={[
              styles.alert,
              {
                backgroundColor: palette.backgroundColor,
                borderColor: palette.borderColor,
                shadowColor: theme.shadow,
              },
            ]}>
            <Icon color={palette.color} size={18} />
            <View style={styles.copy}>
              <Text style={[styles.title, { color: theme.foregroundStrong }]}>{toast.title}</Text>
              {toast.message ? <Text style={[styles.message, { color: theme.mutedLight }]}>{toast.message}</Text> : null}
            </View>
            <Pressable accessibilityLabel="Dismiss toast" accessibilityRole="button" onPress={dismissToast} style={styles.dismiss}>
              <X color={theme.mutedLight} size={16} />
            </Pressable>
          </View>
        </View>
      ) : null}
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

const styles = StyleSheet.create({
  alert: {
    alignItems: 'flex-start',
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    padding: spacing.md,
    shadowOffset: { height: 12, width: 0 },
    shadowOpacity: 0.24,
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
    height: 28,
    justifyContent: 'center',
    marginRight: -spacing.xs,
    marginTop: -spacing.xs,
    width: 28,
  },
  host: {
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 1000,
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
