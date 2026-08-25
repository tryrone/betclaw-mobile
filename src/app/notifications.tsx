import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  ArrowUpCircle,
  Bell,
  CheckCheck,
  ChevronRight,
  CreditCard,
  Sparkles,
  Target,
  TrendingDown,
  Wallet,
  XCircle,
  type LucideIcon,
} from '@/components/modern-icons';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { enterUp, GlassCard, IconButton, PressableScale, Screen, ScreenHeader } from '@/components/ui';
import { useMarkAllNotificationsReadMutation, useMarkNotificationReadMutation, useNotifications } from '@/lib/api/hooks';
import type { NotificationItem } from '@/lib/api/types';
import { useAppTheme, type AppTheme } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

type NotificationScope = 'all' | 'tickets' | 'wallet';
type NotificationCategory = Exclude<NotificationScope, 'all'>;
type NotificationVisual = { color: string; icon: LucideIcon; soft: string };
type NotificationPresentation = NotificationVisual & {
  actionLabel?: string;
  category: NotificationCategory;
  categoryLabel: string;
  destination: string | null;
  detail: string;
};
type NotificationGroup = { items: NotificationItem[]; key: string; label: string };

const walletTypes = new Set([
  'PLAN_UPGRADED',
  'PLAN_DOWNGRADED',
  'PLAN_CANCELLED',
  'PAYMENT_RECEIVED',
  'PAYMENT_FAILED',
  'PAYMENT_RETRY',
  'PAYMENT_REMINDER',
  'SUBSCRIPTION_REMINDER',
]);

