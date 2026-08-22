import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, FolderPlus, MessageSquare, Send } from "lucide-react";

import {
  getEventTree,
  createEventCategory,
  deleteEventCategory,
  createEventEntry,
  deleteEventEntry,
  getEventComments,
  createEventComment,
} from "../../api/events";

import CategoryTree from "../../features/events/CategoryTree";
import EventStatusBadge from "../../features/events/EventStatusBadge";
import { CategoryFormModal, EntryFormModal } from "../../features/events/EventFormModals";

const inr = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

export default function OperatorEventDetail() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [categories, setCategories] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // modal state
  const [categoryModal, setCategoryModal] = useState(null); // { parent } | null
  const [entryModal, setEntryModal] = useState(null); // category | null
  const [reply, setReply] = useState("");

  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    let ignore = false;
    Promise.all([getEventTree(eventId), getEventComments(eventId)])
      .then(([treeRes, commentsRes]) => {
        if (ignore) return;
        setEvent(treeRes.data.event);
        setCategories(treeRes.data.categories);
        setComments(commentsRes.data.results || commentsRes.data);
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

  if (loading) return <p className="text-sm text-gray-400">Loading…</p>;
  if (error || !event) return <p className="text-sm text-rose-500">{error}</p>;

  return (
    <div className="max-w-4xl">
      <button
        onClick={() => navigate("/operator/events")}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-4"
      >
        <ArrowLeft size={15} /> All events
      </button>

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
        {locked && (
          <p className="text-xs text-emerald-600 mt-2">
            This event is approved and locked from further edits.
          </p>
        )}
        {event.status === "REJECTED" && (
          <p className="text-xs text-rose-600 mt-2">
            This event was rejected — check the comments below, fix it up, and it'll
            go back to "Submitted" the next time you edit it.
          </p>
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
  );
}

function countEntries(node) {
  let count = node.entries.length;
  for (const child of node.children) count += countEntries(child);
  return count;
}
