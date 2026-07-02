import { Bell, Check, Clock3 } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { LiveDot, ProgressBar } from '@/components/ui';
import type { TicketJobState } from '@/lib/api/types';
import { useAppTheme } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

const steps = [
  { id: 'decode', label: 'Decode code' },
  { id: 'research', label: 'Research legs' },
  { id: 'verify', label: 'Verify data' },
  { id: 'optimize', label: 'Optimize slip' },
  { id: 'save', label: 'Save result' },
] as const;

const stageToStep: Record<string, number> = {
  collecting_fixtures: 0,
  deep_research: 1,
  error: 0,
  optimizing: 3,
  queued: 0,
  saving: 4,
  scoring_candidates: 1,
  verifying: 2,
};

function activeStepIndex(state?: TicketJobState | null, pending?: boolean) {
  if (!state) return pending ? 0 : -1;
  if (state.status === 'done') return steps.length;
  if (state.status === 'error') return -1;
  return stageToStep[state.stage ?? 'queued'] ?? 1;
}

function progressPercent(state?: TicketJobState | null, pending?: boolean) {
  if (!state) return pending ? 6 : 0;
  if (state.status === 'done') return 100;
  if (state.status === 'error') return 0;
  if (state.chunksTotal && state.chunksTotal > 0) {
    const completed = state.chunksCompleted ?? 0;
    // Reserve headroom while chunks are still merging.
    return Math.min(94, Math.round((completed / state.chunksTotal) * 90) + 6);
  }
  const index = activeStepIndex(state, pending);
  return Math.min(92, Math.max(6, Math.round(((index + 0.5) / steps.length) * 100)));
}

/**
 * Web-parity "ticket is being built" panel: step chips, live progress bar,
 * batch counters for large tickets, and the leave-and-come-back note.
 */
export function JobProgressPanel({ pending, state }: { pending?: boolean; state?: TicketJobState | null }) {
  const theme = useAppTheme();
  const working = pending || state?.status === 'processing';
  const index = activeStepIndex(state, pending);
  const percent = progressPercent(state, pending);
  const processing = state?.status === 'processing' ? state : null;
  const chunksTotal = processing?.chunksTotal ?? 0;
  const chunksCompleted = processing?.chunksCompleted ?? 0;
  const isBatched = chunksTotal > 1;

  return (
    <View style={panelStyles.root}>
      {working ? (
        <Text style={[panelStyles.headline, { color: theme.foregroundStrong }]}>
          {isBatched
            ? `Analysing batch ${Math.min(chunksCompleted + 1, chunksTotal)} of ${chunksTotal}...`
            : 'Verifying each leg before recommending changes'}
        </Text>
      ) : null}
      {working && isBatched ? (
        <Text style={[panelStyles.subCopy, { color: theme.mutedLight }]}>
          This large ticket is being processed in smaller batches, then merged into one optimized slip.
        </Text>
      ) : null}

      <View style={panelStyles.steps}>
        {steps.map((step, stepIndex) => {
          const done = index > stepIndex;
          const active = index === stepIndex;
          return (
            <View key={step.id} style={panelStyles.step}>
              <View
                style={[
                  panelStyles.stepIcon,
                  {
                    backgroundColor: done ? theme.successSoft : active ? theme.warningSoft : theme.field,
                    borderColor: done ? theme.successSoft : active ? theme.warningSoft : theme.border,
                  },
                ]}>
                {done ? (
                  <Check color={theme.success} size={14} />
                ) : (
                  <Clock3 color={active ? theme.warning : theme.muted} size={13} />
                )}
              </View>
              <Text style={[panelStyles.stepLabel, { color: active ? theme.foregroundStrong : theme.foreground }]}>
                {step.label}
              </Text>
              {active ? <LiveDot color={theme.warning} size={6} /> : null}
            </View>
          );
        })}
      </View>

      {working || state?.status === 'done' ? (
        <ProgressBar tone={state?.status === 'done' ? 'success' : 'accent'} value={percent} />
      ) : null}
      {isBatched ? (
        <Text style={[panelStyles.batchNote, { color: theme.muted }]}>
          {chunksCompleted} of {chunksTotal} batches complete
          {processing?.chunksTimedOut ? ` · ${processing.chunksTimedOut} timed out` : ''}
        </Text>
      ) : null}
      {typeof processing?.selectionCount === 'number' ? (
        <Text style={[panelStyles.batchNote, { color: theme.muted }]}>
          {processing.selectionCount} selections detected
        </Text>
      ) : null}

      {working ? (
        <View style={[panelStyles.leaveNote, { backgroundColor: theme.field, borderColor: theme.border }]}>
          <Bell color={theme.mutedLight} size={14} />
          <Text style={[panelStyles.leaveText, { color: theme.mutedLight }]}>
            You can leave this screen and come back — the result will be saved to your history.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const panelStyles = StyleSheet.create({
  batchNote: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  headline: {
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  leaveNote: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.sm,
  },
  leaveText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 16,
  },
  root: {
    gap: spacing.md,
  },
  step: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
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
  steps: {
    gap: spacing.sm,
  },
  subCopy: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
  },
});
