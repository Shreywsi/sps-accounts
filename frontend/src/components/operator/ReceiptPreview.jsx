export default function ReceiptPreview({ payment, student, onClose }) {
  if (!payment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-1">Payment Receipt</h2>
        <p className="text-sm text-gray-500 mb-4">
          Receipt No: {payment.receipt_number}
        </p>

        <div className="space-y-2 text-sm border-t border-b py-4">
          <div className="flex justify-between">
            <span className="text-gray-500">Student</span>
            <span>
              {student
                ? `${student.first_name} ${student.last_name}`
                : "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Amount</span>
            <span className="font-semibold">₹{payment.amount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Method</span>
            <span className="capitalize">{payment.payment_method}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Date</span>
            <span>
              {new Date(payment.payment_datetime).toLocaleString()}
            </span>
          </div>
          {payment.transaction_reference && (
            <div className="flex justify-between">
              <span className="text-gray-500">Reference</span>
              <span>{payment.transaction_reference}</span>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={() => window.print()}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm"
          >
            Print
          </button>
          <button
            onClick={onClose}
            className="flex-1 border px-4 py-2 rounded-md text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}