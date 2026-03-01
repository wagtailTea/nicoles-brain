import type {
  RoadmapItem,
  Workstream,
  ScheduledBlock,
  ScheduleResult,
  ImpactSummary,
} from '../types';

const DEFAULT_ESTIMATE = 2;

/**
 * Build a set of unavailable weeks per stream based on start/end windows.
 * A stream can only schedule work in [startWeek, endWeek].
 * Returns a function that checks if a week is available on a stream.
 */
function makeAvailabilityChecker(streams: Workstream[]) {
  return (stream: Workstream, week: number): boolean => {
    if (stream.startWeek !== null && week < stream.startWeek) return false;
    if (stream.endWeek !== null && week > stream.endWeek) return false;
    return true;
  };
}

export function scheduleItems(
  nowItems: RoadmapItem[],
  streams: Workstream[]
): ScheduleResult {
  const isAvailable = makeAvailabilityChecker(streams);
  const blocks: ScheduledBlock[] = [];
  const itemCompletionWeeks: Record<string, number> = {};

  // Track which weeks are occupied per stream: streamId -> Set<week>
  const occupied: Record<string, Set<number>> = {};
  streams.forEach(s => { occupied[s.id] = new Set(); });

  for (const item of nowItems) {
    const estimate = item.estimate ?? DEFAULT_ESTIMATE;
    if (estimate <= 0) continue;

    const matchingStreams = streams.filter(s => s.type === item.type);
    if (matchingStreams.length === 0) continue;

    // Try each matching stream, pick the one with earliest completion
    let bestStreamId = '';
    let bestCompletion = Infinity;
    let bestWeeks: number[] = [];

    for (const stream of matchingStreams) {
      const weeks: number[] = [];
      let week = 0;
      while (weeks.length < estimate) {
        if (isAvailable(stream, week) && !occupied[stream.id].has(week)) {
          weeks.push(week);
        }
        week++;
        if (week > 500) break; // safety
      }
      if (weeks.length === estimate) {
        const completion = weeks[weeks.length - 1];
        if (completion < bestCompletion) {
          bestCompletion = completion;
          bestStreamId = stream.id;
          bestWeeks = weeks;
        }
      }
    }

    if (bestStreamId && bestWeeks.length > 0) {
      bestWeeks.forEach(w => {
        blocks.push({ itemId: item.id, streamId: bestStreamId, week: w });
        occupied[bestStreamId].add(w);
      });
      itemCompletionWeeks[item.id] = bestCompletion;
    }
  }

  const totalWeeks = blocks.length > 0
    ? Math.max(...blocks.map(b => b.week)) + 1
    : 0;

  return { blocks, itemCompletionWeeks, totalWeeks };
}

export function computeImpact(
  schedule: ScheduleResult,
  nowItems: RoadmapItem[],
  streams: Workstream[]
): ImpactSummary {
  if (nowItems.length === 0 || schedule.blocks.length === 0) {
    return { overallFinish: null, standardFinish: null, integrationFinish: null, devDesignPairFinish: null, bottleneckStream: null };
  }

  let overallFinish = 0;
  let standardFinish = 0;
  let integrationFinish = 0;
  let devDesignPairFinish: number | null = null;

  for (const item of nowItems) {
    const completion = schedule.itemCompletionWeeks[item.id];
    if (completion === undefined) continue;
    overallFinish = Math.max(overallFinish, completion);
    if (item.type === 'Standard') standardFinish = Math.max(standardFinish, completion);
    if (item.type === 'Integration') integrationFinish = Math.max(integrationFinish, completion);
    if (item.type === 'Dev-design pair') {
      devDesignPairFinish = devDesignPairFinish === null ? completion : Math.max(devDesignPairFinish, completion);
    }
  }

  // Find bottleneck stream (last to finish)
  const streamLastWeek: Record<string, number> = {};
  for (const block of schedule.blocks) {
    streamLastWeek[block.streamId] = Math.max(
      streamLastWeek[block.streamId] ?? 0,
      block.week
    );
  }

  let bottleneckStream: string | null = null;
  let maxWeek = -1;
  for (const [sid, w] of Object.entries(streamLastWeek)) {
    if (w > maxWeek) {
      maxWeek = w;
      bottleneckStream = streams.find(s => s.id === sid)?.name ?? sid;
    }
  }

  return { overallFinish, standardFinish, integrationFinish, devDesignPairFinish, bottleneckStream };
}
