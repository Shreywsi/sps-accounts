import { useState } from "react";
import { Modal, Field } from "../../components/Modal";

/* Used for both "new top-level category" and "new sub-category under X"
   depending on whether parentCategory is passed. */
export function CategoryFormModal({ parentCategory, onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSubmit(name.trim());
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={parentCategory ? `New sub-category in "${parentCategory.name}"` : "New category"}
      onClose={onClose}
      small
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Category name">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Food Ingredients"
            className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </Field>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3.5 py-2 text-sm rounded-md border border-slate-200">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="px-3.5 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Add"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* Add an expense line (e.g. "Sugar - ₹80") into a given category, with
   an optional receipt upload. */
export function EntryFormModal({ category, defaultDate, onClose, onSubmit }) {
  const [form, setForm] = useState({
    title: "",
    amount: "",
    payment_method: "cash",
    entry_date: defaultDate || new Date().toISOString().slice(0, 10),
    remarks: "",
  });
  const [receipt, setReceipt] = useState(null);
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.amount) return;
    setSaving(true);
    try {
      await onSubmit({ ...form, category: category.id, receipt });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={`Add expense to "${category.name}"`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="What was it?" full>
          <input
            autoFocus
            value={form.title}
            onChange={set("title")}
            placeholder="e.g. Sugar"
            className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </Field>

        <Field label="Amount (₹)">
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.amount}
            onChange={set("amount")}
            className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </Field>

        <Field label="Date">
          <input
            type="date"
            value={form.entry_date}
            onChange={set("entry_date")}
            className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </Field>

        <Field label="Payment method">
          <select
            value={form.payment_method}
            onChange={set("payment_method")}
            className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="card">Card</option>
            <option value="bank">Bank Transfer</option>
            <option value="cheque">Cheque</option>
          </select>
        </Field>

        <Field label="Receipt (optional)">
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setReceipt(e.target.files?.[0] || null)}
            className="w-full text-sm"
          />
        </Field>

        <Field label="Remarks" full>
          <textarea
            value={form.remarks}
            onChange={set("remarks")}
            rows={2}
            className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </Field>

        <div className="sm:col-span-2 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3.5 py-2 text-sm rounded-md border border-slate-200">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !form.title.trim() || !form.amount}
            className="px-3.5 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Add expense"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
/* Ask the admin to unlock an APPROVED (locked) event so the operator
   can go back in and make changes. */
export function EditRequestModal({ eventName, onClose, onSubmit }) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) return;
    setSaving(true);
    setError("");
    try {
      await onSubmit(reason.trim());
      onClose();
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          Object.values(err?.response?.data || {})[0] ||
          "Couldn't send the request. Try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={`Request edit access — "${eventName}"`} onClose={onClose} small>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-slate-500">
          This event is approved and locked. Tell the admin why you need to
          edit it — they'll unlock it if they approve your request.
        </p>
        <Field label="Reason">
          <textarea
            autoFocus
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="e.g. Forgot to add the tent rental receipt"
            className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </Field>
        {error && <p className="text-xs text-rose-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3.5 py-2 text-sm rounded-md border border-slate-200">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !reason.trim()}
            className="px-3.5 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Sending…" : "Send request"}
          </button>
        </div>
      </form>
    </Modal>
  );
}