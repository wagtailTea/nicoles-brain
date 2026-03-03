import type { RoadmapItem } from '../types';

interface Props {
  title: string;
  items: RoadmapItem[];
}

export function BusinessAsUsualTiles({ title, items }: Props) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        <p className="text-xs text-slate-500 mt-0.5">{items.length} items</p>
      </div>
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.length === 0 ? (
          <p className="text-sm text-slate-400 col-span-full">No items</p>
        ) : (
          items.map(item => (
            <div
              key={item.id}
              className="rounded-lg border border-violet-100 bg-violet-50/50 p-3 text-left"
            >
              <p className="text-sm font-medium text-slate-800">{item.title}</p>
              {item.description && (
                <p className="text-xs text-slate-600 mt-1 line-clamp-3">{item.description}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
