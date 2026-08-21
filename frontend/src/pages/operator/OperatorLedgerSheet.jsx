import { useEffect, useState } from "react";
import { Plus, Trash2, Save, Settings, AlertCircle } from "lucide-react";
import {
  createTransaction,
  getTransactionCategories,
  createTransactionCategory,
  deleteTransactionCategory,
  getTransactionColumns,
  createTransactionColumn,
  deleteTransactionColumn,
} from "../../api/transactions";

const today = () => new Date().toISOString().slice(0, 10);

const newRow = () => ({
  id: crypto.randomUUID(),
  transaction_date: today(),
  type: "EXPENSE",
  category: "",
  title: "",
  amount: "",
  payment_method: "CASH",
  remarks: "",
  custom_data: {},
});

export default function OperatorLedgerSheet() {
  const [categories, setCategories] = useState([]);
  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([newRow()]);
  const [newCatName, setNewCatName] = useState("");
  const [newColumnName, setNewColumnName] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [categoryResponse, columnResponse] = await Promise.all([
          getTransactionCategories(),
          getTransactionColumns(),
        ]);
        setCategories(categoryResponse.results || categoryResponse);
        setColumns(columnResponse.results || columnResponse);
      } catch (error) {
        setMessage({ type: "error", text: "Failed to load categories or columns." });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const updateRow = (id, field, value) => {
    setRows((current) => current.map((row) => (
      row.id === id ? { ...row, [field]: value } : row
    )));
  };

  const saveAll = async () => {
    const validRows = rows.filter((row) => row.title.trim() && row.amount);
    if (!validRows.length) {
      setMessage({ type: "error", text: "Enter a title and amount before saving." });
      return;
    }
    try {
      setSubmitting(true);
      setMessage(null);
      for (const row of validRows) {
        await createTransaction({
          transaction_type: row.type,
          category: row.category || null,
          transaction_date: row.transaction_date,
          payment_mode: row.payment_method,
          narration: row.remarks,
          custom_data: row.custom_data,
          items: [{ title: row.title, amount: Number(row.amount), remarks: row.remarks }],
        });
      }
      setRows([newRow()]);
      setMessage({ type: "success", text: "Changes saved and sent for admin verification." });
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.detail || "Could not save changes." });
    } finally {
      setSubmitting(false);
    }
  };

  const addCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      const created = await createTransactionCategory({ name: newCatName.trim() });
      setCategories((current) => [...current, created]);
      setNewCatName("");
    } catch (error) {
      setMessage({ type: "error", text: "Category could not be created." });
    }
  };

  const addColumn = async () => {
    if (!newColumnName.trim()) return;
    try {
      const created = await createTransactionColumn({ name: newColumnName.trim() });
      setColumns((current) => [...current, created]);
      setNewColumnName("");
    } catch (error) {
      setMessage({ type: "error", text: "Column could not be created or already exists." });
    }
  };

  const removeColumn = async (id) => {
    try {
      await deleteTransactionColumn(id);
      setColumns((current) => current.filter((column) => column.id !== id));
    } catch (error) {
      setMessage({ type: "error", text: "Only an admin can remove columns." });
    }
  };

  if (loading) return <div className="p-6">Loading Day Book...</div>;

  return (
    <div className="p-6 space-y-4 max-w-full overflow-x-auto">
      <div className="flex justify-between items-center gap-3">
        <h1 className="text-2xl font-bold text-gray-800">Operator Day Book (Excel View)</h1>
        <div className="flex gap-3">
          <button onClick={() => setShowSettings(true)} className="flex items-center gap-1 px-3 py-2 bg-gray-100 border rounded hover:bg-gray-200">
            <Settings className="w-4 h-4" /> Manage Categories and Columns
          </button>
          <button onClick={saveAll} disabled={submitting} className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded font-medium disabled:opacity-50">
            <Save className="w-4 h-4" /> {submitting ? "Saving..." : "Submit Sheet"}
          </button>
        </div>
      </div>

      {message && <div className={`p-3 rounded border flex items-center gap-2 ${message.type === "error" ? "bg-red-50 border-red-200 text-red-700" : "bg-green-50 border-green-200 text-green-700"}`}><AlertCircle className="w-4 h-4" />{message.text}</div>}

      <div className="border border-gray-300 rounded shadow-sm bg-white overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse min-w-[1200px]">
          <thead className="bg-gray-100 border-b text-gray-700">
            <tr>
              <th className="p-2 border-r text-center w-12">#</th>
              <th className="p-2 border-r w-36">Date</th>
              <th className="p-2 border-r w-32">Type</th>
              <th className="p-2 border-r w-48">Category</th>
              <th className="p-2 border-r min-w-[200px]">Title / Particulars</th>
              <th className="p-2 border-r w-36">Amount</th>
              <th className="p-2 border-r w-36">Payment Mode</th>
              <th className="p-2 border-r min-w-[200px]">Remarks</th>
              {columns.map((column) => <th key={column.id} className="p-2 border-r min-w-[160px]">{column.name}</th>)}
              <th className="p-2 text-center w-12">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id} className="border-b hover:bg-blue-50/50">
                <td className="p-2 border-r text-center bg-gray-50 text-gray-500">{index + 1}</td>
                <td className="p-1 border-r"><input type="date" value={row.transaction_date} onChange={(event) => updateRow(row.id, "transaction_date", event.target.value)} className="w-full p-1" /></td>
                <td className="p-1 border-r"><select value={row.type} onChange={(event) => updateRow(row.id, "type", event.target.value)} className="w-full p-1"><option value="EXPENSE">EXPENSE</option><option value="INCOME">INCOME</option></select></td>
                <td className="p-1 border-r"><select value={row.category} onChange={(event) => updateRow(row.id, "category", event.target.value)} className="w-full p-1"><option value="">-- Select Category --</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></td>
                <td className="p-1 border-r"><input value={row.title} onChange={(event) => updateRow(row.id, "title", event.target.value)} placeholder="Enter description..." className="w-full p-1" /></td>
                <td className="p-1 border-r"><input type="number" value={row.amount} onChange={(event) => updateRow(row.id, "amount", event.target.value)} placeholder="0.00" className="w-full p-1 text-right" /></td>
                <td className="p-1 border-r"><select value={row.payment_method} onChange={(event) => updateRow(row.id, "payment_method", event.target.value)} className="w-full p-1"><option value="CASH">CASH</option><option value="BANK">BANK</option><option value="UPI">UPI</option><option value="CHEQUE">CHEQUE</option></select></td>
                <td className="p-1 border-r"><input value={row.remarks} onChange={(event) => updateRow(row.id, "remarks", event.target.value)} placeholder="Optional remarks..." className="w-full p-1" /></td>
                {columns.map((column) => <td key={column.id} className="p-1 border-r"><input value={row.custom_data[column.id] || ""} onChange={(event) => updateRow(row.id, "custom_data", { ...row.custom_data, [column.id]: event.target.value })} className="w-full p-1" /></td>)}
                <td className="p-1 text-center"><button onClick={() => setRows((current) => current.length === 1 ? current : current.filter((item) => item.id !== row.id))} className="text-red-500 p-1" title="Delete row"><Trash2 className="w-4 h-4" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <button onClick={() => setRows((current) => [...current, newRow()])} className="m-2 flex items-center gap-1 text-sm text-blue-600"><Plus className="w-4 h-4" /> Add New Row</button>
      </div>

      {showSettings && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="bg-white rounded-lg p-6 w-full max-w-md space-y-4 shadow-xl"><h3 className="text-lg font-bold">Manage Categories and Columns</h3><div className="flex gap-2"><input value={newCatName} onChange={(event) => setNewCatName(event.target.value)} placeholder="New category name" className="flex-1 border rounded px-3 py-2" /><button onClick={addCategory} className="bg-blue-600 text-white px-3 rounded">Add</button></div><div className="flex gap-2"><input value={newColumnName} onChange={(event) => setNewColumnName(event.target.value)} placeholder="New column name" className="flex-1 border rounded px-3 py-2" /><button onClick={addColumn} className="bg-blue-600 text-white px-3 rounded">Add</button></div><div className="max-h-60 overflow-y-auto border rounded divide-y">{categories.map((category) => <div key={category.id} className="p-2">Category: {category.name}</div>)}{columns.map((column) => <div key={column.id} className="flex justify-between p-2">Column: {column.name}<button onClick={() => removeColumn(column.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></button></div>)}</div><button onClick={() => setShowSettings(false)} className="float-right px-4 py-2 bg-gray-200 rounded">Close</button></div></div>}
    </div>
  );
}
