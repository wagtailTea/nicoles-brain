import type {
  RoadmapItem,
  Workstream,
  ScheduledBlock,
  ScheduleResult,
  ImpactSummary,
} from '../types';
import { parseDate, scheduleWeekFromDate, getTimelineOrigin } from '../utils/dates';

const DEFAULT_ESTIMATE = 2;

/** Build map issueKey -> item for items in the list (first occurrence wins). */
function issueKeyToItem(items: RoadmapItem[]): Map<string, RoadmapItem> {
  const map = new Map<string, RoadmapItem>();
  for (const item of items) {
    const key = (item.issueKey || '').trim();
    if (key && !map.has(key)) map.set(key, item);
  }
  return map;
}

/** Resolve item.dependsOn (issue keys) to item IDs that appear in the given set. */
function resolveDependsOn(item: RoadmapItem, issueKeyMap: Map<string, RoadmapItem>, itemIds: Set<string>): string[] {
  const depIds: string[] = [];
  const deps = item.dependsOn || [];
  for (const key of deps) {
    const k = key.trim();
    if (!k) continue;
    const dep = issueKeyMap.get(k);
    if (dep && itemIds.has(dep.id)) depIds.push(dep.id);
  }
  return depIds;
}

/**
 * Placement order that prefers dependents: when multiple items are ready (all deps placed),
 * place one that depends on the item we just placed, so it can go right after it on the same stream.
 * initialLastPlacedId: when starting, prefer placing an item that depends on this (e.g. last WIP item).
 */
function placementOrderPreferDependents(
  items: RoadmapItem[],
  issueKeyMap: Map<string, RoadmapItem>,
  itemIds: Set<string>,
  _initialPlacedIds: Set<string>,
  initialLastPlacedId: string | null
): RoadmapItem[] {
  const idToItem = new Map<string, RoadmapItem>();
  items.forEach(i => idToItem.set(i.id, i));
  const inDegree: Record<string, number> = {};
  const successors: Record<string, string[]> = {};
  const depIdsByItem: Record<string, string[]> = {};
  for (const item of items) {
    inDegree[item.id] = 0;
    successors[item.id] = [];
    depIdsByItem[item.id] = [];
  }
  for (const item of items) {
    const depIds = resolveDependsOn(item, issueKeyMap, itemIds);
    depIdsByItem[item.id] = depIds;
    for (const depId of depIds) {
      if (depId === item.id) continue;
      if (idToItem.has(depId)) {
        successors[depId].push(item.id);
        inDegree[item.id]++;
      }
      // depId not in this phase but in initialPlacedIds: don't increase inDegree (dep already placed)
    }
  }
  const order: RoadmapItem[] = [];
  let lastPlacedId = initialLastPlacedId;
  const ready = new Set<string>(items.filter(i => inDegree[i.id] <= 0).map(i => i.id));
  while (ready.size > 0) {
    let pickId: string | null = null;
    if (lastPlacedId !== null) {
      for (const id of ready) {
        if ((depIdsByItem[id] || []).includes(lastPlacedId)) {
          pickId = id;
          break;
        }
      }
    }
    if (pickId === null) {
      pickId = ready.values().next().value ?? null;
    }
    if (pickId === null) break;
    ready.delete(pickId);
    order.push(idToItem.get(pickId)!);
    lastPlacedId = pickId;
    for (const succId of successors[pickId] || []) {
      inDegree[succId]--;
      if (inDegree[succId] === 0) ready.add(succId);
    }
  }
  return order;
}

/**
 * Build a set of unavailable weeks per stream based on start/end windows.
 * A stream can only schedule work in [startWeek, endWeek].
 */
function makeAvailabilityChecker(_streams: Workstream[]) {
  return (stream: Workstream, week: number): boolean => {
    if (stream.startWeek !== null && week < stream.startWeek) return false;
    if (stream.endWeek !== null && week > stream.endWeek) return false;
    return true;
  };
}

