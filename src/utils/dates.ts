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

/** True if the given calendar week (0 = week of Jan 1) is before today. */
export function isWeekInPast(calendarWeek: number, origin: Date): boolean {
  const weekStart = weekToDate(calendarWeek, origin);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart.getTime() < today.getTime();
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
