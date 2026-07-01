import type { MobileUser } from '@/store/auth-store';
import type { SupportedPlatform } from '@/lib/bookmaker-platforms';

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
  date?: string;
  leagues?: LeagueGroup[];
  nextCursor?: string | null;
  totalMatches?: number;
};

export type LeagueOption = {
  country?: string | null;
  key: string;
  logoUrl?: string | null;
  matchCount?: number;
  name: string;
};

export type PredictionView = {
  confidence?: number | null;
  edgeScore?: number | null;
  fallbackType?: 'predictionPick' | 'apiFootball' | 'marketFavorite' | string;
  kind?: 'prediction' | 'lean' | string;
  label?: string | null;
  marketLabel?: string | null;
  odds?: number | null;
  source?: 'betclaw' | 'apiFootball' | 'marketLean' | string;
  sourceLabel?: string | null;
  summary?: string | null;
};

export type MatchDataSnapshotPayload = {
  available?: {
    lineups?: boolean;
    odds?: boolean;
    players?: boolean;
    prediction?: boolean;
    stats?: boolean;
  };
  elapsedMinute?: number | null;
  phase?: 'prematch' | 'live' | 'finished' | string;
  readiness?: {
    label?: string;
    score?: number | null;
    status?: string;
  };
  score?: string | null;
  status?: string;
  updatedAt?: string | Date | null;
};

export type FeedMatch = {
  awayTeam: TeamReference;
  bestMarket?: {
    confidence?: number | null;
    edgeScore?: number | null;
    label?: string | null;
    odds?: number | null;
    summary?: string | null;
  } | null;
  dataReadiness?: {
    score?: number | null;
    status?: string | null;
  } | null;
  dataSnapshot?: MatchDataSnapshotPayload | null;
  elapsedMinute?: number | null;
  fixtureId: string;
  homeTeam: TeamReference;
  kickoffTime: string | Date;
  leagueKey?: string;
  predictionView?: PredictionView | null;
  score?: string | null;
  sourceKind?: 'canonical' | 'bookmakerFallback' | string;
  status: string;
};

export type LeagueGroup = LeagueOption & {
  matches?: FeedMatch[];
};

export type DailyTicketBookmakerPlatform = 'API_FOOTBALL' | 'SPORTYBET';

export type DailyTicketLeg = {
  awayTeam: string;
  bookmakerPlatform: DailyTicketBookmakerPlatform;
  confidence: number;
  edgeScore?: number | null;
  edgeSummary?: string | null;
  eventId: string;
  expectedValue?: number | null;
  homeTeam: string;
  id: string;
  isVipPick: boolean;
  kickoffTime?: string | Date | null;
  league: string;
  marketId: string;
  modelSummary?: string | null;
  odds: number;
  selectionId: string;
  selectionLabel?: string | null;
  selectionTeam?: string | null;
  specifier?: string | null;
  verdict: string;
};

export type DailyTicketData = {
  avgConfidence: number | null;
  bookmakerPlatform: DailyTicketBookmakerPlatform;
  bookingCode?: string | null;
  date: string;
  emptyReason?: string | null;
  generatedAt: string | Date;
  idealMaxOdds?: number;
  idealMinOdds?: number;
  legCount: number;
  legs: DailyTicketLeg[];
  sport: string;
  targetOdds: number;
  ticketId?: string | null;
  totalOdds: number | null;
};

export type TeamReference = {
  id?: string | number | null;
  logoUrl?: string | null;
  name: string;
};

export type LeagueReference = {
  country?: string | null;
  id?: string | number | null;
  key?: string | null;
  logoUrl?: string | null;
  name: string;
};

export type MatchStatRow = {
  awayDisplay?: string | null;
  awayValue?: number | null;
  homeDisplay?: string | null;
  homeValue?: number | null;
  key: string;
  label: string;
  suffix?: string | null;
};

