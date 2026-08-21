import React, { useState, useEffect } from 'react';
import { Check, X, RefreshCw } from 'lucide-react';
import { getTransactions, approveTransaction, rejectTransaction } from '../api/transactions';

export default function AdminApprovals() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await getTransactions({ status: 'SUBMITTED' });
      setPending(res.results || res);
    } catch (err) {
      alert('Error loading pending approvals.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await approveTransaction(id);
      setPending(pending.filter((t) => t.id !== id));
    } catch (err) {
      alert('Failed to approve transaction.');
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Reason for rejection:');
    if (reason === null) return;
    try {
      await rejectTransaction(id, reason);
      setPending(pending.filter((t) => t.id !== id));
    } catch (err) {
      alert('Failed to reject transaction.');
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Admin Approvals Panel</h1>
        <button
          onClick={fetchPending}
          className="flex items-center space-x-1 px-3 py-1.5 bg-gray-100 border text-gray-700 rounded hover:bg-gray-200"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {loading ? (
        <div>Loading pending transactions...</div>
      ) : pending.length === 0 ? (
        <div className="p-8 text-center text-gray-500 bg-white rounded border">
          No pending entries to verify.
        </div>
      ) : (
        <div className="bg-white border rounded shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 border-b text-gray-700">
              <tr>
                <th className="p-3">Operator</th>
                <th className="p-3">Date</th>
                <th className="p-3">Type</th>
                <th className="p-3">Title</th>
                <th className="p-3">Category</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Mode</th>
                <th className="p-3">Custom Data</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {pending.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="p-3 font-medium">{item.created_by_name || 'Operator'}</td>
                  <td className="p-3">{item.transaction_date}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-bold ${
                        item.transaction_type === 'EXPENSE'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {item.transaction_type}
                    </span>
                  </td>
                  <td className="p-3">{item.items?.[0]?.title || '-'}</td>
                  <td className="p-3">{item.category_name || '-'}</td>
                  <td className="p-3 font-mono font-semibold">₹{item.total_amount}</td>
                  <td className="p-3">{item.payment_mode}</td>
                  <td className="p-3 text-xs">{Object.entries(item.custom_data || {}).map(([key, value]) => `${key}: ${value}`).join(', ') || '-'}</td>
                  <td className="p-3 text-center space-x-2">
                    <button
                      onClick={() => handleApprove(item.id)}
                      className="bg-green-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-green-700 inline-flex items-center space-x-1"
                    >
                      <Check className="w-3 h-3" />
                      <span>Verify</span>
                    </button>
                    <button
                      onClick={() => handleReject(item.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-red-700 inline-flex items-center space-x-1"
                    >
                      <X className="w-3 h-3" />
                      <span>Reject</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}