const toUTCDateString = (date: Date) => date.toISOString().slice(0, 10);

export const startOfDayUTC = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

const addDaysUTC = (date: Date, days: number) => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

const startOfMonthUTC = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));

const endOfMonthUTC = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));

const startOfQuarterUTC = (date: Date) => {
  const quarterStartMonth = Math.floor(date.getUTCMonth() / 3) * 3;
  return new Date(Date.UTC(date.getUTCFullYear(), quarterStartMonth, 1));
};

const thisMondayUTC = (date: Date) => {
  const dayOfWeek = date.getUTCDay();
  const diff = (dayOfWeek + 6) % 7;
  return addDaysUTC(date, -diff);
};

const lastMondayUTC = (date: Date) => addDaysUTC(thisMondayUTC(date), -7);

const lastFridayUTC = (date: Date) => {
  const dayOfWeek = date.getUTCDay();
  const diff = (dayOfWeek + 2) % 7;
  return addDaysUTC(date, -diff);
};

const DATE_PLACEHOLDER_RESOLVERS: Record<string, (base: Date) => string> = {
  today: (base) => toUTCDateString(base),
  "1_day_ago": (base) => toUTCDateString(addDaysUTC(base, -1)),
  "2_days_ago": (base) => toUTCDateString(addDaysUTC(base, -2)),
  "3_days_ago": (base) => toUTCDateString(addDaysUTC(base, -3)),
  "7_days_ago": (base) => toUTCDateString(addDaysUTC(base, -7)),
  "14_days_ago": (base) => toUTCDateString(addDaysUTC(base, -14)),
  "30_days_ago": (base) => toUTCDateString(addDaysUTC(base, -30)),
  "56_days_ago": (base) => toUTCDateString(addDaysUTC(base, -56)),
  "60_days_ago": (base) => toUTCDateString(addDaysUTC(base, -60)),
  month_start: (base) => toUTCDateString(startOfMonthUTC(base)),
  last_month_start: (base) =>
    toUTCDateString(new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() - 1, 1))),
  last_month_end: (base) =>
    toUTCDateString(endOfMonthUTC(addDaysUTC(startOfMonthUTC(base), -1))),
  quarter_start: (base) => toUTCDateString(startOfQuarterUTC(base)),
  this_monday: (base) => toUTCDateString(thisMondayUTC(base)),
  last_monday: (base) => toUTCDateString(lastMondayUTC(base)),
  last_friday: (base) => toUTCDateString(lastFridayUTC(base)),
};

export const resolveDatePlaceholders = (endpoint: string, baseDate: Date) => {
  const resolvedTokens = new Set<string>();
  const unresolvedTokens = new Set<string>();
  const resolvedEndpoint = endpoint.replace(/\{([a-z0-9_-]+)\}/gi, (match, token) => {
    const resolver = DATE_PLACEHOLDER_RESOLVERS[token];
    if (!resolver) {
      unresolvedTokens.add(token);
      return match;
    }
    resolvedTokens.add(token);
    return resolver(baseDate);
  });

  return {
    endpoint: resolvedEndpoint,
    resolvedTokens: Array.from(resolvedTokens),
    unresolvedTokens: Array.from(unresolvedTokens),
  };
};
