import * as Linking from 'expo-linking';
import { useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Check, Coins, Download, ReceiptText, ShieldCheck, WalletCards, Zap } from '@/components/modern-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { enterUp, GlassCard, GradientButton, PressableScale, ProgressBar, Screen, ScreenHeader, StatusBadge } from '@/components/ui';
import { tokenPacks, type BillingItemData, type TokenPackData } from '@/data/mock';
import { getErrorMessage } from '@/lib/api/client';
import {
  useBillingHistory,
  useCreateCheckoutMutation,
  useDownloadReceiptMutation,
  usePlans,
  useSubscriptionCurrent,
  useSubscriptionUsage,
  useVerifyReturnedPaymentMutation,
} from '@/lib/api/hooks';
import { formatCurrency, openExternalUrl } from '@/lib/mobile-format';
import { useAppTheme } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

function TokenPackRow({ onPress, pack, selected }: { onPress: () => void; pack: TokenPackData; selected: boolean }) {
  const theme = useAppTheme();
  return (
    <PressableScale
      accessibilityLabel={`${pack.label}, ${pack.tokens} tokens for ${pack.price}`}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      scaleTo={0.99}
      style={[styles.packRow, { backgroundColor: selected ? theme.primarySubtle : theme.card, borderColor: selected ? theme.selectionBorder : theme.border }]}>
      <View style={[styles.packIcon, { backgroundColor: selected ? theme.primary : theme.field }]}>
        <Coins color={selected ? theme.primaryDark : theme.primarySoft} size={19} strokeWidth={2} />
      </View>
      <View style={styles.packCopy}>
        <View style={styles.packTitleRow}>
          <Text numberOfLines={1} style={[styles.packTitle, { color: theme.foregroundStrong }]}>{pack.label}</Text>
          {pack.featured ? <StatusBadge label="Best value" tone="accent" /> : null}
        </View>
        <Text style={[styles.packMeta, { color: theme.muted }]}>{pack.tokens} research tokens</Text>
      </View>
      <View style={styles.packRight}>
        <Text style={[styles.packPrice, { color: theme.foregroundStrong }]}>{pack.price}</Text>
        <View style={[styles.radio, { borderColor: selected ? theme.primary : theme.borderStrong, backgroundColor: selected ? theme.primary : 'transparent' }]}>
          {selected ? <Check color={theme.primaryDark} size={12} strokeWidth={3} /> : null}
        </View>
      </View>
    </PressableScale>
  );
}

type BillingRowData = BillingItemData & {
  createdAt: Date;
  providerReference?: string | null;
  receiptUrl?: string | null;
};

type BillingGroup = { items: BillingRowData[]; key: string; label: string };

function normalizePurchaseLabel(label: string) {
  return label.replace(/^token purchase:\s*/i, '').replace(/\s+/g, ' ').trim() || 'Token purchase';
}

function BillingRow({ item, onOpenReceipt, receiptPending, showDivider }: { item: BillingRowData; onOpenReceipt: (item: BillingRowData) => void; receiptPending?: boolean; showDivider: boolean }) {
  const theme = useAppTheme();
  const canOpenReceipt = item.status === 'Paid';
  const content = (
    <View style={[styles.billingRow, showDivider ? { borderBottomColor: theme.border, borderBottomWidth: 1 } : null]}>
      <View style={[styles.billingIcon, { backgroundColor: canOpenReceipt ? theme.successSoft : theme.warningSoft }]}>
        <ReceiptText color={canOpenReceipt ? theme.success : theme.warning} size={18} strokeWidth={1.9} />
      </View>
      <View style={styles.billingCopy}>
        <Text numberOfLines={2} style={[styles.billingTitle, { color: theme.foregroundStrong }]}>{normalizePurchaseLabel(item.label)}</Text>
        <View style={styles.billingMetaRow}>
          <Text style={[styles.billingDate, { color: theme.muted }]}>{item.date}</Text>
          <View style={[styles.statusDot, { backgroundColor: canOpenReceipt ? theme.success : theme.warning }]} />
          <Text style={[styles.billingStatus, { color: canOpenReceipt ? theme.success : theme.warning }]}>{item.status}</Text>
        </View>
      </View>
      <View style={styles.billingRight}>
        <Text style={[styles.billingAmount, { color: theme.foregroundStrong }]}>{item.amount}</Text>
        {canOpenReceipt ? <Download color={theme.primarySoft} size={17} strokeWidth={1.9} /> : null}
      </View>
    </View>
  );

  return canOpenReceipt ? (
    <PressableScale
      accessibilityHint="Opens the purchase receipt"
      accessibilityLabel={`Receipt for ${normalizePurchaseLabel(item.label)}, ${item.amount}`}
      accessibilityRole="button"
      disabled={receiptPending}
      onPress={() => onOpenReceipt(item)}
      scaleTo={0.99}>
      {content}
    </PressableScale>
  ) : content;
}

