import { useState } from 'react';
import type { RoadmapItem, ScenarioInsertion } from '../types';

interface Props {
  scenarios: Record<string, RoadmapItem[]>;
  activeScenarios: ScenarioInsertion[];
  onActivate: (scenario: ScenarioInsertion) => void;
  onPriorityChange: (scenarioName: string, priority: number) => void;
  onRemove: (scenarioName: string) => void;
}

export function ScenarioManager({
  scenarios,
  activeScenarios,
  onActivate,
  onPriorityChange,
  onRemove,
}: Props) {
  const scenarioNames = Object.keys(scenarios);
  const activeNames = activeScenarios.map(s => s.scenarioName);
  const inactiveNames = scenarioNames.filter(n => !activeNames.includes(n));

  const [expanded, setExpanded] = useState(false);

  if (scenarioNames.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50 text-left"
      >
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Scenarios</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Test delivery impact · Scenarios slot into the timeline by priority
          </p>
        </div>
        <svg
          className={`w-5 h-5 text-slate-400 transition-transform flex-shrink-0 ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
      <div className="p-4 space-y-3">
        {/* Active scenarios */}
        {activeScenarios.map(sc => (
          <div key={sc.scenarioName} className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-sm font-medium text-indigo-800">{sc.scenarioName}</p>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs text-indigo-700">
                  Priority
                  <input
                    type="number"
                    min={1}
                    max={Math.max(1, activeScenarios.length)}
                    value={sc.priority}
                    onChange={e => onPriorityChange(sc.scenarioName, Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-12 rounded border border-indigo-200 px-1.5 py-0.5 text-xs text-indigo-800 bg-white"
                  />
                </label>
                <button
                  onClick={() => onRemove(sc.scenarioName)}
                  className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 transition"
                >
                  Remove
                </button>
              </div>
            </div>
            <p className="text-xs text-indigo-500">
              Position {sc.priority} in timeline · {scenarios[sc.scenarioName]?.length ?? 0} items
            </p>
          </div>
        ))}

        {/* Inactive scenarios */}
        {inactiveNames.map(name => (
          <div key={name} className="flex flex-col gap-2 rounded-lg border border-slate-200 px-3 py-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-700">{name}</p>
              <p className="text-xs text-slate-400">{scenarios[name]?.length ?? 0} items</p>
            </div>
            <button
              onClick={() => onActivate({
                scenarioName: name,
                priority: 1,
              })}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1 rounded hover:bg-indigo-50 transition w-fit"
            >
              Include
            </button>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}
