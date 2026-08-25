import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import {
  ChevronRight,
  Gift,
  KeyRound,
  Link2,
  LogOut,
  Mail,
  MessageCircle,
  MoonStar,
  Send,
  ShieldCheck,
  Smartphone,
  UserRound,
} from '@/components/modern-icons';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import {
  enterUp,
  GlassCard,
  PressableScale,
  Screen,
  ScreenHeader,
  StatusBadge,
  ToggleSwitch,
  useToast,
} from '@/components/ui';
import {
  useCreateTelegramCommunityInviteMutation,
  useCreateTelegramTokenMutation,
  useLogoutMutation,
  useMe,
  useTelegramCommunityStatus,
  useUpdatePreferencesMutation,
} from '@/lib/api/hooks';
import { useAppTheme, useThemeController } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

type IconComponent = React.ComponentType<{ color?: string; size?: number; strokeWidth?: number }>;

function SectionHeading({ description, title }: { description: string; title: string }) {
  const theme = useAppTheme();

  return (
    <View style={styles.sectionHeading}>
      <Text style={[styles.sectionTitle, { color: theme.foregroundStrong }]}>{title}</Text>
      <Text style={[styles.sectionDescription, { color: theme.muted }]}>{description}</Text>
    </View>
  );
}

function SettingIcon({ icon: Icon }: { icon: IconComponent }) {
  const theme = useAppTheme();

  return (
    <View style={[styles.settingIcon, { backgroundColor: theme.primarySubtle }]}>
      <Icon color={theme.primarySoft} size={19} strokeWidth={1.9} />
    </View>
  );
}

function SettingCopy({ description, label }: { description: string; label: string }) {
  const theme = useAppTheme();

  return (
    <View style={styles.settingCopy}>
      <Text style={[styles.settingLabel, { color: theme.foregroundStrong }]}>{label}</Text>
      <Text style={[styles.settingDescription, { color: theme.mutedLight }]}>{description}</Text>
    </View>
  );
}

function SettingsGroup({ children }: { children: React.ReactNode }) {
  const theme = useAppTheme();

  return (
    <View style={[styles.settingsGroup, { backgroundColor: theme.card, borderColor: theme.border }]}>
      {children}
    </View>
  );
}

function ActionRow({
  description,
  disabled,
  icon,
  label,
  onPress,
  showDivider,
}: {
  description: string;
  disabled?: boolean;
  icon: IconComponent;
  label: string;
  onPress: () => void;
  showDivider?: boolean;
}) {
  const theme = useAppTheme();

  return (
    <PressableScale
      accessibilityHint={description}
      accessibilityLabel={label}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.settingRow,
        showDivider ? { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth } : null,
        disabled ? styles.disabled : null,
      ]}>
      <SettingIcon icon={icon} />
      <SettingCopy description={description} label={label} />
      <ChevronRight color={theme.muted} size={19} strokeWidth={2.2} />
    </PressableScale>
  );
}

