import type { RoadmapItem, ItemType, GroupKind } from '../types';
import { assignColors } from './colors';

const SHEET_ID = '1zYhWjpnyql8kQFBw0DxqXaPSBtuFFh3nJc2mXrHWlOg';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let current = '';
  let inQuotes = false;
  let row: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(current.trim());
        current = '';
      } else if (ch === '\n' || (ch === '\r' && text[i + 1] === '\n')) {
        row.push(current.trim());
        current = '';
        rows.push(row);
        row = [];
        if (ch === '\r') i++;
      } else {
        current += ch;
      }
    }
  }
  if (current || row.length > 0) {
    row.push(current.trim());
    rows.push(row);
  }
  return rows;
}

function findColumnIndices(header: string[]): Record<string, number> {
  const normalized = header.map(h => h.toLowerCase().trim());

  let remaining = normalized.indexOf('remaining (weeks)');
  if (remaining === -1) remaining = normalized.indexOf('estimate (weeks)');
  if (remaining === -1) remaining = normalized.indexOf('estimate');

  let estimateTotal = normalized.indexOf('estimate (total)');
  if (estimateTotal === -1) estimateTotal = normalized.indexOf('total estimate');

  const startDateIdx = normalized.indexOf('startdate');
  const startDate = startDateIdx >= 0 ? startDateIdx : normalized.indexOf('start date');

  let dependsOn = normalized.indexOf('depends on');
  if (dependsOn === -1) dependsOn = normalized.indexOf('dependencies');
  if (dependsOn === -1) dependsOn = normalized.indexOf('blocked by');

  return {
    title: normalized.indexOf('title'),
    issueKey: normalized.indexOf('issue key'),
    labels: normalized.indexOf('labels'),
    description: normalized.indexOf('description'),
    group: normalized.indexOf('group'),
    remaining,
    estimateTotal,
    type: normalized.indexOf('type'),
    deadline: normalized.indexOf('deadline'),
    deadlineNotes: normalized.indexOf('deadline notes'),
    startDate,
    dependsOn,
  };
}

export async function fetchSheetData(): Promise<RoadmapItem[]> {
  const response = await fetch(CSV_URL);
  if (!response.ok) throw new Error(`Failed to fetch sheet: ${response.status}`);
  const text = await response.text();
  return parseSheetCSV(text);
}

export function parseSheetCSV(text: string): RoadmapItem[] {
  const rows = parseCSV(text);
  if (rows.length < 2) return [];

  const cols = findColumnIndices(rows[0]);
  const items: RoadmapItem[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const title = row[cols.title] || '';
    if (!title) continue;

    const remainingRaw = cols.remaining >= 0 ? row[cols.remaining] : '';
    const remaining = remainingRaw ? parseInt(remainingRaw, 10) : null;
    const totalRaw = cols.estimateTotal >= 0 ? row[cols.estimateTotal] : '';
    const total = totalRaw ? parseInt(totalRaw, 10) : null;
  const type: ItemType = (() => {
    const raw = (row[cols.type] || 'Standard').trim().toLowerCase();
    if (raw === 'integration') return 'Integration';
    if (raw === 'slow burners' || raw === 'slow burner') return 'Slow Burners';
    if (raw === 'ongoing') return 'Ongoing';
    if (raw === 'dev-design pair') return 'Standard'; // legacy
    return 'Standard';
  })();
    const group: GroupKind = (row[cols.group] || 'Later').trim();

    const deadlineRaw = cols.deadline >= 0 ? (row[cols.deadline] || '').trim() : '';
    const deadlineNotesRaw = cols.deadlineNotes >= 0 ? (row[cols.deadlineNotes] || '').trim() : '';
    const startDateCol = cols.startDate >= 0 ? cols.startDate : -1;
    const startDateRaw = startDateCol >= 0 ? (row[startDateCol] || '').trim() : '';
    const startDate = startDateRaw || null;

    const dependsOnRaw = cols.dependsOn >= 0 ? (row[cols.dependsOn] || '').trim() : '';
    const dependsOn = dependsOnRaw
      ? dependsOnRaw.split(',').map(k => k.trim()).filter(Boolean)
      : [];

    items.push({
      id: `item-${i}`,
      title,
      issueKey: row[cols.issueKey] || '',
      labels: (row[cols.labels] || '').split(',').map(l => l.trim()).filter(Boolean),
      description: row[cols.description] || '',
      group,
      estimate: isNaN(remaining as number) ? null : remaining,
      estimateTotal: isNaN(total as number) ? null : total,
      type,
      originalIndex: i,
      color: '',
      deadline: deadlineRaw || null,
      deadlineNotes: deadlineNotesRaw || null,
      startDate,
      dependsOn,
    });
  }

  const colorMap = assignColors(items);
  items.forEach(item => {
    item.color = colorMap[item.id];
  });

  return items;
}
