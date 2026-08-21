/* ======================================================================
   components/Badges.jsx
   Small presentational pieces used around the table: the four summary
   cards at the top, the Pending/Checked status pill, the "request
   approved/rejected" dismissible pill, and the sortable column header.
   ====================================================================== */

import { Check, Clock3, CheckCircle2, XCircle, X, ChevronUp, ChevronDown } from "lucide-react";

export function SummaryCard({ icon, label, value, tone, small }) {
  const tones = {
    emerald: "text-emerald-700 bg-emerald-50",
    rose: "text-rose-700 bg-rose-50",
    amber: "text-amber-700 bg-amber-50",
    indigo: "text-indigo-700 bg-indigo-50",
    slate: "text-slate-700 bg-slate-100",
  };
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3.5">
      <div className={`inline-flex items-center justify-center h-7 w-7 rounded-md mb-2 ${tones[tone]}`}>{icon}</div>
      <div className="text-slate-400 text-xs">{label}</div>
      <div className={`font-serif ${small ? "text-base" : "text-lg"} text-slate-900 tabular-nums`}>{value}</div>
    </div>
  );
}

export function StatusBadge({ status }) {
  return status === "checked" ? (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
      <Check size={11} /> Checked
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
      <Clock3 size={11} /> Pending
    </span>
  );
}

// Shown briefly on a row after the admin approves/rejects an operator's
// change request, so the operator knows what happened. Dismissible.
export function ResolvedBadge({ request, onDismiss }) {
  const approved = request.status === "approved";
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-medium pl-2 pr-1 py-0.5 rounded-full ${approved ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-700"}`}>
      {approved ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
      {approved ? "Request approved" : "Request rejected"}
      <button onClick={onDismiss} className="ml-0.5 hover:opacity-70">
        <X size={10} />
      </button>
    </span>
  );
}

export function Th({ label, sortKey, sort, onSort, right }) {
  const active = sort.key === sortKey;
  return (
    <th onClick={() => onSort(sortKey)} className={`px-3 py-2.5 font-medium cursor-pointer select-none hover:text-slate-700 ${right ? "text-right" : ""}`}>
      <span className={`inline-flex items-center gap-1 ${right ? "flex-row-reverse" : ""}`}>
        {label}
        {active && (sort.dir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
      </span>
    </th>
  );
}