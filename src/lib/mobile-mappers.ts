import type { MatchCardData, MatchStatData, Readiness } from '@/data/mock';

function asDate(value: unknown) {
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function formatDate(value: unknown) {
  return asDate(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function formatTime(value: unknown) {
  return asDate(value).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function dateId(value: unknown) {
  const date = asDate(value);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return 'today';
  if (date.toDateString() === tomorrow.toDateString()) return 'tomorrow';
  return date.toISOString().slice(0, 10);
}

function readinessLabel(match: any): Readiness {
  const status =
    match?.dataSnapshot?.readiness?.label ??
    match?.dataSnapshot?.readiness?.status ??
    match?.dataReadiness?.status;

  if (typeof status === 'string' && /ready|verified/i.test(status)) return 'Verified';
  if (typeof status === 'string' && /partial/i.test(status)) return 'Partial';
  return 'Limited';
}

function scoreParts(score?: string | null) {
  if (!score) return {};
  const match = score.match(/(\d+)\D+(\d+)/);
  if (!match) return {};
  return {
    homeScore: Number(match[1]),
    awayScore: Number(match[2]),
  };
}

function confidence(match: any) {
  return Math.round(
    match?.predictionView?.confidence ??
      match?.bestMarket?.confidence ??
      match?.dataSnapshot?.readiness?.score ??
      0,
  );
}

export function flattenHomeFeed(feed: any): MatchCardData[] {
  const leagues = Array.isArray(feed?.leagues) ? feed.leagues : [];
  return leagues.flatMap((league: any) =>
    (Array.isArray(league.matches) ? league.matches : []).map((match: any) => {
      const phase = match?.dataSnapshot?.phase;
      const isLive = phase === 'live' || Boolean(match?.elapsedMinute);
      const scores = scoreParts(match?.score);
      const summary =
        match?.predictionView?.summary ??
        match?.bestMarket?.summary ??
        match?.dataSnapshot?.readiness?.label ??
        'Open the fixture for analysis context.';
      const kickoff = match?.kickoffTime;

      return {
        id: String(match?.fixtureId),
        away: match?.awayTeam?.name ?? 'Away',
        awayLogoUrl: match?.awayTeam?.logoUrl ?? null,
        clock: match?.elapsedMinute ? `${match.elapsedMinute}'` : undefined,
        confidence: confidence(match),
        date: formatDate(kickoff),
        dateId: dateId(kickoff),
        home: match?.homeTeam?.name ?? 'Home',
        homeLogoUrl: match?.homeTeam?.logoUrl ?? null,
        league: league?.name ?? match?.leagueKey ?? 'League',
        leagueId: match?.leagueKey ?? league?.key ?? 'all',
        leagueLogoUrl: league?.logoUrl ?? match?.league?.logoUrl ?? null,
        lineup: [
          { role: 'Readiness', home: readinessLabel(match), away: readinessLabel(match) },
          { role: 'Analysis', home: match?.predictionView?.label ?? 'Pending', away: match?.dataSnapshot?.readiness?.label ?? 'Coverage pending' },
        ],
        period: isLive ? 'Live' : undefined,
        readiness: readinessLabel(match),
        signal: summary,
        sportId: 'football',
        stats: [],
        status: isLive ? 'Live' : dateId(kickoff) === 'tomorrow' ? 'Tomorrow' : dateId(kickoff) === 'today' ? 'Today' : 'Upcoming',
        summary: [summary],
        time: isLive ? 'Live now' : formatTime(kickoff),
        trend: match?.predictionView?.label ?? match?.bestMarket?.label ?? 'Analysis pending',
        venue: match?.venue ?? match?.round ?? 'Fixture analysis',
        ...scores,
      } satisfies MatchCardData;
    }),
  );
}

export function mapInsightStats(insight: any): MatchStatData[] {
  const averageStats = insight?.averageStats;
  if (!averageStats?.home || !averageStats?.away) return [];

  const statRows: MatchStatData[] = [];
  const add = (id: string, label: string, home?: number | null, away?: number | null, suffix?: string) => {
    if (home == null && away == null) return;
    statRows.push({
      id,
      label,
      home: Number(home ?? 0),
      away: Number(away ?? 0),
      suffix,
    });
  };

  add('goals-for', 'Goals for / match', averageStats.home.goalsForPerMatch, averageStats.away.goalsForPerMatch);
  add('goals-against', 'Goals against / match', averageStats.home.goalsAgainstPerMatch, averageStats.away.goalsAgainstPerMatch);
  add('corners', 'Corners / match', averageStats.home.cornersPerMatch, averageStats.away.cornersPerMatch);
  add('cards', 'Cards / match', averageStats.home.cardsPerMatch, averageStats.away.cardsPerMatch);
  add('clean-sheets', 'Clean sheet rate', averageStats.home.cleanSheetRate, averageStats.away.cleanSheetRate, '%');

  return statRows;
}

export function insightSummary(insight: any) {
  return [
    insight?.apiFootballContext?.predictionSummary,
    insight?.h2h?.summary,
    insight?.apiFootballContext?.standingsSummary,
  ].filter(Boolean) as string[];
}
