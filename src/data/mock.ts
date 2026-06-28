export type Readiness = 'Verified' | 'Partial' | 'Limited';

export type MatchStatData = {
  id: string;
  label: string;
  home: number;
  away: number;
  suffix?: string;
};

export type LineupItemData = {
  role: string;
  home: string;
  away: string;
};

export type MatchCardData = {
  id: string;
  home: string;
  away: string;
  league: string;
  leagueId: string;
  sportId: string;
  venue: string;
  date: string;
  dateId: string;
  time: string;
  confidence: number;
  readiness: Readiness;
  signal: string;
  trend: string;
  status: 'Live' | 'Today' | 'Tomorrow' | 'Upcoming';
  homeScore?: number;
  awayScore?: number;
  clock?: string;
  period?: string;
  stats: MatchStatData[];
  lineup: LineupItemData[];
  summary: string[];
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
  { id: 'today', day: 'Today', date: '30 May' },
  { id: 'sat', day: 'Sat', date: '31 May' },
  { id: 'sun', day: 'Sun', date: '1 Jun' },
  { id: 'mon', day: 'Mon', date: '2 Jun' },
];

export const leagues = [
  { id: 'all', label: 'All' },
  { id: 'epl', label: 'Premier League' },
  { id: 'ucl', label: 'UCL' },
  { id: 'serie-a', label: 'Serie A' },
  { id: 'nba', label: 'NBA' },
];

export const sports = [
  { id: 'football', label: 'Football', short: 'FB' },
  { id: 'basketball', label: 'Basketball', short: 'BB' },
  { id: 'tennis', label: 'Tennis', short: 'TN' },
  { id: 'nfl', label: 'NFL', short: 'NF' },
];

export const wallet = {
  balance: '700k',
};

const coreStats: MatchStatData[] = [
  { id: 'shots-on-goal', away: 6, home: 2, label: 'Shots on goal' },
  { id: 'shots', away: 15, home: 4, label: 'Shots' },
  { id: 'possession', away: 74, home: 26, label: 'Possession', suffix: '%' },
  { id: 'cards', away: 2, home: 3, label: 'Yellow cards' },
  { id: 'corners', away: 2, home: 0, label: 'Corner kicks' },
  { id: 'crosses', away: 23, home: 10, label: 'Crosses' },
  { id: 'saves', away: 2, home: 3, label: 'Goalkeeper saves' },
];

const defaultLineup: LineupItemData[] = [
  { away: 'High press 4-3-3', home: 'Compact 4-2-3-1', role: 'Shape' },
  { away: 'Wide overloads', home: 'Mid-block recovery', role: 'Primary route' },
  { away: 'Right flank', home: 'Central counters', role: 'Pressure point' },
];

