type TicketMarketLabelInput = {
  awayTeam?: string | null;
  homeTeam?: string | null;
  market?: string | null;
  platformSelectionId?: string | null;
  platformSpecifier?: string | null;
  selectionLabel?: string | null;
  selectionReason?: string | null;
  selectionTeam?: string | null;
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

function titleCaseSide(value: 'over' | 'under') {
  return value === 'over' ? 'Over' : 'Under';
}

function parseSpecifierValue(specifier: string | null | undefined, key: string) {
  const value = clean(specifier);
  if (!value) return null;

  const parts = value.split(/[|,;]/);
  for (const part of parts) {
    const [rawKey, ...rest] = part.split('=');
    if (rawKey?.trim().toLowerCase() !== key.toLowerCase()) continue;
    const parsed = rest.join('=').trim();
    if (parsed) return parsed;
  }

  return null;
}

function firstLineValue(...values: (string | null | undefined)[]) {
  for (const value of values) {
    const text = clean(value);
    const decimalToken = text.match(/\b(\d+)[._](\d+)\b/);
    if (decimalToken?.[1] && decimalToken[2]) return `${decimalToken[1]}.${decimalToken[2]}`;
    const match = text.match(/\b\d+(?:\.\d+)?\b/);
    if (match?.[0]) return match[0];
  }
  return null;
}

function overUnderSide(...values: (string | null | undefined)[]) {
  for (const value of values) {
    const normalized = comparable(value);
    if (!normalized) continue;
    const hasOver = /\bover\b/.test(normalized);
    const hasUnder = /\bunder\b/.test(normalized);
    if (hasOver !== hasUnder) return hasOver ? 'over' : 'under';
  }
  return null;
}

function totalUnit(market?: string | null) {
  const normalized = comparable(market);
  if (/\bcorner/.test(normalized)) return 'Corners';
  if (/\bcard/.test(normalized)) return 'Cards';
  return 'Goals';
}

function yesNoLabel(value?: string | null) {
  const normalized = comparable(value);
  if (normalized === 'yes' || normalized === 'y') return 'Yes';
  if (normalized === 'no' || normalized === 'n') return 'No';
  return null;
}

function readableSelectionId(value?: string | null) {
  const selectionId = clean(value);
  if (!selectionId || /^\d+$/.test(selectionId)) return '';
  if (selectionId.length > 32 || /^[a-f0-9-]{16,}$/i.test(selectionId)) return '';
  return selectionId.replace(/[_-]+/g, ' ');
}

function resultPickLabel(input: TicketMarketLabelInput) {
  const market = comparable(input.market);
  if (!(market === '1x2' || market.includes('match winner') || /\bresult\b/.test(market))) {
    return null;
  }

  const selection = comparable(input.selectionLabel);
  const homeTeam = clean(input.homeTeam) || 'Home';
  const awayTeam = clean(input.awayTeam) || 'Away';
  const normalizedHome = comparable(input.homeTeam);
  const normalizedAway = comparable(input.awayTeam);
  const selectionId = clean(input.platformSelectionId);

  if (['1', 'home', 'home win'].includes(selection) || selectionId === '1' || (normalizedHome && selection === normalizedHome)) {
    return `${homeTeam} Win`;
  }
  if (['x', 'draw'].includes(selection) || selectionId === '2') return 'Draw';
  if (['2', 'away', 'away win'].includes(selection) || selectionId === '3' || (normalizedAway && selection === normalizedAway)) {
    return `${awayTeam} Win`;
  }
  return clean(input.selectionLabel) || null;
}

function bttsPickLabel(input: TicketMarketLabelInput) {
  const selected = yesNoLabel(input.selectionLabel) ?? yesNoLabel(readableSelectionId(input.platformSelectionId)) ?? yesNoLabel(input.market);
  if (!selected) return null;

  const context = comparable(`${input.market ?? ''} ${input.selectionReason ?? ''}`);
  if (context.includes('both teams to score') || context.includes('both to score') || /\bbtts\b/.test(context)) {
    return `Both Teams To Score: ${selected}`;
  }
  return null;
}

function handicapPickLabel(input: TicketMarketLabelInput) {
  const market = clean(input.market);
  if (!/\b(handicap|spread)\b/i.test(market)) return null;

  const line =
    firstLineValue(input.selectionLabel) ??
    parseSpecifierValue(input.platformSpecifier, 'handicap') ??
    parseSpecifierValue(input.platformSpecifier, 'hcp') ??
    parseSpecifierValue(input.platformSpecifier, 'line');
  const team = clean(input.selectionTeam);
  const selection = clean(input.selectionLabel);

  if (team && line) return `${team} ${line.startsWith('-') || line.startsWith('+') ? line : `+${line}`}`;
  if (selection && comparable(selection) !== comparable(market)) return selection;
  if (line) return `Handicap ${line}`;
  return null;
}

export function formatTicketMarketLabel(input: TicketMarketLabelInput) {
  const market = clean(input.market);
  const selection = clean(input.selectionLabel);
  const selectionIdLabel = readableSelectionId(input.platformSelectionId);
  const selectionCandidate = selection || selectionIdLabel;
  // Side + line come from structured fields only (selection, selection id,
  // market, specifier). Free-text selectionReason is prose and routinely
  // contains "over"/"under" as prepositions plus unrelated numbers, which
  // would fabricate totals for non-total markets like Match Winner.
  const side = overUnderSide(selection, selectionIdLabel, input.platformSelectionId, market);
  const totalLine =
    parseSpecifierValue(input.platformSpecifier, 'total') ??
    parseSpecifierValue(input.platformSpecifier, 'line') ??
    parseSpecifierValue(input.platformSpecifier, 'points') ??
    firstLineValue(selection, selectionIdLabel, input.platformSelectionId, market);

  if (side && totalLine) {
    const teamPrefix = clean(input.selectionTeam);
    return `${teamPrefix ? `${teamPrefix} ` : ''}${titleCaseSide(side)} ${totalLine} ${totalUnit(market)}`;
  }

  const resultPick = resultPickLabel(input);
  if (resultPick) return resultPick;

  const bttsPick = bttsPickLabel(input);
  if (bttsPick) return bttsPick;

  const handicapPick = handicapPickLabel(input);
  if (handicapPick) return handicapPick;

  if (selectionCandidate && comparable(selectionCandidate) !== comparable(market)) {
    const teamPrefix = clean(input.selectionTeam);
    return teamPrefix && !comparable(selectionCandidate).includes(comparable(teamPrefix))
      ? `${teamPrefix} ${selectionCandidate}`
      : selectionCandidate;
  }

  if (totalLine && market) return `${market} ${totalLine}`;
  return market || selectionCandidate || 'Recommended pick';
}
