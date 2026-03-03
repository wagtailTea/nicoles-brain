export function weekToDate(weekOffset: number, origin: Date = new Date()): Date {
  const d = new Date(origin);
  d.setDate(d.getDate() - (d.getDay() + 6) % 7); // Monday of week
  d.setDate(d.getDate() + weekOffset * 7);
  return d;
}

export function formatWeekDate(weekOffset: number, origin?: Date): string {
  const d = weekToDate(weekOffset, origin);
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: '2-digit' });
}

export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('en-AU', { month: 'short', year: '2-digit' });
}

export function formatMonthShort(date: Date): string {
  return date.toLocaleDateString('en-AU', { month: 'short' });
}

export interface MonthGroup {
  label: string;
  weeks: number[];
}

/** Monday of the week that contains January 1 of the given year. Timeline starts here (week 0). */
export function getOriginJan1(year: number): Date {
  const d = new Date(year, 0, 1);
  d.setDate(d.getDate() - (d.getDay() + 6) % 7);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Timeline starts from Monday 5 January 2026 (week 0). */
export function getTimelineOrigin(): Date {
  const d = new Date(2026, 0, 5); // 5 Jan 2026
  d.setHours(0, 0, 0, 0);
  return d;
}

/** True if the given calendar week (0 = week of Jan 1) is entirely before the current week. */
export function isWeekInPast(calendarWeek: number, origin: Date): boolean {
  const todayWeek = dateToWeekOffset(new Date(), origin);
  return calendarWeek < todayWeek;
}

/** True if the given calendar week is the week that contains today (current week in progress). */
export function isCurrentWeek(calendarWeek: number, origin: Date): boolean {
  const todayWeek = dateToWeekOffset(new Date(), origin);
  return calendarWeek === todayWeek;
}

/** Group calendar weeks by month. Origin = Monday of week containing Jan 1. Max 26 weeks per row. */
export function groupWeeksByMonthFromJan1(
  weekCount: number,
  origin: Date,
  maxWeeksPerRow: number = 26
): MonthGroup[][] {
  const groups: MonthGroup[] = [];
  let currentLabel = '';

  for (let w = 0; w < weekCount; w++) {
    const d = weekToDate(w, origin);
    const label = formatMonthShort(d);
    if (label !== currentLabel) {
      groups.push({ label, weeks: [] });
      currentLabel = label;
    }
    groups[groups.length - 1].weeks.push(w);
  }

  const rows: MonthGroup[][] = [];
  let currentRow: MonthGroup[] = [];
  let weeksInRow = 0;

  for (const group of groups) {
    const wouldBe = weeksInRow + group.weeks.length;
    if (currentRow.length > 0 && wouldBe > maxWeeksPerRow) {
      rows.push(currentRow);
      currentRow = [];
      weeksInRow = 0;
    }
    currentRow.push(group);
    weeksInRow += group.weeks.length;
  }
  if (currentRow.length > 0) rows.push(currentRow);

  return rows;
}

/**
 * Assign a week to the month that contains the majority of weekdays (Mon–Fri) in that week.
 * Returns { year, month } (month 0–11) so straddling weeks go to the month with more weekdays.
 */
function getMonthByWeekdayMajority(weekOffset: number, origin: Date): { year: number; month: number } {
  const monday = weekToDate(weekOffset, origin);
  let countMonthA = 0;
  let countMonthB = 0;
  let monthA = -1;
  let yearA = -1;
  let monthB = -1;
  let yearB = -1;
  for (let d = 0; d < 5; d++) {
    const day = new Date(monday);
    day.setDate(day.getDate() + d);
    const m = day.getMonth();
    const y = day.getFullYear();
    if (monthA === -1 || (m === monthA && y === yearA)) {
      monthA = m;
      yearA = y;
      countMonthA++;
    } else if (monthB === -1 || (m === monthB && y === yearB)) {
      monthB = m;
      yearB = y;
      countMonthB++;
    } else {
      countMonthA++;
    }
  }
  if (countMonthB === 0 || countMonthA >= countMonthB) {
    return { year: yearA, month: monthA };
  }
  return { year: yearB, month: monthB };
}

/**
 * Group calendar weeks by month (Jan, Feb, …). Straddling weeks go to the month with more weekdays.
 * Rows break at half-year boundaries: row 1 = Jan–Jun, row 2 = Jul–Dec, then repeat.
 */
export function groupWeeksByHalfYear(weekCount: number, origin: Date): MonthGroup[][] {
  if (weekCount <= 0) return [];
  const groups: MonthGroup[] = [];
  let currentYear = -1;
  let currentMonth = -1;
  let currentWeeks: number[] = [];

  for (let w = 0; w < weekCount; w++) {
    const { year, month } = getMonthByWeekdayMajority(w, origin);
    if (year !== currentYear || month !== currentMonth) {
      if (currentWeeks.length > 0) {
        const d = new Date(currentYear, currentMonth, 1);
        groups.push({ label: formatMonthShort(d), weeks: currentWeeks });
      }
      currentYear = year;
      currentMonth = month;
      currentWeeks = [];
    }
    currentWeeks.push(w);
  }
  if (currentWeeks.length > 0) {
    const d = new Date(currentYear, currentMonth, 1);
    groups.push({ label: formatMonthShort(d), weeks: currentWeeks });
  }

  // Split into rows: new row before July (month 6) and before January (month 0) when previous is December (month 11)
  const rows: MonthGroup[][] = [];
  let currentRow: MonthGroup[] = [];
  for (const group of groups) {
    const firstWeek = group.weeks[0];
    if (firstWeek === undefined) continue;
    const { month } = getMonthByWeekdayMajority(firstWeek, origin);
    const prevMonth = currentRow.length > 0
      ? getMonthByWeekdayMajority(currentRow[currentRow.length - 1].weeks[0], origin).month
      : -1;
    const newRowBeforeThis = currentRow.length > 0 && (month === 6 || (month === 0 && prevMonth === 11));
    if (newRowBeforeThis) {
      rows.push(currentRow);
      currentRow = [];
    }
    currentRow.push(group);
  }
  if (currentRow.length > 0) rows.push(currentRow);

  return rows;
}

export function groupWeeksByMonth(weekCount: number, origin?: Date): MonthGroup[] {
  const o = origin ?? new Date();
  const groups: MonthGroup[] = [];
  let currentLabel = '';

  for (let w = 0; w < weekCount; w++) {
    const d = weekToDate(w, o);
    const label = formatMonthYear(d);
    if (label !== currentLabel) {
      groups.push({ label, weeks: [] });
      currentLabel = label;
    }
    groups[groups.length - 1].weeks.push(w);
  }

  return groups;
}

export function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

export function dateToWeekOffset(date: Date, origin: Date): number {
  const o = new Date(origin);
  o.setDate(o.getDate() - (o.getDay() + 6) % 7);
  o.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const diff = d.getTime() - o.getTime();
  return Math.floor(diff / (7 * 24 * 60 * 60 * 1000));
}

/** Schedule week 0 = this week. Returns weeks from today for the given date (using same origin as timeline). */
export function scheduleWeekFromDate(date: Date, origin: Date): number {
  return dateToWeekOffset(date, origin) - dateToWeekOffset(new Date(), origin);
}
