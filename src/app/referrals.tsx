import { useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, Copy, Gift, Search, Share2, Users } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { enterUp, GlassCard, GradientButton, IconButton, PressableScale, Screen, ScreenHeader, StatusBadge } from '@/components/ui';
import { getErrorMessage } from '@/lib/api/client';
import { useGenerateReferralMutation, useMyReferral, useReferralLookup } from '@/lib/api/hooks';
import type { ReferralReport } from '@/lib/api/types';
import { copyOrShareText, formatCurrency, formatDate, publicWebBaseUrl } from '@/lib/mobile-format';
import { useAppTheme } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

function StatTile({
  highlight,
  label,
  value,
}: {
  highlight?: boolean;
  label: string;
  value: string;
}) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.statTile,
        {
          backgroundColor: highlight ? theme.primarySubtle : theme.field,
          borderColor: highlight ? theme.selectionBorder : theme.border,
        },
      ]}>
      <Text style={[styles.statValue, { color: highlight ? theme.primarySoft : theme.foregroundStrong }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.muted }]}>{label}</Text>
    </View>
  );
}

function ReferralReportCard({ report }: { report: ReferralReport }) {
  const theme = useAppTheme();
  const rate = useMemo(() => `${Math.round(report.commissionRate * 100)}%`, [report.commissionRate]);

  return (
    <GlassCard style={styles.reportCard}>
      <View style={styles.reportTop}>
        <View>
          <Text style={[styles.reportTitle, { color: theme.foregroundStrong }]}>{report.partner.name}</Text>
          <Text style={[styles.reportCopy, { color: theme.muted }]}>Commission rate {rate}</Text>
        </View>
        <StatusBadge label={report.partner.code} tone="accent" />
      </View>
      <View style={styles.statGrid}>
        <StatTile label="Signups" value={report.stats.totalSignups.toLocaleString()} />
        <StatTile label="Qualified" value={report.stats.qualifiedSignups.toLocaleString()} />
        <StatTile label="Pending" value={report.stats.pendingSignups.toLocaleString()} />
        <StatTile highlight label="Earnings" value={formatCurrency(report.stats.earnings)} />
      </View>
      {report.referrals.length === 0 ? (
        <Text style={[styles.emptyLine, { color: theme.muted }]}>No referred users yet.</Text>
      ) : (
        report.referrals.slice(0, 6).map((referral) => (
          <View key={referral.id} style={[styles.referralRow, { borderColor: theme.border }]}>
            <View style={styles.referralCopy}>
              <Text numberOfLines={1} style={[styles.referralName, { color: theme.foregroundStrong }]}>
                {referral.user.name}
              </Text>
              <Text style={[styles.referralDate, { color: theme.muted }]}>{formatDate(referral.signedUpAt)}</Text>
            </View>
            <StatusBadge label={referral.status === 'qualified' ? 'Qualified' : 'Pending'} tone={referral.status === 'qualified' ? 'success' : 'warning'} />
          </View>
        ))
      )}
    </GlassCard>
  );
}

