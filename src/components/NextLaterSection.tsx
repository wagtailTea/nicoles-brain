import type { RoadmapItem } from '../types';
import { ProgressBar } from './ProgressBar';

interface Props {
  sectionTitle: string;
  variant: 'next' | 'later';
  items: RoadmapItem[];
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
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${typeClass}`}>
                  {typeLabel}
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

export function NextLaterSection({ sectionTitle, variant, items, onSelectItem }: Props) {
  const standardItems = items.filter(item => item.type === 'Standard');
  const integrationItems = items.filter(item => item.type === 'Integration');
  const devDesignPairItems = items.filter(item => item.type === 'Dev-design pair');

  const bgColor = variant === 'next' ? '#e6f4ea' : '#ddebd8';

  return (
    <section className="w-full">
      <div
        className="rounded-2xl border border-slate-200 px-5 py-4 space-y-4"
        style={{ backgroundColor: bgColor }}
      >
        <div className="flex items-baseline justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-slate-400" />
            <h2 className="text-sm font-semibold text-slate-800 tracking-wide uppercase">
              {sectionTitle}
            </h2>
          </div>
          <p className="text-xs text-slate-500 italic">
            Loosely prioritised future work — estimates indicative only
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ItemList
            typeLabel="Integration"
            typeClass="bg-amber-50 text-amber-600"
            items={integrationItems}
            onSelectItem={onSelectItem}
          />
          <ItemList
            typeLabel="Standard"
            typeClass="bg-blue-50 text-blue-600"
            items={standardItems}
            onSelectItem={onSelectItem}
          />
          <ItemList
            typeLabel="Dev-design pair"
            typeClass="bg-violet-50 text-violet-600"
            items={devDesignPairItems}
            onSelectItem={onSelectItem}
          />
        </div>
      </div>
    </section>
  );
}
