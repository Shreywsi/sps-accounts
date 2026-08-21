/* ======================================================================
   components/ApprovalsPanel.jsx
   The admin-only "Approvals" tab. Lists every pending change/delete
   request across both ledgers, shows a before → after diff, and lets
   the admin approve or reject with an optional note.
   ====================================================================== */

import { ThumbsUp, ThumbsDown, CheckCircle2, MessageSquareWarning } from "lucide-react";
import { LEDGER_META, inr, formatDate, formatDateTime } from "../constants";

export function ApprovalsPanel({ pendingApprovals, reviewNote, setReviewNote, resolveRequest }) {
  if (pendingApprovals.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-10 text-center text-slate-400">
        <CheckCircle2 size={28} className="mx-auto mb-2 text-slate-300" />
        No change or deletion requests waiting for review.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {pendingApprovals.map(({ ledger, txn }) => {
        const req = txn.changeRequest;
        const M = LEDGER_META[ledger];
        return (
          <div key={txn.id} className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{M.short}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${req.kind === "delete" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}>
                    {req.kind === "delete" ? "Deletion request" : "Change request"}
                  </span>
                </div>
                <div className="font-serif text-slate-900">
                  {formatDate(txn.date)} · {txn.category} · {txn.party} · {inr(txn.amount)}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Requested by {req.requestedBy} on {formatDateTime(req.requestedAt)}
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-start gap-2 bg-slate-50 rounded-md px-3 py-2 text-sm text-slate-600">
              <MessageSquareWarning size={15} className="mt-0.5 shrink-0 text-slate-400" />
              <span>{req.reason}</span>
            </div>

            {req.kind === "edit" && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs bg-amber-50/60 border border-amber-100 rounded-md p-3">
                <DiffRow label="Date" from={txn.date} to={req.proposed.date} />
                <DiffRow label="Type" from={txn.type} to={req.proposed.type} />
                <DiffRow label="Category" from={txn.category} to={req.proposed.category} />
                <DiffRow label={ledger === "student" ? "Student" : "Party"} from={txn.party} to={req.proposed.party} />
                {ledger === "student" && <DiffRow label="Class" from={txn.className || "—"} to={req.proposed.className || "—"} />}
                <DiffRow label="Mode" from={txn.mode} to={req.proposed.mode} />
                <DiffRow label="Amount" from={inr(txn.amount)} to={inr(req.proposed.amount)} />
                <DiffRow label="Remarks" from={txn.remarks || "—"} to={req.proposed.remarks || "—"} />
              </div>
            )}

            <input
              value={reviewNote[txn.id] || ""}
              onChange={(e) => setReviewNote((r) => ({ ...r, [txn.id]: e.target.value }))}
              placeholder="Optional note back to the operator…"
              className="mt-3 w-full border border-slate-200 rounded-md px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />

            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => resolveRequest(ledger, txn.id, "reject")}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm rounded-md border border-slate-200 text-rose-600 hover:bg-rose-50"
              >
                <ThumbsDown size={14} /> Reject
              </button>
              <button
                onClick={() => resolveRequest(ledger, txn.id, "approve")}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <ThumbsUp size={14} /> Approve
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DiffRow({ label, from, to }) {
  const changed = String(from) !== String(to);
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-slate-400 w-16 shrink-0">{label}</span>
      {changed ? (
        <span>
          <span className="line-through text-slate-400">{from}</span>{" "}
          <span className="text-amber-800 font-medium">→ {to}</span>
        </span>
      ) : (
        <span className="text-slate-500">{from}</span>
      )}
    </div>
  );
}