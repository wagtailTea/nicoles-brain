import { useState } from 'react';
import type { WorkstreamConfig as WConfig, Workstream } from '../types';
import type { ItemType } from '../types';

interface Props {
  config: WConfig;
  onChange: (config: WConfig) => void;
}

function buildStreams(
  standardCount: number,
  integrationCount: number,
  devDesignPairCount: number,
  existing: Workstream[]
): Workstream[] {
  const streams: Workstream[] = [];
  for (let i = 0; i < standardCount; i++) {
    const prev = existing.find(s => s.id === `std-${i}`);
    streams.push(prev ?? {
      id: `std-${i}`,
      name: `Standard ${i + 1}`,
      type: 'Standard' as ItemType,
      startWeek: null,
      endWeek: null,
    });
  }
  for (let i = 0; i < integrationCount; i++) {
    const prev = existing.find(s => s.id === `int-${i}`);
    streams.push(prev ?? {
      id: `int-${i}`,
      name: `Integration ${i + 1}`,
      type: 'Integration' as ItemType,
      startWeek: null,
      endWeek: null,
    });
  }
  for (let i = 0; i < devDesignPairCount; i++) {
    const prev = existing.find(s => s.id === `pair-${i}`);
    streams.push(prev ?? {
      id: `pair-${i}`,
      name: `Dev-design pair ${i + 1}`,
      type: 'Dev-design pair' as ItemType,
      startWeek: null,
      endWeek: null,
    });
  }
  return streams;
}

export function WorkstreamConfigPanel({ config, onChange }: Props) {
  const [expanded, setExpanded] = useState(false);

  const setCount = (type: 'standard' | 'integration' | 'devDesignPair', val: number) => {
    const v = Math.max(0, Math.min(10, val));
    const next = {
      ...config,
      standardCount: type === 'standard' ? v : config.standardCount,
      integrationCount: type === 'integration' ? v : config.integrationCount,
      devDesignPairCount: type === 'devDesignPair' ? v : config.devDesignPairCount,
    };
    next.streams = buildStreams(next.standardCount, next.integrationCount, next.devDesignPairCount, config.streams);
    onChange(next);
  };

  const updateStream = (id: string, field: 'startWeek' | 'endWeek', value: string) => {
    const num = value === '' ? null : parseInt(value, 10);
    const streams = config.streams.map(s =>
      s.id === id ? { ...s, [field]: isNaN(num as number) ? null : num } : s
    );
    onChange({ ...config, streams });
  };

  return (
    <div className="rounded-xl bg-white border border-slate-200 shadow-sm">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">What if we added more devs?</p>
            <p className="text-xs text-slate-500">
              {config.standardCount} Standard · {config.integrationCount} Integration
              {config.devDesignPairCount > 0 && ` · ${config.devDesignPairCount} Dev-design pair`}
              {' '}
              · {config.qaReleaseWeeks}w QA & Release
            </p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-slate-100 pt-4">
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              Standard streams
              <input
                type="number" min={0} max={10}
                value={config.standardCount}
                onChange={e => setCount('standard', parseInt(e.target.value))}
                className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              Integration streams
              <input
                type="number" min={0} max={10}
                value={config.integrationCount}
                onChange={e => setCount('integration', parseInt(e.target.value))}
                className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              Dev-design pair streams
              <input
                type="number" min={0} max={10}
                value={config.devDesignPairCount}
                onChange={e => setCount('devDesignPair', parseInt(e.target.value))}
                className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              QA & Release (weeks)
              <input
                type="number" min={0} max={52}
                value={config.qaReleaseWeeks}
                onChange={e => onChange({ ...config, qaReleaseWeeks: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </label>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Availability Windows (week numbers, leave blank for always available)</p>
            {config.streams.map(stream => (
              <div key={stream.id} className="flex items-center gap-3 text-sm">
                <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                  stream.type === 'Standard'
                    ? 'bg-blue-50 text-blue-700'
                    : stream.type === 'Integration'
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-violet-50 text-violet-700'
                }`}>
                  {stream.name}
                </span>
                <label className="flex items-center gap-1 text-slate-600">
                  Start
                  <input
                    type="number" min={0}
                    value={stream.startWeek ?? ''}
                    onChange={e => updateStream(stream.id, 'startWeek', e.target.value)}
                    placeholder="0"
                    className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </label>
                <label className="flex items-center gap-1 text-slate-600">
                  End
                  <input
                    type="number" min={0}
                    value={stream.endWeek ?? ''}
                    onChange={e => updateStream(stream.id, 'endWeek', e.target.value)}
                    placeholder="∞"
                    className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </label>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
