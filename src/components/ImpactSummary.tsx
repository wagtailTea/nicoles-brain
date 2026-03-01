import type { ImpactSummary as ImpactSummaryType } from '../types';
import { formatWeekDate } from '../utils/dates';

interface Props {
  impact: ImpactSummaryType;
  qaReleaseWeeks: number;
}

export function ImpactSummary({ impact, qaReleaseWeeks }: Props) {
  const offset = qaReleaseWeeks;

  const cards = [
    {
      label: 'Horizon 1 delivered',
      value: impact.overallFinish,
      accent: 'from-indigo-500 to-purple-500',
    },
    {
      label: 'Standard Released',
      value: impact.standardFinish,
      accent: 'from-blue-500 to-cyan-500',
    },
    {
      label: 'Integration Released',
      value: impact.integrationFinish,
      accent: 'from-amber-500 to-orange-500',
    },
    {
      label: 'Dev-design pair Released',
      value: impact.devDesignPairFinish,
      accent: 'from-violet-500 to-purple-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {cards.map(card => {
        const adjusted = card.value !== null ? card.value + offset : null;
        return (
          <div
            key={card.label}
            className="relative overflow-hidden rounded-xl bg-white border border-slate-200 p-5 shadow-sm"
          >
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.accent}`} />
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{card.label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {adjusted !== null ? `Week ${adjusted + 1}` : '—'}
            </p>
            <p className="text-sm text-slate-400">
              {adjusted !== null ? formatWeekDate(adjusted) : 'No data'}
            </p>
            {card.value !== null && offset > 0 && (
              <p className="text-[10px] text-slate-400 mt-0.5">
                Dev handover Wk {card.value + 1} + {offset}w QA
              </p>
            )}
          </div>
        );
      })}

      <div className="relative overflow-hidden rounded-xl bg-white border border-slate-200 p-5 shadow-sm">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-pink-500" />
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Bottleneck</p>
        <p className="mt-1 text-2xl font-bold text-slate-900">
          {impact.bottleneckStream ?? '—'}
        </p>
        <p className="text-sm text-slate-400">Last stream to finish</p>
      </div>
    </div>
  );
}
