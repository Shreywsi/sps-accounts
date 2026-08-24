import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, Trash2 } from "lucide-react";
import { getEvents, deleteEvent } from "../api/events";
import EventStatusBadge from "../features/events/EventStatusBadge";

const inr = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

const FILTERS = ["ALL", "DRAFT", "SUBMITTED", "APPROVED", "REJECTED"];

export default function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let ignore = false;
    getEvents(filter === "ALL" ? {} : { status: filter }).then((res) => {
      if (ignore) return;
      setEvents(res.data.results || res.data);
      setLoading(false);
    });
    return () => {
      ignore = true;
    };
  }, [filter]);

  const reload = () => {
    getEvents(filter === "ALL" ? {} : { status: filter }).then((res) =>
      setEvents(res.data.results || res.data)
    );
  };

  const handleDelete = async (ev, e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${ev.name}"? This can't be undone.`)) return;
    await deleteEvent(ev.id);
    reload();
  };

  return (
    <div className="max-w-4xl">
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Events</h1>
      <p className="text-sm text-gray-500 mb-5">
        Review folders operators have submitted, verify the categories and
        receipts inside, and approve or comment.
      </p>

      <div className="flex gap-2 mb-5">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-full border ${
              filter === f
                ? "bg-blue-600 text-white border-blue-600"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : events.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-10 text-center text-slate-400">
          Nothing here.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {events.map((ev) => (
            <div
              key={ev.id}
              onClick={() => navigate(`/admin/events/${ev.id}`)}
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
                {ev.event_date} · by {ev.created_by_name}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">{ev.entries_count} entries</span>
                <span className="font-semibold text-slate-800">{inr(ev.total_amount)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}