export default function WalletScreen() {
  const { reference } = useLocalSearchParams<{ reference?: string }>();
  const theme = useAppTheme();
  const plans = usePlans();
  const subscription = useSubscriptionCurrent();
  const usage = useSubscriptionUsage();
  const billing = useBillingHistory();
  const createCheckout = useCreateCheckoutMutation();
  const downloadReceipt = useDownloadReceiptMutation();
  const verifyPayment = useVerifyReturnedPaymentMutation();
  const verifyReturnedPayment = verifyPayment.mutate;
  const verifiedReturnReference = useRef<string | null>(null);
  const returnedReference = Array.isArray(reference) ? reference[0] : reference;

  const availablePacks = useMemo<TokenPackData[]>(() => {
    const premiumPlan = plans.data?.find((plan: any) => plan.name === 'premium');
    const options = premiumPlan?.purchaseOptions;
    if (!Array.isArray(options) || options.length === 0) return tokenPacks;
    return options.map((option: any) => ({
      featured: option.durationDays === 7,
      id: String(option.durationDays),
      label: option.label ?? `${option.durationDays} day access`,
      price: `₦${Math.round((option.amountKobo ?? 0) / 100).toLocaleString()}`,
      tokens: Number(option.researchTokens ?? 0).toLocaleString(),
    }));
  }, [plans.data]);

  const [selectedPack, setSelectedPack] = useState(availablePacks[0]?.id ?? 'weekly');
  const activeSelectedPack = availablePacks.some((pack) => pack.id === selectedPack) ? selectedPack : availablePacks[0]?.id ?? 'weekly';
  const selectedPackDetails = availablePacks.find((pack) => pack.id === activeSelectedPack) ?? availablePacks[0];
  const selectedDuration = Number(activeSelectedPack) === 1 || Number(activeSelectedPack) === 7 ? (Number(activeSelectedPack) as 1 | 7) : 7;
  const tokenBalance = subscription.data?.researchTokensRemaining ?? 0;
  const minimumBalance = subscription.data?.minimumActiveResearchTokens ?? 1;
  const balanceProgress = Math.min(100, Math.round((tokenBalance / Math.max(1, minimumBalance)) * 100));
  const freeLimit = usage.data?.creditsPerMonth ?? 0;
  const freeUsed = usage.data?.creditsUsed ?? usage.data?.requestsUsed ?? 0;
  const freeRemaining = usage.data?.creditsRemaining ?? usage.data?.requestsRemaining ?? 0;
  const usagePercent = typeof usage.data?.percentUsed === 'number' ? usage.data.percentUsed : freeLimit > 0 ? Math.min(100, Math.round((freeUsed / freeLimit) * 100)) : 0;
  const hasUnlimitedFreeUse = freeLimit === -1;
  const accessLabel = subscription.data?.accessTier ? `${subscription.data.accessTier} access` : 'Account active';

  const billingItems = useMemo<BillingRowData[]>(() => {
    const items = billing.data?.items;
    if (!Array.isArray(items) || items.length === 0) return [];
    return items.map((item: any) => {
      const createdAt = new Date(item.createdAt);
      return {
        amount: formatCurrency(item.amount, item.currency ?? 'NGN'),
        createdAt,
        date: createdAt.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }),
        id: item.id,
        label: item.description ?? 'Token purchase',
        providerReference: item.providerReference,
        receiptUrl: item.receiptUrl,
        status: item.status === 'PAID' ? 'Paid' : 'Pending',
      };
    });
  }, [billing.data]);

  const billingGroups = useMemo<BillingGroup[]>(() => {
    const groups = new Map<string, BillingGroup>();
    billingItems.forEach((item) => {
      const key = `${item.createdAt.getFullYear()}-${item.createdAt.getMonth()}`;
      const current = groups.get(key) ?? {
        items: [],
        key,
        label: item.createdAt.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
      };
      current.items.push(item);
      groups.set(key, current);
    });
    return Array.from(groups.values());
  }, [billingItems]);

  useEffect(() => {
    if (returnedReference && verifiedReturnReference.current !== returnedReference) {
      verifiedReturnReference.current = returnedReference;
      verifyReturnedPayment({ reference: returnedReference });
    }
  }, [returnedReference, verifyReturnedPayment]);

  const handleKoraCheckout = async () => {
    const returnUrl = Linking.createURL('/(tabs)/wallet');
    const checkout = await createCheckout.mutateAsync({ durationDays: selectedDuration, returnUrl });
    const result = await WebBrowser.openAuthSessionAsync(checkout.url, returnUrl);
    if (result.type === 'success') {
      const parsed = Linking.parse(result.url);
      const parsedReference = parsed.queryParams?.reference;
      const verificationReference = checkout.providerReference ?? checkout.reference ?? (Array.isArray(parsedReference) ? parsedReference[0] : parsedReference);
      if (verificationReference) verifyReturnedPayment({ reference: String(verificationReference) });
    }
  };

  const handleOpenReceipt = async (item: BillingRowData) => {
    try {
      const receiptUrl = item.receiptUrl ?? (await downloadReceipt.mutateAsync({ paymentId: item.id })).receiptUrl;
      await openExternalUrl(receiptUrl);
    } catch {
      // The mutation error is rendered beneath purchase history.
    }
  };

  return (
    <Screen
      hasTabs
      onRefresh={() => {
        void plans.refetch();
        void subscription.refetch();
        void usage.refetch();
        void billing.refetch();
      }}
      refreshing={subscription.isRefetching || billing.isRefetching}>
      <Animated.View entering={enterUp(0)}>
        <ScreenHeader eyebrow="Balance" title="Wallet" />
      </Animated.View>

      <Animated.View entering={enterUp(1)}>
        <GlassCard style={[styles.balanceCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.balanceTop}>
            <View>
              <Text style={[styles.balanceLabel, { color: theme.muted }]}>Available research tokens</Text>
              <View style={styles.balanceValueRow}>
                <Text style={[styles.balanceValue, { color: theme.foregroundStrong }]}>{Number(tokenBalance).toLocaleString()}</Text>
                <Text style={[styles.balanceUnit, { color: theme.mutedLight }]}>tokens</Text>
              </View>
            </View>
            <View style={[styles.shieldIcon, { backgroundColor: theme.primarySubtle }]}>
              <ShieldCheck color={theme.primarySoft} size={22} />
            </View>
          </View>
          <View style={styles.accessRow}>
            <StatusBadge label={accessLabel} tone="accent" />
            <Text style={[styles.minimumText, { color: theme.muted }]}>Minimum active balance: {minimumBalance}</Text>
          </View>
          <ProgressBar value={balanceProgress} />
          <View style={[styles.usageRow, { borderTopColor: theme.border }]}>
            <View style={styles.usageMetric}>
              <Text style={[styles.usageValue, { color: theme.foregroundStrong }]}>{hasUnlimitedFreeUse ? 'Unlimited' : Number(freeRemaining).toLocaleString()}</Text>
              <Text style={[styles.usageLabel, { color: theme.muted }]}>Free remaining</Text>
            </View>
            <View style={[styles.usageDivider, { backgroundColor: theme.border }]} />
            <View style={styles.usageMetric}>
              <Text style={[styles.usageValue, { color: theme.foregroundStrong }]}>{hasUnlimitedFreeUse ? 'Premium' : `${Number(freeUsed).toLocaleString()}/${Number(freeLimit).toLocaleString()}`}</Text>
              <Text style={[styles.usageLabel, { color: theme.muted }]}>Monthly usage</Text>
            </View>
            <Zap color={subscription.data?.isBelowMinimumTokenBalance ? theme.warning : theme.primarySoft} size={19} />
          </View>
          {!hasUnlimitedFreeUse ? <ProgressBar tone={subscription.data?.isBelowMinimumTokenBalance ? 'warning' : 'success'} value={usagePercent} /> : null}
        </GlassCard>
      </Animated.View>

      <Animated.View entering={enterUp(2)} style={styles.sectionIntro}>
        <Text style={[styles.sectionTitle, { color: theme.foregroundStrong }]}>Get more tokens</Text>
        <Text style={[styles.sectionCaption, { color: theme.muted }]}>Choose the access period that fits your next research session.</Text>
      </Animated.View>

      <Animated.View entering={enterUp(3)} accessibilityRole="radiogroup" style={styles.packList}>
        {availablePacks.map((pack) => (
          <TokenPackRow key={pack.id} onPress={() => setSelectedPack(pack.id)} pack={pack} selected={activeSelectedPack === pack.id} />
        ))}
      </Animated.View>

      {selectedPackDetails ? (
        <Animated.View entering={enterUp(4)}>
          <GlassCard style={styles.checkoutCard}>
            <View style={styles.checkoutSummary}>
              <View>
                <Text style={[styles.checkoutLabel, { color: theme.muted }]}>Selected pack</Text>
                <Text style={[styles.checkoutTitle, { color: theme.foregroundStrong }]}>{selectedPackDetails.label}</Text>
                <Text style={[styles.checkoutMeta, { color: theme.mutedLight }]}>{selectedPackDetails.tokens} tokens · Secure checkout by Kora</Text>
              </View>
              <Text style={[styles.checkoutPrice, { color: theme.primarySoft }]}>{selectedPackDetails.price}</Text>
            </View>
            {createCheckout.error ? <Text style={[styles.feedbackText, { color: theme.danger }]}>{getErrorMessage(createCheckout.error)}</Text> : null}
            {verifyPayment.data ? <Text style={[styles.feedbackText, { color: theme.success }]}>Payment status: {verifyPayment.data.status}</Text> : null}
            <GradientButton icon={WalletCards} onPress={handleKoraCheckout}>
              {createCheckout.isPending || verifyPayment.isPending ? 'Processing…' : `Pay ${selectedPackDetails.price} with Kora`}
            </GradientButton>
          </GlassCard>
        </Animated.View>
      ) : null}

      <Animated.View entering={enterUp(5)} style={styles.sectionIntro}>
        <Text style={[styles.sectionTitle, { color: theme.foregroundStrong }]}>Purchase history</Text>
        <Text style={[styles.sectionCaption, { color: theme.muted }]}>Receipts and token purchases, newest first.</Text>
      </Animated.View>

      {billingGroups.length === 0 ? (
        <Animated.View entering={enterUp(6)}>
          <GlassCard style={styles.emptyCard}>
            <ReceiptText color={theme.muted} size={22} />
            <Text style={[styles.emptyTitle, { color: theme.foregroundStrong }]}>{billing.isLoading ? 'Loading purchase history' : 'No purchases yet'}</Text>
            <Text style={[styles.emptyCopy, { color: theme.muted }]}>{billing.isLoading ? 'Fetching your wallet activity.' : 'Completed Kora purchases will appear here.'}</Text>
          </GlassCard>
        </Animated.View>
      ) : null}

      {billingGroups.map((group, groupIndex) => (
        <Animated.View entering={enterUp(6 + groupIndex)} key={group.key} style={styles.historyGroup}>
          <Text style={[styles.monthLabel, { color: theme.muted }]}>{group.label}</Text>
          <GlassCard style={styles.historyCard}>
            {group.items.map((item, index) => (
              <BillingRow
                item={item}
                key={item.id}
                onOpenReceipt={handleOpenReceipt}
                receiptPending={downloadReceipt.isPending}
                showDivider={index < group.items.length - 1}
              />
            ))}
          </GlassCard>
        </Animated.View>
      ))}
      {downloadReceipt.error ? <Text style={[styles.feedbackText, { color: theme.danger }]}>{getErrorMessage(downloadReceipt.error)}</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  accessRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between' },
  balanceCard: { gap: spacing.md, padding: spacing.lg },
  balanceLabel: { fontFamily: fonts.bold, fontSize: 11, letterSpacing: 0.7, textTransform: 'uppercase' },
  balanceTop: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  balanceUnit: { fontFamily: fonts.bold, fontSize: 13, paddingBottom: 5 },
  balanceValue: { fontFamily: fonts.extraBold, fontSize: 38, fontVariant: ['tabular-nums'], letterSpacing: -1, lineHeight: 44 },
  balanceValueRow: { alignItems: 'flex-end', flexDirection: 'row', gap: spacing.xs, marginTop: 4 },
  billingAmount: { fontFamily: fonts.extraBold, fontSize: 13, fontVariant: ['tabular-nums'] },
  billingCopy: { flex: 1, gap: 5, minWidth: 0 },
  billingDate: { fontFamily: fonts.medium, fontSize: 11 },
  billingIcon: { alignItems: 'center', borderRadius: radius.pill, height: 38, justifyContent: 'center', width: 38 },
  billingMetaRow: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  billingRight: { alignItems: 'flex-end', gap: spacing.sm },
  billingRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, minHeight: 76, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  billingStatus: { fontFamily: fonts.bold, fontSize: 10 },
  billingTitle: { fontFamily: fonts.bold, fontSize: 13, lineHeight: 17 },
  checkoutCard: { gap: spacing.md, padding: spacing.md },
  checkoutLabel: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 0.6, textTransform: 'uppercase' },
  checkoutMeta: { fontFamily: fonts.medium, fontSize: 11, marginTop: 3 },
  checkoutPrice: { fontFamily: fonts.extraBold, fontSize: 18, fontVariant: ['tabular-nums'] },
  checkoutSummary: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between' },
  checkoutTitle: { fontFamily: fonts.extraBold, fontSize: 16, marginTop: 3 },
  emptyCard: { alignItems: 'center', gap: spacing.xs, padding: spacing.xl },
  emptyCopy: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  emptyTitle: { fontFamily: fonts.extraBold, fontSize: 15 },
  feedbackText: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 17 },
  historyCard: { gap: 0, overflow: 'hidden', padding: 0 },
  historyGroup: { gap: spacing.sm },
  minimumText: { fontFamily: fonts.medium, fontSize: 10 },
  monthLabel: { fontFamily: fonts.extraBold, fontSize: 11, letterSpacing: 0.7, textTransform: 'uppercase' },
  packCopy: { flex: 1, minWidth: 0 },
  packIcon: { alignItems: 'center', borderRadius: radius.lg, height: 42, justifyContent: 'center', width: 42 },
  packList: { gap: spacing.sm },
  packMeta: { fontFamily: fonts.medium, fontSize: 11, marginTop: 4 },
  packPrice: { fontFamily: fonts.extraBold, fontSize: 15, fontVariant: ['tabular-nums'] },
  packRight: { alignItems: 'flex-end', gap: spacing.sm },
  packRow: { alignItems: 'center', borderRadius: radius.xl, borderWidth: 1, flexDirection: 'row', gap: spacing.md, minHeight: 78, padding: spacing.md },
  packTitle: { flexShrink: 1, fontFamily: fonts.extraBold, fontSize: 14 },
  packTitleRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  radio: { alignItems: 'center', borderRadius: radius.pill, borderWidth: 1, height: 20, justifyContent: 'center', width: 20 },
  sectionCaption: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 18, marginTop: 3 },
  sectionIntro: { gap: 1 },
  sectionTitle: { fontFamily: fonts.extraBold, fontSize: 18 },
  shieldIcon: { alignItems: 'center', borderRadius: radius.pill, height: 44, justifyContent: 'center', width: 44 },
  statusDot: { borderRadius: radius.pill, height: 6, width: 6 },
  usageDivider: { height: 28, width: 1 },
  usageLabel: { fontFamily: fonts.medium, fontSize: 10, marginTop: 2 },
  usageMetric: { flex: 1 },
  usageRow: { alignItems: 'center', borderTopWidth: 1, flexDirection: 'row', gap: spacing.md, paddingTop: spacing.md },
  usageValue: { fontFamily: fonts.extraBold, fontSize: 14 },
});
