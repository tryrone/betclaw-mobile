import type { MobileUser } from '@/store/auth-store';

export type MobileAuthSession = {
  accessToken: string;
  expiresAt: string | Date;
  refreshExpiresAt: string | Date;
  refreshToken: string;
  user: MobileUser;
};

export type MobileOAuthProvider = 'google' | 'github';

export type UserProfile = MobileUser & {
  accessTier?: string;
  darkMode?: boolean;
  emailNotifications?: boolean;
  minimumActiveResearchTokens?: number;
  publicProfile?: boolean;
  pushNotifications?: boolean;
  researchTokensRemaining?: number;
  telegramLink?: { chatId?: string | null; username?: string | null } | null;
  twoFactorAuth?: boolean;
};

export type HomeFeed = {
  leagues?: unknown[];
};

export type LeagueOption = {
  country?: string | null;
  key: string;
  logoUrl?: string | null;
  matchCount?: number;
  name: string;
};

export type FixtureInsight = {
  averageStats?: unknown;
  apiFootballContext?: unknown;
  h2h?: unknown;
  recommendation?: {
    label?: string | null;
    summary?: string | null;
  } | null;
};

export type NotificationSummary = {
  unreadCount: number;
};

export type NotificationItem = {
  createdAt: string | Date;
  description?: string | null;
  id: string;
  readAt?: string | Date | null;
  title: string;
  type?: string;
};

export type NotificationFeed = {
  items: NotificationItem[];
  unreadCount: number;
};

export type SubscriptionCurrent = {
  accessTier?: string;
  isBelowMinimumTokenBalance?: boolean;
  minimumActiveResearchTokens?: number;
  researchTokensRemaining?: number;
};

export type PlanOption = {
  amountKobo?: number;
  durationDays: number;
  label?: string;
  researchTokens?: number;
};

export type Plan = {
  displayName?: string;
  id?: string;
  name: string;
  purchaseOptions?: PlanOption[];
};

export type BillingHistory = {
  items: {
    amount: number;
    createdAt: string | Date;
    currency?: string;
    description?: string | null;
    id: string;
    status: string;
  }[];
  nextCursor?: string | null;
};

export type TicketJobState =
  | { stage?: string; status: 'processing' }
  | { message: string; stage: 'error'; status: 'error' }
  | {
      fallbackStatus?: string;
      riskLevel?: string;
      stage: 'done';
      status: 'done';
      summary: string;
      ticketId: string;
    };

export type TicketDetail = {
  id: string;
  matches: {
    awayTeam: string;
    confidence?: number | null;
    homeTeam: string;
    id: string;
    market: string;
    reason?: string | null;
    selectionReason?: string | null;
    status: string;
  }[];
};

export type FixTicketResult = {
  jobId: string;
};

export type CheckoutResult = {
  originalReference?: string;
  providerReference?: string;
  reference: string;
  url: string;
};

export type VerifyPaymentResult = {
  amount?: number;
  currency?: string;
  durationDays?: number | null;
  reference: string;
  status: string;
  tier?: string | null;
};

export type ForgotPasswordResult = {
  message: string;
  success: boolean;
};

export type TelegramTokenResult = {
  command: string;
  expires: string | Date;
  hasVipAccess?: boolean;
  token: string;
};
