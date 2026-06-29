import { useRouter } from 'expo-router';
import { ArrowLeft, Bell, CheckCheck } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { enterUp, GlassCard, IconButton, PressableScale, Screen, StatusBadge } from '@/components/ui';
import {
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotifications,
} from '@/lib/api/hooks';
import { useAppTheme } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

function formatActivityDate(value: string | Date) {
  return new Date(value).toLocaleString(undefined, {
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  });
}

export default function NotificationsScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const notifications = useNotifications(30);
  const markRead = useMarkNotificationReadMutation();
  const markAllRead = useMarkAllNotificationsReadMutation();
  const items = notifications.data?.items ?? [];

  return (
    <Screen>
      <Animated.View entering={enterUp(0)} style={styles.header}>
        <IconButton icon={ArrowLeft} label="Go back" onPress={() => router.back()} />
        <Text style={[styles.title, { color: theme.foregroundStrong }]}>Notifications</Text>
        <IconButton icon={CheckCheck} label="Mark all read" onPress={() => markAllRead.mutate()} />
      </Animated.View>

      <Animated.View entering={enterUp(1)}>
        <GlassCard style={styles.summary}>
          <View style={[styles.summaryIcon, { backgroundColor: theme.primarySubtle, borderColor: theme.selectionBorder }]}>
            <Bell color={theme.primarySoft} size={18} />
          </View>
          <View style={styles.summaryCopy}>
            <Text style={[styles.summaryTitle, { color: theme.foregroundStrong }]}>
              {notifications.data?.unreadCount ?? 0} unread
            </Text>
            <Text style={[styles.summaryText, { color: theme.muted }]}>Ticket, wallet, and account updates from BetClaw.</Text>
          </View>
        </GlassCard>
      </Animated.View>

      {items.length === 0 ? (
        <Animated.View entering={enterUp(2)}>
          <GlassCard style={styles.empty}>
            <Text style={[styles.summaryTitle, { color: theme.foregroundStrong }]}>
              {notifications.isLoading ? 'Loading notifications' : 'No notifications yet'}
            </Text>
            <Text style={[styles.summaryText, { color: theme.muted }]}>
              Activity from ticket jobs and payments will appear here.
            </Text>
          </GlassCard>
        </Animated.View>
      ) : null}

      {items.map((item: any, index: number) => (
        <Animated.View entering={enterUp(2 + index)} key={item.id}>
          <PressableScale
            accessibilityLabel={item.title}
            accessibilityRole="button"
            onPress={() => markRead.mutate(item.id)}
            scaleTo={0.98}>
            <GlassCard style={[styles.item, !item.readAt ? { borderColor: theme.selectionBorder } : null]}>
              <View style={styles.itemTop}>
                <Text numberOfLines={1} style={[styles.itemTitle, { color: theme.foregroundStrong }]}>
                  {item.title}
                </Text>
                <StatusBadge label={item.readAt ? 'Read' : 'New'} tone={item.readAt ? 'neutral' : 'accent'} />
              </View>
              {item.description ? (
                <Text style={[styles.itemText, { color: theme.mutedLight }]}>{item.description}</Text>
              ) : null}
              <Text style={[styles.itemDate, { color: theme.muted }]}>{formatActivityDate(item.createdAt)}</Text>
            </GlassCard>
          </PressableScale>
        </Animated.View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: {
    gap: spacing.xs,
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  item: {
    gap: spacing.sm,
    padding: spacing.md,
  },
  itemDate: {
    fontFamily: fonts.medium,
    fontSize: 11,
  },
  itemText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 19,
  },
  itemTitle: {
    flex: 1,
    fontFamily: fonts.extraBold,
    fontSize: 15,
  },
  itemTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  summary: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  summaryCopy: {
    flex: 1,
    minWidth: 0,
  },
  summaryIcon: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  summaryText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 3,
  },
  summaryTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 17,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 23,
  },
});
