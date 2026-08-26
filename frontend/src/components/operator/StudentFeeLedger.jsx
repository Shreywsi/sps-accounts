import { useEffect, useState } from "react";
import {
  getStudentLedger,
  generateLedgerYear,
  recordMonthlyPayment,
} from "../../api/fees";

const STATUS_STYLES = {
  PAID: "bg-green-100 text-green-700",
  PARTIAL: "bg-yellow-100 text-yellow-700",
  PENDING: "bg-gray-100 text-gray-600",
  OVERDUE: "bg-red-100 text-red-700",
};

const METHODS = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
  { value: "bank", label: "Bank Transfer" },
  { value: "cheque", label: "Cheque" },
];

// One student's Jan-Dec ledger. Click a month that isn't fully paid to
// submit a payment for it - the row won't move to PAID until an admin
// approves it, so this always reflects the true state, not what an
// operator merely typed in.
export default function StudentFeeLedger({ student, year }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeMonth, setActiveMonth] = useState(null);

  const load = async () => {
    if (!student) return;
    setLoading(true);
    setError("");
    try {
      const { data } = await getStudentLedger(student.id, year);
      let results = data.results || data;

      if (results.length === 0) {
        // First time viewing this student/year - create the 12 rows.
        await generateLedgerYear(student.id, year);
        const refreshed = await getStudentLedger(student.id, year);
        results = refreshed.data.results || refreshed.data;
      }

      results.sort((a, b) => a.month - b.month);
      setRows(results);
    } catch (err) {
      console.error("Failed to load ledger:", err);
      setError("Couldn't load the fee ledger for this student.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student?.id, year]);

  if (!student) return null;

  return (
    <div className="bg-white border rounded-lg p-6 mt-6">
      <h2 className="text-xl font-semibold mb-4">
        {year} fee ledger — {student.first_name} {student.last_name}
      </h2>

      {loading && <p className="text-sm text-gray-400">Loading...</p>}
      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-md border border-red-200 mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {rows.map((row) => (
          <div key={row.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm">{row.month_label}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[row.status]}`}
              >
                {row.status}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Due ₹{row.expected_amount} · Paid ₹{row.amount_paid} · Balance ₹{row.balance}
            </p>

            {row.status !== "PAID" && (
              <button
                onClick={() => setActiveMonth(activeMonth === row.id ? null : row.id)}
                className="mt-3 text-sm text-blue-600 hover:underline"
              >
                {activeMonth === row.id ? "Cancel" : "Record payment"}
              </button>
            )}

            {activeMonth === row.id && (
              <MonthPaymentForm
                student={student}
                record={row}
                onDone={() => {
                  setActiveMonth(null);
                  load();
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function MonthPaymentForm({ student, record, onDone }) {
  const [amount, setAmount] = useState(String(record.balance));
  const [method, setMethod] = useState("cash");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const value = parseFloat(amount);
    if (!value || value <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    if (value > parseFloat(record.balance)) {
      setError(`Amount can't exceed the outstanding balance (₹${record.balance}).`);
      return;
    }

    setSaving(true);
    try {
      await recordMonthlyPayment({
        student: student.id,
        monthly_fee_record: record.id,
        payment_type: "MONTHLY",
        amount: value,
        payment_method: method,
        transaction_reference: reference,
        notes,
      });
      onDone();
    } catch (err) {
      console.error("Payment failed:", err);
      setError(err.response?.data?.amount?.[0] || err.response?.data?.detail || "Payment failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-3 pt-3 border-t space-y-2">
      {error && <p className="text-xs text-red-600">{error}</p>}

      <input
        type="number"
        step="0.01"
        min="0"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-full border rounded-md px-2 py-1.5 text-sm"
        placeholder="Amount"
      />

      <select
        value={method}
        onChange={(e) => setMethod(e.target.value)}
        className="w-full border rounded-md px-2 py-1.5 text-sm"
      >
        {METHODS.map((m) => (
          <option key={m.value} value={m.value}>{m.label}</option>
        ))}
      </select>

      <input
        type="text"
        value={reference}
        onChange={(e) => setReference(e.target.value)}
        className="w-full border rounded-md px-2 py-1.5 text-sm"
        placeholder="Transaction reference (optional)"
      />

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="w-full border rounded-md px-2 py-1.5 text-sm"
        placeholder="Notes (optional)"
        rows={2}
      />

      <p className="text-xs text-gray-400">
        This goes to an admin for review before it counts toward the balance.
      </p>

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-blue-600 text-white text-sm rounded-md py-1.5 disabled:opacity-50"
      >
        {saving ? "Submitting..." : "Submit for review"}
      </button>
    </form>
  );
}