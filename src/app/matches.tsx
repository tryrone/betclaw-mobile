import { useRouter } from 'expo-router';
import { ArrowLeft, Search } from '@/components/modern-icons';
import { useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, SectionList, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FeedMatchCard } from '@/components/home/FeedMatchCard';
import { DashboardPillField, enterUp, GlassCard, IconButton, PressableScale, Screen, ScreenHeader, StatusBadge, TeamLogo } from '@/components/ui';
import { useHomeFeed, useLeagues } from '@/lib/api/hooks';
import type { FeedMatch, LeagueGroup } from '@/lib/api/types';
import { useAppTheme } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

type LeagueRailOption = { id: string; label: string };
type DateChip = { date: string; day: string; id: string };
type MatchSection = {
  country?: string | null;
  data: FeedMatch[];
  key: string;
  logoUrl?: string | null;
  name: string;
};

function dateKeyFromDate(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildDateChips(): DateChip[] {
  return Array.from({ length: 5 }, (_, offset) => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() + offset);
    return {
      date: date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', timeZone: 'UTC' }),
      day: offset === 0 ? 'Today' : date.toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'short' }),
      id: dateKeyFromDate(date),
    };
  });
}

function LeagueRail({ onSelect, options, selected }: { onSelect: (leagueId: string) => void; options: LeagueRailOption[]; selected: string }) {
  const theme = useAppTheme();
  return (
    <ScrollView contentContainerStyle={styles.railContent} horizontal showsHorizontalScrollIndicator={false} style={styles.rail}>
      {options.map((league) => {
        const active = league.id === selected;
        return (
          <PressableScale
            accessibilityLabel={`Show ${league.label} fixtures`}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            key={league.id}
            onPress={() => onSelect(league.id)}
            style={[styles.leaguePill, { backgroundColor: active ? theme.primary : theme.card, borderColor: active ? theme.primary : theme.border }]}>
            <Text style={[styles.leagueText, { color: active ? theme.primaryDark : theme.mutedLight }]}>{league.label}</Text>
          </PressableScale>
        );
      })}
    </ScrollView>
  );
}

function DateRail({ chips, onSelect, selected }: { chips: DateChip[]; onSelect: (dateId: string) => void; selected: string }) {
  const theme = useAppTheme();
  return (
    <ScrollView contentContainerStyle={styles.dateContent} horizontal showsHorizontalScrollIndicator={false} style={styles.rail}>
      {chips.map((chip) => {
        const active = chip.id === selected;
        return (
          <PressableScale
            accessibilityLabel={`${chip.day} ${chip.date}`}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            key={chip.id}
            onPress={() => onSelect(chip.id)}
            style={[styles.datePill, { backgroundColor: active ? theme.primarySubtle : theme.card, borderColor: active ? theme.selectionBorder : theme.border }]}>
            <Text style={[styles.dateDay, { color: active ? theme.primary : theme.foregroundStrong }]}>{chip.day}</Text>
            <Text style={[styles.dateMeta, { color: theme.muted }]}>{chip.date}</Text>
          </PressableScale>
        );
      })}
    </ScrollView>
  );
}

function toSections(leagues?: LeagueGroup[]): MatchSection[] {
  return (leagues ?? [])
    .map((league) => ({
      country: league.country,
      data: league.matches ?? [],
      key: league.key,
      logoUrl: league.logoUrl,
      name: league.name,
    }))
    .filter((section) => section.data.length > 0);
}