export type MatchPlayersContext = {
  fixturePlayerStatsStatus?: string | null;
  hasFixturePlayerStats?: boolean;
  hasLineups?: boolean;
  hasSeasonStats?: boolean;
  keyPlayers?: MatchPlayerSummary[];
  lineupStatus?: string | null;
  lineupUnavailableCount?: number;
  lineups?: {
    away?: MatchLineupSide;
    home?: MatchLineupSide;
  };
  seasonStatsStatus?: string | null;
};

export type MatchLineupSide = {
  confirmed?: boolean;
  formation?: string | null;
  players?: MatchPlayerSummary[];
  teamName: string;
  unavailableCount?: number;
};

export type MatchPlayerSummary = {
  name: string;
  number?: number | null;
  photoUrl?: string | null;
  position?: string | null;
  role?: string | null;
  statLine?: string | null;
  team?: 'home' | 'away' | string | null;
};

export type FixtureInsight = {
  averageStats?: {
    away?: Record<string, number | null | undefined>;
    home?: Record<string, number | null | undefined>;
    referee?: Record<string, number | null | undefined>;
  } | null;
  awayTeam?: TeamReference | null;
  apiFootballContext?: {
    predictionSummary?: string | null;
    standingsSummary?: string | null;
    prediction?: {
      awayPercent?: number | null;
      drawPercent?: number | null;
      homePercent?: number | null;
    } | null;
  } | null;
  dataReadiness?: {
    missingFields?: string[];
    score?: number | null;
    status?: string | null;
  } | null;
  elapsedMinute?: number | null;
  evidence?: {
    evidenceType?: string | null;
    snippet?: string | null;
    title?: string | null;
    url?: string | null;
  }[];
  fixtureId?: string;
  h2h?: {
    awayWins?: number;
    draws?: number;
    homeWins?: number;
    meetings?: {
      awayScore?: number | null;
      awayTeam?: string | null;
      date?: string | Date | null;
      homeScore?: number | null;
      homeTeam?: string | null;
      winnerForCurrentFixture?: 'home' | 'away' | 'draw' | null;
    }[];
    sampleSize?: number;
    summary?: string | null;
  } | null;
  homeTeam?: TeamReference | null;
  kickoffTime?: string | Date | null;
  league?: LeagueReference | null;
  matchStats?: {
    fetchedAt?: string | Date | null;
    rows?: MatchStatRow[];
    status?: 'available' | 'pending' | 'unavailable' | string;
  } | null;
  players?: MatchPlayersContext | null;
  providerLinks?: { fetchedAt?: string | Date | null; provider?: string | null }[];
  recentMatches?: {
    away?: RecentMatchTeam | null;
    home?: RecentMatchTeam | null;
  } | null;
  recommendation?: {
    label?: string | null;
    summary?: string | null;
  } | null;
  round?: string | null;
  score?: string | null;
  sourceCoverage?: Record<string, unknown> | null;
  sourceStatus?: string | null;
  standings?: {
    away?: StandingsRow[];
    home?: StandingsRow[];
  } | null;
  status?: string | null;
  venue?: string | null;
};

export type RecentMatchTeam = {
  matches?: {
    awayScore?: number | null;
    awayTeam?: string | null;
    date?: string | Date | null;
    homeScore?: number | null;
    homeTeam?: string | null;
    result?: string | null;
  }[];
  summary?: string | null;
};

export type StandingsRow = {
  all?: { draw?: number | null; lose?: number | null; played?: number | null; win?: number | null };
  description?: string | null;
  form?: string | null;
  logoUrl?: string | null;
  points?: number | null;
  played?: number | null;
  rank?: number | null;
  teamName?: string | null;
  team?: { id?: number | null; name?: string | null };
};

export type TelegramCommunityStatus = {
  accessPolicy?: 'ALL_USERS' | string;
  communityName: string;
  configured: boolean;
  enabled: boolean;
};

export type TelegramCommunityInvite = {
  communityName: string;
  expiresAt: string | Date;
  inviteLink: string;
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
  isPremiumExhausted?: boolean;
  isBelowMinimumTokenBalance?: boolean;
  minimumActiveResearchTokens?: number;
  researchTokensRemaining?: number;
};

