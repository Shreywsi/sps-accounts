import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, CalendarDays, Trash2 } from "lucide-react";
import { getEvents, createEvent, deleteEvent } from "../../api/events";
import { Modal, Field } from "../../components/Modal";
import EventStatusBadge from "../../features/events/EventStatusBadge";

const inr = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

export default function OperatorEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const load = async () => {
    setError("");
    try {
      const res = await getEvents();
      setEvents(res.data.results || res.data);
    } catch (err) {
      setError(
        err?.response
          ? `Couldn't load events (${err.response.status}). ${
              err.response.data?.detail || ""
            }`
          : "Couldn't reach the server — check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (data) => {
    const res = await createEvent(data);
    await load();
    navigate(`/operator/events/${res.data.id}`);
  };

  const handleDelete = async (ev, e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${ev.name}"? This can't be undone.`)) return;
    try {
      await deleteEvent(ev.id);
      await load();
    } catch {
      alert("Couldn't delete this event — it may already be approved and locked.");
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Events</h1>
          <p className="text-sm text-gray-500">
            One folder per occasion — picnic, sports day, etc. Add categories
            and expenses inside, then submit for admin review.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700"
        >
          <Plus size={16} /> New event
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-6 text-center text-rose-600 text-sm">
          {error}
          <button
            onClick={load}
            className="block mx-auto mt-3 px-3 py-1.5 text-xs rounded-md border border-rose-300 hover:bg-rose-100"
          >
            Retry
          </button>
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-10 text-center text-slate-400">
          No events yet. Create your first one to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {events.map((ev) => (
            <div
              key={ev.id}
              onClick={() => navigate(`/operator/events/${ev.id}`)}
              className="text-left bg-white border border-slate-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition cursor-pointer group relative"
            >
              <button
                onClick={(e) => handleDelete(ev, e)}
                title="Delete event"
                className="absolute top-3 right-3 p-1.5 rounded-md text-slate-300 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition"
              >
                <Trash2 size={15} />
              </button>

              <div className="flex items-center justify-between mb-1 pr-8">
                <span className="font-medium text-slate-900">{ev.name}</span>
                <EventStatusBadge status={ev.status} />
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
                <CalendarDays size={13} />
                {ev.event_date}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">{ev.entries_count} entries</span>
                <span className="font-semibold text-slate-800">{inr(ev.total_amount)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateEventModal onClose={() => setShowCreate(false)} onSubmit={handleCreate} />
      )}
    </div>
  );
}

function CreateEventModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({
    name: "",
    event_date: new Date().toISOString().slice(0, 10),
    description: "",
  });
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await onSubmit(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="New event folder" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Event name">
          <input
            autoFocus
            value={form.name}
            onChange={set("name")}
            placeholder="e.g. Annual Picnic"
            className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </Field>
        <Field label="Date">
          <input
            type="date"
            value={form.event_date}
            onChange={set("event_date")}
            className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </Field>
        <Field label="Description (optional)">
          <textarea
            value={form.description}
            onChange={set("description")}
            rows={2}
            className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </Field>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3.5 py-2 text-sm rounded-md border border-slate-200">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !form.name.trim()}
            className="px-3.5 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Creating…" : "Create"}
          </button>
        </div>
      </form>
    </Modal>
  );
}