export const matches: MatchCardData[] = [
  {
    id: 'new-che',
    away: 'Chelsea',
    awayScore: 3,
    clock: "83'",
    confidence: 86,
    date: '30 May',
    dateId: 'today',
    home: 'Newcastle',
    homeScore: 0,
    league: 'Premier League',
    leagueId: 'epl',
    lineup: defaultLineup,
    period: '2nd half',
    readiness: 'Verified',
    signal: 'Away control is backed by shot volume and sustained possession.',
    stats: coreStats,
    status: 'Live',
    sportId: 'football',
    summary: [
      'Chelsea are controlling territory and chance quality late in the match.',
      'Newcastle need direct transitions, but their shot profile is thin.',
      'Card pressure is rising for the home side and limits aggressive pressing.',
    ],
    time: 'Live now',
    trend: 'Away pressure',
    venue: "St James' Park",
  },
  {
    id: 'mci-cry',
    away: 'Palace',
    confidence: 79,
    date: '30 May',
    dateId: 'today',
    home: 'Man City',
    league: 'Premier League',
    leagueId: 'epl',
    lineup: defaultLineup,
    readiness: 'Verified',
    signal: 'City project stronger shot control, Palace counter threat remains live.',
    stats: [
      { id: 'shots', away: 8, home: 17, label: 'Projected shots' },
      { id: 'xg', away: 0.9, home: 2.1, label: 'xG trend' },
      { id: 'corners', away: 3, home: 7, label: 'Corner trend' },
    ],
    status: 'Today',
    sportId: 'football',
    summary: ['City should own the ball, but Palace pace keeps transition risk above baseline.'],
    time: '06:30',
    trend: 'Home control',
    venue: 'Etihad Stadium',
  },
  {
    id: 'bur-bre',
    away: 'Brentford',
    confidence: 68,
    date: '30 May',
    dateId: 'today',
    home: 'Burnley',
    league: 'Premier League',
    leagueId: 'epl',
    lineup: defaultLineup,
    readiness: 'Partial',
    signal: 'Both teams trend toward set-piece volume and uneven defensive coverage.',
    stats: [
      { id: 'shots', away: 11, home: 9, label: 'Projected shots' },
      { id: 'cards', away: 2, home: 3, label: 'Card trend' },
      { id: 'corners', away: 5, home: 4, label: 'Corner trend' },
    ],
    status: 'Today',
    sportId: 'football',
    summary: ['The model likes set-piece activity more than a clean match winner angle.'],
    time: '06:30',
    trend: 'Set-piece edge',
    venue: 'Turf Moor',
  },
  {
    id: 'lei-ars',
    away: 'Arsenal',
    confidence: 82,
    date: '30 May',
    dateId: 'today',
    home: 'Leicester',
    league: 'Premier League',
    leagueId: 'epl',
    lineup: defaultLineup,
    readiness: 'Verified',
    signal: 'Arsenal have the cleaner possession profile and stronger defensive floor.',
    stats: [
      { id: 'shots', away: 16, home: 7, label: 'Projected shots' },
      { id: 'possession', away: 63, home: 37, label: 'Possession', suffix: '%' },
      { id: 'saves', away: 2, home: 5, label: 'Keeper saves' },
    ],
    status: 'Today',
    sportId: 'football',
    summary: ['Arsenal rate well across possession, shot volume, and defensive recoveries.'],
    time: '08:30',
    trend: 'Away advantage',
    venue: 'King Power Stadium',
  },
  {
    id: 'tot-mun',
    away: 'Man United',
    confidence: 72,
    date: '30 May',
    dateId: 'today',
    home: 'Spurs',
    league: 'Premier League',
    leagueId: 'epl',
    lineup: defaultLineup,
    readiness: 'Limited',
    signal: 'Volatility is high; both sides expose space after turnovers.',
    stats: [
      { id: 'shots', away: 13, home: 14, label: 'Projected shots' },
      { id: 'cards', away: 3, home: 2, label: 'Card trend' },
      { id: 'xg', away: 1.5, home: 1.6, label: 'xG trend' },
    ],
    status: 'Today',
    sportId: 'football',
    summary: ['This is a higher variance matchup, better suited to evidence review than a bold lean.'],
    time: '08:30',
    trend: 'High variance',
    venue: 'Tottenham Hotspur Stadium',
  },
  {
    id: 'psg-bay',
    away: 'Bayern',
    confidence: 76,
    date: '30 May',
    dateId: 'today',
    home: 'PSG',
    league: 'UCL',
    leagueId: 'ucl',
    lineup: defaultLineup,
    readiness: 'Verified',
    signal: 'Both sides carry elite shot volume, with transition defense deciding the edge.',
    sportId: 'football',
    stats: [
      { id: 'shots', away: 14, home: 15, label: 'Projected shots' },
      { id: 'xg', away: 1.8, home: 1.9, label: 'xG trend' },
      { id: 'corners', away: 5, home: 6, label: 'Corner trend' },
    ],
    status: 'Today',
    summary: ['The profile is strong but volatile because both teams attack quickly after regains.'],
    time: '20:00',
    trend: 'Transition risk',
    venue: 'Parc des Princes',
  },
  {
    id: 'int-mil',
    away: 'Milan',
    confidence: 74,
    date: '1 Jun',
    dateId: 'sun',
    home: 'Inter',
    league: 'Serie A',
    leagueId: 'serie-a',
    lineup: defaultLineup,
    readiness: 'Partial',
    signal: 'Inter rate cleaner on territory, while Milan create enough wide pressure to keep variance live.',
    sportId: 'football',
    stats: [
      { id: 'shots', away: 10, home: 13, label: 'Projected shots' },
      { id: 'possession', away: 47, home: 53, label: 'Possession', suffix: '%' },
      { id: 'cards', away: 3, home: 2, label: 'Card trend' },
    ],
    status: 'Upcoming',
    summary: ['The matchup leans toward control rather than an aggressive winner angle.'],
    time: '19:45',
    trend: 'Home control',
    venue: 'San Siro',
  },
  {
    id: 'lal-bos',
    away: 'Celtics',
    confidence: 70,
    date: '31 May',
    dateId: 'sat',
    home: 'Lakers',
    league: 'NBA',
    leagueId: 'nba',
    lineup: [
      { away: 'Five-out spacing', home: 'Paint pressure', role: 'Shape' },
      { away: 'Corner threes', home: 'Rim attacks', role: 'Primary route' },
      { away: 'Bench shooting', home: 'Defensive glass', role: 'Pressure point' },
    ],
    readiness: 'Limited',
    signal: 'Boston spacing lifts the baseline, but pace and rotation news keep confidence capped.',
    sportId: 'basketball',
    stats: [
      { id: 'pace', away: 101, home: 99, label: 'Pace rating' },
      { id: 'threes', away: 39, home: 34, label: '3PT attempt trend' },
      { id: 'rebounds', away: 42, home: 45, label: 'Rebound trend' },
    ],
    status: 'Tomorrow',
    summary: ['The evidence favors spacing and depth, but injury confirmation still matters.'],
    time: '22:00',
    trend: 'Spacing edge',
    venue: 'Crypto.com Arena',
  },
];

export const liveMatch = matches[0];

export function getMatchById(id?: string) {
  return matches.find((match) => match.id === id);
}

export function getLeagueLabel(id: string) {
  return leagues.find((league) => league.id === id)?.label ?? 'All leagues';
}

export function getSportLabel(id: string) {
  return sports.find((sport) => sport.id === id)?.label ?? 'Sport';
}

export function filterMatches({
  dateId,
  excludeIds = [],
  leagueId = 'all',
  sportId,
}: {
  dateId?: string;
  excludeIds?: string[];
  leagueId?: string;
  sportId?: string;
} = {}) {
  const excluded = new Set(excludeIds);
  return matches.filter((match) => {
    if (excluded.has(match.id)) return false;
    if (sportId && sportId !== 'all' && match.sportId !== sportId) return false;
    if (leagueId !== 'all' && match.leagueId !== leagueId) return false;
    if (dateId && dateId !== 'all' && match.dateId !== dateId) return false;
    return true;
  });
}

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