/** Place at earliest available consecutive weeks starting at or after minStartWeek. Returns true if placed. */
function tryPlace(
  item: RoadmapItem,
  estimate: number,
  candidateStreams: Workstream[],
  isAvailable: (s: Workstream, w: number) => boolean,
  occupied: Record<string, Set<number>>,
  blocks: ScheduledBlock[],
  itemCompletionWeeks: Record<string, number>,
  minStartWeek: number = 0
): boolean {
  if (candidateStreams.length === 0) return false;
  let bestStreamId = '';
  let bestCompletion = Infinity;
  let bestWeeks: number[] = [];

  for (const stream of candidateStreams) {
    let week = minStartWeek;
    while (week <= 500) {
      const weeks: number[] = [];
      let w = week;
      while (weeks.length < estimate && w <= 500) {
        if (isAvailable(stream, w) && !occupied[stream.id].has(w)) {
          weeks.push(w);
          w++;
        } else {
          break;
        }
      }
      if (weeks.length === estimate) {
        const completion = weeks[weeks.length - 1];
        if (completion < bestCompletion) {
          bestCompletion = completion;
          bestStreamId = stream.id;
          bestWeeks = weeks;
        }
      }
      week++;
    }
  }

  if (bestStreamId && bestWeeks.length > 0) {
    bestWeeks.forEach(w => {
      blocks.push({ itemId: item.id, streamId: bestStreamId, week: w });
      occupied[bestStreamId].add(w);
    });
    itemCompletionWeeks[item.id] = bestWeeks[bestWeeks.length - 1];
    return true;
  }
  return false;
}

/** Place at fixed [startWeek, startWeek+estimate-1]. Returns true if placed at desired start. */
function tryPlaceAtStartWeek(
  item: RoadmapItem,
  startWeek: number,
  estimate: number,
  candidateStreams: Workstream[],
  isAvailable: (s: Workstream, w: number) => boolean,
  occupied: Record<string, Set<number>>,
  blocks: ScheduledBlock[],
  itemCompletionWeeks: Record<string, number>
): boolean {
  if (candidateStreams.length === 0) return false;
  const desiredWeeks = Array.from({ length: estimate }, (_, i) => startWeek + i);
  for (const stream of candidateStreams) {
    const allFree = desiredWeeks.every(w => isAvailable(stream, w) && !occupied[stream.id].has(w));
    if (allFree) {
      desiredWeeks.forEach(w => {
        blocks.push({ itemId: item.id, streamId: stream.id, week: w });
        occupied[stream.id].add(w);
      });
      itemCompletionWeeks[item.id] = startWeek + estimate - 1;
      return true;
    }
  }
  return false;
}

