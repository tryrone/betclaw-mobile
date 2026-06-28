import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Bell, ChevronRight, Copy, KeyRound, LogOut, Settings, ShieldCheck, SunMoon, UserRound } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import {
  enterUp,
  GlassCard,
  IconButton,
  PressableScale,
  Screen,
  ScreenHeader,
  StatusBadge,
  ToggleSwitch,
} from '@/components/ui';
import { useAppTheme, useThemeController } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

type IconComponent = React.ComponentType<{ color?: string; size?: number; strokeWidth?: number }>;
const SETTINGS_STORAGE_PREFIX = 'betclaw.settings';

function useStoredBoolean(key: string, initialValue: boolean) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(`${SETTINGS_STORAGE_PREFIX}.${key}`)
      .then((storedValue) => {
        if (!mounted) return;
        if (storedValue === 'true') setValue(true);
        if (storedValue === 'false') setValue(false);
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, [key]);

  const updateValue = useCallback((nextValue: boolean) => {
    setValue(nextValue);
    AsyncStorage.setItem(`${SETTINGS_STORAGE_PREFIX}.${key}`, String(nextValue)).catch(() => undefined);
  }, [key]);

  return [value, updateValue] as const;
}

function SettingRow({
  checked = true,
  icon: Icon,
  label,
  onChange,
}: {
  checked?: boolean;
  icon: IconComponent;
  label: string;
  onChange?: (value: boolean) => void;
}) {
  const theme = useAppTheme();

  return (
    <View style={[styles.settingRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.settingLeft}>
        <View style={[styles.settingIcon, { backgroundColor: theme.primarySubtle, borderColor: theme.selectionBorder }]}>
          <Icon color={theme.primarySoft} size={16} />
        </View>
        <Text numberOfLines={1} style={[styles.settingLabel, { color: theme.foreground }]}>
          {label}
        </Text>
      </View>
      <ToggleSwitch onChange={onChange} value={checked} />
    </View>
  );
}

function ActionRow({
  icon: Icon,
  label,
  onPress,
}: {
  icon: IconComponent;
  label: string;
  onPress: () => void;
}) {
  const theme = useAppTheme();

  return (
    <PressableScale
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.settingRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.settingLeft}>
        <View style={[styles.settingIcon, { backgroundColor: theme.primarySubtle, borderColor: theme.selectionBorder }]}>
          <Icon color={theme.primarySoft} size={16} />
        </View>
        <Text numberOfLines={1} style={[styles.settingLabel, { color: theme.foreground }]}>
          {label}
        </Text>
      </View>
      <ChevronRight color={theme.mutedLight} size={18} strokeWidth={2.4} />
    </PressableScale>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { mode, setThemeMode } = useThemeController();
  const darkModeEnabled = mode === 'dark';
  const [twoFactorAuth, setTwoFactorAuth] = useStoredBoolean('twoFactorAuth', false);
  const [emailNotifications, setEmailNotifications] = useStoredBoolean('emailNotifications', true);
  const [publicProfile, setPublicProfile] = useStoredBoolean('publicProfile', false);

  return (
    <Screen hasTabs>
      <Animated.View entering={enterUp(0)}>
        <ScreenHeader action={<IconButton icon={Settings} label="Settings menu" />} eyebrow="Account" title="Profile" />
      </Animated.View>

      <Animated.View entering={enterUp(1)}>
        <GlassCard>
          <View style={styles.profileRow}>
            <View style={[styles.avatar, { backgroundColor: theme.primarySubtle, borderColor: theme.selectionBorder }]}>
              <Text style={[styles.avatarText, { color: theme.primarySoft }]}>TO</Text>
            </View>
            <View style={styles.profileCopy}>
              <Text numberOfLines={1} style={[styles.name, { color: theme.foregroundStrong }]}>
                Tega Oboraruvwe
              </Text>
              <Text numberOfLines={1} style={[styles.email, { color: theme.mutedLight }]}>
                tega@betsclaw.win
              </Text>
              <StatusBadge label="Premium" tone="accent" />
            </View>
          </View>
        </GlassCard>
      </Animated.View>

      <Animated.View entering={enterUp(2)}>
        <Text style={[styles.sectionTitle, { color: theme.foregroundStrong }]}>Security</Text>
      </Animated.View>
      <Animated.View entering={enterUp(3)} style={styles.settingList}>
        <ActionRow icon={KeyRound} label="Reset password" onPress={() => router.push('/(auth)/forgot-password' as any)} />
        <SettingRow checked={twoFactorAuth} icon={ShieldCheck} label="Two-factor authentication" onChange={setTwoFactorAuth} />
      </Animated.View>

      <Animated.View entering={enterUp(4)} style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.foregroundStrong }]}>Preferences</Text>
        <StatusBadge label={darkModeEnabled ? 'Dark mode' : 'Light mode'} />
      </Animated.View>
      <Animated.View entering={enterUp(5)} style={styles.settingList}>
        <SettingRow
          checked={darkModeEnabled}
          icon={SunMoon}
          label="Dark mode"
          onChange={(enabled) => setThemeMode(enabled ? 'dark' : 'light')}
        />
        <SettingRow checked={emailNotifications} icon={Bell} label="Email notifications" onChange={setEmailNotifications} />
        <SettingRow checked={publicProfile} icon={UserRound} label="Public profile" onChange={setPublicProfile} />
      </Animated.View>

      <Animated.View entering={enterUp(6)}>
        <GlassCard>
          <View style={styles.telegramHeader}>
            <View style={styles.telegramCopy}>
              <Text style={[styles.cardTitle, { color: theme.foregroundStrong }]}>Telegram delivery</Text>
              <Text style={[styles.cardCaption, { color: theme.muted }]}>VIP pick alerts linked to mobile.</Text>
            </View>
            <StatusBadge label="Token" tone="warning" />
          </View>
          <View style={[styles.telegramToken, { backgroundColor: theme.field, borderColor: theme.border }]}>
            <Text numberOfLines={1} style={[styles.tokenText, { color: theme.foreground }]}>
              /link BCLW-2849
            </Text>
            <PressableScale
              accessibilityLabel="Copy Telegram link command"
              accessibilityRole="button"
              scaleTo={0.85}
              style={[styles.copyButton, { backgroundColor: theme.primarySubtle, borderColor: theme.selectionBorder }]}>
              <Copy color={theme.primarySoft} size={15} />
            </PressableScale>
          </View>
        </GlassCard>
      </Animated.View>

      <Animated.View entering={enterUp(7)}>
        <PressableScale
          accessibilityLabel="Sign out"
          accessibilityRole="button"
          onPress={() => router.replace('/(auth)/login')}
          style={styles.signOut}>
          <LogOut color={theme.danger} size={17} />
          <Text style={[styles.signOutText, { color: theme.danger }]}>Sign Out</Text>
        </PressableScale>
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 60,
    justifyContent: 'center',
    width: 60,
  },
  avatarText: {
    fontFamily: fonts.extraBold,
    fontSize: 21,
  },
  cardCaption: {
    fontFamily: fonts.medium,
    fontSize: 12,
    marginTop: 4,
  },
  cardTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 16,
  },
  copyButton: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  email: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    marginBottom: 10,
  },
  name: {
    fontFamily: fonts.extraBold,
    fontSize: 17,
  },
  profileCopy: {
    flex: 1,
    minWidth: 0,
  },
  profileRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 17,
  },
  settingIcon: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  settingLabel: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  settingLeft: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minWidth: 0,
  },
  settingList: {
    gap: spacing.sm,
  },
  settingRow: {
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
    padding: spacing.sm,
  },
  signOut: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  signOutText: {
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  telegramCopy: {
    flex: 1,
    minWidth: 0,
  },
  telegramHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  telegramToken: {
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
    padding: spacing.sm,
  },
  tokenText: {
    flex: 1,
    fontFamily: fonts.extraBold,
    fontSize: 13,
  },
});
