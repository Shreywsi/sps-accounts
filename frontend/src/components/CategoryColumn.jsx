/* ======================================================================
   components/CategoryColumn.jsx
   One column (income or expense) inside the "Manage Categories" modal.
   Lets anyone add a new category or remove an existing one — this is
   the "full freedom to add/delete categories like Excel" piece.
   ====================================================================== */

import { Plus, X } from "lucide-react";

export function CategoryColumn({ title, tone, items, value, onChange, onAdd, onDelete }) {
  const dot = tone === "emerald" ? "bg-emerald-500" : "bg-rose-500";
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        <h3 className="text-sm font-medium text-slate-700">{title}</h3>
      </div>

      <div className="border border-slate-200 rounded-md divide-y divide-slate-100 max-h-52 overflow-y-auto">
        {items.length === 0 && <div className="px-3 py-3 text-xs text-slate-400">No categories yet.</div>}
        {items.map((c) => (
          <div key={c} className="flex items-center justify-between px-3 py-1.5 text-sm text-slate-700">
            {c}
            <button onClick={() => onDelete(c)} className="text-slate-300 hover:text-rose-500">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-1.5 mt-2">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onAdd()}
          placeholder="Add category…"
          className="flex-1 min-w-0 border border-slate-200 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        <button onClick={onAdd} className="px-2.5 py-1.5 rounded-md bg-slate-900 text-white text-sm hover:bg-slate-800 shrink-0">
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}