export type ItemType = 'Standard' | 'Integration' | 'Slow Burners' | 'Ongoing';

/** Focus Area = pool for Standard/Integration work; WIP Migration = items with group WIP-migration. */
export type StreamType = 'Focus Area' | 'WIP Migration';

export type GroupKind = 'Now' | 'Next' | 'Later' | 'Ongoing' | 'WIP-migration' | string;

export interface RoadmapItem {
  id: string;
  title: string;
  issueKey: string;
  labels: string[];
  description: string;
  group: GroupKind;
  estimate: number | null;
  estimateTotal: number | null;
  type: ItemType;
  originalIndex: number;
  color: string;
  deadline: string | null;
  deadlineNotes: string | null;
  /** Start date from spreadsheet (ISO or parseable); item runs StartDate → StartDate + Remaining weeks */
  startDate: string | null;
  /** Issue keys of items that must complete before this item can start (e.g. ['ROAD-101','ROAD-102']). */
  dependsOn: string[];
}

export interface Workstream {
  id: string;
  name: string;
  type: StreamType;
  startWeek: number | null;
  endWeek: number | null;
}

export interface ScheduledBlock {
  itemId: string;
  streamId: string;
  week: number;
}

export interface ScheduleResult {
  blocks: ScheduledBlock[];
  itemCompletionWeeks: Record<string, number>;
  totalWeeks: number;
  /** True when more items are active in a week than there are streams (focus is spread thin) */
  lostFocus: boolean;
}

export interface ScenarioInsertion {
  scenarioName: string;
  /** 1-based position in the timeline (1 = first scenario block). Default 1. */
  priority: number;
}

export interface CustomItem {
  id: string;
  title: string;
  type: ItemType;
  estimate: number;
  insertAtIndex: number;
}

export interface WorkstreamConfig {
  focusAreaCount: number;
  wipMigrationCount: number;
  streams: Workstream[];
  qaReleaseWeeks: number;
}

export interface ImpactSummary {
  overallFinish: number | null;
  /** Dev-completion week of the last WIP-migration item; null if no WIP items. */
  wipMigrationFinish: number | null;
}
