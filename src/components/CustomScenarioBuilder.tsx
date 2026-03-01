import { useState } from 'react';
import type { CustomItem, ItemType } from '../types';

interface Props {
  nowItemCount: number;
  onAdd: (item: CustomItem) => void;
  customItems: CustomItem[];
  onRemove: (id: string) => void;
}

let nextId = 1;

export function CustomScenarioBuilder({ nowItemCount, onAdd, customItems, onRemove }: Props) {
  const [name, setName] = useState('');
  const [type, setType] = useState<ItemType>('Standard');
  const [estimate, setEstimate] = useState(2);
  const [position, setPosition] = useState(1);

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd({
      id: `custom-${nextId++}`,
      title: name.trim(),
      type,
      estimate,
      insertAtIndex: Math.max(0, position - 1),
    });
    setName('');
    setEstimate(2);
    setPosition(nowItemCount + 1);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
        <h3 className="text-sm font-semibold text-slate-800">Custom Items</h3>
        <p className="text-xs text-slate-500 mt-0.5">Add temporary items to test impact</p>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex flex-wrap gap-2 items-end">
          <label className="flex-1 min-w-[140px]">
            <span className="text-xs text-slate-500 block mb-1">Name</span>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Feature X"
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </label>
          <label>
            <span className="text-xs text-slate-500 block mb-1">Type</span>
            <select
              value={type}
              onChange={e => setType(e.target.value as ItemType)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            >
              <option value="Standard">Standard</option>
              <option value="Integration">Integration</option>
              <option value="Dev-design pair">Dev-design pair</option>
            </select>
          </label>
          <label>
            <span className="text-xs text-slate-500 block mb-1">Weeks</span>
            <input
              type="number"
              min={1}
              value={estimate}
              onChange={e => setEstimate(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-16 rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </label>
          <label>
            <span className="text-xs text-slate-500 block mb-1">Position</span>
            <input
              type="number"
              min={1}
              max={nowItemCount + 1}
              value={position}
              onChange={e => setPosition(parseInt(e.target.value) || 1)}
              className="w-16 rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </label>
          <button
            onClick={handleAdd}
            disabled={!name.trim()}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Add
          </button>
        </div>

        {customItems.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            {customItems.map(ci => (
              <div key={ci.id} className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-emerald-800">{ci.title}</p>
                  <p className="text-xs text-emerald-500">
                    {ci.type} · {ci.estimate}w · Position {ci.insertAtIndex + 1}
                  </p>
                </div>
                <button
                  onClick={() => onRemove(ci.id)}
                  className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 transition"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
