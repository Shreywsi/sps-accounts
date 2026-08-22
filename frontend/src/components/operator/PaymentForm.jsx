import { useState } from "react";
import { collectPayment } from "../../api/fees";

const METHODS = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
  { value: "bank", label: "Bank Transfer" },
  { value: "cheque", label: "Cheque" },
];

export default function PaymentForm({ studentFee, onSuccess }) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cash");
  const [reference, setReference] = useState("");
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!studentFee) {
      setError("No fee record selected.");
      return;
    }

    const value = parseFloat(amount);

    if (!value || value <= 0) {
      setError("Enter a valid amount.");
      return;
    }

    if (value > parseFloat(studentFee.balance)) {
      setError("Amount exceeds remaining balance.");
      return;
    }

    setSaving(true);

    try {
      const { data: payment } = await collectPayment({
        student_fee: studentFee.id,
        amount: value,
        payment_method: method,
        transaction_reference: reference,
        remarks,
      });

      setAmount("");
      setReference("");
      setRemarks("");
      onSuccess?.(payment);
    } catch (err) {
      console.error("Payment failed:", err);
      setError(err.response?.data?.detail || "Payment failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border rounded-lg p-6 mt-6 space-y-4"
    >
      <h2 className="text-xl font-semibold">Collect Payment</h2>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-md border border-red-200">
          {error}
        </div>
      )}

      <div>
        <label className="text-sm text-gray-600">Amount</label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full border rounded-md px-3 py-2 text-sm mt-1"
        />
        {studentFee && (
          <p className="text-xs text-gray-400 mt-1">
            Balance due: ₹{studentFee.balance}
          </p>
        )}
      </div>

      <div>
        <label className="text-sm text-gray-600">Payment Method</label>
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className="w-full border rounded-md px-3 py-2 text-sm mt-1"
        >
          {METHODS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm text-gray-600">
          Transaction Reference (optional)
        </label>
        <input
          type="text"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          className="w-full border rounded-md px-3 py-2 text-sm mt-1"
        />
      </div>

      <div>
        <label className="text-sm text-gray-600">Remarks (optional)</label>
        <textarea
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          rows={2}
          className="w-full border rounded-md px-3 py-2 text-sm mt-1"
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="bg-blue-600 text-white px-6 py-2 rounded-md text-sm disabled:opacity-50"
      >
        {saving ? "Processing..." : "Collect Payment"}
      </button>
    </form>
  );
}