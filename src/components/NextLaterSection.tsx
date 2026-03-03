import type { RoadmapItem } from '../types';
import { ProgressBar } from './ProgressBar';

type ViewMode = 'prioritised' | 'unprioritised';

interface Props {
  nextItems: RoadmapItem[];
  laterItems: RoadmapItem[];
  ongoingItems: RoadmapItem[];
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
  groupFocusByType: boolean;
  onGroupFocusByTypeChange: (value: boolean) => void;
  onSelectItem: (id: string) => void;
}

function ItemList({
  typeLabel,
  typeClass,
  items,
  onSelectItem,
}: {
  typeLabel: string;
  typeClass: string;
  items: RoadmapItem[];
  onSelectItem: (id: string) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
          <h3 className="text-sm font-semibold text-slate-800">{typeLabel}</h3>
          <p className="text-xs text-slate-500 mt-0.5">0 items</p>
        </div>
        <div className="px-4 py-6 text-center text-sm text-slate-400">No items</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
        <h3 className="text-sm font-semibold text-slate-800">{typeLabel}</h3>
        <p className="text-xs text-slate-500 mt-0.5">{items.length} items</p>
      </div>
      <div className="divide-y divide-slate-100">
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => onSelectItem(item.id)}
            className="w-full text-left px-4 py-3 flex items-center gap-3 transition hover:bg-slate-50"
          >
            <div className="w-3 h-3 rounded flex-shrink-0" style={{ backgroundColor: item.color }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{item.title}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${item.startDate ? 'bg-emerald-50 text-emerald-700' : typeClass}`}>
                  {item.startDate ? 'In Progress' : typeLabel}
                </span>
                {item.deadline && (
                  <span className="rounded px-2 py-0.5 text-[10px] font-semibold bg-red-600 text-white">
                    {item.deadline}
                  </span>
                )}
                {item.issueKey && (
                  <span className="text-[10px] font-mono text-slate-400">{item.issueKey}</span>
                )}
              </div>
              {item.estimateTotal !== null && item.estimateTotal > 0 && (
                <div className="mt-1.5 max-w-[180px]">
                  <ProgressBar item={item} size="sm" />
                </div>
              )}
            </div>
            {item.estimate !== null && (
              <span className="text-xs text-slate-400 flex-shrink-0">{item.estimate}w rem</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function oneListSection(items: RoadmapItem[], onSelectItem: (id: string) => void) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
          <h3 className="text-sm font-semibold text-slate-800">Next & Later</h3>
          <p className="text-xs text-slate-500 mt-0.5">0 items</p>
        </div>
        <div className="px-4 py-6 text-center text-sm text-slate-400">No items</div>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
        <h3 className="text-sm font-semibold text-slate-800">Next & Later</h3>
        <p className="text-xs text-slate-500 mt-0.5">{items.length} items</p>
      </div>
      <div className="divide-y divide-slate-100">
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => onSelectItem(item.id)}
            className="w-full text-left px-4 py-3 flex items-center gap-3 transition hover:bg-slate-50"
          >
            <div className="w-3 h-3 rounded flex-shrink-0" style={{ backgroundColor: item.color }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{item.title}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${item.startDate ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                  {item.startDate ? 'In Progress' : `${item.type}${item.group === 'Ongoing' ? ' · Ongoing' : item.group === 'Next' ? ' · Next' : ' · Later'}`}
                </span>
                {item.deadline && (
                  <span className="rounded px-2 py-0.5 text-[10px] font-semibold bg-red-600 text-white">
                    {item.deadline}
                  </span>
                )}
                {item.issueKey && (
                  <span className="text-[10px] font-mono text-slate-400">{item.issueKey}</span>
                )}
              </div>
              {item.estimateTotal !== null && item.estimateTotal > 0 && (
                <div className="mt-1.5 max-w-[180px]">
                  <ProgressBar item={item} size="sm" />
                </div>
              )}
            </div>
            {item.estimate !== null && (
              <span className="text-xs text-slate-400 flex-shrink-0">{item.estimate}w rem</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export function NextLaterSection({
  nextItems,
  laterItems,
  ongoingItems: _ongoingItems,
  view,
  onViewChange,
  groupFocusByType,
  onGroupFocusByTypeChange,
  onSelectItem,
}: Props) {
  // Focus only: Next & Later lists exclude Ongoing (Business as Usual lives next to Focus in Horizon 1)
  const allNextAndLater = [...nextItems, ...laterItems];

  return (
    <section className="w-full space-y-4">
      {/* Toggle and single section for Unprioritised */}
      <div
        className="rounded-2xl border border-slate-200 px-5 py-4"
        style={{ backgroundColor: '#e0e8e4' }}
      >
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-slate-400" />
            <h2 className="text-sm font-semibold text-slate-800 tracking-wide uppercase">
              Next & Later
            </h2>
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={view === 'prioritised'}
                onChange={e => onViewChange(e.target.checked ? 'prioritised' : 'unprioritised')}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Prioritised view
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={groupFocusByType}
                onChange={e => onGroupFocusByTypeChange(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Group by type (Integration / Standard)
            </label>
          </div>
          <p className="text-xs text-slate-500 italic">
            Loosely prioritised future work — estimates indicative only
          </p>
        </div>

        {view === 'unprioritised' ? (
          groupFocusByType ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ItemList
                typeLabel="Integration"
                typeClass="bg-amber-50 text-amber-600"
                items={allNextAndLater.filter(i => i.type === 'Integration')}
                onSelectItem={onSelectItem}
              />
              <ItemList
                typeLabel="Standard"
                typeClass="bg-blue-50 text-blue-600"
                items={allNextAndLater.filter(i => i.type === 'Standard')}
                onSelectItem={onSelectItem}
              />
            </div>
          ) : (
            oneListSection(allNextAndLater, onSelectItem)
          )
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <h3 className="text-xs font-semibold text-slate-500 uppercase col-span-full">Next</h3>
              {groupFocusByType ? (
                <>
                  <ItemList
                    typeLabel="Integration"
                    typeClass="bg-amber-50 text-amber-600"
                    items={nextItems.filter(i => i.type === 'Integration')}
                    onSelectItem={onSelectItem}
                  />
                  <ItemList
                    typeLabel="Standard"
                    typeClass="bg-blue-50 text-blue-600"
                    items={nextItems.filter(i => i.type === 'Standard')}
                    onSelectItem={onSelectItem}
                  />
                </>
              ) : (
                <ItemList
                  typeLabel="Focus"
                  typeClass="bg-indigo-50 text-indigo-600"
                  items={nextItems.filter(i => i.type === 'Standard' || i.type === 'Integration')}
                  onSelectItem={onSelectItem}
                />
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <h3 className="text-xs font-semibold text-slate-500 uppercase col-span-full">Later</h3>
              {groupFocusByType ? (
                <>
                  <ItemList
                    typeLabel="Integration"
                    typeClass="bg-amber-50 text-amber-600"
                    items={laterItems.filter(i => i.type === 'Integration')}
                    onSelectItem={onSelectItem}
                  />
                  <ItemList
                    typeLabel="Standard"
                    typeClass="bg-blue-50 text-blue-600"
                    items={laterItems.filter(i => i.type === 'Standard')}
                    onSelectItem={onSelectItem}
                  />
                </>
              ) : (
                <ItemList
                  typeLabel="Focus"
                  typeClass="bg-indigo-50 text-indigo-600"
                  items={laterItems.filter(i => i.type === 'Standard' || i.type === 'Integration')}
                  onSelectItem={onSelectItem}
                />
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
