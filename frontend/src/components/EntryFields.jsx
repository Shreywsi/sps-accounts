/* ======================================================================
   components/EntryFields.jsx
   The date/type/category/party/mode/amount/remarks form. Used in two
   places: the normal Add/Edit Entry modal, and the Request Change modal
   (where an operator proposes new values for a locked entry).
   ====================================================================== */

import { Field } from "./Modal";
import { MODES, CLASS_OPTIONS } from "../constants";

export function EntryFields({ ledger, form, setForm, categories }) {
  const options = form.type === "income" ? categories.income : categories.expense;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Field label="Date">
        <input
          type="date"
          value={form.date}
          onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
          className="w-full border border-slate-200 rounded-md px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </Field>

      <Field label="Type">
        <select
          value={form.type}
          onChange={(e) => setForm((f) => ({ ...f, type: e.target.value, category: "" }))}
          className="w-full border border-slate-200 rounded-md px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
      </Field>

      <Field label="Category" full={ledger === "general"}>
        <select
          value={form.category}
          onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          className="w-full border border-slate-200 rounded-md px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="">Select category…</option>
          {options.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </Field>

      {ledger === "student" && (
        <Field label="Class">
          <select
            value={form.className}
            onChange={(e) => setForm((f) => ({ ...f, className: e.target.value }))}
            className="w-full border border-slate-200 rounded-md px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">—</option>
            {CLASS_OPTIONS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </Field>
      )}

      <Field label={ledger === "student" ? "Student Name" : "Party / Description"} full>
        <input
          value={form.party}
          onChange={(e) => setForm((f) => ({ ...f, party: e.target.value }))}
          placeholder={ledger === "student" ? "e.g. Rahul Sharma" : "e.g. Rent — April"}
          className="w-full border border-slate-200 rounded-md px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </Field>

      <Field label="Mode">
        <select
          value={form.mode}
          onChange={(e) => setForm((f) => ({ ...f, mode: e.target.value }))}
          className="w-full border border-slate-200 rounded-md px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          {MODES.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </Field>

      <Field label="Amount (₹)">
        <input
          type="number"
          min="0"
          step="0.01"
          value={form.amount}
          onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
          className="w-full border border-slate-200 rounded-md px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </Field>

      <Field label="Remarks (optional)" full>
        <input
          value={form.remarks}
          onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
          className="w-full border border-slate-200 rounded-md px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </Field>
    </div>
  );
}