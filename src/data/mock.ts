export type MatchOdds = {
  home: number;
  draw: number;
  away: number;
};

export type MatchCardData = {
  id: string;
  home: string;
  away: string;
  league: string;
  time: string;
  pick: string;
  confidence: number;
  edge: string;
  readiness: 'Verified' | 'Partial' | 'Limited';
  odds: MatchOdds;
  recommended: keyof MatchOdds;
};

export type LiveMatchData = {
  id: string;
  league: string;
  stage: string;
  home: string;
  away: string;
  homeScore: number;
  awayScore: number;
  clock: string;
  period: string;
  odds: MatchOdds;
};

export type TicketRowData = {
  id: string;
  teams: string;
  market: string;
  confidence: number;
  status: 'Keep' | 'Remove';
  reason: string;
};

export type TokenPackData = {
  id: string;
  label: string;
  price: string;
  tokens: string;
  featured?: boolean;
};

export type BillingItemData = {
  id: string;
  label: string;
  date: string;
  amount: string;
  status: 'Paid' | 'Pending';
};

export const dateChips = [
  { id: 'mon', day: 'Mon', date: '28 May' },
  { id: 'tue', day: 'Tue', date: '29 May' },
  { id: 'today', day: 'Today', date: '30 May' },
  { id: 'thu', day: 'Thu', date: '31 May' },
  { id: 'fri', day: 'Fri', date: '1 Jun' },
];

export const leagues = ['All', 'EPL', 'Serie A', 'UCL'];

export const sports = [
  { emoji: '⚽', id: 'football', label: 'Football' },
  { emoji: '🏀', id: 'basketball', label: 'Basketball' },
  { emoji: '🎾', id: 'tennis', label: 'Tennis' },
  { emoji: '🏐', id: 'volleyball', label: 'Volleyball' },
  { emoji: '🏈', id: 'nfl', label: 'NFL' },
];

export const wallet = {
  balance: '₦ 24,300',
};

export const liveMatch: LiveMatchData = {
  away: 'Chelsea',
  awayScore: 2,
  clock: '32:29',
  home: 'Barcelona',
  homeScore: 0,
  id: 'bar-che',
  league: 'UEFA Champions League',
  odds: { away: 1.24, draw: 4.2, home: 3.74 },
  period: '1st half',
  stage: 'Group A',
};

export const matches: MatchCardData[] = [
  {
    id: 'ars-che',
    away: 'Chelsea',
    confidence: 74,
    edge: '+8.7',
    home: 'Arsenal',
    league: 'Premier League',
    odds: { away: 4.1, draw: 3.6, home: 1.92 },
    pick: 'Home win or draw',
    readiness: 'Verified',
    recommended: 'home',
    time: '19:30',
  },
  {
    id: 'dor-lev',
    away: 'Leverkusen',
    confidence: 68,
    edge: '+5.1',
    home: 'Dortmund',
    league: 'Bundesliga',
    odds: { away: 3.74, draw: 4.2, home: 1.84 },
    pick: 'Over 1.5 goals',
    readiness: 'Partial',
    recommended: 'home',
    time: '20:00',
  },
  {
    id: 'mil-int',
    away: 'Inter',
    confidence: 71,
    edge: '+7.4',
    home: 'Milan',
    league: 'Serie A',
    odds: { away: 2.95, draw: 3.1, home: 2.45 },
    pick: 'Both teams score',
    readiness: 'Verified',
    recommended: 'draw',
    time: '20:45',
  },
];

export const ticketRows: TicketRowData[] = [
  {
    id: 'ticket-1',
    confidence: 78,
    market: 'Over 1.5 goals',
    reason: 'Both sides trend high shot volume across recent fixtures.',
    status: 'Keep',
    teams: 'Arsenal vs Chelsea',
  },
  {
    id: 'ticket-2',
    confidence: 63,
    market: 'Home double chance',
    reason: 'Home form is steady and avoids the riskier straight win market.',
    status: 'Keep',
    teams: 'Milan vs Inter',
  },
  {
    id: 'ticket-3',
    confidence: 41,
    market: 'Away win',
    reason: 'Away win relies on weak lineup assumptions and thin source coverage.',
    status: 'Remove',
    teams: 'Dortmund vs Leverkusen',
  },
];

export const tokenPacks: TokenPackData[] = [
  { id: 'daily', label: 'Daily', price: 'NGN 7,000', tokens: '700k' },
  { id: 'weekly', featured: true, label: 'Weekly', price: 'NGN 25,000', tokens: '3m' },
];

export const billingHistory: BillingItemData[] = [
  { id: 'bill-1', amount: 'NGN 25,000', date: 'Today', label: 'Weekly Token Pack', status: 'Paid' },
  { id: 'bill-2', amount: 'NGN 7,000', date: '26 May', label: 'Daily Token Pack', status: 'Paid' },
];
