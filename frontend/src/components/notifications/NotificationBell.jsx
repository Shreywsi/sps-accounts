import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import {
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "../../api/notifications";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const boxRef = useRef(null);

  const loadUnread = async () => {
    try {
      const res = await getUnreadCount();
      setUnread(res.data.unread_count);
    } catch {
      // ignore, next poll will retry
    }
  };

  const loadList = async () => {
    try {
      const res = await getNotifications();
      setItems(res.data.results || res.data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadUnread();
    const interval = setInterval(loadUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOpen = async () => {
    const next = !open;
    setOpen(next);
    if (next) await loadList();
  };

  const handleItemClick = async (item) => {
    if (!item.is_read) {
      await markNotificationRead(item.id);
      setItems((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n))
      );
      setUnread((u) => Math.max(u - 1, 0));
    }
    if (item.link) window.location.href = item.link;
  };

  const handleMarkAll = async () => {
    await markAllNotificationsRead();
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnread(0);
  };

  return (
    <div className="relative" ref={boxRef}>
      <button
        onClick={toggleOpen}
        className="relative text-gray-500 hover:text-blue-600"
        aria-label="Notifications"
      >
        <Bell size={19} />
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] leading-none rounded-full px-1.5 py-1 min-w-[16px] text-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-80 bg-white border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between px-4 py-2 border-b">
            <span className="font-medium text-sm">Notifications</span>
            <button
              onClick={handleMarkAll}
              className="text-xs text-blue-600 hover:underline"
            >
              Mark all read
            </button>
          </div>

          {items.length === 0 && (
            <p className="text-sm text-gray-400 px-4 py-6 text-center">
              No notifications yet
            </p>
          )}

          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={`w-full text-left px-4 py-3 border-b last:border-0 hover:bg-gray-50 ${
                item.is_read ? "bg-white" : "bg-blue-50"
              }`}
            >
              <p className="text-sm font-medium text-gray-800">{item.title}</p>
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                {item.message}
              </p>
              <p className="text-[11px] text-gray-400 mt-1">
                {new Date(item.created_at).toLocaleString()}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}