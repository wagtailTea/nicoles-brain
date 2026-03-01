// A cohesive, muted palette (UI-friendly) + simple adjacency avoidance
// so neighbours are distinct without looking neon/rainbow.

import type { ItemType, RoadmapItem, ScheduleResult, Workstream } from '../types';

type RGB = { r: number; g: number; b: number };

const PREFIX_RE = /^\[([^\]]+)/;

function extractPrefix(title: string): string | null {
  const m = title.match(PREFIX_RE);
  return m ? m[1].toUpperCase().trim() : null;
}

// Curated palette: muted, modern, readable on light backgrounds.
// (Intentionally avoids neon magenta/cyan/lime.)
const PALETTE: string[] = [
  "#3B82F6", // blue
  "#F97316", // orange
  "#10B981", // emerald
  "#8B5CF6", // violet
  "#EF4444", // red
  "#06B6D4", // cyan (muted-ish)
  "#84CC16", // lime (not too neon)
  "#F59E0B", // amber
  "#22C55E", // green
  "#6366F1", // indigo
  "#14B8A6", // teal
  "#EC4899", // pink (kept, but only one)
  "#A855F7", // purple
  "#0EA5E9", // sky
  "#FB7185", // rose
  "#64748B", // slate (neutral fallback)
];

// This order alternates warm/cool to reduce samey neighbours.
// It’s the *same colors* as above, just in a better sequence.
const ORDER: number[] = [
  0, 1, 2, 3,
  4, 5, 6, 7,
  9, 10, 13, 8,
  12, 14, 11, 15,
];

function hexToRgb(hex: string): RGB {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map(c => c + c).join("") : h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

// Simple Euclidean distance in RGB space.
// Good enough to avoid “too similar” neighbours.
function colorDistance(a: string, b: string): number {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  const dr = A.r - B.r;
  const dg = A.g - B.g;
  const db = A.b - B.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

const MIN_NEIGHBOR_DISTANCE = 120; // raise to be stricter, lower to be looser

function pickNextColor(
  startIndex: number,
  lastColor: string | null,
  usedByPrefix: Set<string>
): { color: string; nextIndex: number } {
  const len = ORDER.length;

  // Try up to len candidates to find one not too close to lastColor.
  for (let step = 0; step < len; step++) {
    const idx = ORDER[(startIndex + step) % len];
    const candidate = PALETTE[idx];

    // Optional: avoid reusing a color already assigned to a prefix (helps variety)
    // but don't make this a hard rule if palette is small.
    const alreadyUsed = usedByPrefix.has(candidate);

    if (lastColor) {
      const d = colorDistance(candidate, lastColor);
      if (d < MIN_NEIGHBOR_DISTANCE) continue;
    }

    // Prefer unused-by-prefix colours, but allow reuse if needed.
    if (!alreadyUsed) {
      return { color: candidate, nextIndex: (startIndex + step + 1) % len };
    }
  }

  // Fallback: if everything is "too close", just take the next in order.
  const fallback = PALETTE[ORDER[startIndex % len]];
  return { color: fallback, nextIndex: (startIndex + 1) % len };
}

export function assignColors(items: { id: string; title: string }[]): Record<string, string> {
  const map: Record<string, string> = {};
  const prefixColorMap: Record<string, string> = {};

  let cursor = 0;
  let lastColor: string | null = null;
  const usedByPrefix = new Set<string>();

  for (const item of items) {
    const prefix = extractPrefix(item.title);

    if (prefix) {
      if (!prefixColorMap[prefix]) {
        const pick = pickNextColor(cursor, lastColor, usedByPrefix);
        prefixColorMap[prefix] = pick.color;
        usedByPrefix.add(pick.color);
        cursor = pick.nextIndex;
      }
      const color = prefixColorMap[prefix];
      map[item.id] = color;
      lastColor = color;
    } else {
      const pick = pickNextColor(cursor, lastColor, usedByPrefix);
      map[item.id] = pick.color;
      cursor = pick.nextIndex;
      lastColor = map[item.id];
    }
  }

  return map;
}

// --- Stream-based colors: one base hue per stream type, alternating light/dark within stream ---

const STREAM_BASE_HUE: Record<ItemType, number> = {
  'Standard': 210,       // blue (aligns with UI)
  'Integration': 22,     // muted rust
  'Dev-design pair': 270, // violet
};

const SCENARIO_BASE_HUE = 165;
const SCENARIO_SAT = 48;

const CUSTOM_BASE_HUE = 320;
const CUSTOM_SAT = 50;

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  const r = Math.round(255 * f(0));
  const g = Math.round(255 * f(8));
  const b = Math.round(255 * f(4));
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

/** Light and dark shades (same hue) for contrast between adjacent items. */
function streamShades(hue: number, saturation = 52): { light: string; dark: string } {
  return {
    light: hslToHex(hue, saturation, 72),
    dark: hslToHex(hue, saturation, 42),
  };
}

/**
 * Assign colors by stream: each stream has a base hue; within a stream items
 * use alternating light/dark shades so adjacent items have clear contrast.
 * Reinforces stream identity (blue / amber / violet).
 */
export function assignColorsByStream(
  schedule: ScheduleResult,
  items: RoadmapItem[],
  streams: Workstream[]
): Record<string, string> {
  const map: Record<string, string> = {};
  const itemById: Record<string, RoadmapItem> = {};
  items.forEach(i => { itemById[i.id] = i; });
  const scenarioShades = streamShades(SCENARIO_BASE_HUE, SCENARIO_SAT);
  const customShades = streamShades(CUSTOM_BASE_HUE, CUSTOM_SAT);

  for (const stream of streams) {
    const hue = STREAM_BASE_HUE[stream.type];
    const sat = stream.type === 'Integration' ? 42 : 52;
    const { light, dark } = streamShades(hue, sat);

    // Item IDs on this stream, ordered by first week (left-to-right on timeline)
    const byItem: Record<string, number> = {};
    for (const b of schedule.blocks) {
      if (b.streamId !== stream.id) continue;
      if (byItem[b.itemId] === undefined || b.week < byItem[b.itemId]) {
        byItem[b.itemId] = b.week;
      }
    }
    const ordered = Object.entries(byItem)
      .sort(([, a], [, b]) => a - b)
      .map(([id]) => id);

    let customIndex = 0;
    let scenarioIndex = 0;
    ordered.forEach((itemId, i) => {
      const item = itemById[itemId];
      const isCustom = item && item.labels && item.labels.includes('custom');
      const isScenario = item && item.group !== 'WIP' && item.group !== 'Now';
      if (isCustom) {
        map[itemId] = (customIndex % 2 === 0) ? customShades.light : customShades.dark;
        customIndex++;
      } else if (isScenario) {
        map[itemId] = (scenarioIndex % 2 === 0) ? scenarioShades.light : scenarioShades.dark;
        scenarioIndex++;
      } else {
        map[itemId] = i % 2 === 0 ? light : dark;
      }
    });
  }

  // Unscheduled items (no block): use mid shade of their type’s hue
  for (const item of items) {
    if (map[item.id]) continue;
    const isCustom = item.labels && item.labels.includes('custom');
    const isScenario = item.group !== 'WIP' && item.group !== 'Now';
    if (isCustom) {
      map[item.id] = hslToHex(CUSTOM_BASE_HUE, CUSTOM_SAT, 58);
    } else if (isScenario) {
      map[item.id] = hslToHex(SCENARIO_BASE_HUE, SCENARIO_SAT, 58);
    } else {
      const hue = STREAM_BASE_HUE[item.type];
      map[item.id] = hslToHex(hue, 50, 58);
    }
  }

  return map;
}