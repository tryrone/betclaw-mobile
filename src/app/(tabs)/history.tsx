import { useFocusEffect } from 'expo-router';
import { ChevronLeft, ChevronRight, Eye, Filter, Search } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { TicketDetailView } from '@/components/ticket/TicketDetailView';
import { BottomSheet, enterUp, GlassCard, PressableScale, Screen, ScreenHeader, StatusBadge } from '@/components/ui';
import { useTicketList } from '@/lib/api/hooks';
import type { TicketDetail, TicketResult } from '@/lib/api/types';
import { formatDate } from '@/lib/mobile-format';
import { useAppTheme } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

const filters: { label: string; value?: TicketResult }[] = [
  { label: 'All' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Won', value: 'WON' },
  { label: 'Lost', value: 'LOST' },
];

function resultTone(result?: string) {
  if (result === 'WON') return 'success' as const;
  if (result === 'LOST') return 'danger' as const;
  return 'warning' as const;
}

function TicketCard({ onPress, ticket }: { onPress: () => void; ticket: TicketDetail }) {
  const theme = useAppTheme();
  const kept = ticket.matches?.filter((match) => match.status === 'KEPT').length ?? 0;
  const total = ticket.matches?.length ?? 0;
  const displayCode = ticket.bookingCode ?? ticket.originalCode ?? 'Saved ticket';

  return (
    <PressableScale
      accessibilityLabel={`Open ${displayCode}`}
      accessibilityRole="button"
      onPress={onPress}
      scaleTo={0.98}>
      <GlassCard style={styles.ticketCard}>
        <View style={styles.ticketTop}>
          <View style={styles.ticketCopy}>
            <Text numberOfLines={1} style={[styles.ticketCode, { color: theme.foregroundStrong }]}>
              {displayCode}
            </Text>
            <Text style={[styles.ticketDate, { color: theme.muted }]}>{formatDate(ticket.createdAt)}</Text>
          </View>
          <StatusBadge label={ticket.result ?? 'PENDING'} tone={resultTone(ticket.result)} />
        </View>
        <View style={styles.metricRow}>
          <Text style={[styles.metric, { color: theme.primarySoft }]}>{kept}/{total} kept</Text>
          <Text style={[styles.metric, { color: theme.foreground }]}>Odds {ticket.optimizedOdds?.toFixed(2) ?? '-'}</Text>
          <Eye color={theme.mutedLight} size={16} />
        </View>
      </GlassCard>
    </PressableScale>
  );
}

export default function HistoryScreen() {
  const theme = useAppTheme();
  const [search, setSearch] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [status, setStatus] = useState<TicketResult | undefined>();
  const [pageIndex, setPageIndex] = useState(0);
  const [cursors, setCursors] = useState<(string | undefined)[]>([undefined]);
  const input = useMemo(
    () => ({
      cursor: cursors[pageIndex],
      limit: 12,
      search: search.trim() || undefined,
      status,
    }),
    [cursors, pageIndex, search, status],
  );
  const tickets = useTicketList(input);
  const items = tickets.data?.items ?? [];

  useFocusEffect(
    useCallback(() => () => setSelectedTicketId(null), []),
  );

  const resetPaging = () => {
    setPageIndex(0);
    setCursors([undefined]);
  };

  const nextPage = () => {
    const nextCursor = tickets.data?.nextCursor ?? undefined;
    if (!nextCursor) return;
    setCursors((current) => {
      const next = current.slice(0, pageIndex + 1);
      next[pageIndex + 1] = nextCursor;
      return next;
    });
    setPageIndex((current) => current + 1);
  };

  return (
    <Screen hasTabs onRefresh={() => void tickets.refetch()} refreshing={tickets.isRefetching}>
      <Animated.View entering={enterUp(0)}>
        <ScreenHeader eyebrow="Ticket archive" title="History" />
      </Animated.View>

      <Animated.View entering={enterUp(1)}>
        <GlassCard>
          <View style={[styles.searchWrap, { backgroundColor: theme.field, borderColor: theme.border }]}>
            <Search color={theme.muted} size={18} />
            <TextInput
              onChangeText={(value) => {
                setSearch(value);
                resetPaging();
              }}
              placeholder="Search booking code"
              placeholderTextColor={theme.muted}
              style={[styles.searchInput, { color: theme.foregroundStrong }]}
              value={search}
            />
          </View>
          <View style={styles.filterRow}>
            <Filter color={theme.mutedLight} size={16} />
            {filters.map((filter) => {
              const active = filter.value === status || (!filter.value && !status);
              return (
                <PressableScale
                  accessibilityLabel={filter.label}
                  accessibilityRole="button"
                  key={filter.label}
                  onPress={() => {
                    setStatus(filter.value);
                    resetPaging();
                  }}
                  style={[
                    styles.filterPill,
                    {
                      backgroundColor: active ? theme.primarySubtle : theme.field,
                      borderColor: active ? theme.selectionBorder : theme.border,
                    },
                  ]}>
                  <Text style={[styles.filterText, { color: active ? theme.primarySoft : theme.mutedLight }]}>{filter.label}</Text>
                </PressableScale>
              );
            })}
          </View>
        </GlassCard>
      </Animated.View>

      {tickets.isLoading ? (
        <Animated.View entering={enterUp(2)}>
          <GlassCard style={styles.emptyCard}>
            <Text style={[styles.emptyTitle, { color: theme.foregroundStrong }]}>Loading tickets</Text>
            <Text style={[styles.emptyCopy, { color: theme.muted }]}>Fetching your optimized and generated slips.</Text>
          </GlassCard>
        </Animated.View>
      ) : null}

      {!tickets.isLoading && items.length === 0 ? (
        <Animated.View entering={enterUp(2)}>
          <GlassCard style={styles.emptyCard}>
            <Text style={[styles.emptyTitle, { color: theme.foregroundStrong }]}>No tickets found</Text>
            <Text style={[styles.emptyCopy, { color: theme.muted }]}>Fix or build a ticket and it will appear here.</Text>
          </GlassCard>
        </Animated.View>
      ) : null}

      {items.map((ticket, index) => (
        <Animated.View entering={enterUp(2 + index)} key={ticket.id}>
          <TicketCard onPress={() => setSelectedTicketId(ticket.id)} ticket={ticket} />
        </Animated.View>
      ))}

      <BottomSheet onClose={() => setSelectedTicketId(null)} title="Ticket detail" visible={Boolean(selectedTicketId)}>
        <ScrollView contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false}>
          {selectedTicketId ? (
            <TicketDetailView onNavigate={() => setSelectedTicketId(null)} ticketId={selectedTicketId} />
          ) : null}
        </ScrollView>
      </BottomSheet>

      {items.length > 0 ? (
        <Animated.View entering={enterUp(3 + items.length)}>
          <View style={styles.pager}>
            <PressableScale
              accessibilityLabel="Previous page"
              accessibilityRole="button"
              onPress={() => setPageIndex((current) => Math.max(0, current - 1))}
              style={[styles.pageButton, { backgroundColor: theme.field, borderColor: theme.border, opacity: pageIndex === 0 ? 0.45 : 1 }]}>
              <ChevronLeft color={theme.foreground} size={17} />
              <Text style={[styles.pageText, { color: theme.foreground }]}>Previous</Text>
            </PressableScale>
            <Text style={[styles.pageLabel, { color: theme.muted }]}>Page {pageIndex + 1}</Text>
            <PressableScale
              accessibilityLabel="Next page"
              accessibilityRole="button"
              onPress={nextPage}
              style={[styles.pageButton, { backgroundColor: theme.field, borderColor: theme.border, opacity: tickets.data?.nextCursor ? 1 : 0.45 }]}>
              <Text style={[styles.pageText, { color: theme.foreground }]}>Next</Text>
              <ChevronRight color={theme.foreground} size={17} />
            </PressableScale>
          </View>
        </Animated.View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  emptyCard: {
    gap: spacing.xs,
    padding: spacing.lg,
  },
  emptyCopy: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  emptyTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 16,
    textAlign: 'center',
  },
  filterPill: {
    borderRadius: radius.pill,
    borderWidth: 1,
    minHeight: 32,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  filterRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  filterText: {
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  metric: {
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  metricRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  pageButton: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 38,
    paddingHorizontal: spacing.md,
  },
  pageLabel: {
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
  pageText: {
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  pager: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 15,
    padding: 0,
  },
  searchWrap: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  sheetContent: {
    paddingBottom: spacing.xl,
    paddingTop: spacing.xs,
  },
  ticketCard: {
    gap: spacing.sm,
  },
  ticketCode: {
    fontFamily: fonts.extraBold,
    fontSize: 15,
  },
  ticketCopy: {
    flex: 1,
    minWidth: 0,
  },
  ticketDate: {
    fontFamily: fonts.medium,
    fontSize: 12,
    marginTop: 3,
  },
  ticketTop: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
});
