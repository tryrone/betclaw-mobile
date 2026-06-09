import { useRouter } from 'expo-router';
import { Bell, Copy, KeyRound, LogOut, Settings, ShieldCheck, UserRound } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import {
  enterUp,
  GlassCard,
  GradientButton,
  IconButton,
  PressableScale,
  Screen,
  ScreenHeader,
  StatusBadge,
  ToggleSwitch,
} from '@/components/ui';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

type IconComponent = React.ComponentType<{ color?: string; size?: number; strokeWidth?: number }>;

function SettingRow({ checked = true, icon: Icon, label }: { checked?: boolean; icon: IconComponent; label: string }) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingLeft}>
        <View style={styles.settingIcon}>
          <Icon color={colors.primary} size={17} />
        </View>
        <Text numberOfLines={1} style={styles.settingLabel}>
          {label}
        </Text>
      </View>
      <ToggleSwitch value={checked} />
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();

  return (
    <Screen hasTabs>
      <Animated.View entering={enterUp(0)}>
        <ScreenHeader action={<IconButton icon={Settings} label="Settings menu" />} eyebrow="Account" title="Profile" />
      </Animated.View>

      <Animated.View entering={enterUp(1)}>
        <GlassCard>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>TO</Text>
            </View>
            <View style={styles.profileCopy}>
              <Text numberOfLines={1} style={styles.name}>
                Tega Oboraruvwe
              </Text>
              <Text numberOfLines={1} style={styles.email}>
                tega@betsclaw.win
              </Text>
              <StatusBadge label="Premium" tone="accent" />
            </View>
          </View>
        </GlassCard>
      </Animated.View>

      <Animated.View entering={enterUp(2)}>
        <Text style={styles.sectionTitle}>Security</Text>
      </Animated.View>
      <Animated.View entering={enterUp(3)} style={styles.settingList}>
        <SettingRow icon={KeyRound} label="Password update" />
        <SettingRow checked={false} icon={ShieldCheck} label="Two-factor authentication" />
      </Animated.View>

      <Animated.View entering={enterUp(4)} style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <StatusBadge label="Dark only" />
      </Animated.View>
      <Animated.View entering={enterUp(5)} style={styles.settingList}>
        <SettingRow icon={Bell} label="Email notifications" />
        <SettingRow icon={UserRound} label="Public profile" />
      </Animated.View>

      <Animated.View entering={enterUp(6)}>
        <GlassCard>
          <View style={styles.telegramHeader}>
            <View style={styles.telegramCopy}>
              <Text style={styles.cardTitle}>Telegram delivery</Text>
              <Text style={styles.cardCaption}>VIP pick alerts linked to mobile.</Text>
            </View>
            <StatusBadge label="Token" tone="warning" />
          </View>
          <View style={styles.telegramToken}>
            <Text numberOfLines={1} style={styles.tokenText}>
              /link BCLW-2849
            </Text>
            <PressableScale accessibilityLabel="Copy Telegram link command" accessibilityRole="button" scaleTo={0.85} style={styles.copyButton}>
              <Copy color={colors.primary} size={16} />
            </PressableScale>
          </View>
        </GlassCard>
      </Animated.View>

      <Animated.View entering={enterUp(7)}>
        <GradientButton>Save Changes</GradientButton>
      </Animated.View>

      <Animated.View entering={enterUp(8)}>
        <PressableScale
          accessibilityLabel="Sign out"
          accessibilityRole="button"
          onPress={() => router.replace('/(auth)/login')}
          style={styles.signOut}>
          <LogOut color={colors.danger} size={17} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </PressableScale>
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.primaryMuted,
    borderColor: colors.borderAccent,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 68,
    justifyContent: 'center',
    width: 68,
  },
  avatarText: {
    color: colors.primary,
    fontFamily: fonts.extraBold,
    fontSize: 23,
  },
  cardCaption: {
    color: colors.muted,
    fontFamily: fonts.medium,
    fontSize: 12,
    marginTop: 4,
  },
  cardTitle: {
    color: colors.foregroundStrong,
    fontFamily: fonts.extraBold,
    fontSize: 16,
  },
  copyButton: {
    alignItems: 'center',
    backgroundColor: colors.primaryMuted,
    borderColor: colors.borderAccent,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  email: {
    color: colors.mutedLight,
    fontFamily: fonts.semibold,
    fontSize: 12,
    marginBottom: 10,
  },
  name: {
    color: colors.foregroundStrong,
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
    gap: spacing.lg,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: colors.foregroundStrong,
    fontFamily: fonts.extraBold,
    fontSize: 17,
  },
  settingIcon: {
    alignItems: 'center',
    backgroundColor: colors.primaryMuted,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  settingLabel: {
    color: colors.foreground,
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  settingLeft: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minWidth: 0,
  },
  settingList: {
    gap: spacing.md,
  },
  settingRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  signOut: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  signOutText: {
    color: colors.danger,
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
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  telegramToken: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  tokenText: {
    color: colors.foreground,
    flex: 1,
    fontFamily: fonts.extraBold,
    fontSize: 13,
  },
});