function relativeActivityDate(value: string | Date) {
  const date = new Date(value);
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function dayKey(value: string | Date) {
  const date = new Date(value);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function groupLabel(value: string | Date) {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const key = dayKey(value);
  if (key === dayKey(now)) return 'Today';
  if (key === dayKey(yesterday)) return 'Yesterday';
  return 'Earlier';
}

function groupNotifications(items: NotificationItem[]): NotificationGroup[] {
  const order = ['Today', 'Yesterday', 'Earlier'];
  return order
    .map((label) => ({ items: items.filter((item) => groupLabel(item.createdAt) === label), key: label.toLowerCase(), label }))
    .filter((group) => group.items.length > 0);
}

function resolveDestination(item: NotificationItem, category: NotificationCategory) {
  const metadata = item.metadata;
  if (metadata && typeof metadata.url === 'string' && metadata.url.startsWith('/')) return metadata.url;
  if (metadata && typeof metadata.ticketId === 'string' && metadata.ticketId.length > 0) return `/ticket/${metadata.ticketId}`;
  if (category === 'wallet') return '/(tabs)/wallet';
  return item.type?.startsWith('TICKET_') ? '/(tabs)/history' : null;
}

function presentationFor(item: NotificationItem, theme: AppTheme): NotificationPresentation {
  const description = item.description?.trim();
  const type = item.type ?? '';
  const category: NotificationCategory = walletTypes.has(type) ? 'wallet' : 'tickets';
  const destination = resolveDestination(item, category);
  let visual: NotificationVisual = { color: theme.primarySoft, icon: Bell, soft: theme.primarySubtle };
  let detail = description || 'Open this update for more information.';
  let actionLabel = destination ? 'View update' : undefined;
  let categoryLabel = category === 'wallet' ? 'Wallet' : 'Tickets';

  switch (type) {
    case 'TICKET_BUILT':
      visual = { color: theme.primarySoft, icon: Sparkles, soft: theme.primarySubtle };
      detail = description ? `${description} ticket is ready for review.` : 'Your AI-built ticket is ready for review.';
      actionLabel = 'View ticket';
      break;
    case 'TICKET_OPTIMIZED':
      visual = { color: theme.success, icon: Target, soft: theme.successSoft };
      detail = description ? `Booking code ${description} has been optimized.` : 'Your optimized ticket is ready.';
      actionLabel = 'View changes';
      break;
    case 'MATCH_REMOVED':
      visual = { color: theme.warning, icon: Target, soft: theme.warningSoft };
      detail = description || 'A match was removed while improving the ticket.';
      actionLabel = 'Review ticket';
      break;
    case 'PLAN_UPGRADED':
      visual = { color: theme.success, icon: ArrowUpCircle, soft: theme.successSoft };
      detail = description || 'Your token access has been upgraded.';
      actionLabel = 'View wallet';
      break;
    case 'PLAN_DOWNGRADED':
      visual = { color: theme.warning, icon: TrendingDown, soft: theme.warningSoft };
      detail = description || 'Your access plan has changed.';
      actionLabel = 'View wallet';
      break;
    case 'PLAN_CANCELLED':
      visual = { color: theme.danger, icon: XCircle, soft: theme.dangerSoft };
      detail = description || 'Your plan has been cancelled.';
      actionLabel = 'View wallet';
      break;
    case 'PAYMENT_RECEIVED':
      visual = { color: theme.success, icon: CreditCard, soft: theme.successSoft };
      detail = description || 'Your payment was received successfully.';
      actionLabel = 'View receipt';
      break;
    case 'PAYMENT_FAILED':
    case 'PAYMENT_RETRY':
      visual = { color: theme.danger, icon: CreditCard, soft: theme.dangerSoft };
      detail = description || 'Your payment needs attention.';
      actionLabel = 'Review payment';
      break;
    case 'PAYMENT_REMINDER':
    case 'SUBSCRIPTION_REMINDER':
      visual = { color: theme.warning, icon: Wallet, soft: theme.warningSoft };
      detail = description || 'Review your token access and balance.';
      actionLabel = 'View wallet';
      break;
    case 'POLYMARKET_TRADE_OUTCOME':
      visual = { color: theme.success, icon: Target, soft: theme.successSoft };
      categoryLabel = 'Result';
      actionLabel = destination ? 'View result' : undefined;
      break;
    default:
      break;
  }

  return { ...visual, actionLabel, category, categoryLabel, destination, detail };
}

function ScopeControl({ onChange, value }: { onChange: (scope: NotificationScope) => void; value: NotificationScope }) {
  const theme = useAppTheme();
  const scopes: { key: NotificationScope; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'tickets', label: 'Tickets' },
    { key: 'wallet', label: 'Wallet' },
  ];
  return (
    <View accessibilityRole="tablist" style={[styles.scopeControl, { backgroundColor: theme.field, borderColor: theme.border }]}>
      {scopes.map((scope) => {
        const active = scope.key === value;
        return (
          <PressableScale
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            key={scope.key}
            onPress={() => onChange(scope.key)}
            style={[styles.scopeButton, active ? { backgroundColor: theme.card, borderColor: theme.border } : null]}>
            <Text style={[styles.scopeText, { color: active ? theme.foregroundStrong : theme.muted }]}>{scope.label}</Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

function NotificationRow({ item, onPress, showDivider }: { item: NotificationItem; onPress: () => void; showDivider: boolean }) {
  const theme = useAppTheme();
  const presentation = presentationFor(item, theme);
  const VisualIcon = presentation.icon;
  const actionable = Boolean(presentation.destination) || !item.readAt;

  const content = (
    <View style={[styles.item, showDivider ? { borderBottomColor: theme.border, borderBottomWidth: 1 } : null]}>
      <View style={[styles.unreadRail, { backgroundColor: item.readAt ? 'transparent' : theme.primary }]} />
      <View style={[styles.itemIcon, { backgroundColor: presentation.soft }]}>
        <VisualIcon color={presentation.color} size={18} strokeWidth={1.9} />
      </View>
      <View style={styles.itemCopy}>
        <View style={styles.itemMetaRow}>
          <Text style={[styles.categoryText, { color: presentation.color }]}>{presentation.categoryLabel}</Text>
          <Text style={[styles.itemDate, { color: theme.muted }]}>{relativeActivityDate(item.createdAt)}</Text>
        </View>
        <Text numberOfLines={2} style={[styles.itemTitle, { color: item.readAt ? theme.mutedLight : theme.foregroundStrong }]}>{item.title}</Text>
        <Text numberOfLines={3} style={[styles.itemText, { color: theme.mutedLight }]}>{presentation.detail}</Text>
        {presentation.actionLabel ? (
          <View style={styles.actionRow}>
            <Text style={[styles.actionText, { color: theme.primarySoft }]}>{presentation.actionLabel}</Text>
            <ChevronRight color={theme.primarySoft} size={14} strokeWidth={2.2} />
          </View>
        ) : null}
      </View>
    </View>
  );

  return actionable ? (
    <PressableScale
      accessibilityHint={presentation.destination ? `Opens ${presentation.actionLabel?.toLowerCase() ?? 'the related update'}` : 'Marks this update as read'}
      accessibilityLabel={`${item.title}. ${presentation.detail}`}
      accessibilityRole="button"
      onPress={onPress}
      scaleTo={0.99}>
      {content}
    </PressableScale>
  ) : content;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const notifications = useNotifications(30);
  const markRead = useMarkNotificationReadMutation();
  const markAllRead = useMarkAllNotificationsReadMutation();
  const [scope, setScope] = useState<NotificationScope>('all');
  const items = useMemo(() => notifications.data?.items ?? [], [notifications.data?.items]);
  const visibleItems = useMemo(
    () => items.filter((item) => scope === 'all' || presentationFor(item, theme).category === scope),
    [items, scope, theme],
  );
  const groups = useMemo(() => groupNotifications(visibleItems), [visibleItems]);
  const unreadCount = notifications.data?.unreadCount ?? 0;

  return (
    <Screen onRefresh={() => void notifications.refetch()} refreshing={notifications.isRefetching}>
      <Animated.View entering={enterUp(0)}>
        <ScreenHeader
          action={<IconButton icon={CheckCheck} label="Mark all read" onPress={() => markAllRead.mutate()} />}
          eyebrow="Activity"
          leadingAction={<IconButton icon={ArrowLeft} label="Go back" onPress={() => router.back()} />}
          title="Notifications"
        />
      </Animated.View>

      <Animated.View entering={enterUp(1)} style={styles.summaryLine}>
        <View style={styles.summaryCopy}>
          <Text style={[styles.summaryTitle, { color: theme.foregroundStrong }]}>{unreadCount === 0 ? 'You’re all caught up' : `${unreadCount} unread update${unreadCount === 1 ? '' : 's'}`}</Text>
          <Text style={[styles.summaryText, { color: theme.muted }]}>Tickets, payments, and account activity from BetClaw.</Text>
        </View>
        {unreadCount > 0 ? <View style={[styles.unreadCount, { backgroundColor: theme.primary }]}><Text style={[styles.unreadCountText, { color: theme.primaryDark }]}>{unreadCount}</Text></View> : null}
      </Animated.View>

      <Animated.View entering={enterUp(2)}>
        <ScopeControl onChange={setScope} value={scope} />
      </Animated.View>

      {groups.length === 0 ? (
        <Animated.View entering={enterUp(3)}>
          <GlassCard style={styles.empty}>
            <Bell color={theme.muted} size={23} />
            <Text style={[styles.emptyTitle, { color: theme.foregroundStrong }]}>{notifications.isLoading ? 'Loading notifications' : `No ${scope === 'all' ? '' : `${scope} `}updates`}</Text>
            <Text style={[styles.summaryText, { color: theme.muted }]}>Activity from ticket jobs and payments will appear here.</Text>
          </GlassCard>
        </Animated.View>
      ) : null}

      {groups.map((group, groupIndex) => (
        <Animated.View entering={enterUp(3 + groupIndex)} key={group.key} style={styles.group}>
          <Text style={[styles.groupLabel, { color: theme.muted }]}>{group.label}</Text>
          <GlassCard style={styles.groupCard}>
            {group.items.map((item, index) => {
              const presentation = presentationFor(item, theme);
              const handlePress = () => {
                if (!item.readAt) markRead.mutate(item.id);
                if (presentation.destination) router.push(presentation.destination as never);
              };
              return <NotificationRow item={item} key={item.id} onPress={handlePress} showDivider={index < group.items.length - 1} />;
            })}
          </GlassCard>
        </Animated.View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  actionRow: { alignItems: 'center', flexDirection: 'row', gap: 2, marginTop: spacing.xs },
  actionText: { fontFamily: fonts.bold, fontSize: 11 },
  categoryText: { fontFamily: fonts.extraBold, fontSize: 9, letterSpacing: 0.7, textTransform: 'uppercase' },
  empty: { alignItems: 'center', gap: spacing.xs, padding: spacing.xl },
  emptyTitle: { fontFamily: fonts.extraBold, fontSize: 16 },
  group: { gap: spacing.sm },
  groupCard: { gap: 0, overflow: 'hidden', padding: 0 },
  groupLabel: { fontFamily: fonts.extraBold, fontSize: 11, letterSpacing: 0.7, textTransform: 'uppercase' },
  item: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.sm, minHeight: 116, padding: spacing.md, paddingLeft: spacing.lg, position: 'relative' },
  itemCopy: { flex: 1, minWidth: 0 },
  itemDate: { fontFamily: fonts.medium, fontSize: 10 },
  itemIcon: { alignItems: 'center', borderRadius: radius.pill, height: 38, justifyContent: 'center', width: 38 },
  itemMetaRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  itemText: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 17, marginTop: 4 },
  itemTitle: { fontFamily: fonts.extraBold, fontSize: 14, lineHeight: 18, marginTop: 5 },
  scopeButton: { alignItems: 'center', borderColor: 'transparent', borderRadius: radius.pill, borderWidth: 1, flex: 1, minHeight: 40, justifyContent: 'center' },
  scopeControl: { borderRadius: radius.pill, borderWidth: 1, flexDirection: 'row', padding: 3 },
  scopeText: { fontFamily: fonts.bold, fontSize: 12 },
  summaryCopy: { flex: 1, minWidth: 0 },
  summaryLine: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  summaryText: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 18, marginTop: 3, textAlign: 'center' },
  summaryTitle: { fontFamily: fonts.extraBold, fontSize: 17 },
  unreadCount: { alignItems: 'center', borderRadius: radius.pill, height: 34, justifyContent: 'center', minWidth: 34, paddingHorizontal: 8 },
  unreadCountText: { fontFamily: fonts.extraBold, fontSize: 12, fontVariant: ['tabular-nums'] },
  unreadRail: { borderRadius: radius.pill, bottom: spacing.md, left: 6, position: 'absolute', top: spacing.md, width: 3 },
});
