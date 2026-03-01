import { useState } from 'react';
import type { RoadmapItem, ScenarioInsertion } from '../types';

interface Props {
  scenarios: Record<string, RoadmapItem[]>;
  activeScenarios: ScenarioInsertion[];
  wipCount: number;
  onActivate: (scenario: ScenarioInsertion) => void;
  onMove: (scenarioName: string, newIndex: number) => void;
  onToggleDisrupt: (scenarioName: string, disruptWip: boolean) => void;
  onRemove: (scenarioName: string) => void;
}

export function ScenarioManager({
  scenarios,
  activeScenarios,
  wipCount,
  onActivate,
  onMove: _onMove,
  onToggleDisrupt,
  onRemove,
}: Props) {
  const scenarioNames = Object.keys(scenarios);
  const activeNames = activeScenarios.map(s => s.scenarioName);
  const inactiveNames = scenarioNames.filter(n => !activeNames.includes(n));

  const [disruptWipByInactive, setDisruptWipByInactive] = useState<Record<string, boolean>>({});

  if (scenarioNames.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
        <h3 className="text-sm font-semibold text-slate-800">Scenarios</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Test delivery impact · WIP items stay first unless you choose to disrupt
        </p>
      </div>

      <div className="p-4 space-y-3">
        {/* Active scenarios */}
        {activeScenarios.map(sc => (
          <div key={sc.scenarioName} className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-indigo-800">{sc.scenarioName}</p>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 text-xs text-indigo-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sc.disruptWip === true}
                    onChange={e => onToggleDisrupt(sc.scenarioName, e.target.checked)}
                    className="rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Disrupt current WIP
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
              {(sc.disruptWip === true)
                ? 'Top priority (before WIP)'
                : `After WIP (position ${wipCount + 1}+)`}
              {' '}
              · {scenarios[sc.scenarioName]?.length ?? 0} items
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
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={disruptWipByInactive[name] ?? false}
                  onChange={e => setDisruptWipByInactive(prev => ({ ...prev, [name]: e.target.checked }))}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                Disrupt current work in progress
              </label>
              <button
                onClick={() => {
                  const disruptWip = disruptWipByInactive[name] ?? false;
                  onActivate({
                    scenarioName: name,
                    insertAtIndex: disruptWip ? 0 : wipCount,
                    disruptWip,
                  });
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1 rounded hover:bg-indigo-50 transition"
              >
                Include
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
