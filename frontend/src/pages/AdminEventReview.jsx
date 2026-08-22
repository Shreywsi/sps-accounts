import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, MessageSquare, Send, X } from "lucide-react";

import {
  getEventTree,
  getEventComments,
  createEventComment,
  approveEvent,
  rejectEvent,
} from "../api/events";

import CategoryTree from "../features/events/CategoryTree";
import EventStatusBadge from "../features/events/EventStatusBadge";

const inr = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

export default function AdminEventReview() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [categories, setCategories] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    Promise.all([getEventTree(eventId), getEventComments(eventId)]).then(
      ([treeRes, commentsRes]) => {
        if (ignore) return;
        setEvent(treeRes.data.event);
        setCategories(treeRes.data.categories);
        setComments(commentsRes.data.results || commentsRes.data);
        setLoading(false);
      }
    );
    return () => {
      ignore = true;
    };
  }, [eventId, reloadKey]);

  const reload = () => setReloadKey((k) => k + 1);

  const handleApprove = async () => {
    setBusy(true);
    try {
      await approveEvent(eventId);
      reload();
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async () => {
    setBusy(true);
    try {
      await rejectEvent(eventId, note.trim());
      setNote("");
      reload();
    } finally {
      setBusy(false);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!note.trim()) return;
    setBusy(true);
    try {
      await createEventComment({ event: eventId, message: note.trim() });
      setNote("");
      reload();
    } finally {
      setBusy(false);
    }
  };

  if (loading || !event) return <p className="text-sm text-gray-400">Loading…</p>;

  return (
    <div className="max-w-4xl">
      <button
        onClick={() => navigate("/admin/events")}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-4"
      >
        <ArrowLeft size={15} /> All events
      </button>

      <div className="bg-white border border-slate-200 rounded-lg p-5 mb-5">
        <div className="flex items-start justify-between gap-3 mb-1">
          <h1 className="text-lg font-semibold text-slate-900">{event.name}</h1>
          <EventStatusBadge status={event.status} />
        </div>
        <p className="text-xs text-slate-400 mb-2">
          {event.event_date} · submitted by {event.created_by_name}
        </p>
        {event.description && (
          <p className="text-sm text-slate-600 mb-3">{event.description}</p>
        )}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3 mb-4">
          <span className="text-sm text-slate-500">Total spent</span>
          <span className="text-lg font-semibold text-slate-900">
            {inr(event.total_amount)}
          </span>
        </div>

        {event.status === "SUBMITTED" && (
          <div className="flex gap-2">
            <button
              onClick={handleApprove}
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <Check size={15} /> Approve
            </button>
            <button
              onClick={handleReject}
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm rounded-md border border-rose-200 text-rose-600 hover:bg-rose-50 disabled:opacity-50"
            >
              <X size={15} /> Reject{note.trim() ? " with note" : ""}
            </button>
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-5 mb-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">
          Categories &amp; receipts
        </h2>
        {categories.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">
            No categories were added to this event.
          </p>
        ) : (
          <div className="space-y-1">
            {categories
              .slice()
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((cat) => (
                <CategoryTree key={cat.id} node={cat} readOnly />
              ))}
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5 mb-3">
          <MessageSquare size={15} /> Comments
        </h2>
        {comments.length === 0 ? (
          <p className="text-sm text-slate-400 mb-3">No comments yet.</p>
        ) : (
          <div className="space-y-2 mb-3">
            {comments.map((c) => (
              <div key={c.id} className="text-sm bg-slate-50 rounded-md px-3 py-2">
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-0.5">
                  <span className="font-medium text-slate-600">{c.author_name}</span>
                  <span>·</span>
                  <span>{c.author_role}</span>
                  {c.entry_title && (
                    <>
                      <span>·</span>
                      <span>on "{c.entry_title}"</span>
                    </>
                  )}
                </div>
                <p className="text-slate-700">{c.message}</p>
              </div>
            ))}
          </div>
        )}
        <form onSubmit={handleComment} className="flex gap-2">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a comment (also used as the reject note above)…"
            className="flex-1 border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!note.trim() || busy}
            className="px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
}
