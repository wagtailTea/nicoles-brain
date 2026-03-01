import type { RoadmapItem } from '../types';

interface Props {
  item: RoadmapItem;
  size?: 'sm' | 'md';
}

export function ProgressBar({ item, size = 'sm' }: Props) {
  const total = item.estimateTotal;
  const remaining = item.estimate;

  if (total === null || total <= 0) return null;

  const completed = total - (remaining ?? 0);
  const pct = Math.round(Math.min(100, Math.max(0, (completed / total) * 100)));
  const isComplete = pct >= 100;

  const h = size === 'sm' ? 'h-1.5' : 'h-2.5';

  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 ${h} rounded-full bg-slate-200 overflow-hidden`}>
        <div
          className={`${h} rounded-full transition-all duration-300 ${
            isComplete ? 'bg-emerald-500' : 'bg-indigo-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`flex-shrink-0 font-medium ${
        size === 'sm' ? 'text-[10px]' : 'text-xs'
      } ${isComplete ? 'text-emerald-600' : 'text-slate-500'}`}>
        {pct}%
      </span>
    </div>
  );
}