export function scheduleItems(
  nowItems: RoadmapItem[],
  streams: Workstream[]
): ScheduleResult {
  const origin = getTimelineOrigin();
  const isAvailable = makeAvailabilityChecker(streams);
  const blocks: ScheduledBlock[] = [];
  const itemCompletionWeeks: Record<string, number> = {};
  let lostFocus = false;

  const occupied: Record<string, Set<number>> = {};
  streams.forEach(s => { occupied[s.id] = new Set(); });

  const focusAreaStreams = streams.filter(s => s.type === 'Focus Area');
  const wipMigrationStreams = streams.filter(s => s.type === 'WIP Migration');

  const issueKeyMap = issueKeyToItem(nowItems);
  const nowIds = new Set(nowItems.map(i => i.id));

  const tryPlaceWithMin = (
    item: RoadmapItem,
    estimate: number,
    candidateStreams: Workstream[],
    minStartWeek: number
  ) => tryPlace(item, estimate, candidateStreams, isAvailable, occupied, blocks, itemCompletionWeeks, minStartWeek);

  /** Which stream each placed item is on (from blocks). */
  const itemToStreamId: Record<string, string> = {};
  function recordPlacement(itemId: string, streamId: string) {
    itemToStreamId[itemId] = streamId;
  }

  /**
   * Try to place dependent item on the same stream as its latest-finishing dependency, starting the week after that dep.
   * Returns true if placed, so the dependent starts as soon as possible after dev handover.
   */
  function tryPlaceRightAfterDependency(
    item: RoadmapItem,
    estimate: number,
    candidateStreams: Workstream[],
    itemCompletionWeeks: Record<string, number>
  ): boolean {
    const depIds = resolveDependsOn(item, issueKeyMap, nowIds);
    if (depIds.length === 0) return false;
    let latestDepId = '';
    let latestCompletion = -1;
    for (const depId of depIds) {
      const c = itemCompletionWeeks[depId];
      if (c !== undefined && c > latestCompletion) {
        latestCompletion = c;
        latestDepId = depId;
      }
    }
    if (latestDepId === '' || latestCompletion < 0) return false;
    const streamId = itemToStreamId[latestDepId];
    if (!streamId) return false;
    const depStream = candidateStreams.find(s => s.id === streamId);
    if (!depStream) return false; // dependency is on a different stream type (e.g. WIP-migration vs Focus)
    const startWeek = latestCompletion + 1;
    return tryPlaceAtStartWeek(item, startWeek, estimate, [depStream], isAvailable, occupied, blocks, itemCompletionWeeks);
  }

  /**
   * Earliest week this item can start: the week after the last dependency's dev work completes.
   * Uses dev completion (last schedule week) only — no wait for QA/release.
   */
  function minStartWeekForItem(item: RoadmapItem): number {
    const depIds = resolveDependsOn(item, issueKeyMap, nowIds);
    let min = 0;
    for (const depId of depIds) {
      const devCompletionWeek = itemCompletionWeeks[depId];
      if (devCompletionWeek !== undefined && devCompletionWeek + 1 > min) min = devCompletionWeek + 1;
    }
    return min;
  }

  // 1) WIP-migration items: dependency order; dependent can start the week after dependency's dev handover (no QA/release wait)
  const wipMigItems = nowItems.filter(i => i.group === 'WIP-migration');
  const wipMigOrder = placementOrderPreferDependents(wipMigItems, issueKeyMap, nowIds, new Set(), null);
  let lastPlacedIdPreviousPhase: string | null = null;
  for (const item of wipMigOrder) {
    const estimate = item.estimate ?? DEFAULT_ESTIMATE;
    if (estimate <= 0) continue;
    const minStart = minStartWeekForItem(item);
    let placed = false;
    if (minStart > 0) {
      placed = tryPlaceRightAfterDependency(item, estimate, wipMigrationStreams, itemCompletionWeeks);
      if (placed) {
        recordPlacement(item.id, blocks[blocks.length - 1].streamId);
        lastPlacedIdPreviousPhase = item.id;
      }
    }
    if (!placed && item.startDate) {
      const d = parseDate(item.startDate);
      const desiredStart = d ? Math.max(0, scheduleWeekFromDate(d, origin)) : 0;
      const startWeek = Math.max(desiredStart, minStart);
      placed = tryPlaceAtStartWeek(item, startWeek, estimate, wipMigrationStreams, isAvailable, occupied, blocks, itemCompletionWeeks);
      if (placed) {
        recordPlacement(item.id, blocks[blocks.length - 1].streamId);
        lastPlacedIdPreviousPhase = item.id;
      } else {
        placed = tryPlaceWithMin(item, estimate, wipMigrationStreams, minStart);
        if (placed) {
          recordPlacement(item.id, blocks[blocks.length - 1].streamId);
          lastPlacedIdPreviousPhase = item.id;
        }
        if (item.group === 'Now' || item.group === 'WIP-migration') lostFocus = true;
      }
    } else if (!placed) {
      placed = tryPlaceWithMin(item, estimate, wipMigrationStreams, minStart);
      if (placed) {
        recordPlacement(item.id, blocks[blocks.length - 1].streamId);
        lastPlacedIdPreviousPhase = item.id;
      }
    }
  }

  // 2) Focus Area: dependency order; prefer placing dependents right after their dep (same phase or after WIP)
  const focusItems = nowItems.filter(
    i => i.group !== 'WIP-migration' && (i.type === 'Standard' || i.type === 'Integration')
  );
  const focusOrder = placementOrderPreferDependents(
    focusItems,
    issueKeyMap,
    nowIds,
    new Set(),
    lastPlacedIdPreviousPhase
  );
  for (const item of focusOrder) {
    const estimate = item.estimate ?? DEFAULT_ESTIMATE;
    if (estimate <= 0) continue;
    const minStart = minStartWeekForItem(item);
    let placed = false;
    if (minStart > 0) {
      placed = tryPlaceRightAfterDependency(item, estimate, focusAreaStreams, itemCompletionWeeks);
      if (placed) recordPlacement(item.id, blocks[blocks.length - 1].streamId);
    }
    if (!placed && item.startDate) {
      const d = parseDate(item.startDate);
      const desiredStart = d ? Math.max(0, scheduleWeekFromDate(d, origin)) : 0;
      const startWeek = Math.max(desiredStart, minStart);
      placed = tryPlaceAtStartWeek(item, startWeek, estimate, focusAreaStreams, isAvailable, occupied, blocks, itemCompletionWeeks);
      if (placed) recordPlacement(item.id, blocks[blocks.length - 1].streamId);
      else {
        placed = tryPlaceWithMin(item, estimate, focusAreaStreams, minStart);
        if (placed) recordPlacement(item.id, blocks[blocks.length - 1].streamId);
        if (item.group === 'Now' || item.group === 'WIP-migration') lostFocus = true;
      }
    } else if (!placed) {
      placed = tryPlaceWithMin(item, estimate, focusAreaStreams, minStart);
      if (placed) recordPlacement(item.id, blocks[blocks.length - 1].streamId);
    }
  }

  // Detect lost focus: in any week, do more items (by desired startDate+remaining) want to be active than we have streams?
  const weekDesiredCount: Record<number, number> = {};
  for (const item of nowItems) {
    if (!item.startDate) continue;
    if (item.group !== 'Now' && item.group !== 'WIP-migration') continue;
    const estimate = item.estimate ?? DEFAULT_ESTIMATE;
    if (estimate <= 0) continue;
    if (item.group !== 'WIP-migration' && item.type !== 'Standard' && item.type !== 'Integration') continue;
    const d = parseDate(item.startDate);
    const startWeek = d ? Math.max(0, scheduleWeekFromDate(d, origin)) : 0;
    for (let w = startWeek; w < startWeek + estimate; w++) {
      weekDesiredCount[w] = (weekDesiredCount[w] ?? 0) + 1;
    }
  }
  const maxDesired = Math.max(0, ...Object.values(weekDesiredCount));
  if (maxDesired > streams.length) lostFocus = true;

  const totalWeeks = blocks.length > 0
    ? Math.max(...blocks.map(b => b.week)) + 1
    : 0;

  return { blocks, itemCompletionWeeks, totalWeeks, lostFocus };
}

export function computeImpact(
  schedule: ScheduleResult,
  nowItems: RoadmapItem[],
  _streams: Workstream[]
): ImpactSummary {
  if (nowItems.length === 0 || schedule.blocks.length === 0) {
    return { overallFinish: null, wipMigrationFinish: null };
  }

  let overallFinish = 0;
  let wipMigrationFinish: number | null = null;

  for (const item of nowItems) {
    const completion = schedule.itemCompletionWeeks[item.id];
    if (completion === undefined) continue;
    overallFinish = Math.max(overallFinish, completion);
    if (item.group === 'WIP-migration') {
      wipMigrationFinish = wipMigrationFinish === null
        ? completion
        : Math.max(wipMigrationFinish, completion);
    }
  }

  return { overallFinish, wipMigrationFinish };
}
