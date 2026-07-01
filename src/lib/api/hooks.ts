import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { callWithMobileRefresh, trpc } from '@/lib/api/client';
import { signInWithNativeGoogle } from '@/lib/api/google-auth';
import type {
  BillingHistory,
  BuilderOptions,
  BuildTicketInput,
  BuildTicketResult,
  CheckoutResult,
  ConvertCodeResult,
  DailyTicketBookmakerPlatform,
  DailyTicketData,
  DownloadReceiptResult,
  FixtureInsight,
  FixTicketResult,
  ForgotPasswordResult,
  GenerateBookingCodeResult,
  HomeFeed,
  LeagueOption,
  MobileAuthSession,
  MobileOAuthProvider,
  NotificationFeed,
  NotificationSummary,
  Plan,
  ReferralReport,
  ShareLinkResult,
  SubscriptionCurrent,
  SubscriptionUsage,
  TelegramCommunityInvite,
  TelegramCommunityStatus,
  TelegramTokenResult,
  TicketDetail,
  TicketJobState,
  TicketList,
  TicketMatchResult,
  TicketResult,
  UserProfile,
  VerifyPaymentResult,
} from '@/lib/api/types';
import type { SupportedPlatform } from '@/lib/bookmaker-platforms';
import { signInWithMobileOAuth } from '@/lib/api/oauth';
import { getMobileDeviceInput } from '@/lib/device';
import { useAuthStore } from '@/store/auth-store';
import { useNotificationStore } from '@/store/notification-store';

const authed = () => useAuthStore.getState().status === 'authenticated';
const asPromise = <T>(value: Promise<unknown>) => value as Promise<T>;

export const queryKeys = {
  activeJobs: ['ticket', 'activeJobs'] as const,
  billing: ['payment', 'billing'] as const,
  builderOptions: (input?: unknown) => ['ticket', 'builderOptions', input] as const,
  dailyTicket: (input?: unknown) => ['prediction', 'dailyTicket', input] as const,
  fixtureInsight: (fixtureId?: string) => ['matchday', 'fixtureInsight', fixtureId] as const,
  homeFeed: (input?: unknown) => ['matchday', 'homeFeed', input] as const,
  infiniteHomeFeed: (input?: unknown) => ['matchday', 'homeFeedInfinite', input] as const,
  leagues: (input?: unknown) => ['matchday', 'leagues', input] as const,
  me: ['user', 'me'] as const,
  notifications: ['ticket', 'notifications'] as const,
  notificationSummary: ['ticket', 'notificationSummary'] as const,
  plans: ['subscription', 'plans'] as const,
  recentActivity: ['ticket', 'recentActivity'] as const,
  referralLookup: (code?: string) => ['referral', 'lookup', code] as const,
  myReferral: ['referral', 'mine'] as const,
  subscription: ['subscription', 'current'] as const,
  subscriptionUsage: ['subscription', 'usage'] as const,
  telegramCommunityStatus: ['user', 'telegramCommunityStatus'] as const,
  ticketList: (input?: unknown) => ['ticket', 'list', input] as const,
  ticketStats: ['ticket', 'stats'] as const,
  ticket: (ticketId?: string | null) => ['ticket', 'detail', ticketId] as const,
};

export function useMe() {
  const status = useAuthStore((state) => state.status);
  return useQuery<UserProfile>({
    enabled: status === 'authenticated',
    queryKey: queryKeys.me,
    queryFn: () => callWithMobileRefresh(() => asPromise<UserProfile>(trpc.user.me.query())),
  });
}

export function useHomeFeed(input?: { cursor?: string; date?: string; leagueKey?: string; limit?: number; query?: string; windowDays?: 1 | 3 }) {
  const status = useAuthStore((state) => state.status);
  return useQuery<HomeFeed>({
    enabled: status === 'authenticated',
    queryKey: queryKeys.homeFeed(input),
    queryFn: () => callWithMobileRefresh(() => asPromise<HomeFeed>(trpc.matchday.getHomeFeed.query(input ?? { limit: 24 }))),
  });
}

export function useInfiniteHomeFeed(input?: { date?: string; leagueKey?: string; limit?: number; query?: string; windowDays?: 1 | 3 }) {
  const status = useAuthStore((state) => state.status);
  return useInfiniteQuery<HomeFeed>({
    enabled: status === 'authenticated',
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    queryKey: queryKeys.infiniteHomeFeed(input),
    queryFn: ({ pageParam }) =>
      callWithMobileRefresh(() =>
        asPromise<HomeFeed>(
          trpc.matchday.getHomeFeed.query({
            ...(input ?? { limit: 24 }),
            cursor: pageParam,
          }),
        ),
      ),
  });
}

