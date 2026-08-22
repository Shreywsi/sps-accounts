import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Clock3, FileEdit, X } from "lucide-react";

import {
  getEventEditRequests,
  approveEventEditRequest,
  denyEventEditRequest,
} from "../api/events";

const STATUS_STYLES = {
  PENDING: "bg-amber-50 text-amber-700",
  APPROVED: "bg-emerald-50 text-emerald-700",
  DENIED: "bg-rose-50 text-rose-700",
};

function StatusBadge({ status }) {
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  );
}

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AdminRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    getEventEditRequests().then((res) => {
      if (ignore) return;
      setRequests(res.data.results || res.data);
      setLoading(false);
    });
    return () => {
      ignore = true;
    };
  }, [reloadKey]);

  const reload = () => setReloadKey((k) => k + 1);

  const pending = requests.filter((r) => r.status === "PENDING");
  const history = requests.filter((r) => r.status !== "PENDING");

  const handleApprove = async (id) => {
    setBusyId(id);
    try {
      await approveEventEditRequest(id);
      reload();
    } finally {
      setBusyId(null);
    }
  };

  const handleDeny = async (id) => {
    const note = prompt("Optional note for the operator (why you're denying this):") || "";
    setBusyId(id);
    try {
      await denyEventEditRequest(id, note);
      reload();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <FileEdit size={18} /> Operator Requests
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Every edit request operators send for locked events, all in one place.
        </p>
      </div>

      <section className="bg-white border border-slate-200 rounded-lg p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
          <Clock3 size={14} /> Pending ({pending.length})
        </h2>

        {loading ? (
          <p className="text-sm text-slate-400 py-4">Loading…</p>
        ) : pending.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">
            No pending requests right now.
          </p>
        ) : (
          <div className="space-y-2">
            {pending.map((r) => (
              <div
                key={r.id}
                className="flex items-start justify-between gap-3 border border-amber-100 bg-amber-50/50 rounded-md px-3 py-2.5"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-slate-800">{r.requested_by_name}</span>
                    <span className="text-slate-400">requested to edit</span>
                    <Link
                      to={`/admin/events/${r.event}`}
                      className="font-medium text-blue-600 hover:underline truncate"
                    >
                      {r.event_name}
                    </Link>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{r.reason}</p>
                  <p className="text-xs text-slate-400 mt-1">{timeAgo(r.created_at)}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleApprove(r.id)}
                    disabled={busyId === r.id}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <Check size={12} /> Approve
                  </button>
                  <button
                    onClick={() => handleDeny(r.id)}
                    disabled={busyId === r.id}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md border border-rose-200 text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                  >
                    <X size={12} /> Deny
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="bg-white border border-slate-200 rounded-lg p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">History</h2>
        {history.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">No reviewed requests yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[700px]">
              <thead className="text-xs text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="py-2 pr-3 font-medium">Operator</th>
                  <th className="py-2 pr-3 font-medium">Event</th>
                  <th className="py-2 pr-3 font-medium">Reason</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 pr-3 font-medium">Reviewed by</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((r) => (
                  <tr key={r.id}>
                    <td className="py-2 pr-3 text-slate-700">{r.requested_by_name}</td>
                    <td className="py-2 pr-3">
                      <Link to={`/admin/events/${r.event}`} className="text-blue-600 hover:underline">
                        {r.event_name}
                      </Link>
                    </td>
                    <td className="py-2 pr-3 text-slate-500 max-w-xs truncate">{r.reason}</td>
                    <td className="py-2 pr-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="py-2 pr-3 text-slate-500">{r.reviewed_by_name || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}