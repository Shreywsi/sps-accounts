import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { getMessages, sendMessage } from "../api/notifications";
import { useAuth } from "../context/AuthContext";

export default function Messages() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const load = async () => {
    const res = await getMessages();
    setMessages(res.data.results || res.data);
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!body.trim()) return;

    setSending(true);
    try {
      await sendMessage({ body });
      setBody("");
      await load();
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white border rounded-lg flex flex-col h-[75vh]">
      <div className="px-5 py-3 border-b">
        <h2 className="font-semibold text-gray-800">
          Admin ↔ Operator Messages
        </h2>
        <p className="text-xs text-gray-500">
          Messages sent here reach every {user?.role === "OPERATOR" ? "admin" : "operator"}.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-sm text-gray-400 text-center mt-10">
            No messages yet. Say hello 👋
          </p>
        )}

        {messages.map((m) => {
          const mine = m.sender === user?.id;
          return (
            <div
              key={m.id}
              className={`flex ${mine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-4 py-2 text-sm ${
                  mine
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {!mine && (
                  <p className="text-xs font-semibold mb-0.5 opacity-70">
                    {m.sender_name} ({m.sender_role})
                  </p>
                )}
                <p>{m.body}</p>
                <p
                  className={`text-[10px] mt-1 ${
                    mine ? "text-blue-100" : "text-gray-400"
                  }`}
                >
                  {new Date(m.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="border-t px-4 py-3 flex gap-2">
        <input
          type="text"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={sending}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm flex items-center gap-1 disabled:opacity-50"
        >
          <Send size={15} /> Send
        </button>
      </form>
    </div>
  );
}