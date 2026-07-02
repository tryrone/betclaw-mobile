import * as Linking from 'expo-linking';
import { useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { CreditCard, Download, FileText, ShieldCheck, Trophy, WalletCards, Zap } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import {
  enterUp,
  GlassCard,
  GradientButton,
  IconButton,
  PressableScale,
  ProgressBar,
  Screen,
  ScreenHeader,
  StatusBadge,
} from '@/components/ui';
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

function TokenPack({ onPress, pack, selected }: { onPress: () => void; pack: TokenPackData; selected: boolean }) {
  const theme = useAppTheme();

  return (
    <PressableScale
      accessibilityLabel={`${pack.label} pack, ${pack.tokens} tokens for ${pack.price}`}
      accessibilityRole="button"
      onPress={onPress}
      style={styles.packWrap}>
      <GlassCard style={[styles.packCard, { borderColor: selected ? theme.selectionBorder : theme.border }]}>
        <View style={styles.packTop}>
          <View style={[styles.packIcon, { backgroundColor: theme.primarySubtle, borderColor: theme.selectionBorder }]}>
            <Trophy color={theme.primarySoft} size={17} />
          </View>
          {pack.featured ? <StatusBadge label="Best value" tone="accent" /> : null}
        </View>
        <Text style={[styles.packTitle, { color: theme.foregroundStrong }]}>{pack.label}</Text>
        <Text style={[styles.packMeta, { color: theme.mutedLight }]}>{pack.tokens} tokens</Text>
        <Text style={[styles.packPrice, { color: theme.primarySoft }]}>{pack.price}</Text>
      </GlassCard>
    </PressableScale>
  );
}

type BillingRowData = BillingItemData & {
  providerReference?: string | null;
  receiptUrl?: string | null;
};

function BillingRow({
  item,
  onOpenReceipt,
  receiptPending,
}: {
  item: BillingRowData;
  onOpenReceipt: (item: BillingRowData) => void;
  receiptPending?: boolean;
}) {
  const theme = useAppTheme();
  const canOpenReceipt = item.status === 'Paid';

  return (
    <GlassCard style={styles.billingRow}>
      <View style={[styles.billingIcon, { backgroundColor: theme.primarySubtle, borderColor: theme.selectionBorder }]}>
        <FileText color={theme.primarySoft} size={15} />
      </View>
      <View style={styles.billingCopy}>
        <Text numberOfLines={2} style={[styles.billingTitle, { color: theme.foregroundStrong }]}>
          {item.label}
        </Text>
        <View style={styles.billingMetaRow}>
          <Text style={[styles.billingDate, { color: theme.muted }]}>{item.date}</Text>
          <StatusBadge label={item.status} tone={item.status === 'Paid' ? 'success' : 'warning'} />
        </View>
      </View>
      <View style={styles.billingRight}>
        <Text style={[styles.billingAmount, { color: theme.foregroundStrong }]}>{item.amount}</Text>
        {canOpenReceipt ? (
          <PressableScale
            accessibilityLabel={`Open receipt for ${item.label}`}
            accessibilityRole="button"
            onPress={() => onOpenReceipt(item)}
            style={[styles.receiptButton, { backgroundColor: theme.field, borderColor: theme.border }]}>
            <Download color={theme.primarySoft} size={13} />
            <Text style={[styles.receiptText, { color: theme.primarySoft }]}>
              {receiptPending ? 'Opening' : 'Receipt'}
            </Text>
          </PressableScale>
        ) : null}
      </View>
    </GlassCard>
  );
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
      id: String(option.durationDays),
      label: option.label ?? `${option.durationDays} day access`,
      price: `₦${Math.round((option.amountKobo ?? 0) / 100).toLocaleString()}`,
      tokens: Number(option.researchTokens ?? 0).toLocaleString(),
      featured: option.durationDays === 7,
    }));
  }, [plans.data]);
  const [selectedPack, setSelectedPack] = useState(availablePacks[0]?.id ?? 'weekly');
  const activeSelectedPack = availablePacks.some((pack) => pack.id === selectedPack)
    ? selectedPack
    : availablePacks[0]?.id ?? 'weekly';
  const selectedDuration = Number(activeSelectedPack) === 1 || Number(activeSelectedPack) === 7 ? (Number(activeSelectedPack) as 1 | 7) : 7;
  const tokenBalance = subscription.data?.researchTokensRemaining ?? 0;
  const minimumBalance = subscription.data?.minimumActiveResearchTokens ?? 1;
  const balanceProgress = Math.min(100, Math.round((tokenBalance / Math.max(1, minimumBalance)) * 100));
  const freeLimit = usage.data?.creditsPerMonth ?? 0;
  const freeUsed = usage.data?.creditsUsed ?? usage.data?.requestsUsed ?? 0;
  const freeRemaining = usage.data?.creditsRemaining ?? usage.data?.requestsRemaining ?? 0;
  const usagePercent =
    typeof usage.data?.percentUsed === 'number'
      ? usage.data.percentUsed
      : freeLimit > 0
        ? Math.min(100, Math.round((freeUsed / freeLimit) * 100))
        : 0;
  const hasUnlimitedFreeUse = freeLimit === -1;
  const billingItems = useMemo<BillingRowData[]>(() => {
    const items = billing.data?.items;
    if (!Array.isArray(items) || items.length === 0) return [];

    return items.map((item: any) => ({
      id: item.id,
      label: item.description ?? 'Token purchase',
      date: new Date(item.createdAt).toLocaleDateString(),
      amount: formatCurrency(item.amount, item.currency ?? 'NGN'),
      providerReference: item.providerReference,
      receiptUrl: item.receiptUrl,
      status: item.status === 'PAID' ? 'Paid' : 'Pending',
    }));
  }, [billing.data]);

  useEffect(() => {
    if (returnedReference && verifiedReturnReference.current !== returnedReference) {
      verifiedReturnReference.current = returnedReference;
      verifyReturnedPayment({ reference: returnedReference });
    }
  }, [returnedReference, verifyReturnedPayment]);

  const handleKoraCheckout = async () => {
    const returnUrl = Linking.createURL('/(tabs)/wallet');
    const checkout = await createCheckout.mutateAsync({
      durationDays: selectedDuration,
      returnUrl,
    });
    const result = await WebBrowser.openAuthSessionAsync(checkout.url, returnUrl);
    if (result.type === 'success') {
      const parsed = Linking.parse(result.url);
      const parsedReference = parsed.queryParams?.reference;
      const verificationReference =
        checkout.providerReference ?? checkout.reference ?? (Array.isArray(parsedReference) ? parsedReference[0] : parsedReference);
      if (verificationReference) {
        verifyReturnedPayment({ reference: String(verificationReference) });
      }
    }
  };

  const handleOpenReceipt = async (item: BillingRowData) => {
    try {
      const receiptUrl = item.receiptUrl ?? (await downloadReceipt.mutateAsync({ paymentId: item.id })).receiptUrl;
      await openExternalUrl(receiptUrl);
    } catch {
      // downloadReceipt.error is surfaced to the user in the billing list below.
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
        <ScreenHeader action={<IconButton icon={CreditCard} label="Payment methods" />} eyebrow="Billing" title="Wallet" />
      </Animated.View>

      <Animated.View entering={enterUp(1)}>
        <GlassCard gradient="hero" style={styles.balanceCard}>
          <View style={styles.balanceTop}>
            <StatusBadge label="Premium active" tone="accent" />
            <ShieldCheck color={theme.primarySoft} size={21} />
          </View>
          <View>
            <Text style={[styles.balanceLabel, { color: theme.muted }]}>Token balance</Text>
            <Text style={[styles.balanceValue, { color: theme.foregroundStrong }]}>{Number(tokenBalance).toLocaleString()}</Text>
            <Text style={[styles.balanceSub, { color: theme.mutedLight }]}>tokens remaining</Text>
          </View>
          <ProgressBar value={balanceProgress} />
        </GlassCard>
      </Animated.View>

      <Animated.View entering={enterUp(2)}>
        <GlassCard>
          <View style={styles.cardHeader}>
            <View>
              <Text style={[styles.cardTitle, { color: theme.foregroundStrong }]}>Usage and limits</Text>
              <Text style={[styles.cardCaption, { color: theme.muted }]}>Free checks plus token-backed research activity.</Text>
            </View>
            <Zap color={theme.accent} size={22} />
          </View>
          <View style={styles.usageGrid}>
            <View style={[styles.usageTile, { backgroundColor: theme.field, borderColor: theme.border }]}>
              <Text style={[styles.usageValue, { color: theme.primarySoft }]}>
                {hasUnlimitedFreeUse ? 'Unlimited' : Number(freeRemaining).toLocaleString()}
              </Text>
              <Text style={[styles.usageLabel, { color: theme.muted }]}>Free remaining</Text>
            </View>
            <View style={[styles.usageTile, { backgroundColor: theme.field, borderColor: theme.border }]}>
              <Text style={[styles.usageValue, { color: theme.foregroundStrong }]}>
                {hasUnlimitedFreeUse ? 'Premium' : `${Number(freeUsed).toLocaleString()}/${Number(freeLimit).toLocaleString()}`}
              </Text>
              <Text style={[styles.usageLabel, { color: theme.muted }]}>Free usage</Text>
            </View>
          </View>
          <ProgressBar
            tone={subscription.data?.isBelowMinimumTokenBalance ? 'warning' : 'success'}
            value={hasUnlimitedFreeUse ? 100 : usagePercent}
          />
          <Text style={[styles.cardCaption, { color: subscription.data?.isBelowMinimumTokenBalance ? theme.warning : theme.muted }]}>
            {subscription.data?.isBelowMinimumTokenBalance
              ? `Keep at least ${Number(minimumBalance).toLocaleString()} token${minimumBalance === 1 ? '' : 's'} for research actions.`
              : usage.isLoading
                ? 'Refreshing usage counters.'
                : 'Fix Ticket and Build Ticket are available while your access and token balance are valid.'}
          </Text>
        </GlassCard>
      </Animated.View>

      <Animated.View entering={enterUp(3)} style={styles.packGrid}>
        {availablePacks.map((pack) => (
          <TokenPack key={pack.id} onPress={() => setSelectedPack(pack.id)} pack={pack} selected={activeSelectedPack === pack.id} />
        ))}
      </Animated.View>

      <Animated.View entering={enterUp(4)}>
        <GlassCard>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: theme.foregroundStrong }]}>Payment paths</Text>
            <StatusBadge label="Kora" tone="accent" />
          </View>
          <View style={styles.paymentGrid}>
            {createCheckout.error ? <Text style={[styles.cardCaption, { color: theme.danger }]}>{getErrorMessage(createCheckout.error)}</Text> : null}
            {verifyPayment.data ? <Text style={[styles.cardCaption, { color: theme.success }]}>Payment status: {verifyPayment.data.status}</Text> : null}
            <GradientButton icon={WalletCards} onPress={handleKoraCheckout}>
              {createCheckout.isPending || verifyPayment.isPending ? 'Processing...' : 'Pay with Kora'}
            </GradientButton>
          </View>
        </GlassCard>
      </Animated.View>

      <Animated.View entering={enterUp(5)} style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.foregroundStrong }]}>Purchase history</Text>
        <Text style={[styles.sectionAction, { color: theme.primarySoft }]}>View all</Text>
      </Animated.View>

      {billingItems.length === 0 ? (
        <Animated.View entering={enterUp(6)}>
          <GlassCard style={styles.emptyCard}>
            <Text style={[styles.emptyTitle, { color: theme.foregroundStrong }]}>
              {billing.isLoading ? 'Loading purchase history' : 'No purchases yet'}
            </Text>
            <Text style={[styles.emptyCopy, { color: theme.muted }]}>
              {billing.isLoading ? 'Fetching your wallet activity.' : 'Completed Kora purchases will appear here.'}
            </Text>
          </GlassCard>
        </Animated.View>
      ) : null}

      {billingItems.map((item, index) => (
        <Animated.View entering={enterUp(7 + index)} key={item.id}>
          <BillingRow item={item} onOpenReceipt={handleOpenReceipt} receiptPending={downloadReceipt.isPending} />
        </Animated.View>
      ))}
      {downloadReceipt.error ? (
        <Text style={[styles.emptyCopy, { color: theme.danger }]}>{getErrorMessage(downloadReceipt.error)}</Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  balanceCard: {
    gap: spacing.md,
  },
  balanceLabel: {
    fontFamily: fonts.bold,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  balanceSub: {
    fontFamily: fonts.bold,
    fontSize: 13,
    marginTop: 5,
  },
  balanceTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceValue: {
    fontFamily: fonts.extraBold,
    fontSize: 36,
    letterSpacing: 0,
    lineHeight: 41,
    marginTop: 5,
  },
  billingAmount: {
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  billingCopy: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  billingMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  billingDate: {
    fontFamily: fonts.medium,
    fontSize: 11,
    marginTop: 4,
  },
  billingIcon: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  billingRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  billingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  billingTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 14,
    lineHeight: 19,
  },
  cardCaption: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
    maxWidth: 220,
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
  emptyCard: {
    gap: spacing.xs,
    padding: spacing.lg,
  },
  emptyCopy: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
  },
  emptyTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 15,
  },
  packCard: {
    flex: 1,
    padding: spacing.md,
  },
  packGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  packIcon: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  packMeta: {
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
  packPrice: {
    fontFamily: fonts.extraBold,
    fontSize: 16,
  },
  packTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 16,
  },
  packTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  packWrap: {
    flex: 1,
  },
  paymentGrid: {
    gap: spacing.sm,
  },
  receiptButton: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    minHeight: 28,
    paddingHorizontal: 8,
  },
  receiptText: {
    fontFamily: fonts.bold,
    fontSize: 10,
  },
  sectionAction: {
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
  storePay: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 46,
    justifyContent: 'center',
  },
  storePayText: {
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  usageGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  usageLabel: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    marginTop: 3,
  },
  usageTile: {
    borderRadius: radius.lg,
    borderWidth: 1,
    flex: 1,
    padding: spacing.md,
  },
  usageValue: {
    fontFamily: fonts.extraBold,
    fontSize: 18,
  },
});
