import { Check, Clock3, Copy, SlidersHorizontal, Target, Wand2 } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import {
  enterUp,
  GlassCard,
  GradientButton,
  IconButton,
  LiveDot,
  PressableScale,
  ProgressBar,
  Screen,
  ScreenHeader,
  StatusBadge,
} from '@/components/ui';
import { ticketRows, type TicketRowData } from '@/data/mock';
import { useAppTheme } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

const pipeline = [
  { id: 'decode', label: 'Decode', state: 'done' },
  { id: 'research', label: 'Research', state: 'active' },
  { id: 'verify', label: 'Verify', state: 'next' },
  { id: 'optimize', label: 'Optimize', state: 'next' },
  { id: 'save', label: 'Save', state: 'next' },
];

const riskLevels = ['Safe', 'Balanced', 'Bold'];

function PipelineStep({ label, state }: { label: string; state: string }) {
  const theme = useAppTheme();
  const done = state === 'done';
  const active = state === 'active';

  return (
    <View style={styles.pipelineStep}>
      <View
        style={[
          styles.stepIcon,
          {
            backgroundColor: done ? theme.successSoft : active ? theme.warningSoft : theme.field,
            borderColor: done ? theme.successSoft : active ? theme.warningSoft : theme.border,
          },
        ]}>
        {done ? <Check color={theme.success} size={14} /> : <Clock3 color={active ? theme.warning : theme.muted} size={13} />}
      </View>
      <Text style={[styles.stepLabel, { color: theme.foreground }]}>{label}</Text>
      {active ? <LiveDot color={theme.warning} size={6} /> : null}
    </View>
  );
}

function TicketRow({ row }: { row: TicketRowData }) {
  const theme = useAppTheme();
  const keep = row.status === 'Keep';

  return (
    <PressableScale accessibilityLabel={row.teams} accessibilityRole="button" scaleTo={0.98}>
      <GlassCard style={styles.ticketRow}>
        <View style={styles.ticketTop}>
          <View style={styles.ticketCopy}>
            <Text numberOfLines={1} style={[styles.ticketTeams, { color: theme.foregroundStrong }]}>
              {row.teams}
            </Text>
            <Text numberOfLines={1} style={[styles.ticketMarket, { color: theme.mutedLight }]}>
              {row.market}
            </Text>
          </View>
          <StatusBadge label={row.status} tone={keep ? 'success' : 'danger'} />
        </View>
        <Text style={[styles.reason, { color: theme.mutedLight }]}>{row.reason}</Text>
        <View style={styles.confidenceRow}>
          <Text style={[styles.confidenceLabel, { color: theme.muted }]}>Confidence</Text>
          <Text style={[styles.confidenceValue, { color: keep ? theme.success : theme.warning }]}>{row.confidence}%</Text>
        </View>
        <ProgressBar tone={keep ? 'success' : 'warning'} value={row.confidence} />
      </GlassCard>
    </PressableScale>
  );
}

export default function FixTicketScreen() {
  const [risk, setRisk] = useState('Balanced');
  const theme = useAppTheme();

  return (
    <Screen hasTabs>
      <Animated.View entering={enterUp(0)}>
        <ScreenHeader action={<IconButton icon={SlidersHorizontal} label="Ticket settings" />} eyebrow="Optimize" title="Fix Ticket" />
      </Animated.View>

      <Animated.View entering={enterUp(1)}>
        <GlassCard style={styles.bookingCard}>
          <View style={styles.bookingTop}>
            <StatusBadge label="Booking code" tone="accent" />
            <StatusBadge label="SportyBet" />
          </View>
          <View style={[styles.bookingCode, { backgroundColor: theme.field, borderColor: theme.border }]}>
            <Text style={[styles.bookingText, { color: theme.foregroundStrong }]}>SB-84K2-P9X</Text>
            <PressableScale
              accessibilityLabel="Copy booking code"
              accessibilityRole="button"
              scaleTo={0.85}
              style={[styles.copyButton, { backgroundColor: theme.primarySubtle, borderColor: theme.selectionBorder }]}>
              <Copy color={theme.primarySoft} size={16} />
            </PressableScale>
          </View>
          <View style={styles.riskGrid}>
            {riskLevels.map((level) => {
              const active = level === risk;
              return (
                <PressableScale
                  accessibilityLabel={`${level} risk`}
                  accessibilityRole="button"
                  key={level}
                  onPress={() => setRisk(level)}
                  style={[
                    styles.riskPill,
                    {
                      backgroundColor: active ? theme.primarySubtle : theme.field,
                      borderColor: active ? theme.selectionBorder : theme.border,
                    },
                  ]}>
                  <Text style={[styles.riskText, { color: active ? theme.primarySoft : theme.mutedLight }]}>{level}</Text>
                </PressableScale>
              );
            })}
          </View>
          <GradientButton icon={Wand2}>Optimize Ticket</GradientButton>
        </GlassCard>
      </Animated.View>

      <Animated.View entering={enterUp(2)}>
        <GlassCard>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: theme.foregroundStrong }]}>Pipeline</Text>
            <StatusBadge label="Researching" tone="warning" />
          </View>
          <View style={styles.pipelineGrid}>
            {pipeline.map((step) => (
              <PipelineStep key={step.id} label={step.label} state={step.state} />
            ))}
          </View>
        </GlassCard>
      </Animated.View>

      <Animated.View entering={enterUp(3)}>
        <GlassCard gradient="amberCard">
          <View style={styles.cardHeader}>
            <View>
              <Text style={[styles.cardTitle, { color: theme.foregroundStrong }]}>Ticket trust</Text>
              <Text style={[styles.cardCaption, { color: theme.muted }]}>Verified data coverage across kept legs.</Text>
            </View>
            <Target color={theme.primarySoft} size={21} />
          </View>
          <ProgressBar value={82} />
        </GlassCard>
      </Animated.View>

      <Animated.View entering={enterUp(4)} style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.foregroundStrong }]}>Optimized slip</Text>
        <StatusBadge label="2 kept" tone="success" />
      </Animated.View>

      {ticketRows.map((row, index) => (
        <Animated.View entering={enterUp(5 + index)} key={row.id}>
          <TicketRow row={row} />
        </Animated.View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  bookingCard: {
    gap: spacing.md,
  },
  bookingCode: {
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  bookingText: {
    fontFamily: fonts.extraBold,
    fontSize: 20,
    letterSpacing: 0,
  },
  bookingTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardCaption: {
    fontFamily: fonts.medium,
    fontSize: 12,
    marginTop: 4,
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
  confidenceLabel: {
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
  confidenceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  confidenceValue: {
    fontFamily: fonts.extraBold,
    fontSize: 13,
  },
  copyButton: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  pipelineGrid: {
    gap: spacing.sm,
  },
  pipelineStep: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  reason: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 19,
  },
  riskGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  riskPill: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    flex: 1,
    height: 36,
    justifyContent: 'center',
  },
  riskText: {
    fontFamily: fonts.bold,
    fontSize: 12,
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
  stepIcon: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  stepLabel: {
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  ticketCopy: {
    flex: 1,
    minWidth: 0,
  },
  ticketMarket: {
    fontFamily: fonts.medium,
    fontSize: 12,
    marginTop: 4,
  },
  ticketRow: {
    gap: spacing.sm,
    padding: spacing.md,
  },
  ticketTeams: {
    fontFamily: fonts.extraBold,
    fontSize: 14,
  },
  ticketTop: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
});