export default function ReferralsScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const myReferral = useMyReferral();
  const generateReferral = useGenerateReferralMutation();
  const [lookupCode, setLookupCode] = useState('');
  const [submittedCode, setSubmittedCode] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const lookup = useReferralLookup(submittedCode);
  const report = myReferral.data;
  const referralLink = report ? `${publicWebBaseUrl()}/r/${report.partner.code}` : '';
  const rateLabel = `${Math.round((report?.commissionRate ?? 0.2) * 100)}%`;

  const handleCopy = async () => {
    if (!referralLink) return;
    try {
      const mode = await copyOrShareText(referralLink, 'Join me on BetClaw');
      setMessage(mode === 'copied' ? 'Referral link copied' : 'Referral link shared');
    } catch {
      setMessage('Could not share referral link');
    }
  };

  return (
    <Screen>
      <Animated.View entering={enterUp(0)}>
        <ScreenHeader
          eyebrow="Invite"
          leadingAction={<IconButton icon={ArrowLeft} label="Go back" onPress={() => router.back()} />}
          title="Referrals"
        />
      </Animated.View>

      <Animated.View entering={enterUp(1)}>
        <GlassCard gradient="hero" style={styles.hero}>
          <View style={styles.heroTop}>
            <StatusBadge label="Invite and earn" tone="accent" />
            <Gift color={theme.primarySoft} size={22} />
          </View>
          <Text style={[styles.heroTitle, { color: theme.foregroundStrong }]}>Share BetClaw and earn on first payments.</Text>
          <Text style={[styles.heroCopy, { color: theme.mutedLight }]}>
            Generate a personal link, share it, and track signups and commission from the same mobile flow.
          </Text>
        </GlassCard>
      </Animated.View>

      <Animated.View entering={enterUp(2)}>
        <GlassCard>
          <View style={styles.cardHeader}>
            <View style={styles.cardCopy}>
              <Text style={[styles.cardTitle, { color: theme.foregroundStrong }]}>Your referral link</Text>
              <Text style={[styles.cardCaption, { color: theme.muted }]}>Earn {rateLabel} commission on qualified first payments.</Text>
            </View>
            <Users color={theme.primarySoft} size={21} />
          </View>

          {myReferral.isLoading ? <Text style={[styles.emptyLine, { color: theme.muted }]}>Loading referral profile...</Text> : null}
          {!myReferral.isLoading && !report ? (
            <>
              <GradientButton icon={Gift} onPress={() => generateReferral.mutate()}>
                {generateReferral.isPending ? 'Generating...' : 'Generate referral link'}
              </GradientButton>
              {generateReferral.error ? <Text style={[styles.errorText, { color: theme.danger }]}>{getErrorMessage(generateReferral.error)}</Text> : null}
            </>
          ) : null}

          {report ? (
            <>
              {!report.partner.isActive ? (
                <Text style={[styles.errorText, { color: theme.warning }]}>This link is currently disabled for new signups.</Text>
              ) : null}
              <PressableScale
                accessibilityLabel="Copy referral link"
                accessibilityRole="button"
                onPress={handleCopy}
                style={[styles.linkBox, { backgroundColor: theme.field, borderColor: theme.selectionBorder }]}>
                <Text numberOfLines={1} style={[styles.linkText, { color: theme.foregroundStrong }]}>{referralLink}</Text>
                <Copy color={theme.primarySoft} size={16} />
              </PressableScale>
              <View style={styles.actionGrid}>
                <PressableScale accessibilityLabel="Copy referral link" accessibilityRole="button" onPress={handleCopy} style={[styles.actionButton, { backgroundColor: theme.field, borderColor: theme.border }]}>
                  <Copy color={theme.primarySoft} size={16} />
                  <Text style={[styles.actionText, { color: theme.foreground }]}>Copy</Text>
                </PressableScale>
                <PressableScale accessibilityLabel="Share referral link" accessibilityRole="button" onPress={handleCopy} style={[styles.actionButton, { backgroundColor: theme.field, borderColor: theme.border }]}>
                  <Share2 color={theme.primarySoft} size={16} />
                  <Text style={[styles.actionText, { color: theme.foreground }]}>Share</Text>
                </PressableScale>
              </View>
              {message ? <Text style={[styles.message, { color: theme.success }]}>{message}</Text> : null}
              <View style={styles.statGrid}>
                <StatTile label="Signups" value={report.stats.totalSignups.toLocaleString()} />
                <StatTile label="Qualified" value={report.stats.qualifiedSignups.toLocaleString()} />
                <StatTile label="Pending" value={report.stats.pendingSignups.toLocaleString()} />
                <StatTile highlight label="Earnings" value={formatCurrency(report.stats.earnings)} />
              </View>
            </>
          ) : null}
        </GlassCard>
      </Animated.View>

      <Animated.View entering={enterUp(3)}>
        <GlassCard>
          <View style={styles.cardHeader}>
            <View style={styles.cardCopy}>
              <Text style={[styles.cardTitle, { color: theme.foregroundStrong }]}>Referral lookup</Text>
              <Text style={[styles.cardCaption, { color: theme.muted }]}>Check any referral code report.</Text>
            </View>
            <Search color={theme.primarySoft} size={20} />
          </View>
          <View style={[styles.searchWrap, { backgroundColor: theme.field, borderColor: theme.border }]}>
            <Search color={theme.muted} size={17} />
            <TextInput
              autoCapitalize="none"
              onChangeText={setLookupCode}
              placeholder="Enter referral code"
              placeholderTextColor={theme.muted}
              style={[styles.searchInput, { color: theme.foregroundStrong }]}
              value={lookupCode}
            />
          </View>
          <GradientButton
            icon={ArrowRight}
            onPress={() => {
              setSubmittedCode(lookupCode.trim());
            }}>
            {lookup.isLoading ? 'Loading...' : 'View Report'}
          </GradientButton>
          {lookup.error ? <Text style={[styles.errorText, { color: theme.danger }]}>{getErrorMessage(lookup.error)}</Text> : null}
          {submittedCode && !lookup.isLoading && !lookup.data && !lookup.error ? (
            <Text style={[styles.emptyLine, { color: theme.muted }]}>No active referral code found.</Text>
          ) : null}
        </GlassCard>
      </Animated.View>

      {lookup.data ? (
        <Animated.View entering={enterUp(4)}>
          <ReferralReportCard report={lookup.data} />
        </Animated.View>
      ) : null}
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
  },
  actionGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionText: {
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  cardCaption: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 3,
  },
  cardCopy: {
    flex: 1,
    minWidth: 0,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 16,
  },
  emptyLine: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
  },
  errorText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
  },
  hero: {
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
  linkBox: {
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  linkText: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  message: {
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  referralCopy: {
    flex: 1,
    minWidth: 0,
  },
  referralDate: {
    fontFamily: fonts.medium,
    fontSize: 11,
    marginTop: 3,
  },
  referralName: {
    fontFamily: fonts.extraBold,
    fontSize: 13,
  },
  referralRow: {
    alignItems: 'center',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  reportCard: {
    gap: spacing.md,
  },
  reportCopy: {
    fontFamily: fonts.medium,
    fontSize: 12,
    marginTop: 3,
  },
  reportTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 18,
  },
  reportTop: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
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
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statLabel: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    marginTop: 3,
  },
  statTile: {
    borderRadius: radius.lg,
    borderWidth: 1,
    flexBasis: '47%',
    flexGrow: 1,
    padding: spacing.md,
  },
  statValue: {
    fontFamily: fonts.extraBold,
    fontSize: 20,
  },
});
