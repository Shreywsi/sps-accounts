import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Clock3,
  FolderPlus,
  Lock,
  MessageSquare,
  Maximize2,
  Minimize2,
  Send,
  ShieldAlert,
} from "lucide-react";

import {
  getEventTree,
  createEventCategory,
  deleteEventCategory,
  createEventEntry,
  deleteEventEntry,
  getEventComments,
  createEventComment,
  getEventEditRequests,
  createEventEditRequest,
  updateEvent,
} from "../../api/events";

import CategoryTree from "../../features/events/CategoryTree";
import EventStatusBadge from "../../features/events/EventStatusBadge";
import { CategoryFormModal, EntryFormModal, EditRequestModal } from "../../features/events/EventFormModals";

const inr = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

export default function OperatorEventDetail() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [categories, setCategories] = useState([]);
  const [comments, setComments] = useState([]);
  const [editRequests, setEditRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fullscreen, setFullscreen] = useState(false);

  // modal state
  const [categoryModal, setCategoryModal] = useState(null); // { parent } | null
  const [entryModal, setEntryModal] = useState(null); // category | null
  const [editRequestModal, setEditRequestModal] = useState(false);
  const [reply, setReply] = useState("");

  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    let ignore = false;
    Promise.all([
      getEventTree(eventId),
      getEventComments(eventId),
      getEventEditRequests({ event: eventId }),
    ])
      .then(([treeRes, commentsRes, editRequestsRes]) => {
        if (ignore) return;
        setEvent(treeRes.data.event);
        setCategories(treeRes.data.categories);
        setComments(commentsRes.data.results || commentsRes.data);
        setEditRequests(editRequestsRes.data.results || editRequestsRes.data);
      })
      .catch(() => {
        if (!ignore) setError("Couldn't load this event.");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [eventId, reloadKey]);

  const locked = event?.status === "APPROVED";
  const pendingEditRequest = editRequests.find((r) => r.status === "PENDING");
  const lastEditRequest = editRequests[0];

  const handleRequestEdit = async (reason) => {
    await createEventEditRequest(eventId, reason);
    reload();
  };

  const handleAddSubCategory = async (name) => {
    await createEventCategory({
      event: eventId,
      parent: categoryModal?.parent?.id || null,
      name,
    });
    reload();
  };

  const handleDeleteCategory = async (node) => {
    const count = countEntries(node);
    const msg =
      count > 0
        ? `Delete "${node.name}" and its ${count} expense${count === 1 ? "" : "s"}? This can't be undone.`
        : `Delete "${node.name}"?`;
    if (!window.confirm(msg)) return;
    await deleteEventCategory(node.id);
    reload();
  };

  const handleAddEntry = async (payload) => {
    await createEventEntry(payload);
    reload();
  };

  const handleDeleteEntry = async (entry) => {
    if (!window.confirm(`Delete "${entry.title}"?`)) return;
    await deleteEventEntry(entry.id);
    reload();
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    await createEventComment({ event: eventId, message: reply.trim() });
    setReply("");
    reload();
  };

  const handleSubmitEvent = async () => {
    try {
      await updateEvent(eventId, { status: "SUBMITTED" });
      reload();
    } catch (err) {
      alert("Failed to submit event. Please try again.");
    }
  };

  if (loading) return <p className="text-sm text-gray-400">Loading…</p>;
  if (error || !event) return <p className="text-sm text-rose-500">{error}</p>;

  return (
    <div
      className={
        fullscreen
          ? "fixed inset-0 z-40 bg-slate-50 overflow-y-auto px-4 md:px-10 py-6"
          : "max-w-4xl"
      }
    >
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate("/operator/events")}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft size={15} /> All events
        </button>

        <button
          onClick={() => setFullscreen((f) => !f)}
          className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border border-slate-200 hover:bg-white text-slate-600 bg-white/60"
        >
          {fullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          {fullscreen ? "Exit fullscreen" : "Fullscreen"}
        </button>
      </div>

      <div className={fullscreen ? "max-w-4xl mx-auto" : ""}>

      <div className="bg-white border border-slate-200 rounded-lg p-5 mb-5">
        <div className="flex items-start justify-between gap-3 mb-1">
          <h1 className="text-lg font-semibold text-slate-900">{event.name}</h1>
          <EventStatusBadge status={event.status} />
        </div>
        <p className="text-xs text-slate-400 mb-2">{event.event_date}</p>
        {event.description && (
          <p className="text-sm text-slate-600 mb-3">{event.description}</p>
        )}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="text-sm text-slate-500">Total spent</span>
          <span className="text-lg font-semibold text-slate-900">
            {inr(event.total_amount)}
          </span>
        </div>

        {locked && pendingEditRequest && (
          <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-md px-3 py-2">
            <Clock3 size={14} className="text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700">
              Edit request sent — waiting on admin approval.
            </p>
          </div>
        )}

        {locked && !pendingEditRequest && (
          <div className="mt-3 flex items-start justify-between gap-3 bg-emerald-50 border border-emerald-100 rounded-md px-3 py-2">
            <div className="flex items-start gap-2">
              <Lock size={14} className="text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-emerald-700">
                  This event is approved and locked from further edits.
                </p>
                {lastEditRequest?.status === "DENIED" && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                    <ShieldAlert size={12} /> Last request was denied
                    {lastEditRequest.admin_note ? `: ${lastEditRequest.admin_note}` : "."}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => setEditRequestModal(true)}
              className="shrink-0 text-xs px-2.5 py-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
            >
              Request edit
            </button>
          </div>
        )}

        {event.status === "REJECTED" && (
          <p className="text-xs text-rose-600 mt-2">
            This event was rejected — check the comments below, fix it up, and it'll
            go back to "Submitted" the next time you edit it.
          </p>
        )}

        {event.status === "DRAFT" && (
          <button
            onClick={handleSubmitEvent}
            className="mt-3 w-full text-xs px-2.5 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700"
          >
            Submit for review
          </button>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-5 mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-700">Categories</h2>
          {!locked && (
            <button
              onClick={() => setCategoryModal({ parent: null })}
              className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-600"
            >
              <FolderPlus size={13} /> New category
            </button>
          )}
        </div>

        {categories.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">
            No categories yet — add one (e.g. "Food Ingredients") to start
            logging expenses.
          </p>
        ) : (
          <div className="space-y-1">
            {categories
              .slice()
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((cat) => (
                <CategoryTree
                  key={cat.id}
                  node={cat}
                  readOnly={locked}
                  onAddSubCategory={(node) => setCategoryModal({ parent: node })}
                  onDeleteCategory={handleDeleteCategory}
                  onAddEntry={(node) => setEntryModal(node)}
                  onDeleteEntry={handleDeleteEntry}
                />
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
        <form onSubmit={handleSendReply} className="flex gap-2">
          <input
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Reply to a comment…"
            className="flex-1 border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!reply.trim()}
            className="px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Send size={15} />
          </button>
        </form>
      </div>

      {categoryModal && (
        <CategoryFormModal
          parentCategory={categoryModal.parent}
          onClose={() => setCategoryModal(null)}
          onSubmit={handleAddSubCategory}
        />
      )}

      {entryModal && (
        <EntryFormModal
          category={entryModal}
          defaultDate={event.event_date}
          onClose={() => setEntryModal(null)}
          onSubmit={handleAddEntry}
        />
      )}

      </div>

      {editRequestModal && (
        <EditRequestModal
          eventName={event.name}
          onClose={() => setEditRequestModal(false)}
          onSubmit={handleRequestEdit}
        />
      )}
    </div>
  );
}

function countEntries(node) {
  let count = node.entries.length;
  for (const child of node.children) count += countEntries(child);
  return count;
}