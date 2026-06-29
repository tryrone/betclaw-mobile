import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { callWithMobileRefresh, trpc } from '@/lib/api/client';
import type {
  BillingHistory,
  CheckoutResult,
  FixtureInsight,
  FixTicketResult,
  ForgotPasswordResult,
  HomeFeed,
  LeagueOption,
  MobileAuthSession,
  MobileOAuthProvider,
  NotificationFeed,
  NotificationSummary,
  Plan,
  SubscriptionCurrent,
  TelegramTokenResult,
  TicketDetail,
  TicketJobState,
  UserProfile,
  VerifyPaymentResult,
} from '@/lib/api/types';
import { signInWithMobileOAuth } from '@/lib/api/oauth';
import { getMobileDeviceInput } from '@/lib/device';
import { useAuthStore } from '@/store/auth-store';
import { useNotificationStore } from '@/store/notification-store';

const authed = () => useAuthStore.getState().status === 'authenticated';
const asPromise = <T>(value: Promise<unknown>) => value as Promise<T>;

export const queryKeys = {
  activeJobs: ['ticket', 'activeJobs'] as const,
  billing: ['payment', 'billing'] as const,
  fixtureInsight: (fixtureId?: string) => ['matchday', 'fixtureInsight', fixtureId] as const,
  homeFeed: (input?: unknown) => ['matchday', 'homeFeed', input] as const,
  leagues: (input?: unknown) => ['matchday', 'leagues', input] as const,
  me: ['user', 'me'] as const,
  notifications: ['ticket', 'notifications'] as const,
  notificationSummary: ['ticket', 'notificationSummary'] as const,
  plans: ['subscription', 'plans'] as const,
  recentActivity: ['ticket', 'recentActivity'] as const,
  subscription: ['subscription', 'current'] as const,
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

export function useHomeFeed(input?: { date?: string; leagueKey?: string; limit?: number; windowDays?: 1 | 3 }) {
  const status = useAuthStore((state) => state.status);
  return useQuery<HomeFeed>({
    enabled: status === 'authenticated',
    queryKey: queryKeys.homeFeed(input),
    queryFn: () => callWithMobileRefresh(() => asPromise<HomeFeed>(trpc.matchday.getHomeFeed.query(input ?? { limit: 24 }))),
  });
}

export function useLeagues(input?: { dateRange?: 'today' | 'tomorrow' | 'week'; windowDays?: 1 | 3 }) {
  const status = useAuthStore((state) => state.status);
  return useQuery<LeagueOption[]>({
    enabled: status === 'authenticated',
    queryKey: queryKeys.leagues(input),
    queryFn: () => callWithMobileRefresh(() => asPromise<LeagueOption[]>(trpc.matchday.getLeagues.query(input ?? { dateRange: 'today' }))),
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
    mutationFn: (provider) => signInWithMobileOAuth(provider),
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

export { authed };
