export type ItemType = 'Standard' | 'Integration' | 'Dev-design pair';

export type GroupKind = 'Now' | 'Next' | 'Later' | string; // string covers "Scenario X"

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
}

export interface Workstream {
  id: string;
  name: string;
  type: ItemType;
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
}

export interface ScenarioInsertion {
  scenarioName: string;
  insertAtIndex: number;
  /** If true, scenario is top priority (before WIP). If false, scenario is inserted after WIP items. */
  disruptWip: boolean;
}

export interface CustomItem {
  id: string;
  title: string;
  type: ItemType;
  estimate: number;
  insertAtIndex: number;
}

export interface WorkstreamConfig {
  standardCount: number;
  integrationCount: number;
  devDesignPairCount: number;
  streams: Workstream[];
  qaReleaseWeeks: number;
}

export interface ImpactSummary {
  overallFinish: number | null;
  standardFinish: number | null;
  integrationFinish: number | null;
  devDesignPairFinish: number | null;
  bottleneckStream: string | null;
}
