/* ======================================================================
   components/Modal.jsx
   Generic popup shell (used for Add Entry, Request Change, Categories,
   Confirm Delete, Confirm Reset) + a small labeled-field wrapper used
   inside forms.
   ====================================================================== */

import { X } from "lucide-react";

export function Modal({ children, title, onClose, wide, small }) {
  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-white rounded-lg shadow-xl w-full ${small ? "max-w-sm" : wide ? "max-w-2xl" : "max-w-lg"} max-h-[90vh] overflow-y-auto p-5`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-lg text-slate-900">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-slate-100 text-slate-400">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, children, full }) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="block text-xs font-medium text-slate-500 mb-1">{label}</span>
      {children}
    </label>
  );
}