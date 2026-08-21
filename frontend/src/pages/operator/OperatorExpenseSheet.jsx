import { useEffect, useState } from "react";
import { Plus, Save, Trash2, Paperclip } from "lucide-react";
import {
  createExpense,
  deleteExpense,
  getExpenseCategories,
  getExpenses,
} from "../../api/expenses";

const todayStr = () => new Date().toISOString().slice(0, 10);

const blankRow = () => ({
  key: crypto.randomUUID(),
  expense_date: todayStr(),
  category: "",
  title: "",
  amount: "",
  payment_method: "cash",
  remarks: "",
  receiptFile: null,
  saving: false,
  error: "",
});

export default function OperatorExpenseSheet() {
  const [categories, setCategories] = useState([]);
  const [rows, setRows] = useState([blankRow()]);
  const [todayEntries, setTodayEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(true);

  const loadCategories = async () => {
    const res = await getExpenseCategories();
    setCategories(res.data.results || res.data);
  };

  const loadTodayEntries = async () => {
    setLoadingEntries(true);
    try {
      const res = await getExpenses({ expense_date: todayStr() });
      setTodayEntries(res.data.results || res.data);
    } finally {
      setLoadingEntries(false);
    }
  };

  useEffect(() => {
    loadCategories();
    loadTodayEntries();
  }, []);

  const updateRow = (key, field, value) => {
    setRows((prev) =>
      prev.map((r) => (r.key === key ? { ...r, [field]: value } : r))
    );
  };

  const addRow = () => setRows((prev) => [...prev, blankRow()]);

  const removeRow = (key) =>
    setRows((prev) => prev.filter((r) => r.key !== key));

  const saveRow = async (row) => {
    if (!row.category || !row.title || !row.amount) {
      updateRow(row.key, "error", "Category, title and amount are required.");
      return;
    }

    updateRow(row.key, "saving", true);
    updateRow(row.key, "error", "");

    try {
      await createExpense({
        expense_date: row.expense_date,
        category: row.category,
        title: row.title,
        amount: row.amount,
        payment_method: row.payment_method,
        remarks: row.remarks,
        receipt: row.receiptFile,
      });

      // Row saved successfully — remove it from the entry grid and
      // refresh the "today's entries" list below.
      setRows((prev) => prev.filter((r) => r.key !== row.key));
      if (rows.length === 1) setRows([blankRow()]);
      await loadTodayEntries();
    } catch (err) {
      updateRow(
        row.key,
        "error",
        err?.response?.data?.detail || "Could not save this row."
      );
    } finally {
      updateRow(row.key, "saving", false);
    }
  };

  const handleDeleteEntry = async (id) => {
    if (!window.confirm("Delete this expense entry?")) return;
    await deleteExpense(id);
    loadTodayEntries();
  };

  const gridTotal = rows.reduce(
    (sum, r) => sum + (parseFloat(r.amount) || 0),
    0
  );

  const todayTotal = todayEntries.reduce(
    (sum, e) => sum + parseFloat(e.amount || 0),
    0
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-1">
          Add Expenses
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Fill each row like a spreadsheet, then save. Attach a receipt if you
          have one.
        </p>

        <div className="overflow-x-auto border rounded-lg bg-white">
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-600 text-left">
                <th className="px-3 py-2 border w-36">Date</th>
                <th className="px-3 py-2 border w-40">Category</th>
                <th className="px-3 py-2 border">Title</th>
                <th className="px-3 py-2 border w-32">Amount (₹)</th>
                <th className="px-3 py-2 border w-32">Payment</th>
                <th className="px-3 py-2 border">Remarks</th>
                <th className="px-3 py-2 border w-24">Receipt</th>
                <th className="px-3 py-2 border w-20 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key} className="border-b align-top">
                  <td className="border px-1 py-1">
                    <input
                      type="date"
                      value={row.expense_date}
                      onChange={(e) =>
                        updateRow(row.key, "expense_date", e.target.value)
                      }
                      className="w-full px-2 py-1.5 outline-none focus:bg-blue-50 rounded"
                    />
                  </td>
                  <td className="border px-1 py-1">
                    <select
                      value={row.category}
                      onChange={(e) =>
                        updateRow(row.key, "category", e.target.value)
                      }
                      className="w-full px-2 py-1.5 outline-none focus:bg-blue-50 rounded bg-transparent"
                    >
                      <option value="">Select</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="border px-1 py-1">
                    <input
                      type="text"
                      placeholder="e.g. Stationery purchase"
                      value={row.title}
                      onChange={(e) =>
                        updateRow(row.key, "title", e.target.value)
                      }
                      className="w-full px-2 py-1.5 outline-none focus:bg-blue-50 rounded"
                    />
                  </td>
                  <td className="border px-1 py-1">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={row.amount}
                      onChange={(e) =>
                        updateRow(row.key, "amount", e.target.value)
                      }
                      className="w-full px-2 py-1.5 outline-none focus:bg-blue-50 rounded"
                    />
                  </td>
                  <td className="border px-1 py-1">
                    <select
                      value={row.payment_method}
                      onChange={(e) =>
                        updateRow(row.key, "payment_method", e.target.value)
                      }
                      className="w-full px-2 py-1.5 outline-none focus:bg-blue-50 rounded bg-transparent"
                    >
                      <option value="cash">Cash</option>
                      <option value="upi">UPI</option>
                      <option value="card">Card</option>
                      <option value="bank">Bank Transfer</option>
                      <option value="cheque">Cheque</option>
                    </select>
                  </td>
                  <td className="border px-1 py-1">
                    <input
                      type="text"
                      placeholder="Optional note"
                      value={row.remarks}
                      onChange={(e) =>
                        updateRow(row.key, "remarks", e.target.value)
                      }
                      className="w-full px-2 py-1.5 outline-none focus:bg-blue-50 rounded"
                    />
                  </td>
                  <td className="border px-1 py-1 text-center">
                    <label className="inline-flex items-center justify-center cursor-pointer text-gray-500 hover:text-blue-600">
                      <Paperclip size={16} />
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) =>
                          updateRow(
                            row.key,
                            "receiptFile",
                            e.target.files[0] || null
                          )
                        }
                      />
                    </label>
                    {row.receiptFile && (
                      <p className="text-[10px] text-gray-400 truncate max-w-[70px]">
                        {row.receiptFile.name}
                      </p>
                    )}
                  </td>
                  <td className="border px-1 py-1">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => saveRow(row)}
                        disabled={row.saving}
                        className="text-green-600 hover:text-green-700 disabled:opacity-50"
                        title="Save row"
                      >
                        <Save size={16} />
                      </button>
                      <button
                        onClick={() => removeRow(row.key)}
                        className="text-red-500 hover:text-red-600"
                        title="Remove row"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    {row.error && (
                      <p className="text-[10px] text-red-500 mt-1 w-24">
                        {row.error}
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-medium">
                <td colSpan={3} className="border px-3 py-2 text-right">
                  Grid total
                </td>
                <td className="border px-3 py-2">₹{gridTotal.toFixed(2)}</td>
                <td colSpan={4} className="border"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <button
          onClick={addRow}
          className="mt-3 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
        >
          <Plus size={16} /> Add row
        </button>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800">
            Today's Entries
          </h2>
          <p className="text-sm text-gray-600">
            Total spent today:{" "}
            <span className="font-semibold">₹{todayTotal.toFixed(2)}</span>
          </p>
        </div>

        <div className="overflow-x-auto border rounded-lg bg-white">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-100 text-gray-600 text-left">
                <th className="px-3 py-2 border">Category</th>
                <th className="px-3 py-2 border">Title</th>
                <th className="px-3 py-2 border">Amount</th>
                <th className="px-3 py-2 border">Payment</th>
                <th className="px-3 py-2 border">Receipt</th>
                <th className="px-3 py-2 border w-16 text-center">Delete</th>
              </tr>
            </thead>
            <tbody>
              {!loadingEntries && todayEntries.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-gray-400">
                    No expenses added yet today.
                  </td>
                </tr>
              )}
              {todayEntries.map((e) => (
                <tr key={e.id} className="border-b">
                  <td className="px-3 py-2 border">{e.category_name}</td>
                  <td className="px-3 py-2 border">{e.title}</td>
                  <td className="px-3 py-2 border">₹{e.amount}</td>
                  <td className="px-3 py-2 border capitalize">
                    {e.payment_method}
                  </td>
                  <td className="px-3 py-2 border">
                    {e.receipt_url ? (
                      <a
                        href={e.receipt_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        View
                      </a>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 border text-center">
                    <button
                      onClick={() => handleDeleteEntry(e.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}