export function useLeagues(input?: { date?: string; dateRange?: 'today' | 'tomorrow' | 'week'; windowDays?: 1 | 3 }) {
  const status = useAuthStore((state) => state.status);
  return useQuery<LeagueOption[]>({
    enabled: status === 'authenticated',
    queryKey: queryKeys.leagues(input),
    queryFn: () => callWithMobileRefresh(() => asPromise<LeagueOption[]>(trpc.matchday.getLeagues.query(input ?? { dateRange: 'today' }))),
  });
}

export function useDailyTicket(input?: {
  bookmakerPlatform?: DailyTicketBookmakerPlatform;
  date?: string;
  maxLegs?: number;
  sport?: 'FOOTBALL';
  targetOdds?: number;
}, options?: { enabled?: boolean }) {
  const status = useAuthStore((state) => state.status);
  return useQuery<DailyTicketData>({
    enabled: status === 'authenticated' && (options?.enabled ?? true),
    queryKey: queryKeys.dailyTicket(input),
    retry: false,
    queryFn: () => callWithMobileRefresh(() => asPromise<DailyTicketData>(trpc.prediction.getDailyTicket.query(input ?? { sport: 'FOOTBALL' }))),
  });
}

export function useFixtureInsight(fixtureId?: string) {
  const status = useAuthStore((state) => state.status);
  return useQuery<FixtureInsight>({
    enabled: status === 'authenticated' && Boolean(fixtureId),
    queryKey: queryKeys.fixtureInsight(fixtureId),
    queryFn: () => callWithMobileRefresh(() => asPromise<FixtureInsight>(trpc.matchday.getFixtureInsight.query({ fixtureId }))),
  });
}

export function useTelegramCommunityStatus() {
  const status = useAuthStore((state) => state.status);
  return useQuery<TelegramCommunityStatus>({
    enabled: status === 'authenticated',
    queryKey: queryKeys.telegramCommunityStatus,
    queryFn: () => callWithMobileRefresh(() => asPromise<TelegramCommunityStatus>(trpc.user.getTelegramCommunityStatus.query())),
  });
}

export function useTicketStats() {
  const status = useAuthStore((state) => state.status);
  return useQuery<unknown>({
    enabled: status === 'authenticated',
    queryKey: queryKeys.ticketStats,
    queryFn: () => callWithMobileRefresh(() => asPromise<unknown>(trpc.ticket.getStats.query())),
  });
}

export function useTicketById(ticketId?: string | null) {
  const status = useAuthStore((state) => state.status);
  return useQuery<TicketDetail>({
    enabled: status === 'authenticated' && Boolean(ticketId),
    queryKey: queryKeys.ticket(ticketId),
    queryFn: () => callWithMobileRefresh(() => asPromise<TicketDetail>(trpc.ticket.getById.query({ ticketId }))),
  });
}

export function useRecentActivity(limit = 5) {
  const status = useAuthStore((state) => state.status);
  return useQuery<unknown>({
    enabled: status === 'authenticated',
    queryKey: queryKeys.recentActivity,
    queryFn: () => callWithMobileRefresh(() => asPromise<unknown>(trpc.ticket.getRecentActivity.query({ limit }))),
  });
}

export function useNotifications(limit = 20) {
  const status = useAuthStore((state) => state.status);
  return useQuery<NotificationFeed>({
    enabled: status === 'authenticated',
    queryKey: queryKeys.notifications,
    queryFn: () => callWithMobileRefresh(() => asPromise<NotificationFeed>(trpc.ticket.getNotifications.query({ limit }))),
  });
}

export function useNotificationSummary() {
  const status = useAuthStore((state) => state.status);
  return useQuery<NotificationSummary>({
    enabled: status === 'authenticated',
    queryKey: queryKeys.notificationSummary,
    queryFn: () => callWithMobileRefresh(() => asPromise<NotificationSummary>(trpc.ticket.getNotificationSummary.query())),
  });
}

export function useSubscriptionCurrent() {
  const status = useAuthStore((state) => state.status);
  return useQuery<SubscriptionCurrent>({
    enabled: status === 'authenticated',
    queryKey: queryKeys.subscription,
    queryFn: () => callWithMobileRefresh(() => asPromise<SubscriptionCurrent>(trpc.subscription.getCurrent.query())),
  });
}

