import { useRouter } from 'expo-router';
import { ArrowLeft, Bot, Check, Copy, Minus, Plus, Share2, SlidersHorizontal, Target, Trophy } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { JobProgressPanel } from '@/components/ticket/JobProgressPanel';
import {
  enterUp,
  GlassCard,
  GradientButton,
  IconButton,
  PressableScale,
  Screen,
  ScreenHeader,
  StatusBadge,
  useToast,
} from '@/components/ui';
import { DEFAULT_BOOKMAKER_PLATFORM } from '@/lib/bookmaker-platforms';
import { getErrorMessage } from '@/lib/api/client';
import {
  useBuilderOptions,
  useBuildTicketMutation,
  useCreateShareLinkMutation,
  useGenerateBookingCodeMutation,
  useJobStatus,
  useTicketById,
} from '@/lib/api/hooks';
import type { BuildTicketInput } from '@/lib/api/types';
import { copyOrShareText } from '@/lib/mobile-format';
import { useAppTheme } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

const oddsProfiles: { id: NonNullable<BuildTicketInput['oddsProfile']>; label: string }[] = [
  { id: 'SAFE', label: 'Safe' },
  { id: 'BALANCED', label: 'Balanced' },
  { id: 'VALUE', label: 'Value' },
];

const timeWindows: { id: NonNullable<BuildTicketInput['timeWindow']>; label: string }[] = [
  { id: 'all_day', label: 'All day' },
  { id: 'early', label: 'Early' },
  { id: 'afternoon', label: 'Afternoon' },
  { id: 'late', label: 'Late' },
];

function dateInput(offset: number) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

const dateOptions = [
  { label: 'Today', value: dateInput(0) },
  { label: 'Tomorrow', value: dateInput(1) },
  { label: 'Next day', value: dateInput(2) },
];

const LEAGUE_PREVIEW_COUNT = 8;

function OptionPill({
  active,
  label,
  onPress,
}: {
  active?: boolean;
  label: string;
  onPress: () => void;
}) {
  const theme = useAppTheme();

  return (
    <PressableScale
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.pill,
        {
          backgroundColor: active ? theme.primarySubtle : theme.field,
          borderColor: active ? theme.selectionBorder : theme.border,
        },
      ]}>
      {active ? <Check color={theme.primarySoft} size={13} /> : null}
      <Text style={[styles.pillText, { color: active ? theme.primarySoft : theme.mutedLight }]}>{label}</Text>
    </PressableScale>
  );
}

function TicketMatchRow({ match }: { match: any }) {
  const theme = useAppTheme();
  const kept = match.status === 'KEPT';

  return (
    <GlassCard style={styles.matchRow}>
      <View style={styles.matchTop}>
        <View style={styles.matchCopy}>
          <Text numberOfLines={1} style={[styles.matchTeams, { color: theme.foregroundStrong }]}>
            {match.homeTeam} vs {match.awayTeam}
          </Text>
          <Text numberOfLines={1} style={[styles.matchMeta, { color: theme.mutedLight }]}>
            {match.market}
          </Text>
        </View>
        <StatusBadge label={kept ? 'Keep' : 'Removed'} tone={kept ? 'success' : 'danger'} />
      </View>
      <View style={styles.matchMetrics}>
        <Text style={[styles.metric, { color: theme.primarySoft }]}>Odds {Number(match.odds ?? 0).toFixed(2)}</Text>
        <Text style={[styles.metric, { color: theme.muted }]}>
          {Math.round(match.confidence ?? 0)}% confidence
        </Text>
        {typeof match.baseRate === 'number' ? (
          <View style={[styles.historyTag, { backgroundColor: theme.successSoft }]}>
            <Text style={[styles.historyTagText, { color: theme.success }]}>
              History {Math.round(match.baseRate * 100)}%
              {typeof match.baseRateSample === 'number' && match.baseRateSample > 0
                ? ` · ${match.baseRateSample}`
                : ''}
            </Text>
          </View>
        ) : null}
      </View>
      {match.selectionReason || match.reason ? (
        <Text style={[styles.matchReason, { color: theme.mutedLight }]}>{match.selectionReason ?? match.reason}</Text>
      ) : null}
    </GlassCard>
  );
}

