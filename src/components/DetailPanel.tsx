import type { RoadmapItem } from '../types';
import { formatWeekDate } from '../utils/dates';
import Markdown from 'react-markdown';
import { ProgressBar } from './ProgressBar';

interface Props {
  item: RoadmapItem | null;
  completionWeek: number | undefined;
  qaReleaseWeeks: number;
  onClose: () => void;
}

export function DetailPanel({ item, completionWeek, qaReleaseWeeks, onClose }: Props) {
  if (!item) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl border-l border-slate-200 z-50 flex flex-col animate-in slide-in-from-right">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: item.color }} />
          <h2 className="text-lg font-semibold text-slate-900 truncate">{item.title}</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {(item.deadline || item.deadlineNotes) && (
          <div className="rounded-lg border-2 border-red-300 bg-red-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-700">Deadline</p>
            {item.deadline && (
              <p className="mt-1 text-lg font-bold text-red-800">{item.deadline}</p>
            )}
            {item.deadlineNotes && (
              <div className="mt-2 text-sm text-red-900 leading-relaxed [&_p]:my-1 [&_ul]:my-1 [&_ul]:pl-4">
                <Markdown>{item.deadlineNotes}</Markdown>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Issue Key</p>
            {item.issueKey ? (
              <a
                href={`https://erinliving.atlassian.net/browse/${item.issueKey}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-sm font-mono text-indigo-600 hover:text-indigo-800 hover:underline transition"
              >
                {item.issueKey}
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
              </a>
            ) : (
              <p className="mt-1 text-sm font-mono text-slate-800">—</p>
            )}
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Type</p>
            <span className={`mt-1 inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
              item.type === 'Standard' ? 'bg-blue-50 text-blue-700' : item.type === 'Integration' ? 'bg-amber-50 text-amber-700' : 'bg-violet-50 text-violet-700'
            }`}>
              {item.type}
            </span>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Group</p>
            <p className="mt-1 text-sm text-slate-800">{item.group}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Remaining</p>
            <p className="mt-1 text-sm text-slate-800">
              {item.estimate !== null ? `${item.estimate} weeks` : 'Not estimated'}
            </p>
          </div>
        </div>

        {item.estimateTotal !== null && item.estimateTotal > 0 && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Progress</p>
              <p className="text-xs text-slate-500">
                {item.estimateTotal - (item.estimate ?? 0)}w of {item.estimateTotal}w completed
              </p>
            </div>
            <ProgressBar item={item} size="md" />
          </div>
        )}

        {(completionWeek !== undefined || item.estimate === 0) && (
          <div className="space-y-2">
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Dev Handover</p>
              <p className="mt-1 text-lg font-bold text-slate-800">
                {completionWeek !== undefined
                  ? `Week ${completionWeek + 1} — ${formatWeekDate(completionWeek)}`
                  : 'Complete'}
              </p>
            </div>
            <div className="rounded-lg bg-indigo-50 border border-indigo-100 p-4">
              <p className="text-xs font-medium text-indigo-600 uppercase tracking-wide">Projected Release</p>
              <p className="mt-1 text-lg font-bold text-indigo-900">
                {completionWeek !== undefined
                  ? `Week ${completionWeek + 1 + qaReleaseWeeks} — ${formatWeekDate(completionWeek + qaReleaseWeeks)}`
                  : `Week ${qaReleaseWeeks + 1} — ${formatWeekDate(qaReleaseWeeks)}`}
              </p>
              {qaReleaseWeeks > 0 && (
                <p className="mt-1 text-xs text-indigo-400">
                  {completionWeek !== undefined
                    ? `Includes ${qaReleaseWeeks}w QA & Release`
                    : `Dev work complete · ${qaReleaseWeeks}w QA & Release`}
                </p>
              )}
            </div>
          </div>
        )}

        {item.labels.length > 0 && (
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Labels</p>
            <div className="flex flex-wrap gap-1.5">
              {item.labels.map(label => (
                <span key={label} className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                  {label}
                </span>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Description</p>
          {item.description ? (
            <div className="prose prose-sm prose-slate max-w-none text-sm text-slate-700 leading-relaxed [&_h1]:text-base [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2 [&_h2]:text-sm [&_h2]:font-bold [&_h2]:mt-3 [&_h2]:mb-1.5 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1 [&_p]:my-1.5 [&_ul]:my-1.5 [&_ul]:pl-4 [&_ol]:my-1.5 [&_ol]:pl-4 [&_li]:my-0.5 [&_strong]:font-semibold [&_a]:text-indigo-600 [&_a]:underline [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_blockquote]:border-l-2 [&_blockquote]:border-slate-300 [&_blockquote]:pl-3 [&_blockquote]:text-slate-500 [&_blockquote]:italic">
              <Markdown>{item.description}</Markdown>
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">No description provided.</p>
          )}
        </div>
      </div>
    </div>
  );
}
