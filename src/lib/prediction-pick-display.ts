import type { PublishedPrediction } from '@/lib/api/types';
import { formatTicketMarketLabel } from '@/lib/ticket-market-label';

export type PredictionPickDisplay = {
  condition: string;
  market: string;
  title: string;
};

const SPORTYBET_MARKETS: Record<string, string> = {
  '1': 'Match Winner',
  '18': 'Goals Over/Under',
  '29': 'Both Teams To Score',
  '68': '1st Half Over/Under',
  '77': 'Result/Total Goals',
  '450001': 'Goal Bounds',
};

function clean(value?: string | null) {
  return (value ?? '').trim();
}

function comparable(value?: string | null) {
  return clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function readableMarketId(value?: string | null) {
  const market = clean(value);
  if (!market || /^\d+$/.test(market) || /^[a-f0-9-]{16,}$/i.test(market)) return null;
  return market
    .replace(/::.*$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function marketDescriptor(prediction: PublishedPrediction) {
  if (prediction.bookmakerPlatform.trim().toUpperCase() === 'SPORTYBET') {
    return SPORTYBET_MARKETS[prediction.marketId] ?? prediction.marketId;
  }
  return prediction.marketId;
}

function quantityPhrase(value: number, side: 'over' | 'under') {
  if (!Number.isFinite(value)) return null;
  const doubled = value * 2;
  if (!Number.isInteger(doubled) || Math.abs(doubled % 2) !== 1) return null;

  if (side === 'over') {
    const minimum = Math.ceil(value);
    return `${minimum} or more`;
  }

  const maximum = Math.floor(value);
  return maximum === 0 ? '0' : `${maximum} or fewer`;
}

function totalDisplay(title: string, prediction: PublishedPrediction): PredictionPickDisplay | null {
  const total = title.match(/\b(over|under)\s+(\d+(?:\.\d+)?)\s+(goals|corners|cards)\b/i);
  if (!total?.[1] || !total[2] || !total[3]) return null;

  const side = total[1].toLowerCase() as 'over' | 'under';
  const sideLabel = side === 'over' ? 'Over' : 'Under';
  const line = Number(total[2]);
  const lineLabel = total[2];
  const unit = total[3].toLowerCase();
  const teamPrefix = title.slice(0, total.index).trim();
  const context = comparable(`${marketDescriptor(prediction)} ${prediction.verdict}`);
  const firstHalf = /\b(1st half|first half|half time|halftime|1h|ht)\b/.test(context);
  const period = firstHalf ? 'in the first half' : 'in regulation time';
  const quantity = quantityPhrase(line, side);
  const subject = teamPrefix
    ? `${teamPrefix} ${unit === 'goals' ? 'scores' : 'records'}`
    : 'the teams combine for';

  return {
    market: firstHalf ? `FIRST HALF · TOTAL ${unit.toUpperCase()}` : `FULL MATCH · TOTAL ${unit.toUpperCase()}`,
    title: teamPrefix
      ? `${teamPrefix} — ${sideLabel} ${lineLabel} ${unit}`
      : firstHalf
        ? `${sideLabel} ${lineLabel} first-half ${unit}`
        : `${sideLabel} ${lineLabel} total ${unit}`,
    condition: quantity
      ? `Wins if ${subject} ${quantity} ${unit} ${period}.`
      : `Wins if ${subject} ${side === 'over' ? 'more than' : 'fewer than'} ${lineLabel} ${unit} ${period}.`,
  };
}

function bothTeamsToScoreDisplay(title: string): PredictionPickDisplay | null {
  const match = title.match(/^Both Teams To Score:\s*(Yes|No)$/i);
  if (!match?.[1]) return null;
  const yes = match[1].toLowerCase() === 'yes';
  return {
    market: 'FULL MATCH · BOTH TEAMS TO SCORE',
    title: `Both teams to score — ${yes ? 'Yes' : 'No'}`,
    condition: yes
      ? 'Wins if each team scores at least one goal in regulation time.'
      : 'Wins if at least one team finishes without scoring in regulation time.',
  };
}

function resultDisplay(title: string, prediction: PublishedPrediction): PredictionPickDisplay | null {
  const normalized = comparable(title);
  if (normalized === 'draw') {
    return {
      market: 'FULL MATCH · RESULT',
      title: 'Draw',
      condition: 'Wins if the score is level at the end of regulation time.',
    };
  }

  if (!normalized.endsWith(' win')) return null;
  const team = title.replace(/\s+Win$/i, '').trim();
  return {
    market: 'FULL MATCH · RESULT',
    title: `${team} to win`,
    condition: `${team} must be ahead at the end of regulation time; a draw does not win this pick.`,
  };
}

function doubleChanceDisplay(title: string, prediction: PublishedPrediction): PredictionPickDisplay | null {
  const normalized = comparable(`${marketDescriptor(prediction)} ${prediction.verdict} ${title}`);
  if (!normalized.includes('double chance')) return null;

  const selection = comparable(title);
  if (selection === 'home away' || selection === '12') {
    return {
      market: 'FULL MATCH · DOUBLE CHANCE',
      title: `${prediction.homeTeam} or ${prediction.awayTeam} to win`,
      condition: 'Wins if either team wins in regulation time; a draw loses this pick.',
    };
  }

  if (selection === 'home draw' || selection === '1x') {
    return {
      market: 'FULL MATCH · DOUBLE CHANCE',
      title: `${prediction.homeTeam} or draw`,
      condition: `Wins if ${prediction.homeTeam} wins or the match ends level in regulation time.`,
    };
  }

  if (selection === 'away draw' || selection === 'draw away' || selection === 'x2') {
    return {
      market: 'FULL MATCH · DOUBLE CHANCE',
      title: `${prediction.awayTeam} or draw`,
      condition: `Wins if ${prediction.awayTeam} wins or the match ends level in regulation time.`,
    };
  }

  return {
    market: 'FULL MATCH · DOUBLE CHANCE',
    title,
    condition: 'Wins if either of the two outcomes named in the pick happens in regulation time.',
  };
}

function handicapDisplay(title: string, prediction: PublishedPrediction): PredictionPickDisplay | null {
  const normalized = comparable(`${marketDescriptor(prediction)} ${title}`);
  if (!normalized.includes('handicap') && !normalized.includes('spread')) return null;

  return {
    market: 'FULL MATCH · HANDICAP',
    title,
    condition: 'The displayed handicap is applied to the selected team before the result is settled.',
  };
}

export function getPredictionPickDisplay(prediction: PublishedPrediction): PredictionPickDisplay {
  const market = marketDescriptor(prediction);
  const title = formatTicketMarketLabel({
    awayTeam: prediction.awayTeam,
    homeTeam: prediction.homeTeam,
    market,
    platformSelectionId: prediction.selectionId,
    platformSpecifier: prediction.specifier,
    selectionLabel: prediction.selectionLabel ?? prediction.verdict,
    selectionTeam: prediction.selectionTeam,
  });

  return totalDisplay(title, prediction)
    ?? bothTeamsToScoreDisplay(title)
    ?? resultDisplay(title, prediction)
    ?? doubleChanceDisplay(title, prediction)
    ?? handicapDisplay(title, prediction)
    ?? {
      market: (readableMarketId(market) ?? 'SELECTED OUTCOME').toUpperCase(),
      title,
      condition: `The pick wins when “${title}” is the settled outcome for this market.`,
    };
}
