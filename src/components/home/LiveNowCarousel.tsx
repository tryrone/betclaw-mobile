import { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { LoaderCircle, Radio } from 'lucide-react-native';

import { FeedMatchCard } from '@/components/home/FeedMatchCard';
import { DashboardGlassCard, DashboardStatePanel, StatusBadge } from '@/components/ui';
import { useInfiniteHomeFeed } from '@/lib/api/hooks';
import type { FeedMatch } from '@/lib/api/types';
import { useAppTheme } from '@/theme/colors';
import { layout, radius, spacing } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

const LIVE_POLL_MS = 30_000;
const LIVE_FEED_PAGE_LIMIT = 48;
const MAX_LIVE_FEED_PAGES = 8;
const CONTENT_MAX_WIDTH = 390;

type LiveEntry = {
  league: { country?: string | null; name: string };
  match: FeedMatch;
};

function isLiveMatch(match: FeedMatch) {
  const status = String(match.dataSnapshot?.status ?? match.status ?? '').toUpperCase();
  const elapsedMinute = match.elapsedMinute ?? match.dataSnapshot?.elapsedMinute;
  if (['FT', 'AET', 'PEN', 'FINISHED'].includes(status) || match.dataSnapshot?.phase === 'finished') return false;
  return (
    match.dataSnapshot?.phase === 'live' ||
    ['LIVE', '1H', '2H', 'HT', 'ET', 'BT', 'P', 'SUSP', 'INT'].includes(status) ||
    (typeof elapsedMinute === 'number' && Number.isFinite(elapsedMinute))
  );
}

/**
 * "Live now" carousel: every match currently in play across ALL leagues
 * (independent of the dashboard's league/date filters), rendered as
 * full-width reference-style live cards with swipe paging + dots.
 * Polls every 30s while mounted so scores and clocks stay fresh.
 */
export function LiveNowCarousel() {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const [pageIndex, setPageIndex] = useState(0);
  // Unfiltered slate for today — deliberately ignores the selected league/query.
  const liveFeed = useInfiniteHomeFeed({ limit: LIVE_FEED_PAGE_LIMIT, windowDays: 1 }, { refetchIntervalMs: LIVE_POLL_MS });
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = liveFeed;
  const loadedLivePages = data?.pages.length ?? 0;

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage || loadedLivePages >= MAX_LIVE_FEED_PAGES) return;
    fetchNextPage().catch(() => undefined);
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, loadedLivePages]);

  const liveEntries = useMemo<LiveEntry[]>(() => {
    const entries: LiveEntry[] = [];
    const seen = new Set<string>();
    for (const page of data?.pages ?? []) {
      for (const league of page.leagues ?? []) {
        for (const match of league.matches ?? []) {
          if (!isLiveMatch(match) || seen.has(match.fixtureId)) continue;
          seen.add(match.fixtureId);
          entries.push({ league: { country: league.country, name: league.name }, match });
        }
      }
    }
    return entries;
  }, [data]);

  const pageWidth = Math.min(width, CONTENT_MAX_WIDTH) - layout.screenGutter * 2;

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / pageWidth);
    setPageIndex(Math.max(0, Math.min(liveEntries.length - 1, next)));
  };

  const header = (
    <View style={carouselStyles.header}>
      <View style={carouselStyles.headerCopy}>
        <View style={[carouselStyles.liveDot, { backgroundColor: liveEntries.length > 0 ? theme.live : theme.muted }]} />
        <Text style={[carouselStyles.title, { color: theme.foregroundStrong }]}>Live now</Text>
      </View>
      <StatusBadge
        label={liveEntries.length > 0 ? `${liveEntries.length} in play` : 'None in play'}
        tone={liveEntries.length > 0 ? 'danger' : 'neutral'}
      />
    </View>
  );

  if (liveEntries.length === 0) {
    return (
      <View style={carouselStyles.root}>
        {header}
        <DashboardGlassCard>
          {liveFeed.isLoading ? (
            <DashboardStatePanel icon={LoaderCircle} title="Checking live matches">
              Scanning every league for fixtures currently in play.
            </DashboardStatePanel>
          ) : (
            <DashboardStatePanel icon={Radio} title="No matches in play right now" tone="warning">
              Live fixtures from every league appear here the moment they kick off — this checks all competitions, not just your selected filters.
            </DashboardStatePanel>
          )}
        </DashboardGlassCard>
      </View>
    );
  }

  return (
    <View style={carouselStyles.root}>
      {header}

      <ScrollView
        decelerationRate="fast"
        horizontal
        onMomentumScrollEnd={handleScrollEnd}
        showsHorizontalScrollIndicator={false}
        snapToInterval={pageWidth + spacing.sm}
        snapToAlignment="start">
        {liveEntries.map((entry) => (
          <View key={entry.match.fixtureId} style={[carouselStyles.page, { width: pageWidth }]}>
            <FeedMatchCard caption={entry.league.name} league={entry.league} match={entry.match} />
          </View>
        ))}
      </ScrollView>

      {liveEntries.length > 1 ? (
        <View style={carouselStyles.dots}>
          {liveEntries.map((entry, index) => {
            const active = index === pageIndex;
            return (
              <View
                key={entry.match.fixtureId}
                style={[
                  carouselStyles.dot,
                  {
                    backgroundColor: active ? theme.primary : theme.borderStrong,
                    width: active ? 26 : 7,
                  },
                ]}
              />
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const carouselStyles = StyleSheet.create({
  dot: {
    borderRadius: radius.pill,
    height: 7,
  },
  dots: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerCopy: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  liveDot: {
    borderRadius: radius.pill,
    height: 8,
    width: 8,
  },
  page: {
    marginRight: spacing.sm,
  },
  root: {
    gap: spacing.md,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 17,
  },
});
