import { useMemo } from 'react';
import type { RoadmapItem, Workstream, ScheduleResult } from '../types';
import {
  getOriginJan1,
  groupWeeksByMonthFromJan1,
  isWeekInPast,
  dateToWeekOffset,
} from '../utils/dates';

interface Props {
  schedule: ScheduleResult;
  streams: Workstream[];
  items: RoadmapItem[];
  selectedItemId: string | null;
  onSelectItem: (id: string) => void;
}

const WEEKS_PER_ROW = 26;

export function TimelineGrid({ schedule, streams, items, selectedItemId, onSelectItem }: Props) {
  const itemMap = useMemo(() => {
    const m: Record<string, RoadmapItem> = {};
    items.forEach(i => { m[i.id] = i; });
    return m;
  }, [items]);

  const origin = useMemo(() => getOriginJan1(new Date().getFullYear()), []);
  const todayCalendarWeek = useMemo(() => dateToWeekOffset(new Date(), origin), [origin]);

  const weekCount = useMemo(
    () => Math.max(todayCalendarWeek + schedule.totalWeeks, 52),
    [todayCalendarWeek, schedule.totalWeeks]
  );

  const blockLookup = useMemo(() => {
    const lookup: Record<string, Record<number, string>> = {};
    streams.forEach(s => { lookup[s.id] = {}; });
    schedule.blocks.forEach(b => {
      if (!lookup[b.streamId]) lookup[b.streamId] = {};
      lookup[b.streamId][b.week] = b.itemId;
    });
    return lookup;
  }, [schedule, streams]);

  const rows = useMemo(
    () => groupWeeksByMonthFromJan1(weekCount, origin, WEEKS_PER_ROW),
    [weekCount, origin]
  );

  const hasSelection = selectedItemId !== null;

  function renderCell(stream: Workstream, calendarWeek: number) {
    const scheduleWeek = calendarWeek - todayCalendarWeek;
    const itemId = scheduleWeek >= 0 ? blockLookup[stream.id]?.[scheduleWeek] : undefined;
    const item = itemId ? itemMap[itemId] : null;
    const isPast = isWeekInPast(calendarWeek, origin);
    const isUnavailable =
      scheduleWeek >= 0 &&
      ((stream.startWeek !== null && scheduleWeek < stream.startWeek) ||
        (stream.endWeek !== null && scheduleWeek > stream.endWeek));
    const isSelected = item && item.id === selectedItemId;
    const isDimmed = hasSelection && item && item.id !== selectedItemId;

    let bg: string | undefined;
    if (item) {
      if (isPast) {
        bg = '#e2e8f0';
      } else if (isDimmed) {
        bg = '#d1d5db';
      } else {
        bg = item.color;
      }
    } else if (isPast) {
      bg = '#e2e8f0';
    }

    return (
      <div
        key={calendarWeek}
        className={`w-10 min-w-10 h-9 border-r border-slate-50 flex-shrink-0 transition-all duration-150
          ${isUnavailable ? 'bg-slate-100 bg-stripes' : ''}
          ${isPast ? 'opacity-80' : ''}
          ${isSelected ? 'ring-3 ring-indigo-500 ring-inset z-10 scale-110 rounded-sm shadow-lg' : ''}
          ${item ? 'cursor-pointer' : ''}
          ${isDimmed ? 'opacity-50' : ''}
        `}
        style={bg ? { backgroundColor: bg } : undefined}
        onClick={() => item && onSelectItem(item.id)}
        title={
          item
            ? `${item.title} (Week ${scheduleWeek + 1})`
            : isUnavailable
              ? 'Unavailable'
              : isPast
                ? 'Past'
                : `Week ${calendarWeek + 1}`
        }
      >
        {isSelected && (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full shadow" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {rows.map((rowGroups, rowIdx) => {
        const allWeeksInRow = rowGroups.flatMap(g => g.weeks);
        return (
          <div key={rowIdx} className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="min-w-fit">
              <div className="flex border-b border-slate-200 sticky top-0 bg-white z-10">
                <div className="w-36 min-w-36 px-3 py-2 text-xs font-medium text-slate-500 border-r border-slate-100 flex-shrink-0">
                  {rowIdx === 0 ? 'Stream' : ''}
                </div>
                {rowGroups.map((group, gIdx) => (
                  <div
                    key={`${rowIdx}-${gIdx}-${group.label}`}
                    className="text-center text-xs font-semibold text-slate-600 py-2 border-r border-slate-100 flex-shrink-0 bg-slate-50/50"
                    style={{
                      width: `${group.weeks.length * 2.5}rem`,
                      minWidth: `${group.weeks.length * 2.5}rem`,
                    }}
                  >
                    {group.label}
                  </div>
                ))}
              </div>

              {streams.map(stream => (
                <div key={stream.id} className="flex border-b border-slate-100 last:border-b-0">
                  <div className="w-36 min-w-36 px-3 py-2 flex items-center gap-2 border-r border-slate-100 flex-shrink-0">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        stream.type === 'Standard'
                          ? 'bg-blue-500'
                          : stream.type === 'Integration'
                            ? 'bg-orange-600'
                            : 'bg-violet-500'
                      }`}
                    />
                    <span className="text-xs font-medium text-slate-700 truncate">{stream.name}</span>
                  </div>
                  {allWeeksInRow.map(w => renderCell(stream, w))}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