export function useSubscriptionUsage() {
  const status = useAuthStore((state) => state.status);
  return useQuery<SubscriptionUsage>({
    enabled: status === 'authenticated',
    queryKey: queryKeys.subscriptionUsage,
    queryFn: () => callWithMobileRefresh(() => asPromise<SubscriptionUsage>(trpc.subscription.getUsage.query())),
  });
}

export function usePlans() {
  const status = useAuthStore((state) => state.status);
  return useQuery<Plan[]>({
    enabled: status === 'authenticated',
    queryKey: queryKeys.plans,
    queryFn: () => callWithMobileRefresh(() => asPromise<Plan[]>(trpc.subscription.getPlans.query())),
  });
}

export function useBillingHistory(limit = 20) {
  const status = useAuthStore((state) => state.status);
  return useQuery<BillingHistory>({
    enabled: status === 'authenticated',
    queryKey: queryKeys.billing,
    queryFn: () => callWithMobileRefresh(() => asPromise<BillingHistory>(trpc.payment.getBillingHistory.query({ limit }))),
  });
}

export function useBuilderOptions(input?: Partial<BuildTicketInput>) {
  const status = useAuthStore((state) => state.status);
  return useQuery<BuilderOptions>({
    enabled: status === 'authenticated',
    queryKey: queryKeys.builderOptions(input),
    queryFn: () => callWithMobileRefresh(() => asPromise<BuilderOptions>(trpc.ticket.getBuilderOptions.query(input))),
  });
}

export function useTicketList(input: { cursor?: string; limit?: number; search?: string; status?: TicketResult }) {
  const status = useAuthStore((state) => state.status);
  return useQuery<TicketList>({
    enabled: status === 'authenticated',
    queryKey: queryKeys.ticketList(input),
    queryFn: () => callWithMobileRefresh(() => asPromise<TicketList>(trpc.ticket.list.query(input))),
  });
}

export function useActiveJobs() {
  const status = useAuthStore((state) => state.status);
  return useQuery<unknown[]>({
    enabled: status === 'authenticated',
    queryKey: queryKeys.activeJobs,
    queryFn: () => callWithMobileRefresh(() => asPromise<unknown[]>(trpc.ticket.getActiveJobs.query())),
    refetchInterval: (query) => {
      const jobs = query.state.data as unknown[] | undefined;
      return jobs?.length ? 5000 : false;
    },
  });
}

