import { useState, useCallback, useMemo, useEffect } from 'react';
import type {
  RoadmapItem,
  WorkstreamConfig,
  ScenarioInsertion,
  CustomItem,
  ItemType,
  Workstream,
} from './types';
import { fetchSheetData } from './utils/sheetParser';
import { getMockData } from './utils/mockData';
import { scheduleItems, computeImpact } from './utils/scheduler';
import { assignColorsByStream } from './utils/colors';
import { ImpactSummary } from './components/ImpactSummary';
import { WorkstreamConfigPanel } from './components/WorkstreamConfig';
import { TimelineGrid } from './components/TimelineGrid';
import { PriorityList } from './components/PriorityList';
import { DetailPanel } from './components/DetailPanel';
import { NextLaterSection } from './components/NextLaterSection';
import { ScenarioManager } from './components/ScenarioManager';
import { CustomScenarioBuilder } from './components/CustomScenarioBuilder';

function buildDefaultStreams(stdCount: number, intCount: number, pairCount: number): Workstream[] {
  const streams: Workstream[] = [];
  for (let i = 0; i < stdCount; i++) {
    streams.push({ id: `std-${i}`, name: `Standard ${i + 1}`, type: 'Standard' as ItemType, startWeek: null, endWeek: null });
  }
  for (let i = 0; i < intCount; i++) {
    streams.push({ id: `int-${i}`, name: `Integration ${i + 1}`, type: 'Integration' as ItemType, startWeek: null, endWeek: null });
  }
  for (let i = 0; i < pairCount; i++) {
    streams.push({ id: `pair-${i}`, name: `Dev-design pair ${i + 1}`, type: 'Dev-design pair' as ItemType, startWeek: null, endWeek: null });
  }
  return streams;
}