export default function BuildTicketScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { showToast } = useToast();
  const [selectedDate, setSelectedDate] = useState(dateOptions[0].value);
  const [timeWindow, setTimeWindow] = useState<NonNullable<BuildTicketInput['timeWindow']>>('all_day');
  const [oddsProfile, setOddsProfile] = useState<NonNullable<BuildTicketInput['oddsProfile']>>('BALANCED');
  const [gameCount, setGameCount] = useState('5');
  const [targetOdds, setTargetOdds] = useState('5');
  const [notes, setNotes] = useState('');
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);
  const [selectedLeagues, setSelectedLeagues] = useState<string[]>([]);
  const [showAllLeagues, setShowAllLeagues] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);

  const optionInput = useMemo<Partial<BuildTicketInput>>(
    () => ({
      date: selectedDate,
      fixtureWindowDays: 7,
      gameCount: Number(gameCount) || 5,
      oddsProfile,
      targetTotalOdds: Number(targetOdds) > 1 ? Number(targetOdds) : undefined,
      timeWindow,
    }),
    [gameCount, oddsProfile, selectedDate, targetOdds, timeWindow],
  );
  const builderOptions = useBuilderOptions(optionInput);
  const buildTicket = useBuildTicketMutation();
  const jobStatus = useJobStatus(jobId);
  const ticket = useTicketById(jobStatus.data?.status === 'done' ? jobStatus.data.ticketId : null);
  const generateCode = useGenerateBookingCodeMutation();
  const createShareLink = useCreateShareLinkMutation();

  const marketIds = selectedMarkets.length
    ? selectedMarkets
    : builderOptions.data?.defaults?.marketPresetIds ?? builderOptions.data?.marketPresets.slice(0, 3).map((preset) => preset.id) ?? [];
  const leagueKeys = selectedLeagues.length
    ? selectedLeagues
    : builderOptions.data?.recommendedLeagueKeys ?? [];
  const status = jobStatus.data?.status ?? (buildTicket.isPending ? 'processing' : 'ready');
  const doneTicket = ticket.data;
  const allLeagues = builderOptions.data?.leagues ?? [];
  const visibleLeagues = showAllLeagues ? allLeagues : allLeagues.slice(0, LEAGUE_PREVIEW_COUNT);

  const toggle = (id: string, values: string[], setValues: (next: string[]) => void) => {
    setValues(values.includes(id) ? values.filter((value) => value !== id) : [...values, id]);
  };

  const handleBuild = () => {
    if (buildTicket.isPending) return;
    buildTicket.mutate(
      {
        date: selectedDate,
        fixtureWindowDays: 7,
        gameCount: Math.max(1, Math.min(40, Number(gameCount) || 5)),
        leagueKeys,
        marketPresetIds: marketIds,
        notes: notes.trim() || undefined,
        oddsProfile,
        targetTotalOdds: Number(targetOdds) > 1 ? Number(targetOdds) : undefined,
        timeWindow,
        useRecommendedLeagues: selectedLeagues.length === 0,
      },
      {
        onSuccess: (result) => {
          setJobId(result.jobId);
        },
      },
    );
  };

  const handleGenerateCode = () => {
    if (!doneTicket?.id || generateCode.isPending) return;
    generateCode.mutate({ platform: DEFAULT_BOOKMAKER_PLATFORM, ticketId: doneTicket.id });
  };

  const handleShare = async () => {
    if (!doneTicket?.id || createShareLink.isPending) return;
    try {
      const result = await createShareLink.mutateAsync({ ticketId: doneTicket.id });
      await copyOrShareText(result.previewUrl, 'BetClaw ticket');
      showToast({
        message: 'Share link ready',
        title: 'Ticket share',
        tone: 'success',
      });
    } catch {
      showToast({
        message: 'Could not create share link',
        title: 'Ticket share failed',
        tone: 'error',
      });
    }
  };

  const handleCopyCode = async (code?: string | null) => {
    if (!code) return;
    try {
      const mode = await copyOrShareText(code, 'BetClaw booking code');
      showToast({
        message: mode === 'copied' ? 'Code copied' : 'Code shared',
        title: 'Booking code',
        tone: 'success',
      });
    } catch {
      showToast({
        message: 'Could not copy code',
        title: 'Copy failed',
        tone: 'error',
      });
    }
  };

  useEffect(() => {
    if (!buildTicket.error) return;
    showToast({
      message: getErrorMessage(buildTicket.error),
      title: 'Build failed',
      tone: 'error',
    });
  }, [buildTicket.error, showToast]);

  useEffect(() => {
    if (!generateCode.error) return;
    showToast({
      message: getErrorMessage(generateCode.error),
      title: 'Booking code failed',
      tone: 'error',
    });
  }, [generateCode.error, showToast]);

  useEffect(() => {
    if (!generateCode.data || generateCode.data.success) return;
    showToast({
      message: generateCode.data.error ?? generateCode.data.regenerationError ?? 'Code generation is unavailable.',
      title: 'Booking code unavailable',
      tone: 'warning',
    });
  }, [generateCode.data, showToast]);

  return (
    <Screen hasTabs>
      <Animated.View entering={enterUp(0)}>
        <ScreenHeader
          eyebrow="AI builder"
          leadingAction={<IconButton icon={ArrowLeft} label="Go back" onPress={() => router.back()} />}
          title="Build Ticket"
        />
      </Animated.View>

      <Animated.View entering={enterUp(1)}>
        <GlassCard gradient="hero" style={styles.heroCard}>
          <View style={styles.heroTop}>
            <StatusBadge label="Deep research" tone="accent" />
            <Bot color={theme.primarySoft} size={22} />
          </View>
          <Text style={[styles.heroTitle, { color: theme.foregroundStrong }]}>Build a researched slip from live fixtures.</Text>
          <Text style={[styles.heroCopy, { color: theme.mutedLight }]}>
            Choose the slate, markets, risk profile, and target odds. BetClaw will score candidate matches and save the ticket.
          </Text>
        </GlassCard>
      </Animated.View>

      <Animated.View entering={enterUp(2)}>
        <GlassCard>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: theme.foregroundStrong }]}>Date and profile</Text>
            <SlidersHorizontal color={theme.primarySoft} size={18} />
          </View>
          <Text style={[styles.sectionLabel, { color: theme.muted }]}>Match day</Text>
          <ScrollView contentContainerStyle={styles.pillRow} horizontal showsHorizontalScrollIndicator={false}>
            {dateOptions.map((option) => (
              <OptionPill
                active={selectedDate === option.value}
                key={option.value}
                label={option.label}
                onPress={() => setSelectedDate(option.value)}
              />
            ))}
          </ScrollView>
          <Text style={[styles.sectionLabel, { color: theme.muted }]}>Kickoff window</Text>
          <ScrollView contentContainerStyle={styles.pillRow} horizontal showsHorizontalScrollIndicator={false}>
            {timeWindows.map((option) => (
              <OptionPill
                active={timeWindow === option.id}
                key={option.id}
                label={option.label}
                onPress={() => setTimeWindow(option.id)}
              />
            ))}
          </ScrollView>
          <Text style={[styles.sectionLabel, { color: theme.muted }]}>Risk profile</Text>
          <ScrollView contentContainerStyle={styles.pillRow} horizontal showsHorizontalScrollIndicator={false}>
            {oddsProfiles.map((option) => (
              <OptionPill
                active={oddsProfile === option.id}
                key={option.id}
                label={option.label}
                onPress={() => setOddsProfile(option.id)}
              />
            ))}
          </ScrollView>
          <View style={styles.inputGrid}>
            <View style={[styles.inputBox, { backgroundColor: theme.field, borderColor: theme.border }]}>
              <Text style={[styles.inputLabel, { color: theme.muted }]}>Games</Text>
              <View style={styles.stepperRow}>
                <PressableScale
                  accessibilityLabel="Fewer games"
                  accessibilityRole="button"
                  onPress={() => setGameCount(String(Math.max(1, (Number(gameCount) || 5) - 1)))}
                  style={[styles.stepperButton, { backgroundColor: theme.primarySubtle, borderColor: theme.border }]}>
                  <Minus color={theme.primarySoft} size={16} />
                </PressableScale>
                <Text style={[styles.stepperValue, { color: theme.foregroundStrong }]}>
                  {Math.max(1, Math.min(10, Number(gameCount) || 5))}
                </Text>
                <PressableScale
                  accessibilityLabel="More games"
                  accessibilityRole="button"
                  onPress={() => setGameCount(String(Math.min(10, (Number(gameCount) || 5) + 1)))}
                  style={[styles.stepperButton, { backgroundColor: theme.primarySubtle, borderColor: theme.border }]}>
                  <Plus color={theme.primarySoft} size={16} />
                </PressableScale>
              </View>
              <Text style={[styles.helper, { color: theme.muted }]}>
                Historical screening may keep fewer legs to protect the win rate.
              </Text>
            </View>
            <View style={[styles.inputBox, { backgroundColor: theme.field, borderColor: theme.border }]}>
              <Text style={[styles.inputLabel, { color: theme.muted }]}>Target odds</Text>
              <TextInput
                keyboardType="decimal-pad"
                onChangeText={setTargetOdds}
                placeholder="5.00"
                placeholderTextColor={theme.muted}
                style={[styles.input, { color: theme.foregroundStrong }]}
                value={targetOdds}
              />
              <Text style={[styles.helper, { color: theme.muted }]}>Optional. Leave as-is to let odds float.</Text>
            </View>
          </View>
        </GlassCard>
      </Animated.View>

      <Animated.View entering={enterUp(3)}>
        <GlassCard>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: theme.foregroundStrong }]}>Markets</Text>
            <StatusBadge label={`${marketIds.length} selected`} tone="accent" />
          </View>
          <View style={styles.wrapGrid}>
            {(builderOptions.data?.marketPresets ?? []).map((preset) => (
              <OptionPill
                active={marketIds.includes(preset.id)}
                key={preset.id}
                label={preset.label}
                onPress={() => toggle(preset.id, selectedMarkets, setSelectedMarkets)}
              />
            ))}
          </View>
          <Text style={[styles.helper, { color: theme.muted }]}>
            Goal markets (Over/Under, BTTS) are screened against each league&apos;s historical hit rate, so
            they may produce fewer, stronger legs.
          </Text>
          {builderOptions.isLoading ? <Text style={[styles.helper, { color: theme.muted }]}>Loading available markets...</Text> : null}
        </GlassCard>
      </Animated.View>

      <Animated.View entering={enterUp(4)}>
        <GlassCard>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: theme.foregroundStrong }]}>Leagues</Text>
            <StatusBadge
              label={selectedLeagues.length ? `${selectedLeagues.length} selected` : 'Recommended'}
              tone={selectedLeagues.length ? 'accent' : 'warning'}
            />
          </View>
          <Text style={[styles.helper, { color: theme.muted }]}>
            {selectedLeagues.length
              ? 'Building only from your selected leagues.'
              : 'Using leagues recommended from fixture coverage and historical hit rates. Tap to pick your own.'}
          </Text>
          <View style={styles.wrapGrid}>
            {visibleLeagues.map((league) => (
              <OptionPill
                active={selectedLeagues.includes(league.key) || (selectedLeagues.length === 0 && Boolean(league.recommended))}
                key={league.key}
                label={`${league.league ?? league.name ?? league.key}${league.fixtureCount ? ` (${league.fixtureCount})` : ''}`}
                onPress={() => toggle(league.key, selectedLeagues, setSelectedLeagues)}
              />
            ))}
          </View>
          <View style={styles.leagueActions}>
            {allLeagues.length > LEAGUE_PREVIEW_COUNT ? (
              <PressableScale
                accessibilityLabel={showAllLeagues ? 'Show fewer leagues' : 'Show all leagues'}
                accessibilityRole="button"
                onPress={() => setShowAllLeagues((prev) => !prev)}
                style={[styles.leagueActionButton, { backgroundColor: theme.field, borderColor: theme.border }]}>
                <Text style={[styles.leagueActionText, { color: theme.primarySoft }]}>
                  {showAllLeagues ? 'Show fewer' : `Show all (${allLeagues.length})`}
                </Text>
              </PressableScale>
            ) : null}
            {selectedLeagues.length ? (
              <PressableScale
                accessibilityLabel="Reset to recommended leagues"
                accessibilityRole="button"
                onPress={() => setSelectedLeagues([])}
                style={[styles.leagueActionButton, { backgroundColor: theme.field, borderColor: theme.border }]}>
                <Text style={[styles.leagueActionText, { color: theme.mutedLight }]}>Use recommended</Text>
              </PressableScale>
            ) : null}
          </View>
          <TextInput
            multiline
            onChangeText={setNotes}
            placeholder="Optional notes for the builder"
            placeholderTextColor={theme.muted}
            style={[styles.notes, { backgroundColor: theme.field, borderColor: theme.border, color: theme.foreground }]}
            value={notes}
          />
          <GradientButton icon={Trophy} onPress={handleBuild}>
            {buildTicket.isPending ? 'Submitting...' : 'Build Ticket'}
          </GradientButton>
        </GlassCard>
      </Animated.View>

      <Animated.View entering={enterUp(5)}>
        <GlassCard>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: theme.foregroundStrong }]}>Build status</Text>
            <StatusBadge
              label={status === 'done' ? 'Done' : status === 'error' ? 'Failed' : status === 'processing' ? 'Researching' : 'Ready'}
              tone={status === 'done' ? 'success' : status === 'error' ? 'danger' : status === 'processing' ? 'warning' : 'neutral'}
            />
          </View>
          <Text style={[styles.helper, { color: theme.mutedLight }]}>
            {jobStatus.data?.status === 'error'
              ? jobStatus.data.message
              : jobStatus.data?.status === 'done'
                ? jobStatus.data.summary
                : status === 'processing'
                  ? 'Collecting fixtures, scoring markets, and saving the strongest slip.'
                  : 'Start a build to track the research pipeline here.'}
          </Text>
          <JobProgressPanel pending={buildTicket.isPending} state={jobStatus.data ?? null} />
        </GlassCard>
      </Animated.View>

      {doneTicket ? (
        <Animated.View entering={enterUp(6)}>
          <GlassCard gradient="amberCard">
            <View style={styles.cardHeader}>
              <View>
                <Text style={[styles.cardTitle, { color: theme.foregroundStrong }]}>Generated ticket</Text>
                <Text style={[styles.helper, { color: theme.muted }]}>
                  {doneTicket.matches?.filter((match) => match.status === 'KEPT').length ?? 0} kept legs · odds{' '}
                  {doneTicket.optimizedOdds?.toFixed(2) ?? '-'}
                </Text>
              </View>
              <Target color={theme.primarySoft} size={22} />
            </View>
            {typeof doneTicket.projectedWinRate === 'number' ? (
              <View style={[styles.projectedBox, { backgroundColor: theme.successSoft }]}>
                <Text style={[styles.projectedValue, { color: theme.success }]}>
                  Projected win {Math.round(doneTicket.projectedWinRate * 100)}%
                </Text>
                <Text style={[styles.helper, { color: theme.mutedLight }]}>
                  Based on how often each leg&apos;s market has landed in its league historically.
                </Text>
              </View>
            ) : null}
            <View style={styles.actionGrid}>
              <PressableScale accessibilityLabel="Generate booking code" accessibilityRole="button" onPress={handleGenerateCode} style={[styles.actionButton, { borderColor: theme.border, backgroundColor: theme.field }]}>
                <Copy color={theme.primarySoft} size={16} />
                <Text style={[styles.actionText, { color: theme.foreground }]}>Generate code</Text>
              </PressableScale>
              <PressableScale accessibilityLabel="Create share link" accessibilityRole="button" onPress={handleShare} style={[styles.actionButton, { borderColor: theme.border, backgroundColor: theme.field }]}>
                <Share2 color={theme.primarySoft} size={16} />
                <Text style={[styles.actionText, { color: theme.foreground }]}>Share</Text>
              </PressableScale>
            </View>
            {generateCode.data?.bookingCode ? (
              <PressableScale accessibilityLabel="Copy generated code" accessibilityRole="button" onPress={() => handleCopyCode(generateCode.data?.bookingCode)} style={[styles.codeBox, { backgroundColor: theme.field, borderColor: theme.selectionBorder }]}>
                <Text style={[styles.codeText, { color: theme.primarySoft }]}>{generateCode.data.bookingCode}</Text>
                <Copy color={theme.primarySoft} size={16} />
              </PressableScale>
            ) : null}
          </GlassCard>
        </Animated.View>
      ) : null}

      {doneTicket?.matches?.map((match, index) => (
        <Animated.View entering={enterUp(7 + index)} key={match.id}>
          <TicketMatchRow match={match} />
        </Animated.View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: spacing.md,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionText: {
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 16,
  },
  codeBox: {
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  codeText: {
    flex: 1,
    fontFamily: fonts.extraBold,
    fontSize: 18,
    letterSpacing: 0,
  },
  errorText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
  },
  helper: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
  },
  heroCard: {
    gap: spacing.md,
  },
  heroCopy: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 20,
  },
  heroTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 20,
    lineHeight: 25,
  },
  heroTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  input: {
    fontFamily: fonts.extraBold,
    fontSize: 18,
    padding: 0,
  },
  inputBox: {
    borderRadius: radius.lg,
    borderWidth: 1,
    flex: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  inputGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  inputLabel: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  matchCopy: {
    flex: 1,
    minWidth: 0,
  },
  matchMeta: {
    fontFamily: fonts.medium,
    fontSize: 12,
    marginTop: 3,
  },
  matchMetrics: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  matchReason: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
  },
  matchRow: {
    gap: spacing.sm,
  },
  matchTeams: {
    fontFamily: fonts.extraBold,
    fontSize: 14,
  },
  matchTop: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  metric: {
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  notes: {
    borderRadius: radius.lg,
    borderWidth: 1,
    fontFamily: fonts.medium,
    fontSize: 13,
    minHeight: 82,
    padding: spacing.md,
    textAlignVertical: 'top',
  },
  pill: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    minHeight: 36,
    paddingHorizontal: spacing.md,
  },
  pillRow: {
    gap: spacing.sm,
    paddingVertical: 2,
  },
  pillText: {
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  wrapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  sectionLabel: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  stepperRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  stepperButton: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 40,
  },
  stepperValue: {
    fontFamily: fonts.extraBold,
    fontSize: 20,
  },
  historyTag: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  historyTagText: {
    fontFamily: fonts.bold,
    fontSize: 11,
  },
  leagueActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  leagueActionButton: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    minHeight: 34,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  leagueActionText: {
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  projectedBox: {
    borderRadius: radius.lg,
    gap: 4,
    padding: spacing.md,
  },
  projectedValue: {
    fontFamily: fonts.extraBold,
    fontSize: 15,
  },
});
