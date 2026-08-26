import { useEffect, useState } from "react";
import { getPendingPayments, approvePayment, rejectPayment } from "../api/fees";

// Every fee payment an operator has recorded, awaiting admin sign-off.
// The backend blocks an admin from approving their own submission
// (separation of duties) - if that happens the approve call comes back
// with a 403 and the message below is shown.
export default function AdminFeeReview() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await getPendingPayments();
      setPayments(data.results || data);
    } catch (err) {
      console.error("Failed to load pending payments:", err);
      setError("Couldn't load the review queue.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleApprove = async (payment) => {
    setBusyId(payment.id);
    setError("");
    try {
      await approvePayment(payment.id);
      await load();
    } catch (err) {
      setError(
        err.response?.status === 403
          ? "You can't approve a payment you recorded yourself."
          : "Approval failed."
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (payment) => {
    if (!rejectReason.trim()) {
      setError("A rejection reason is required.");
      return;
    }
    setBusyId(payment.id);
    setError("");
    try {
      await rejectPayment(payment.id, rejectReason);
      setRejectingId(null);
      setRejectReason("");
      await load();
    } catch (err) {
      setError("Rejection failed.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Payments awaiting review</h1>

      {loading && <p className="text-sm text-gray-400">Loading...</p>}

      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-md border border-red-200 mb-4">
          {error}
        </div>
      )}

      {!loading && payments.length === 0 && (
        <p className="text-sm text-gray-400">Nothing pending review.</p>
      )}

      <div className="space-y-3">
        {payments.map((payment) => (
          <div key={payment.id} className="bg-white border rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">
                  {payment.student_name} ({payment.student_admission_no})
                </p>
                <p className="text-sm text-gray-500">
                  ₹{payment.amount} · {payment.payment_type} · {payment.payment_method} ·
                  receipt {payment.receipt_number}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Recorded by {payment.received_by_name} on {payment.payment_date}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleApprove(payment)}
                  disabled={busyId === payment.id}
                  className="text-sm bg-green-600 text-white rounded-md px-3 py-1.5 disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  onClick={() => setRejectingId(rejectingId === payment.id ? null : payment.id)}
                  disabled={busyId === payment.id}
                  className="text-sm bg-red-50 text-red-700 border border-red-200 rounded-md px-3 py-1.5"
                >
                  Reject
                </button>
              </div>
            </div>

            {rejectingId === payment.id && (
              <div className="mt-3 pt-3 border-t flex gap-2">
                <input
                  type="text"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Reason for rejection"
                  className="flex-1 border rounded-md px-2 py-1.5 text-sm"
                />
                <button
                  onClick={() => handleReject(payment)}
                  disabled={busyId === payment.id}
                  className="text-sm bg-red-600 text-white rounded-md px-3 py-1.5 disabled:opacity-50"
                >
                  Confirm reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}