export function useJobStatus(jobId?: string | null) {
  const status = useAuthStore((state) => state.status);
  return useQuery<TicketJobState>({
    enabled: status === 'authenticated' && Boolean(jobId),
    queryKey: ['ticket', 'jobStatus', jobId] as const,
    queryFn: () => callWithMobileRefresh(() => asPromise<TicketJobState>(trpc.ticket.getJobStatus.query({ jobId }))),
    refetchInterval: (query) => {
      const job = query.state.data as { status?: string } | undefined;
      return job?.status === 'processing' ? 2500 : false;
    },
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation<MobileAuthSession, Error, { email: string; password: string }>({
    mutationFn: async (input: { email: string; password: string }) =>
      asPromise<MobileAuthSession>(
        trpc.auth.mobileLogin.mutate({
          ...input,
          ...(await getMobileDeviceInput()),
        }),
      ),
    onSuccess: async (session) => {
      await setSession(session);
      await queryClient.invalidateQueries();
    },
  });
}

export function useOAuthLoginMutation() {
  const queryClient = useQueryClient();
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation<MobileAuthSession, Error, MobileOAuthProvider>({
    mutationFn: (provider) =>
      provider === 'google' ? signInWithNativeGoogle() : signInWithMobileOAuth(provider),
    onSuccess: async (session) => {
      await setSession(session);
      await queryClient.invalidateQueries();
    },
  });
}

export function useSignupMutation() {
  const queryClient = useQueryClient();
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation<MobileAuthSession, Error, { email: string; name?: string; password: string; referralCode?: string }>({
    mutationFn: async (input: { email: string; name?: string; password: string; referralCode?: string }) =>
      asPromise<MobileAuthSession>(
        trpc.auth.mobileRegister.mutate({
          ...input,
          ...(await getMobileDeviceInput()),
        }),
      ),
    onSuccess: async (session) => {
      await setSession(session);
      await queryClient.invalidateQueries();
    },
  });
}

export function useForgotPasswordMutation() {
  return useMutation<ForgotPasswordResult, Error, { email: string }>({
    mutationFn: (input: { email: string }) => asPromise<ForgotPasswordResult>(trpc.auth.forgotPassword.mutate(input)),
  });
}

export function useResetPasswordMutation() {
  return useMutation<unknown, Error, { token: string; password: string }>({
    mutationFn: (input: { token: string; password: string }) => asPromise<unknown>(trpc.auth.resetPassword.mutate(input)),
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  const clearSession = useAuthStore((state) => state.clearSession);
  const resetNotificationState = useNotificationStore((state) => state.resetNotificationState);

  return useMutation<void, Error, void>({
    mutationFn: async () => {
      const { expoPushToken } = useNotificationStore.getState();
      if (expoPushToken) {
        await callWithMobileRefresh(() =>
          asPromise<unknown>(trpc.mobile.unregisterPushDevice.mutate({ expoPushToken })),
        ).catch(() => undefined);
      }

      const { accessToken, refreshToken } = useAuthStore.getState();
      if (accessToken || refreshToken) {
        await trpc.auth.mobileLogout.mutate({
          accessToken: accessToken ?? undefined,
          refreshToken: refreshToken ?? undefined,
        });
      }
    },
    onSettled: async () => {
      await clearSession();
      resetNotificationState();
      queryClient.clear();
    },
  });
}

export function useUpdatePreferencesMutation() {
  const queryClient = useQueryClient();
  return useMutation<UserProfile, Error, {
    darkMode?: boolean;
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    publicProfile?: boolean;
    twoFactorAuth?: boolean;
  }>({
    mutationFn: (input: {
      darkMode?: boolean;
      emailNotifications?: boolean;
      pushNotifications?: boolean;
      publicProfile?: boolean;
      twoFactorAuth?: boolean;
    }) => callWithMobileRefresh(() => asPromise<UserProfile>(trpc.user.updatePreferences.mutate(input))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.me });
    },
  });
}

export function useCreateTelegramTokenMutation() {
  const queryClient = useQueryClient();
  return useMutation<TelegramTokenResult, Error, void>({
    mutationFn: () => callWithMobileRefresh(() => asPromise<TelegramTokenResult>(trpc.user.createTelegramLinkToken.mutate())),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.me });
    },
  });
}

export function useCreateTelegramCommunityInviteMutation() {
  const queryClient = useQueryClient();
  return useMutation<TelegramCommunityInvite, Error, void>({
    mutationFn: () => callWithMobileRefresh(() => asPromise<TelegramCommunityInvite>(trpc.user.createTelegramCommunityInvite.mutate())),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.telegramCommunityStatus });
    },
  });
}

export function useRegisterPushDeviceMutation() {
  return useMutation<unknown, Error, { expoPushToken: string; deviceId?: string; deviceName?: string; platform: string }>({
    mutationFn: (input: { expoPushToken: string; deviceId?: string; deviceName?: string; platform: string }) =>
      callWithMobileRefresh(() => asPromise<unknown>(trpc.mobile.registerPushDevice.mutate(input))),
  });
}

export function useFixTicketMutation() {
  const queryClient = useQueryClient();
  return useMutation<FixTicketResult, Error, { bookingCode: string; platform?: string; riskTolerance: 'conservative' | 'moderate' | 'aggressive' }>({
    mutationFn: (input: { bookingCode: string; platform?: string; riskTolerance: 'conservative' | 'moderate' | 'aggressive' }) =>
      callWithMobileRefresh(() => asPromise<FixTicketResult>(trpc.ticket.fixTicket.mutate(input))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.activeJobs });
    },
  });
}

export function useBuildTicketMutation() {
  const queryClient = useQueryClient();
  return useMutation<BuildTicketResult, Error, BuildTicketInput>({
    mutationFn: (input: BuildTicketInput) =>
      callWithMobileRefresh(() => asPromise<BuildTicketResult>(trpc.ticket.buildTicket.mutate(input))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.activeJobs });
    },
  });
}

export function useConvertBookingCodeMutation() {
  return useMutation<ConvertCodeResult, Error, { code: string; fromPlatform: SupportedPlatform; toPlatform: SupportedPlatform }>({
    mutationFn: (input: { code: string; fromPlatform: SupportedPlatform; toPlatform: SupportedPlatform }) =>
      callWithMobileRefresh(() => asPromise<ConvertCodeResult>(trpc.ticket.convertBookingCode.mutate(input))),
  });
}

