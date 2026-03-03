import type { RoadmapItem, ScheduleResult } from '../types';

interface Props {
  title: string;
  items: RoadmapItem[];
  schedule: ScheduleResult;
  selectedItemId: string | null;
  onSelectItem: (id: string) => void;
}

export function PriorityList({ title, items, schedule: _schedule, selectedItemId, onSelectItem }: Props) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        <p className="text-xs text-slate-500 mt-0.5">{items.length} items</p>
      </div>
      <div className="divide-y divide-slate-100">
        {items.map((item, idx) => {
          const isSelected = item.id === selectedItemId;
          return (
            <button
              key={item.id}
              onClick={() => onSelectItem(item.id)}
              className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition hover:bg-slate-50 ${
                isSelected ? 'bg-indigo-50 border-l-2 border-indigo-500' : 'border-l-2 border-transparent'
              }`}
            >
              <span className="text-xs font-mono text-slate-400 w-5 text-right flex-shrink-0">
                {idx + 1}
              </span>
              <div
                className="w-3 h-3 rounded flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <p className="flex-1 min-w-0 text-sm font-medium text-slate-800 truncate">{item.title}</p>
              {item.deadline && (
                <span className="flex-shrink-0 rounded px-2 py-0.5 text-xs font-semibold bg-red-600 text-white">
                  {item.deadline}
                </span>
              )}
              {(() => {
                const badgeLabel = item.startDate ? 'In Progress'
                  : item.group === 'WIP' ? 'WIP'
                  : item.group === 'WIP-migration' ? 'Old Format'
                  : item.group === 'Now' ? 'Scheduled' : item.type;
                const badgeClass = item.startDate
                  ? 'bg-emerald-50 text-emerald-700'
                  : item.group === 'WIP'
                  ? 'bg-amber-50 text-amber-700'
                  : item.group === 'WIP-migration'
                  ? 'bg-slate-100 text-slate-600'
                  : item.group === 'Now'
                  ? 'bg-slate-100 text-slate-700'
                  : item.type === 'Standard'
                  ? 'bg-blue-50 text-blue-600'
                  : item.type === 'Integration'
                  ? 'bg-amber-50 text-amber-600'
                  : 'bg-violet-50 text-violet-600';
                return (
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded flex-shrink-0 ${badgeClass}`}>
                    {badgeLabel}
                  </span>
                );
              })()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
