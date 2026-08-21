import { useEffect, useState } from "react";
import { getExpenseSummary } from "../api/expenses";
import { getDueFeesReport } from "../api/fees";

const PERIODS = [
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "annual", label: "Annual" },
];

export default function ExpenseReports() {
  const [period, setPeriod] = useState("monthly");
  const [summary, setSummary] = useState(null);
  const [dueFees, setDueFees] = useState(null);

  useEffect(() => {
    getExpenseSummary(period).then((res) => setSummary(res.data));
  }, [period]);

  useEffect(() => {
    getDueFeesReport().then((res) => setDueFees(res.data));
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Expense Summary
          </h2>

          <div className="flex gap-2">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`px-3 py-1.5 text-sm rounded-md border ${
                  period === p.key
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {summary && (
          <>
            <div className="bg-white border rounded-lg p-5 mb-4">
              <p className="text-sm text-gray-500">
                Total spent this {period.replace("ly", "")}
              </p>
              <p className="text-2xl font-semibold text-gray-800">
                ₹{Number(summary.total).toFixed(2)}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white border rounded-lg overflow-hidden">
                <div className="px-4 py-2 border-b bg-gray-50 font-medium text-sm">
                  By Category
                </div>
                <table className="min-w-full text-sm">
                  <tbody>
                    {summary.by_category.length === 0 && (
                      <tr>
                        <td className="px-4 py-4 text-gray-400" colSpan={2}>
                          No expenses in this period.
                        </td>
                      </tr>
                    )}
                    {summary.by_category.map((c) => (
                      <tr key={c.category__name} className="border-b last:border-0">
                        <td className="px-4 py-2">{c.category__name}</td>
                        <td className="px-4 py-2 text-right font-medium">
                          ₹{Number(c.total).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-white border rounded-lg overflow-hidden">
                <div className="px-4 py-2 border-b bg-gray-50 font-medium text-sm">
                  Trend ({period})
                </div>
                <table className="min-w-full text-sm">
                  <tbody>
                    {summary.trend.map((t) => (
                      <tr key={t.bucket} className="border-b last:border-0">
                        <td className="px-4 py-2">
                          {new Date(t.bucket).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2 text-right font-medium">
                          ₹{Number(t.total).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Fee Dues (with late fee)
        </h2>

        {dueFees && (
          <>
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div className="bg-white border rounded-lg p-4">
                <p className="text-sm text-gray-500">Total outstanding</p>
                <p className="text-xl font-semibold">
                  ₹{Number(dueFees.total_outstanding).toFixed(2)}
                </p>
              </div>
              <div className="bg-white border rounded-lg p-4">
                <p className="text-sm text-gray-500">Total late fees accrued</p>
                <p className="text-xl font-semibold text-red-600">
                  ₹{Number(dueFees.total_late_fees).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto border rounded-lg bg-white">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 text-left">
                    <th className="px-3 py-2 border">Student</th>
                    <th className="px-3 py-2 border">Fee</th>
                    <th className="px-3 py-2 border">Due Date</th>
                    <th className="px-3 py-2 border">Days Overdue</th>
                    <th className="px-3 py-2 border">Balance</th>
                    <th className="px-3 py-2 border">Late Fee</th>
                    <th className="px-3 py-2 border">Total Payable</th>
                  </tr>
                </thead>
                <tbody>
                  {dueFees.results.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-3 py-6 text-center text-gray-400">
                        No pending dues 🎉
                      </td>
                    </tr>
                  )}
                  {dueFees.results.map((r) => (
                    <tr key={r.student_fee_id} className="border-b">
                      <td className="px-3 py-2 border">
                        {r.admission_no} — {r.student_name}
                      </td>
                      <td className="px-3 py-2 border">{r.fee_structure}</td>
                      <td className="px-3 py-2 border">{r.due_date || "—"}</td>
                      <td className="px-3 py-2 border">
                        {r.days_overdue > 0 ? (
                          <span className="text-red-600 font-medium">
                            {r.days_overdue}
                          </span>
                        ) : (
                          0
                        )}
                      </td>
                      <td className="px-3 py-2 border">₹{Number(r.balance).toFixed(2)}</td>
                      <td className="px-3 py-2 border">
                        ₹{Number(r.late_fee_amount).toFixed(2)}
                      </td>
                      <td className="px-3 py-2 border font-medium">
                        ₹{Number(r.total_payable).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}