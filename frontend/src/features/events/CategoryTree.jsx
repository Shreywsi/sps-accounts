/* ======================================================================
   features/events/CategoryTree.jsx
   Renders one category node: its own entries + a "+ Sub-category" /
   "+ Expense" affordance + recurses into its children. This is the
   single component that gives "category within category" — the same
   component just renders itself again for each child.

   Pass `readOnly` for the admin review screen (no add/delete, but
   entries + receipts still visible).
   ====================================================================== */

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderPlus,
  Paperclip,
  Plus,
  Receipt,
  Trash2,
} from "lucide-react";

const inr = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

export default function CategoryTree({
  node,
  depth = 0,
  readOnly = false,
  onAddSubCategory,
  onDeleteCategory,
  onAddEntry,
  onDeleteEntry,
}) {
  const [open, setOpen] = useState(true);
  const hasContent = node.children.length > 0 || node.entries.length > 0;

  return (
    <div className={depth > 0 ? "ml-5 border-l border-slate-200 pl-4" : ""}>
      <div className="flex items-center justify-between group py-1.5">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-800 hover:text-blue-600"
        >
          {hasContent ? (
            open ? <ChevronDown size={15} /> : <ChevronRight size={15} />
          ) : (
            <span className="w-[15px]" />
          )}
          <Folder size={15} className="text-amber-500" />
          {node.name}
          <span className="text-xs font-normal text-slate-400">
            {inr(node.subtotal)}
          </span>
        </button>

        {!readOnly && (
          <div className="hidden group-hover:flex items-center gap-1">
            <IconBtn title="Add sub-category" onClick={() => onAddSubCategory(node)}>
              <FolderPlus size={14} />
            </IconBtn>
            <IconBtn title="Add expense here" onClick={() => onAddEntry(node)}>
              <Plus size={14} />
            </IconBtn>
            <IconBtn
              title="Delete category"
              danger
              onClick={() => onDeleteCategory(node)}
            >
              <Trash2 size={14} />
            </IconBtn>
          </div>
        )}
      </div>

      {open && (
        <div className="pb-1">
          {node.entries.map((entry) => (
            <EntryRow
              key={entry.id}
              entry={entry}
              readOnly={readOnly}
              onDelete={() => onDeleteEntry(entry)}
            />
          ))}

          {node.children
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((child) => (
              <CategoryTree
                key={child.id}
                node={child}
                depth={depth + 1}
                readOnly={readOnly}
                onAddSubCategory={onAddSubCategory}
                onDeleteCategory={onDeleteCategory}
                onAddEntry={onAddEntry}
                onDeleteEntry={onDeleteEntry}
              />
            ))}
        </div>
      )}
    </div>
  );
}

function EntryRow({ entry, readOnly, onDelete }) {
  return (
    <div className="ml-5 pl-4 border-l border-slate-100 flex items-center justify-between py-1 text-sm group/entry">
      <div className="flex items-center gap-2 min-w-0">
        <Receipt size={13} className="text-slate-300 shrink-0" />
        <span className="text-slate-700 truncate">{entry.title}</span>
        <span className="text-xs text-slate-400 shrink-0">
          {entry.entry_date} · {entry.payment_method}
        </span>
        {entry.receipt_url && (
          <a
            href={entry.receipt_url}
            target="_blank"
            rel="noreferrer"
            className="text-blue-500 hover:text-blue-700 shrink-0"
            title="View receipt"
          >
            <Paperclip size={13} />
          </a>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="font-medium text-slate-800">{inr(entry.amount)}</span>
        {!readOnly && (
          <button
            onClick={onDelete}
            className="opacity-0 group-hover/entry:opacity-100 text-slate-300 hover:text-rose-500"
            title="Delete entry"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

function IconBtn({ children, onClick, title, danger }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`p-1 rounded hover:bg-slate-100 ${
        danger ? "text-rose-400 hover:text-rose-600" : "text-slate-400 hover:text-blue-600"
      }`}
    >
      {children}
    </button>
  );
}
