export default function FeeSummary({ studentFee }) {
  if (!studentFee) return null;

  return (
    <div className="bg-white border rounded-lg p-6 mt-6">
      <h2 className="text-xl font-semibold mb-4">Fee Summary</h2>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <strong className="block text-gray-500">Fee Structure</strong>
          <p>{studentFee.fee_structure_name || studentFee.fee_structure}</p>
        </div>

        <div>
          <strong className="block text-gray-500">Total Amount</strong>
          <p>₹{studentFee.total_amount}</p>
        </div>

        <div>
          <strong className="block text-gray-500">Paid</strong>
          <p>₹{studentFee.amount_paid}</p>
        </div>

        <div>
          <strong className="block text-gray-500">Balance</strong>
          <p>₹{studentFee.balance}</p>
        </div>

        <div>
          <strong className="block text-gray-500">Due Date</strong>
          <p>{studentFee.due_date || "—"}</p>
        </div>

        <div>
          <strong className="block text-gray-500">Days Overdue</strong>
          <p>{studentFee.days_overdue || 0}</p>
        </div>

        <div>
          <strong className="block text-gray-500">Late Fee Accrued</strong>
          <p>₹{studentFee.late_fee_amount || 0}</p>
        </div>

        <div>
          <strong className="block text-gray-500">Total Payable</strong>
          <p className="font-semibold">₹{studentFee.total_payable}</p>
        </div>
      </div>

      <span
        className={
          "inline-block mt-4 px-2 py-1 rounded-full text-xs font-medium " +
          (studentFee.status === "PAID"
            ? "bg-green-100 text-green-700"
            : studentFee.status === "PARTIAL"
            ? "bg-yellow-100 text-yellow-700"
            : "bg-red-100 text-red-700")
        }
      >
        {studentFee.status}
      </span>
    </div>
  );
}