export type SubscriptionUsage = {
  accessDurationDays?: number | null;
  accessTier?: string;
  creditsRemaining?: number;
  creditsUsed?: number;
  creditsPerMonth?: number;
  expiresAt?: string | Date | null;
  isBelowMinimumTokenBalance?: boolean;
  isPremiumExhausted?: boolean;
  minimumActiveResearchTokens?: number;
  percentUsed?: number;
  premiumPreviewRemaining?: number;
  requestsRemaining?: number;
  requestsUsed?: number;
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
    providerReference?: string | null;
    receiptUrl?: string | null;
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
  avgConfidence?: number | null;
  bookingCode?: string | null;
  createdAt?: string | Date;
  id: string;
  matches: {
    awayTeam: string;
    citations?: { snippet?: string | null; title?: string | null; url: string }[] | null;
    confidence?: number | null;
    confidenceReason?: string | null;
    dataReadiness?: { missingFields?: string[]; score?: number; status?: string } | null;
    fixtureId?: string | null;
    h2hSummary?: string | null;
    homeTeam: string;
    id: string;
    keyFactors?: string | null;
    matchResult?: TicketMatchResult;
    market: string;
    odds?: number | null;
    platformEventId?: string | null;
    reason?: string | null;
    selectionReason?: string | null;
    selectionLabel?: string | null;
    selectionTeam?: string | null;
    status: string;
  }[];
  optimizedOdds?: number | null;
  originalCode?: string | null;
  originalOdds?: number | null;
  result?: TicketResult;
  shareToken?: string | null;
};

export type TicketResult = 'WON' | 'LOST' | 'PENDING';
export type TicketMatchResult = 'WON' | 'LOST' | 'VOID' | 'PENDING';

export type TicketList = {
  items: TicketDetail[];
  nextCursor?: string | null;
};

export type FixTicketResult = {
  jobId: string;
};

export type BuildTicketInput = {
  date?: string;
  fixtureWindowDays?: 1 | 7 | 30;
  gameCount?: number;
  leagueKeys?: string[];
  marketPresetIds?: string[];
  notes?: string;
  oddsProfile?: 'SAFE' | 'BALANCED' | 'VALUE';
  prompt?: string;
  targetTotalOdds?: number;
  timeWindow?: 'all_day' | 'early' | 'afternoon' | 'late';
  useRecommendedLeagues?: boolean;
};

export type BuilderOptions = {
  defaults?: Partial<BuildTicketInput>;
  leagues: {
    country?: string | null;
    fixtureCount?: number;
    key: string;
    league?: string;
    name?: string;
    recommended?: boolean;
  }[];
  marketPresets: {
    description?: string;
    fixtureCount?: number;
    id: string;
    label: string;
  }[];
  recommendedLeagueKeys?: string[];
};

export type BuildTicketResult = {
  jobId: string;
};

export type ConvertCodeResult = {
  convertedCode?: string | null;
  destinationPlatform?: string;
  error?: string;
  sourcePlatform?: string;
  success: boolean;
};

export type GenerateBookingCodeResult = {
  bookingCode: string | null;
  canRegenerate?: boolean;
  error?: string;
  platform: SupportedPlatform;
  previewUrl?: string;
  regenerationError?: string;
  shareSource?: string;
  success: boolean;
};

export type ShareLinkResult = {
  previewUrl: string;
};

export type DownloadReceiptResult = {
  receiptUrl?: string | null;
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

export type ReferralReport = {
  commissionRate: number;
  partner: {
    code: string;
    isActive?: boolean;
    name: string;
  };
  referrals: {
    earnings: number;
    firstPaidAt?: string | Date | null;
    firstPaymentRevenue?: number;
    id: string;
    signedUpAt: string | Date;
    status: 'qualified' | 'pending';
    user: { email: string; name: string };
  }[];
  stats: {
    earnings: number;
    firstPaymentRevenue: number;
    pendingSignups: number;
    qualifiedSignups: number;
    totalSignups: number;
  };
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