function App() {
  const [allItems, setAllItems] = useState<RoadmapItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingMock, setUsingMock] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [activeScenarios, setActiveScenarios] = useState<ScenarioInsertion[]>([]);
  const [customItems, setCustomItems] = useState<CustomItem[]>([]);

  const [wsConfig, setWsConfig] = useState<WorkstreamConfig>({
    standardCount: 2,
    integrationCount: 1,
    devDesignPairCount: 1,
    streams: buildDefaultStreams(2, 1, 1),
    qaReleaseWeeks: 3,
  });

  const loadData = useCallback(async (useMock = false) => {
    setLoading(true);
    setError(null);
    try {
      if (useMock) {
        setAllItems(getMockData());
        setUsingMock(true);
      } else {
        const items = await fetchSheetData();
        setAllItems(items);
        setUsingMock(false);
      }
    } catch (err) {
      console.error('Failed to load sheet, using mock data:', err);
      setAllItems(getMockData());
      setUsingMock(true);
      setError('Could not load Google Sheet. Showing mock data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Categorise items (WIP is part of "now" for timeline; we keep it separate for scenario ordering)
  const { wipItems, baseNowItems, nextItems, laterItems, scenarios } = useMemo(() => {
    const wip: RoadmapItem[] = [];
    const now: RoadmapItem[] = [];
    const next: RoadmapItem[] = [];
    const later: RoadmapItem[] = [];
    const sc: Record<string, RoadmapItem[]> = {};

    for (const item of allItems) {
      if (item.group === 'WIP') wip.push(item);
      else if (item.group === 'Now') now.push(item);
      else if (item.group === 'Next') next.push(item);
      else if (item.group === 'Later') later.push(item);
      else if (item.group) {
        if (!sc[item.group]) sc[item.group] = [];
        sc[item.group].push(item);
      }
    }
    return { wipItems: wip, baseNowItems: now, nextItems: next, laterItems: later, scenarios: sc };
  }, [allItems]);

  // Base ordered list for timeline: WIP first (work already started), then Now
  const baseOrderedNow = useMemo(
    () => [...wipItems, ...baseNowItems],
    [wipItems, baseNowItems]
  );

  // Build effective Now list: base (WIP + Now), then scenario blocks by disruptWip, then custom items
  const effectiveNowItems = useMemo(() => {
    let list = [...baseOrderedNow];
    const wipCount = wipItems.length;

    // Disrupt WIP = true: scenario goes to top (prepend). Order so first in activeScenarios is at top.
    const disruptScenarios = activeScenarios.filter(s => s.disruptWip);
    for (const sc of [...disruptScenarios].reverse()) {
      const items = scenarios[sc.scenarioName] || [];
      list = [...items, ...list];
    }

    // Disrupt WIP = false: scenario goes after WIP (insert after wipCount, then offset for multiple)
    const nonDisruptScenarios = activeScenarios.filter(s => !s.disruptWip);
    let insertOffset = wipCount;
    for (const sc of nonDisruptScenarios) {
      const items = scenarios[sc.scenarioName] || [];
      list.splice(insertOffset, 0, ...items);
      insertOffset += items.length;
    }

    // Insert custom items
    const sortedCustom = [...customItems].sort((a, b) => a.insertAtIndex - b.insertAtIndex);
    let cOffset = 0;
    for (const ci of sortedCustom) {
      const item: RoadmapItem = {
        id: ci.id,
        title: ci.title,
        issueKey: '',
        labels: ['custom'],
        description: 'Custom scenario item',
        group: 'Now',
        estimate: ci.estimate,
        estimateTotal: ci.estimate,
        type: ci.type,
        originalIndex: -1,
        color: '',
        deadline: null,
        deadlineNotes: null,
      };
      const idx = Math.min(ci.insertAtIndex + cOffset, list.length);
      list.splice(idx, 0, item);
      cOffset++;
    }

    // Re-assign colors by stream (base hue per stream, alternating light/dark within stream)
    list = list.map(item => ({ ...item, color: '' }));
    return list;
  }, [baseOrderedNow, wipItems.length, activeScenarios, customItems, scenarios]);

  // Schedule (based on items without final colors)
  const schedule = useMemo(
    () => scheduleItems(effectiveNowItems, wsConfig.streams),
    [effectiveNowItems, wsConfig.streams]
  );

  // Stream-based colors: one hue per stream type, alternating light/dark for contrast
  const effectiveNowItemsWithColors = useMemo(() => {
    const colorMap = assignColorsByStream(schedule, effectiveNowItems, wsConfig.streams);
    return effectiveNowItems.map(item => ({ ...item, color: colorMap[item.id] ?? item.color }));
  }, [effectiveNowItems, schedule, wsConfig.streams]);

  const impact = useMemo(
    () => computeImpact(schedule, effectiveNowItems, wsConfig.streams),
    [schedule, effectiveNowItems, wsConfig.streams]
  );

  // Item lookup for detail panel
  const allItemMap = useMemo(() => {
    const map: Record<string, RoadmapItem> = {};
    allItems.forEach(i => { map[i.id] = i; });
    effectiveNowItemsWithColors.forEach(i => { map[i.id] = i; });
    return map;
  }, [allItems, effectiveNowItemsWithColors]);

  const selectedItem = selectedItemId ? allItemMap[selectedItemId] ?? null : null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-slate-200">
        <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Nicole&apos;s Brain</h1>
              <p className="text-xs text-slate-500">
                {usingMock ? 'Using mock data' : "Simulating consequences since 2021."}
                {error && <span className="text-amber-500 ml-2">{error}</span>}
              </p>
            </div>
          </div>
          <button
            onClick={() => loadData()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm"
          >
            <svg
              className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">
        {/* Impact Summary */}
        <ImpactSummary impact={impact} qaReleaseWeeks={wsConfig.qaReleaseWeeks} />

        {/* Config */}
        <WorkstreamConfigPanel config={wsConfig} onChange={setWsConfig} />

        {/* NOW section */}
        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-indigo-500" />
            Horizon 1
          </h2>
          <div className="space-y-6">
            {/* Timeline full width */}
            <TimelineGrid
              schedule={schedule}
              streams={wsConfig.streams}
              items={effectiveNowItemsWithColors}
              selectedItemId={selectedItemId}
              onSelectItem={setSelectedItemId}
            />
            {/* Scenarios & Custom - above the lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ScenarioManager
                scenarios={scenarios}
                activeScenarios={activeScenarios}
                wipCount={wipItems.length}
                onActivate={(sc) => setActiveScenarios(prev => [...prev, sc])}
                onMove={(name, idx) =>
                  setActiveScenarios(prev =>
                    prev.map(s => s.scenarioName === name ? { ...s, insertAtIndex: idx } : s)
                  )
                }
                onToggleDisrupt={(name, disruptWip) =>
                  setActiveScenarios(prev =>
                    prev.map(s => s.scenarioName === name ? { ...s, disruptWip } : s)
                  )
                }
                onRemove={(name) => setActiveScenarios(prev => prev.filter(s => s.scenarioName !== name))}
              />
              <CustomScenarioBuilder
                nowItemCount={effectiveNowItemsWithColors.length}
                onAdd={(item) => setCustomItems(prev => [...prev, item])}
                customItems={customItems}
                onRemove={(id) => setCustomItems(prev => prev.filter(c => c.id !== id))}
              />
            </div>
            {/* Priority lists - fully visible */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <PriorityList
                title="Integration"
                items={effectiveNowItemsWithColors.filter(i => i.type === 'Integration')}
                schedule={schedule}
                selectedItemId={selectedItemId}
                onSelectItem={setSelectedItemId}
              />
              <PriorityList
                title="Standard"
                items={effectiveNowItemsWithColors.filter(i => i.type === 'Standard')}
                schedule={schedule}
                selectedItemId={selectedItemId}
                onSelectItem={setSelectedItemId}
              />
              <PriorityList
                title="Dev-design pair"
                items={effectiveNowItemsWithColors.filter(i => i.type === 'Dev-design pair')}
                schedule={schedule}
                selectedItemId={selectedItemId}
                onSelectItem={setSelectedItemId}
              />
            </div>
          </div>
        </section>

        {/* Next - full width section with two lists */}
        <NextLaterSection sectionTitle="Next" variant="next" items={nextItems} onSelectItem={setSelectedItemId} />

        {/* Later - full width section with two lists */}
        <NextLaterSection sectionTitle="Later" variant="later" items={laterItems} onSelectItem={setSelectedItemId} />
      </main>

      {/* Detail Panel */}
      {selectedItem && (
        <>
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setSelectedItemId(null)}
          />
          <DetailPanel
            item={selectedItem}
            completionWeek={schedule.itemCompletionWeeks[selectedItem.id]}
            qaReleaseWeeks={wsConfig.qaReleaseWeeks}
            onClose={() => setSelectedItemId(null)}
          />
        </>
      )}
    </div>
  );
}

export default App;