function SwitchRow({
  checked,
  description,
  disabled,
  icon,
  label,
  onChange,
  showDivider,
}: {
  checked: boolean;
  description: string;
  disabled?: boolean;
  icon: IconComponent;
  label: string;
  onChange: (value: boolean) => void;
  showDivider?: boolean;
}) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.settingRow,
        showDivider ? { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth } : null,
        disabled ? styles.disabled : null,
      ]}>
      <SettingIcon icon={icon} />
      <SettingCopy description={description} label={label} />
      <ToggleSwitch accessibilityLabel={label} disabled={disabled} onChange={onChange} value={checked} />
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { showToast } = useToast();
  const { mode, setThemeMode } = useThemeController();
  const me = useMe();
  const updatePreferences = useUpdatePreferencesMutation();
  const logout = useLogoutMutation();
  const telegramToken = useCreateTelegramTokenMutation();
  const communityStatus = useTelegramCommunityStatus();
  const createCommunityInvite = useCreateTelegramCommunityInviteMutation();

  const handleCommunityJoin = () => {
    createCommunityInvite.mutate(undefined, {
      onError: (error) => showToast({ message: error.message, title: 'Community invite failed', tone: 'error' }),
      onSuccess: (invite) => {
        Linking.openURL(invite.inviteLink)
          .then(() => showToast({ message: 'Invite ready. Opening Telegram.', title: 'Community invite', tone: 'success' }))
          .catch(() => showToast({ message: 'Open Telegram from the invite link.', title: 'Could not open Telegram', tone: 'error' }));
      },
    });
  };

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
  const telegramIdentity = profile?.telegramLink
    ? `@${profile.telegramLink.username ?? profile.telegramLink.chatId}`
    : 'Not connected';

  return (
    <Screen hasTabs>
      <Animated.View entering={enterUp(0)}>
        <ScreenHeader eyebrow="Account" title="Settings" />
      </Animated.View>

      <Animated.View entering={enterUp(1)}>
        <GlassCard style={styles.profileCard}>
          <View style={styles.profileTopRow}>
            <View style={[styles.avatar, { backgroundColor: theme.primarySubtle, borderColor: theme.selectionBorder }]}>
              <Text style={[styles.avatarText, { color: theme.primarySoft }]}>{initials || 'BC'}</Text>
            </View>
            <View style={styles.profileCopy}>
              <Text style={[styles.name, { color: theme.foregroundStrong }]}>{displayName}</Text>
              <Text numberOfLines={1} style={[styles.email, { color: theme.mutedLight }]}>{email}</Text>
            </View>
            <StatusBadge label={profile?.accessTier ?? 'Account'} tone={profile?.accessTier === 'PREMIUM' ? 'accent' : 'neutral'} />
          </View>
          <View style={[styles.profileStatus, { backgroundColor: theme.cardMuted, borderColor: theme.border }]}>
            <ShieldCheck color={profile?.twoFactorAuth ? theme.success : theme.muted} size={17} strokeWidth={2} />
            <Text style={[styles.profileStatusText, { color: theme.mutedLight }]}>
              Two-factor authentication is {profile?.twoFactorAuth ? 'enabled' : 'not enabled'}
            </Text>
          </View>
        </GlassCard>
      </Animated.View>

      <Animated.View entering={enterUp(2)} style={styles.sectionBlock}>
        <SectionHeading description="Password and account protection" title="Security" />
        <SettingsGroup>
          <ActionRow
            description="Send a secure password reset link"
            icon={KeyRound}
            label="Reset password"
            onPress={() => router.push('/(auth)/forgot-password' as any)}
            showDivider
          />
          <SwitchRow
            checked={Boolean(profile?.twoFactorAuth)}
            description="Require an extra verification step"
            disabled={updatePreferences.isPending}
            icon={ShieldCheck}
            label="Two-factor authentication"
            onChange={(twoFactorAuth) => updatePreferences.mutate({ twoFactorAuth })}
          />
        </SettingsGroup>
      </Animated.View>

      <Animated.View entering={enterUp(3)} style={styles.sectionBlock}>
        <SectionHeading description="Choose how BetClaw looks and reaches you" title="Preferences" />
        <SettingsGroup>
          <SwitchRow
            checked={darkModeEnabled}
            description={darkModeEnabled ? 'Dark appearance is active' : 'Use dark appearance'}
            disabled={updatePreferences.isPending}
            icon={MoonStar}
            label="Dark mode"
            onChange={(enabled) => {
              setThemeMode(enabled ? 'dark' : 'light');
              updatePreferences.mutate({ darkMode: enabled });
            }}
            showDivider
          />
          <SwitchRow
            checked={profile?.emailNotifications ?? true}
            description="Product and account updates"
            disabled={updatePreferences.isPending}
            icon={Mail}
            label="Email notifications"
            onChange={(emailNotifications) => updatePreferences.mutate({ emailNotifications })}
            showDivider
          />
          <SwitchRow
            checked={profile?.pushNotifications ?? true}
            description="Ticket, payment, and match alerts"
            disabled={updatePreferences.isPending}
            icon={Smartphone}
            label="Push notifications"
            onChange={(pushNotifications) => updatePreferences.mutate({ pushNotifications })}
            showDivider
          />
          <SwitchRow
            checked={Boolean(profile?.publicProfile)}
            description="Let other members find your profile"
            disabled={updatePreferences.isPending}
            icon={UserRound}
            label="Public profile"
            onChange={(publicProfile) => updatePreferences.mutate({ publicProfile })}
          />
        </SettingsGroup>
      </Animated.View>

      <Animated.View entering={enterUp(4)} style={styles.sectionBlock}>
        <SectionHeading description="Connect alert and delivery channels" title="Integrations" />
        <GlassCard style={styles.integrationCard}>
          <View style={styles.integrationHeader}>
            <View style={[styles.integrationIcon, { backgroundColor: theme.primarySubtle }]}>
              <Send color={theme.primarySoft} size={21} strokeWidth={1.9} />
            </View>
            <View style={styles.integrationCopy}>
              <Text style={[styles.integrationTitle, { color: theme.foregroundStrong }]}>Telegram delivery</Text>
              <Text style={[styles.integrationDescription, { color: theme.mutedLight }]}>Receive VIP pick alerts in Telegram.</Text>
            </View>
            <StatusBadge label={profile?.telegramLink ? 'Linked' : 'Not linked'} tone={profile?.telegramLink ? 'success' : 'neutral'} />
          </View>

          <View style={[styles.telegramIdentity, { backgroundColor: theme.cardMuted, borderColor: theme.border }]}>
            <Text style={[styles.telegramLabel, { color: theme.muted }]}>Telegram account</Text>
            <Text selectable style={[styles.telegramValue, { color: theme.foregroundStrong }]}>{telegramIdentity}</Text>
          </View>

          {telegramToken.data?.command ? (
            <View style={[styles.telegramCommand, { backgroundColor: theme.field, borderColor: theme.border }]}>
              <Text style={[styles.telegramLabel, { color: theme.muted }]}>Link command</Text>
              <Text selectable style={[styles.commandText, { color: theme.foregroundStrong }]}>{telegramToken.data.command}</Text>
            </View>
          ) : null}

          <PressableScale
            accessibilityHint="Creates a command you can use to connect your Telegram account"
            accessibilityLabel={profile?.telegramLink ? 'Create a new Telegram link command' : 'Create Telegram link command'}
            accessibilityRole="button"
            disabled={telegramToken.isPending}
            onPress={() => telegramToken.mutate()}
            style={[styles.integrationAction, { borderColor: theme.border }, telegramToken.isPending ? styles.disabled : null]}>
            <Link2 color={theme.primarySoft} size={18} />
            <Text style={[styles.integrationActionText, { color: theme.foregroundStrong }]}>
              {telegramToken.isPending ? 'Creating command…' : profile?.telegramLink ? 'Create a new link command' : 'Create link command'}
            </Text>
            <ChevronRight color={theme.muted} size={18} />
          </PressableScale>
        </GlassCard>
      </Animated.View>

      <Animated.View entering={enterUp(5)} style={styles.sectionBlock}>
        <SectionHeading description="Share BetClaw and join the conversation" title="Community & rewards" />
        <SettingsGroup>
          <ActionRow
            description={communityStatus.data?.enabled && communityStatus.data?.configured ? 'Open your private Telegram community invite' : 'Community access is still being configured'}
            disabled={createCommunityInvite.isPending}
            icon={MessageCircle}
            label={communityStatus.data?.enabled && communityStatus.data?.configured ? 'Join the BetClaw community' : 'Community setup pending'}
            onPress={handleCommunityJoin}
            showDivider
          />
          <ActionRow
            description="Earn 20% when friends purchase eligible access"
            icon={Gift}
            label="Invite friends"
            onPress={() => router.push('/referrals' as any)}
          />
        </SettingsGroup>
      </Animated.View>

      <Animated.View entering={enterUp(6)} style={styles.accountActions}>
        <Text style={[styles.accountActionsLabel, { color: theme.muted }]}>ACCOUNT ACTIONS</Text>
        <PressableScale
          accessibilityHint="Ends your BetClaw session on this device"
          accessibilityLabel="Sign out"
          accessibilityRole="button"
          disabled={logout.isPending}
          onPress={() => logout.mutate(undefined, { onSettled: () => router.replace('/(auth)/login') })}
          style={[styles.signOut, { backgroundColor: theme.dangerSoft, borderColor: theme.dangerSoft }, logout.isPending ? styles.disabled : null]}>
          <View style={[styles.signOutIcon, { backgroundColor: theme.card }]}>
            <LogOut color={theme.danger} size={19} />
          </View>
          <View style={styles.signOutCopy}>
            <Text style={[styles.signOutText, { color: theme.danger }]}>{logout.isPending ? 'Signing out…' : 'Sign out'}</Text>
            <Text style={[styles.signOutDescription, { color: theme.mutedLight }]}>End this session on your device</Text>
          </View>
        </PressableScale>
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  accountActions: { gap: spacing.sm },
  accountActionsLabel: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 0.8, paddingLeft: spacing.xs },
  avatar: { alignItems: 'center', borderRadius: radius.pill, borderWidth: 1, height: 56, justifyContent: 'center', width: 56 },
  avatarText: { fontFamily: fonts.extraBold, fontSize: 19 },
  commandText: { fontFamily: fonts.bold, fontSize: 12, lineHeight: 18 },
  disabled: { opacity: 0.5 },
  email: { fontFamily: fonts.medium, fontSize: 12, marginTop: 2 },
  integrationAction: { alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: spacing.sm, minHeight: 48, paddingTop: spacing.md },
  integrationActionText: { flex: 1, fontFamily: fonts.bold, fontSize: 13 },
  integrationCard: { gap: spacing.md },
  integrationCopy: { flex: 1, minWidth: 0 },
  integrationDescription: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 17, marginTop: 2 },
  integrationHeader: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  integrationIcon: { alignItems: 'center', borderRadius: radius.md, height: 42, justifyContent: 'center', width: 42 },
  integrationTitle: { fontFamily: fonts.extraBold, fontSize: 15 },
  name: { fontFamily: fonts.extraBold, fontSize: 18, lineHeight: 22 },
  profileCard: { gap: spacing.md },
  profileCopy: { flex: 1, minWidth: 0 },
  profileStatus: { alignItems: 'center', borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, minHeight: 40, paddingHorizontal: spacing.md },
  profileStatusText: { flex: 1, fontFamily: fonts.semibold, fontSize: 11 },
  profileTopRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  sectionBlock: { gap: spacing.sm },
  sectionDescription: { fontFamily: fonts.medium, fontSize: 11, lineHeight: 16, marginTop: 1 },
  sectionHeading: { paddingHorizontal: spacing.xs },
  sectionTitle: { fontFamily: fonts.extraBold, fontSize: 17, lineHeight: 22 },
  settingCopy: { flex: 1, minWidth: 0 },
  settingDescription: { fontFamily: fonts.medium, fontSize: 11, lineHeight: 16, marginTop: 2 },
  settingIcon: { alignItems: 'center', borderRadius: radius.md, height: 40, justifyContent: 'center', width: 40 },
  settingLabel: { fontFamily: fonts.bold, fontSize: 14, lineHeight: 18 },
  settingRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, minHeight: 68, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  settingsGroup: { borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden' },
  signOut: { alignItems: 'center', borderRadius: radius.lg, borderWidth: 1, flexDirection: 'row', gap: spacing.md, minHeight: 68, padding: spacing.md },
  signOutCopy: { flex: 1 },
  signOutDescription: { fontFamily: fonts.medium, fontSize: 11, marginTop: 2 },
  signOutIcon: { alignItems: 'center', borderRadius: radius.md, height: 40, justifyContent: 'center', width: 40 },
  signOutText: { fontFamily: fonts.extraBold, fontSize: 14 },
  telegramCommand: { borderRadius: radius.md, borderWidth: 1, gap: spacing.xs, padding: spacing.md },
  telegramIdentity: { alignItems: 'center', borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between', minHeight: 44, paddingHorizontal: spacing.md },
  telegramLabel: { fontFamily: fonts.semibold, fontSize: 10, textTransform: 'uppercase' },
  telegramValue: { flexShrink: 1, fontFamily: fonts.bold, fontSize: 12, textAlign: 'right' },
});
