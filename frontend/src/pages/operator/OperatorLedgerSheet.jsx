import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Trash2,
  Save,
  Settings,
  AlertCircle,
  CalendarDays,
  ArrowRight,
} from "lucide-react";
import {
  createTransaction,
  getTransactionCategories,
  createTransactionCategory,
  deactivateTransactionCategory,
  getTransactionColumns,
  createTransactionColumn,
  deleteTransactionColumn,
  getTransactions,
} from "../../api/transactions";
import { getEvents } from "../../api/events";
import EventStatusBadge from "../../features/events/EventStatusBadge";

const today = () => new Date().toISOString().slice(0, 10);

const inr = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

const newRow = () => ({
  id: crypto.randomUUID(),
  transaction_date: today(),
  type: "EXPENSE",
  categoryName: "",
  title: "",
  amount: "",
  payment_method: "CASH",
  remarks: "",
  custom_data: {},
});

export default function OperatorLedgerSheet() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([newRow()]);
  const [newCatName, setNewCatName] = useState("");
  const [newColumnName, setNewColumnName] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [history, setHistory] = useState([]);

  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  // Map of "rowIndex-columnKey" -> input/select DOM node, used for
  // spreadsheet-style Enter/Arrow key navigation between cells.
  const cellRefs = useRef({});
  const pendingFocusKey = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [categoryResponse, columnResponse] = await Promise.all([
          getTransactionCategories(),
          getTransactionColumns(),
        ]);
        setCategories(categoryResponse.results || categoryResponse);
        setColumns(columnResponse.results || columnResponse);
        const transactionResponse = await getTransactions();
        setHistory(transactionResponse.results || transactionResponse);
      } catch (error) {
        setMessage({ type: "error", text: "Failed to load categories or columns." });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const res = await getEvents();
        const list = res.data.results || res.data;
        setEvents(list.slice(0, 4));
      } catch (error) {
        // Non-critical widget — fail quietly, the full Events page still works.
      } finally {
        setEventsLoading(false);
      }
    };
    loadEvents();
  }, []);

  // After a row is added because the user pressed Enter/Down on the last
  // row, move focus into the same column of the newly created row.
  useEffect(() => {
    if (!pendingFocusKey.current) return;
    const el = cellRefs.current[pendingFocusKey.current];
    if (el) el.focus();
    pendingFocusKey.current = null;
  }, [rows]);

  const setCellRef = (rowIndex, colKey) => (el) => {
    cellRefs.current[`${rowIndex}-${colKey}`] = el;
  };

  const focusCell = (rowIndex, colKey) => {
    const el = cellRefs.current[`${rowIndex}-${colKey}`];
    if (el) el.focus();
  };

  const handleCellKeyDown = (event, rowIndex, colKey) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (rowIndex + 1 < rows.length) {
        focusCell(rowIndex + 1, colKey);
      } else {
        pendingFocusKey.current = `${rowIndex + 1}-${colKey}`;
        setRows((current) => [...current, newRow()]);
      }
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (rowIndex > 0) focusCell(rowIndex - 1, colKey);
    } else if (event.key === "Enter" && !event.shiftKey) {
      // Every cell (other than Remarks, where Enter should behave normally)
      // behaves like Excel: Enter moves down a row.
      if (colKey !== "remarks") {
        event.preventDefault();
        if (rowIndex + 1 < rows.length) {
          focusCell(rowIndex + 1, colKey);
        } else {
          pendingFocusKey.current = `${rowIndex + 1}-${colKey}`;
          setRows((current) => [...current, newRow()]);
        }
      }
    }
  };

  const updateRow = (id, field, value) => {
    setRows((current) => {
      const index = current.findIndex((row) => row.id === id);
      if (index === -1) return current;
      const updated = { ...current[index], [field]: value };
      const next = current.map((row) => (row.id === id ? updated : row));

      // Excel-style "always one ready blank row at the bottom": once the
      // last row gets a title or amount, silently append a fresh blank row
      // so there's always somewhere to keep typing without clicking anything.
      const isLastRow = index === current.length - 1;
      const justFilledIn =
        (field === "title" || field === "amount") && String(value).trim() !== "";
      if (isLastRow && justFilledIn) {
        next.push(newRow());
      }
      return next;
    });
  };

  const refreshHistory = async () => {
    const transactionResponse = await getTransactions();
    setHistory(transactionResponse.results || transactionResponse);
  };

  // Turns whatever text the operator typed into the Category cell into a
  // real category id — matching an existing category case-insensitively, or
  // creating a brand new one on the fly (no need to visit "Manage
  // Categories" first, just type it like any other Excel cell).
  const resolveCategoryId = async (name, categoryCache) => {
    const trimmed = (name || "").trim();
    if (!trimmed) return null;

    const existing = categoryCache.find(
      (c) => c.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (existing) return existing.id;

    const created = await createTransactionCategory({ name: trimmed });
    categoryCache.push(created);
    return created.id;
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

      // Local cache so typing the same new category on two rows in this
      // batch only creates it once.
      const categoryCache = [...categories];

      for (const row of validRows) {
        const categoryId = await resolveCategoryId(row.categoryName, categoryCache);
        await createTransaction({
          transaction_type: row.type,
          category: categoryId,
          transaction_date: row.transaction_date,
          payment_mode: row.payment_method,
          narration: row.remarks,
          custom_data: row.custom_data,
          items: [{ title: row.title, amount: Number(row.amount), remarks: row.remarks }],
        });
      }

      setCategories(categoryCache);
      setRows([newRow()]);
      await refreshHistory();
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

  const removeCategory = async (id) => {
    try {
      await deactivateTransactionCategory(id);
      setCategories((current) => current.filter((category) => category.id !== id));
    } catch (error) {
      setMessage({ type: "error", text: "Category could not be removed." });
    }
  };

  if (loading) return <div className="p-6">Loading Day Book...</div>;

  return (
    <div className="p-6 space-y-6 max-w-full overflow-x-auto">

      {/* Events — a separate card, purely for event folders (picnics, sports
          day, etc). Kept completely apart from the day-to-day ledger grid
          below; full create/manage flow lives on the dedicated Events page. */}
      <div className="border border-gray-300 rounded shadow-sm bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-blue-600" />
              Events
            </h2>
            <p className="text-sm text-gray-500">
              Picnics, sports day, and other one-off occasions — tracked separately from daily entries.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/operator/events")}
              className="flex items-center gap-1 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" /> New Event
            </button>
            <button
              onClick={() => navigate("/operator/events")}
              className="flex items-center gap-1 px-3 py-2 text-sm border rounded hover:bg-gray-50 text-gray-700"
            >
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {eventsLoading ? (
          <p className="text-sm text-gray-400 py-4">Loading events…</p>
        ) : events.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm border border-dashed rounded">
            No events yet. Create one to start tracking picnic/sports-day style spending.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {events.map((ev) => (
              <div
                key={ev.id}
                onClick={() => navigate(`/operator/events/${ev.id}`)}
                className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 hover:shadow-sm transition cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900 truncate pr-2">{ev.name}</span>
                  <EventStatusBadge status={ev.status} />
                </div>
                <div className="text-xs text-gray-400 mb-2">{ev.event_date}</div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{ev.entries_count} entries</span>
                  <span className="font-semibold text-gray-800">{inr(ev.total_amount)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Day Book — the actual excel-style grid */}
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
                <td className="p-1 border-r">
                  <input
                    type="date"
                    value={row.transaction_date}
                    onChange={(event) => updateRow(row.id, "transaction_date", event.target.value)}
                    onKeyDown={(event) => handleCellKeyDown(event, index, "transaction_date")}
                    ref={setCellRef(index, "transaction_date")}
                    className="w-full p-1 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
                  />
                </td>
                <td className="p-1 border-r">
                  <select
                    value={row.type}
                    onChange={(event) => updateRow(row.id, "type", event.target.value)}
                    onKeyDown={(event) => handleCellKeyDown(event, index, "type")}
                    ref={setCellRef(index, "type")}
                    className="w-full p-1 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
                  >
                    <option value="EXPENSE">EXPENSE</option>
                    <option value="INCOME">INCOME</option>
                  </select>
                </td>
                <td className="p-1 border-r">
                  <input
                    list="ledger-category-options"
                    value={row.categoryName}
                    onChange={(event) => updateRow(row.id, "categoryName", event.target.value)}
                    onKeyDown={(event) => handleCellKeyDown(event, index, "category")}
                    ref={setCellRef(index, "category")}
                    placeholder="Type a category…"
                    className="w-full p-1 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
                  />
                </td>
                <td className="p-1 border-r">
                  <input
                    value={row.title}
                    onChange={(event) => updateRow(row.id, "title", event.target.value)}
                    onKeyDown={(event) => handleCellKeyDown(event, index, "title")}
                    ref={setCellRef(index, "title")}
                    placeholder="Enter description..."
                    className="w-full p-1 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
                  />
                </td>
                <td className="p-1 border-r">
                  <input
                    type="number"
                    value={row.amount}
                    onChange={(event) => updateRow(row.id, "amount", event.target.value)}
                    onKeyDown={(event) => handleCellKeyDown(event, index, "amount")}
                    ref={setCellRef(index, "amount")}
                    placeholder="0.00"
                    className="w-full p-1 text-right focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
                  />
                </td>
                <td className="p-1 border-r">
                  <select
                    value={row.payment_method}
                    onChange={(event) => updateRow(row.id, "payment_method", event.target.value)}
                    onKeyDown={(event) => handleCellKeyDown(event, index, "payment_method")}
                    ref={setCellRef(index, "payment_method")}
                    className="w-full p-1 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
                  >
                    <option value="CASH">CASH</option>
                    <option value="BANK">BANK</option>
                    <option value="UPI">UPI</option>
                    <option value="CHEQUE">CHEQUE</option>
                  </select>
                </td>
                <td className="p-1 border-r">
                  <input
                    value={row.remarks}
                    onChange={(event) => updateRow(row.id, "remarks", event.target.value)}
                    onKeyDown={(event) => handleCellKeyDown(event, index, "remarks")}
                    ref={setCellRef(index, "remarks")}
                    placeholder="Optional remarks..."
                    className="w-full p-1 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
                  />
                </td>
                {columns.map((column) => (
                  <td key={column.id} className="p-1 border-r">
                    <input
                      value={row.custom_data[column.id] || ""}
                      onChange={(event) => updateRow(row.id, "custom_data", { ...row.custom_data, [column.id]: event.target.value })}
                      onKeyDown={(event) => handleCellKeyDown(event, index, column.id)}
                      ref={setCellRef(index, column.id)}
                      className="w-full p-1 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
                    />
                  </td>
                ))}
                <td className="p-1 text-center"><button onClick={() => setRows((current) => current.length === 1 ? current : current.filter((item) => item.id !== row.id))} className="text-red-500 p-1" title="Delete row"><Trash2 className="w-4 h-4" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <datalist id="ledger-category-options">
          {categories.map((category) => <option key={category.id} value={category.name} />)}
        </datalist>
        <button onClick={() => setRows((current) => [...current, newRow()])} className="m-2 flex items-center gap-1 text-sm text-blue-600"><Plus className="w-4 h-4" /> Add New Row</button>
      </div>

      {showSettings && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="bg-white rounded-lg p-6 w-full max-w-md space-y-4 shadow-xl"><h3 className="text-lg font-bold">Manage Categories and Columns</h3><p className="text-xs text-gray-500 -mt-2">Categories can also just be typed directly into the grid — this is only needed for adding extra columns or cleaning up old categories.</p><div className="flex gap-2"><input value={newCatName} onChange={(event) => setNewCatName(event.target.value)} placeholder="New category name" className="flex-1 border rounded px-3 py-2" /><button onClick={addCategory} className="bg-blue-600 text-white px-3 rounded">Add</button></div><div className="flex gap-2"><input value={newColumnName} onChange={(event) => setNewColumnName(event.target.value)} placeholder="New column name" className="flex-1 border rounded px-3 py-2" /><button onClick={addColumn} className="bg-blue-600 text-white px-3 rounded">Add</button></div><div className="max-h-60 overflow-y-auto border rounded divide-y">{categories.map((category) => <div key={category.id} className="flex justify-between p-2">Category: {category.name}<button onClick={() => removeCategory(category.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></button></div>)}{columns.map((column) => <div key={column.id} className="flex justify-between p-2">Column: {column.name}<button onClick={() => removeColumn(column.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></button></div>)}</div><button onClick={() => setShowSettings(false)} className="float-right px-4 py-2 bg-gray-200 rounded">Close</button></div></div>}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-800">My Transaction History</h2>
        {history.length === 0 ? (
          <p className="p-6 bg-white border rounded text-sm text-gray-500">No submitted transactions yet.</p>
        ) : (
          <div className="border rounded bg-white overflow-x-auto">
            <table className="min-w-[700px] w-full text-sm text-left">
              <thead className="bg-gray-100 border-b text-gray-700">
                <tr><th className="p-2">Date</th><th className="p-2">Type</th><th className="p-2">Title</th><th className="p-2">Amount</th><th className="p-2">Status</th><th className="p-2">Reviewed By</th></tr>
              </thead>
              <tbody className="divide-y">
                {history.map((item) => (
                  <tr key={item.id}>
                    <td className="p-2">{item.transaction_date}</td>
                    <td className="p-2">{item.transaction_type}</td>
                    <td className="p-2">{item.items?.[0]?.title || "-"}</td>
                    <td className="p-2">₹{item.total_amount}</td>
                    <td className="p-2 font-medium">{item.status}</td>
                    <td className="p-2">{item.approved_by_name || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

    </div>
  );
}