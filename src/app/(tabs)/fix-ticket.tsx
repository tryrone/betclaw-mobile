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
import { colors } from '@/theme/colors';
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
  const done = state === 'done';
  const active = state === 'active';

  return (
    <View style={styles.pipelineStep}>
      <View style={[styles.stepIcon, done && styles.doneStep, active && styles.activeStep]}>
        {done ? <Check color="#86efac" size={14} /> : <Clock3 color={active ? colors.warning : colors.muted} size={13} />}
      </View>
      <Text style={styles.stepLabel}>{label}</Text>
      {active ? <LiveDot color={colors.warning} size={6} /> : null}
    </View>
  );
}

function TicketRow({ row }: { row: TicketRowData }) {
  const keep = row.status === 'Keep';

  return (
    <PressableScale accessibilityLabel={row.teams} accessibilityRole="button" scaleTo={0.98}>
      <GlassCard style={styles.ticketRow}>
        <View style={styles.ticketTop}>
          <View style={styles.ticketCopy}>
            <Text numberOfLines={1} style={styles.ticketTeams}>
              {row.teams}
            </Text>
            <Text numberOfLines={1} style={styles.ticketMarket}>
              {row.market}
            </Text>
          </View>
          <StatusBadge label={row.status} tone={keep ? 'success' : 'danger'} />
        </View>
        <Text style={styles.reason}>{row.reason}</Text>
        <View style={styles.confidenceRow}>
          <Text style={styles.confidenceLabel}>Confidence</Text>
          <Text style={styles.confidenceValue}>{row.confidence}%</Text>
        </View>
        <ProgressBar tone={keep ? 'success' : 'warning'} value={row.confidence} />
      </GlassCard>
    </PressableScale>
  );
}

export default function FixTicketScreen() {
  const [risk, setRisk] = useState('Balanced');

  return (
    <Screen hasTabs>
      <Animated.View entering={enterUp(0)}>
        <ScreenHeader action={<IconButton icon={SlidersHorizontal} label="Ticket settings" />} eyebrow="Optimize" title="Fix Ticket" />
      </Animated.View>

      <Animated.View entering={enterUp(1)}>
        <GlassCard>
          <View style={styles.bookingTop}>
            <StatusBadge label="Booking code" tone="accent" />
            <StatusBadge label="SportyBet" />
          </View>
          <View style={styles.bookingCode}>
            <Text style={styles.bookingText}>SB-84K2-P9X</Text>
            <PressableScale accessibilityLabel="Copy booking code" accessibilityRole="button" scaleTo={0.85} style={styles.copyButton}>
              <Copy color={colors.primary} size={17} />
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
                  style={[styles.riskPill, active && styles.activeRisk]}>
                  <Text style={[styles.riskText, active && styles.activeRiskText]}>{level}</Text>
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
            <Text style={styles.cardTitle}>Pipeline</Text>
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
              <Text style={styles.cardTitle}>Ticket trust</Text>
              <Text style={styles.cardCaption}>Verified data coverage across kept legs.</Text>
            </View>
            <Target color={colors.primary} size={22} />
          </View>
          <ProgressBar value={82} />
        </GlassCard>
      </Animated.View>

      <Animated.View entering={enterUp(4)} style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Optimized slip</Text>
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
  activeRisk: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.borderAccent,
  },
  activeRiskText: {
    color: colors.primary,
  },
  activeStep: {
    backgroundColor: colors.warningSoft,
    borderColor: 'rgba(251,191,36,0.35)',
  },
  bookingCode: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  bookingText: {
    color: colors.foregroundStrong,
    fontFamily: fonts.extraBold,
    fontSize: 22,
    letterSpacing: 0.5,
  },
  bookingTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardCaption: {
    color: colors.muted,
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
    color: colors.foregroundStrong,
    fontFamily: fonts.extraBold,
    fontSize: 16,
  },
  confidenceLabel: {
    color: colors.muted,
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
  confidenceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  confidenceValue: {
    color: colors.primary,
    fontFamily: fonts.extraBold,
    fontSize: 13,
  },
  copyButton: {
    alignItems: 'center',
    backgroundColor: colors.primaryMuted,
    borderColor: colors.borderAccent,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  doneStep: {
    backgroundColor: colors.successSoft,
    borderColor: 'rgba(74,222,128,0.35)',
  },
  pipelineGrid: {
    gap: spacing.md,
  },
  pipelineStep: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  reason: {
    color: colors.mutedLight,
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
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    flex: 1,
    height: 38,
    justifyContent: 'center',
  },
  riskText: {
    color: colors.mutedLight,
    fontFamily: fonts.bold,
    fontSize: 12,
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
  stepIcon: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  stepLabel: {
    color: colors.foreground,
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  ticketCopy: {
    flex: 1,
    minWidth: 0,
  },
  ticketMarket: {
    color: colors.mutedLight,
    fontFamily: fonts.medium,
    fontSize: 12,
    marginTop: 4,
  },
  ticketRow: {
    gap: spacing.sm,
    padding: spacing.md,
  },
  ticketTeams: {
    color: colors.foregroundStrong,
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