export function useGenerateBookingCodeMutation() {
  const queryClient = useQueryClient();
  return useMutation<GenerateBookingCodeResult, Error, { platform: SupportedPlatform; ticketId: string }>({
    mutationFn: (input: { platform: SupportedPlatform; ticketId: string }) =>
      callWithMobileRefresh(() => asPromise<GenerateBookingCodeResult>(trpc.ticket.generateBookingCode.mutate(input))),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ticket(variables.ticketId) });
      queryClient.invalidateQueries({ queryKey: ['ticket', 'list'] });
    },
  });
}

export function useCreateShareLinkMutation() {
  return useMutation<ShareLinkResult, Error, { ticketId: string }>({
    mutationFn: (input: { ticketId: string }) =>
      callWithMobileRefresh(() => asPromise<ShareLinkResult>(trpc.ticket.createShareLink.mutate(input))),
  });
}

export function useSetMatchResultMutation(ticketId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, { matchId: string; result: TicketMatchResult }>({
    mutationFn: (input: { matchId: string; result: TicketMatchResult }) =>
      callWithMobileRefresh(() => asPromise<unknown>(trpc.ticket.setMatchResult.mutate(input))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ticket(ticketId) });
      queryClient.invalidateQueries({ queryKey: ['ticket', 'list'] });
    },
  });
}

export function useCreateCheckoutMutation() {
  return useMutation<CheckoutResult, Error, { durationDays: 1 | 7; returnUrl?: string }>({
    mutationFn: (input: { durationDays: 1 | 7; returnUrl?: string }) =>
      callWithMobileRefresh(() =>
        asPromise<CheckoutResult>(
          trpc.subscription.createCheckout.mutate({
            tier: 'premium',
            ...input,
          }),
        ),
      ),
  });
}

export function useDownloadReceiptMutation() {
  return useMutation<DownloadReceiptResult, Error, { paymentId: string }>({
    mutationFn: (input: { paymentId: string }) =>
      callWithMobileRefresh(() => asPromise<DownloadReceiptResult>(trpc.payment.downloadReceipt.mutate(input))),
  });
}

export function useVerifyReturnedPaymentMutation() {
  const queryClient = useQueryClient();
  return useMutation<VerifyPaymentResult, Error, { reference: string }>({
    mutationFn: (input: { reference: string }) =>
      callWithMobileRefresh(() => asPromise<VerifyPaymentResult>(trpc.payment.verifyReturnedPayment.mutate(input))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subscription });
      queryClient.invalidateQueries({ queryKey: queryKeys.billing });
    },
  });
}

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, string>({
    mutationFn: (activityId: string) =>
      callWithMobileRefresh(() => asPromise<unknown>(trpc.ticket.markNotificationRead.mutate({ activityId }))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
      queryClient.invalidateQueries({ queryKey: queryKeys.notificationSummary });
    },
  });
}

export function useMarkAllNotificationsReadMutation() {
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, void>({
    mutationFn: () => callWithMobileRefresh(() => asPromise<unknown>(trpc.ticket.markAllNotificationsRead.mutate())),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
      queryClient.invalidateQueries({ queryKey: queryKeys.notificationSummary });
    },
  });
}

export function useMyReferral() {
  const status = useAuthStore((state) => state.status);
  return useQuery<ReferralReport | null>({
    enabled: status === 'authenticated',
    queryKey: queryKeys.myReferral,
    queryFn: () => callWithMobileRefresh(() => asPromise<ReferralReport | null>(trpc.referral.myReferral.query())),
  });
}

export function useReferralLookup(code?: string) {
  const status = useAuthStore((state) => state.status);
  return useQuery<ReferralReport | null>({
    enabled: status === 'authenticated' && Boolean(code?.trim()),
    queryKey: queryKeys.referralLookup(code),
    queryFn: () => callWithMobileRefresh(() => asPromise<ReferralReport | null>(trpc.referral.lookupByCode.query({ code }))),
  });
}

export function useGenerateReferralMutation() {
  const queryClient = useQueryClient();
  return useMutation<ReferralReport | null, Error, void>({
    mutationFn: () => callWithMobileRefresh(() => asPromise<ReferralReport | null>(trpc.referral.generate.mutate())),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myReferral });
    },
  });
}

export { authed };