export default function MatchesScreen({ embedded = false }: { embedded?: boolean }) {
  const router = useRouter();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const dateChipOptions = useMemo(() => buildDateChips(), []);
  const [selectedLeague, setSelectedLeague] = useState('all');
  const [selectedDate, setSelectedDate] = useState(dateChipOptions[0].id);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => clearTimeout(timeout);
  }, [query]);

  const leagueList = useLeagues({ date: selectedDate, windowDays: 1 });
  const leagueOptions = useMemo<LeagueRailOption[]>(
    () => [
      { id: 'all', label: 'All competitions' },
      ...(leagueList.data ?? []).map((league) => ({ id: league.key, label: league.name })),
    ],
    [leagueList.data],
  );
  const activeLeague = leagueOptions.some((league) => league.id === selectedLeague) ? selectedLeague : 'all';
  const homeFeed = useHomeFeed({
    date: selectedDate,
    leagueKey: activeLeague !== 'all' ? activeLeague : undefined,
    limit: 48,
    query: debouncedQuery || undefined,
    windowDays: 1,
  });
  const sections = useMemo(() => toSections(homeFeed.data?.leagues), [homeFeed.data?.leagues]);
  const totalFixtures = useMemo(() => sections.reduce((total, section) => total + section.data.length, 0), [sections]);

  return (
    <Screen contentBottomPadding={0} hasTabs={embedded} scroll={false}>
      <Animated.View entering={enterUp(0)}>
        <ScreenHeader
          eyebrow="Matchday"
          leadingAction={embedded ? undefined : <IconButton icon={ArrowLeft} label="Go back" onPress={() => router.back()} />}
          title="Browse Matches"
        />
      </Animated.View>

      <Animated.View entering={enterUp(1)} style={styles.controls}>
        <DashboardPillField
          icon={Search}
          onChangeText={setQuery}
          placeholder="Search competition or club"
          returnKeyType="search"
          value={query}
        />
        <DateRail chips={dateChipOptions} onSelect={setSelectedDate} selected={selectedDate} />
        <LeagueRail onSelect={setSelectedLeague} options={leagueOptions} selected={activeLeague} />
      </Animated.View>

      <View style={styles.resultSummary}>
        <View>
          <Text style={[styles.resultTitle, { color: theme.foregroundStrong }]}>{debouncedQuery ? 'Search results' : 'Match schedule'}</Text>
          <Text numberOfLines={1} style={[styles.resultCaption, { color: theme.muted }]}>
            {debouncedQuery ? `Showing matches for “${debouncedQuery}”` : 'Grouped by competition'}
          </Text>
        </View>
        <StatusBadge label={`${totalFixtures} fixtures`} tone="accent" />
      </View>

      <SectionList<FeedMatch, MatchSection>
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: (embedded ? 76 : spacing.xl) + insets.bottom },
          sections.length === 0 ? styles.emptyListContent : null,
        ]}
        initialNumToRender={10}
        keyExtractor={(match) => match.fixtureId}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <GlassCard style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: theme.foregroundStrong }]}>
              {homeFeed.isLoading ? 'Loading fixtures' : homeFeed.isError ? 'Fixtures unavailable' : 'No fixtures found'}
            </Text>
            <Text style={[styles.emptyCopy, { color: theme.muted }]}>
              {homeFeed.isLoading
                ? 'Fetching the latest matchday slate.'
                : homeFeed.isError
                  ? 'Pull to refresh and try the production feed again.'
                  : debouncedQuery
                    ? `No matches for “${debouncedQuery}”. Try another club or competition.`
                    : 'Try another competition or date.'}
            </Text>
          </GlassCard>
        }
        maxToRenderPerBatch={8}
        refreshControl={
          <RefreshControl
            colors={[theme.primary]}
            onRefresh={() => void homeFeed.refetch()}
            progressBackgroundColor={theme.card}
            refreshing={homeFeed.isRefetching}
            tintColor={theme.primary}
          />
        }
        renderItem={({ item, section }) => (
          <View style={styles.matchCardWrap}>
            <FeedMatchCard league={section} match={item} showCompetition={false} variant="compact" />
          </View>
        )}
        renderSectionHeader={({ section }) => (
          <View accessibilityRole="header" style={[styles.sectionHeaderShell, { backgroundColor: theme.background }]}>
            <View
              style={[
                styles.sectionHeader,
                {
                  backgroundColor: theme.panelElevated,
                  borderColor: theme.borderStrong,
                  shadowColor: theme.shadow,
                },
              ]}>
              <View style={[styles.sectionLogo, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <TeamLogo logoUrl={section.logoUrl} name={section.name} size={24} />
              </View>
              <View style={styles.sectionCopy}>
                <Text style={[styles.sectionEyebrow, { color: theme.muted }]}>Competition</Text>
                <Text numberOfLines={1} style={[styles.sectionName, { color: theme.foregroundStrong }]}>{section.name}</Text>
                {section.country ? <Text numberOfLines={1} style={[styles.sectionCountry, { color: theme.mutedLight }]}>{section.country}</Text> : null}
              </View>
              <View style={[styles.sectionCountPill, { backgroundColor: theme.primarySubtle, borderColor: theme.borderAccent }]}>
                <Text numberOfLines={1} style={[styles.sectionCount, { color: theme.primarySoft }]}>
                  {section.data.length} {section.data.length === 1 ? 'match' : 'matches'}
                </Text>
              </View>
            </View>
          </View>
        )}
        sections={sections}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled
        style={styles.list}
        windowSize={7}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  controls: { gap: spacing.md },
  dateContent: { gap: spacing.sm, paddingRight: spacing.md },
  dateDay: { fontFamily: fonts.extraBold, fontSize: 12 },
  dateMeta: { fontFamily: fonts.medium, fontSize: 10, marginTop: 2 },
  datePill: { alignItems: 'center', borderRadius: radius.lg, borderWidth: 1, justifyContent: 'center', minHeight: 52, minWidth: 66, paddingHorizontal: spacing.sm },
  emptyCopy: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  emptyListContent: { flexGrow: 1 },
  emptyState: { alignItems: 'center', gap: spacing.xs, marginTop: spacing.xl, padding: spacing.xl },
  emptyTitle: { fontFamily: fonts.extraBold, fontSize: 16 },
  leaguePill: { alignItems: 'center', borderRadius: radius.pill, borderWidth: 1, justifyContent: 'center', minHeight: 36, paddingHorizontal: spacing.md },
  leagueText: { fontFamily: fonts.bold, fontSize: 12 },
  list: { flex: 1 },
  listContent: { paddingTop: spacing.xs },
  matchCardWrap: { marginBottom: spacing.md },
  rail: { marginRight: -spacing.md },
  railContent: { gap: spacing.sm, paddingRight: spacing.md },
  resultCaption: { fontFamily: fonts.medium, fontSize: 11, marginTop: 2, maxWidth: 240 },
  resultSummary: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  resultTitle: { fontFamily: fonts.extraBold, fontSize: 17 },
  sectionCopy: { flex: 1, minWidth: 0 },
  sectionCount: { fontFamily: fonts.bold, fontSize: 11 },
  sectionCountPill: { alignItems: 'center', borderRadius: radius.pill, borderWidth: 1, justifyContent: 'center', minHeight: 30, paddingHorizontal: spacing.sm },
  sectionCountry: { fontFamily: fonts.medium, fontSize: 10, marginTop: 2 },
  sectionEyebrow: { fontFamily: fonts.bold, fontSize: 9, letterSpacing: 0.8, marginBottom: 2, textTransform: 'uppercase' },
  sectionHeader: {
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    elevation: 2,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 64,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  sectionHeaderShell: { paddingBottom: spacing.sm, paddingTop: spacing.xs },
  sectionLogo: { alignItems: 'center', borderRadius: radius.md, borderWidth: 1, height: 42, justifyContent: 'center', width: 42 },
  sectionName: { fontFamily: fonts.extraBold, fontSize: 13, lineHeight: 16 },
});
