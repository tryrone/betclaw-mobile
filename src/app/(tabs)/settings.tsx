import { useRouter } from 'expo-router';
import { Bell, ChevronRight, Copy, KeyRound, LogOut, Settings, ShieldCheck, SunMoon, UserRound } from 'lucide-react-native';
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
import {
  useCreateTelegramTokenMutation,
  useLogoutMutation,
  useMe,
  useUpdatePreferencesMutation,
} from '@/lib/api/hooks';
import { useAppTheme, useThemeController } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

type IconComponent = React.ComponentType<{ color?: string; size?: number; strokeWidth?: number }>;

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
  const me = useMe();
  const updatePreferences = useUpdatePreferencesMutation();
  const logout = useLogoutMutation();
  const telegramToken = useCreateTelegramTokenMutation();
  const darkModeEnabled = mode === 'dark';
  const profile = me.data;
  const displayName = profile?.name ?? 'BetClaw user';
  const email = profile?.email ?? '';
  const initials = displayName
    .split(' ')
    .map((part: string) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const telegramCommand =
    telegramToken.data?.command ??
    (profile?.telegramLink ? `Linked: @${profile.telegramLink.username ?? profile.telegramLink.chatId}` : 'Generate a link token');

  return (
    <Screen hasTabs>
      <Animated.View entering={enterUp(0)}>
        <ScreenHeader action={<IconButton icon={Settings} label="Settings menu" />} eyebrow="Account" title="Profile" />
      </Animated.View>

      <Animated.View entering={enterUp(1)}>
        <GlassCard>
          <View style={styles.profileRow}>
            <View style={[styles.avatar, { backgroundColor: theme.primarySubtle, borderColor: theme.selectionBorder }]}>
              <Text style={[styles.avatarText, { color: theme.primarySoft }]}>{initials || 'BC'}</Text>
            </View>
            <View style={styles.profileCopy}>
              <Text numberOfLines={1} style={[styles.name, { color: theme.foregroundStrong }]}>
                {displayName}
              </Text>
              <Text numberOfLines={1} style={[styles.email, { color: theme.mutedLight }]}>
                {email}
              </Text>
              <StatusBadge label={profile?.accessTier ?? 'Account'} tone={profile?.accessTier === 'PREMIUM' ? 'accent' : 'neutral'} />
            </View>
          </View>
        </GlassCard>
      </Animated.View>

      <Animated.View entering={enterUp(2)}>
        <Text style={[styles.sectionTitle, { color: theme.foregroundStrong }]}>Security</Text>
      </Animated.View>
      <Animated.View entering={enterUp(3)} style={styles.settingList}>
        <ActionRow icon={KeyRound} label="Reset password" onPress={() => router.push('/(auth)/forgot-password' as any)} />
        <SettingRow checked={Boolean(profile?.twoFactorAuth)} icon={ShieldCheck} label="Two-factor authentication" onChange={(twoFactorAuth) => updatePreferences.mutate({ twoFactorAuth })} />
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
          onChange={(enabled) => {
            setThemeMode(enabled ? 'dark' : 'light');
            updatePreferences.mutate({ darkMode: enabled });
          }}
        />
        <SettingRow checked={profile?.emailNotifications ?? true} icon={Bell} label="Email notifications" onChange={(emailNotifications) => updatePreferences.mutate({ emailNotifications })} />
        <SettingRow checked={profile?.pushNotifications ?? true} icon={Bell} label="Push notifications" onChange={(pushNotifications) => updatePreferences.mutate({ pushNotifications })} />
        <SettingRow checked={Boolean(profile?.publicProfile)} icon={UserRound} label="Public profile" onChange={(publicProfile) => updatePreferences.mutate({ publicProfile })} />
      </Animated.View>

      <Animated.View entering={enterUp(6)}>
        <GlassCard>
          <View style={styles.telegramHeader}>
            <View style={styles.telegramCopy}>
              <Text style={[styles.cardTitle, { color: theme.foregroundStrong }]}>Telegram delivery</Text>
              <Text style={[styles.cardCaption, { color: theme.muted }]}>VIP pick alerts linked to mobile.</Text>
            </View>
            <StatusBadge label={profile?.telegramLink ? 'Linked' : 'Token'} tone={profile?.telegramLink ? 'success' : 'warning'} />
          </View>
          <View style={[styles.telegramToken, { backgroundColor: theme.field, borderColor: theme.border }]}>
            <Text numberOfLines={1} style={[styles.tokenText, { color: theme.foreground }]}>
              {telegramCommand}
            </Text>
            <PressableScale
              accessibilityLabel="Create Telegram link command"
              accessibilityRole="button"
              onPress={() => telegramToken.mutate()}
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
          onPress={() => logout.mutate(undefined, { onSettled: () => router.replace('/(auth)/login') })}
          style={styles.signOut}>
          <LogOut color={theme.danger} size={17} />
          <Text style={[styles.signOutText, { color: theme.danger }]}>{logout.isPending ? 'Signing Out...' : 'Sign Out'}</Text>
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
