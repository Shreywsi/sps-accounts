import { useEffect, useState } from "react";
import Card from "../components/common/Card";
import Loader from "../components/ui/Loader";
import Modal from "../components/ui/Modal";
import { getClasses, getSessions, createClass } from "../api/academics";
import {
  getFeeCategories,
  createFeeCategory,
  getFeeStructures,
  createFeeStructure,
  deleteFeeStructure,
  createFeeStructureItem,
} from "../api/fees";

export default function Fees() {
  const [classes, setClasses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [structures, setStructures] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [newCategoryName, setNewCategoryName] = useState("");

  const [showAddClass, setShowAddClass] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [savingClass, setSavingClass] = useState(false);

  const [form, setForm] = useState({
    name: "",
    academic_session: "",
    class_from: "",
    class_to: "",
    due_date: "",
    late_fee_per_day: "0",
  });

  const [rows, setRows] = useState([{ fee_category: "", amount: "" }]);

  const loadAll = () => {
    setLoading(true);
    setError("");

    Promise.all([
      getClasses(),
      getSessions(),
      getFeeCategories(),
      getFeeStructures(),
    ])
      .then(([c, s, cat, st]) => {
        const sortedClasses = [...(c.data.results || c.data)].sort(
          (a, b) => a.display_order - b.display_order
        );
        setClasses(sortedClasses);
        setSessions(s.data.results || s.data);
        setCategories(cat.data.results || cat.data);
        setStructures(st.data.results || st.data);
      })
      .catch((err) => {
        console.error("Failed to load fee setup data:", err);
        setError("Failed to load data.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      await createFeeCategory({ name: newCategoryName.trim() });
      setNewCategoryName("");
      loadAll();
    } catch (err) {
      console.error("Failed to add category:", err);
      alert(err.response?.data?.detail || "Failed to add category.");
    }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    setSavingClass(true);
    try {
      await createClass({ name: newClassName.trim() });
      setNewClassName("");
      setShowAddClass(false);
      loadAll();
    } catch (err) {
      console.error("Failed to create class:", err);
      alert(
        err.response?.data?.name?.[0] ||
          "Failed to create class. It may already exist."
      );
    } finally {
      setSavingClass(false);
    }
  };

  const handleRowChange = (index, field, value) => {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const addRow = () => {
    setRows((prev) => [...prev, { fee_category: "", amount: "" }]);
  };

  const removeRow = (index) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.academic_session || !form.class_from || !form.class_to) {
      alert("Please fill in name, session, and the class range.");
      return;
    }

    const fromOrder = classes.find((c) => String(c.id) === String(form.class_from))
      ?.display_order;
    const toOrder = classes.find((c) => String(c.id) === String(form.class_to))
      ?.display_order;

    if (fromOrder === undefined || toOrder === undefined) {
      alert("Invalid class range.");
      return;
    }

    const targetClasses = classes.filter(
      (c) =>
        c.display_order >= Math.min(fromOrder, toOrder) &&
        c.display_order <= Math.max(fromOrder, toOrder)
    );

    const validRows = rows.filter((r) => r.fee_category && r.amount);

    if (validRows.length === 0) {
      alert("Add at least one fee item (e.g. Tuition Fee).");
      return;
    }

    setSaving(true);

    try {
      for (const cls of targetClasses) {
        const { data: structure } = await createFeeStructure({
          name: form.name,
          academic_session: form.academic_session,
          school_class: cls.id,
          due_date: form.due_date || null,
          late_fee_per_day: form.late_fee_per_day || "0",
        });

        for (const row of validRows) {
          await createFeeStructureItem({
            fee_structure: structure.id,
            fee_category: row.fee_category,
            amount: row.amount,
          });
        }
      }

      setForm({
        name: "",
        academic_session: "",
        class_from: "",
        class_to: "",
        due_date: "",
        late_fee_per_day: "0",
      });
      setRows([{ fee_category: "", amount: "" }]);
      loadAll();
      alert("Fee structure created and sent to admin for verification.");
    } catch (err) {
      console.error("Failed to create fee structure:", err);
      alert(err.response?.data?.detail || "Failed to create fee structure.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStructure = async (id) => {
    if (!window.confirm("Delete this fee structure?")) return;
    try {
      await deleteFeeStructure(id);
      loadAll();
    } catch (err) {
      console.error("Failed to delete structure:", err);
      alert(err.response?.data?.detail || "Failed to delete structure.");
    }
  };

  if (loading) return <Loader label="Loading fee setup..." />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Fee Structure</h1>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-md border border-red-200">
          {error}
        </div>
      )}

      <Card>
        <h2 className="text-lg font-semibold mb-4">Fee Categories</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map((c) => (
            <span
              key={c.id}
              className="px-3 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
            >
              {c.name}
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. Cab Fare, Annual Fee, Lab Fee"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            className="flex-1 border rounded-md px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={handleAddCategory}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm"
          >
            Add Category
          </button>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold mb-4">Define Fee Structure</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">Structure Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. 2025-26 Regular Fees"
                className="w-full border rounded-md px-3 py-2 text-sm mt-1"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Academic Session</label>
              <select
                value={form.academic_session}
                onChange={(e) =>
                  setForm({ ...form, academic_session: e.target.value })
                }
                className="w-full border rounded-md px-3 py-2 text-sm mt-1"
              >
                <option value="">Select session</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-600 flex items-center justify-between">
                From Class
                <button
                  type="button"
                  onClick={() => setShowAddClass(true)}
                  className="text-blue-600 text-xs"
                >
                  + Add Class
                </button>
              </label>
              <select
                value={form.class_from}
                onChange={(e) => setForm({ ...form, class_from: e.target.value })}
                className="w-full border rounded-md px-3 py-2 text-sm mt-1"
              >
                <option value="">Select class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-600">To Class</label>
              <select
                value={form.class_to}
                onChange={(e) => setForm({ ...form, class_to: e.target.value })}
                className="w-full border rounded-md px-3 py-2 text-sm mt-1"
              >
                <option value="">Select class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-600">
                Due Date (pay by this date to avoid late fee)
              </label>
              <input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                className="w-full border rounded-md px-3 py-2 text-sm mt-1"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">
                Late Fee (per day, after due date)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.late_fee_per_day}
                onChange={(e) =>
                  setForm({ ...form, late_fee_per_day: e.target.value })
                }
                className="w-full border rounded-md px-3 py-2 text-sm mt-1"
              />
              <p className="text-xs text-gray-400 mt-1">
                Applied per student when this structure is assigned.
              </p>
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-600 block mb-2">
              Fee Items (Tuition, Annual Fee, Cab Fare, etc.)
            </label>

            <div className="space-y-2">
              {rows.map((row, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <select
                    value={row.fee_category}
                    onChange={(e) =>
                      handleRowChange(i, "fee_category", e.target.value)
                    }
                    className="flex-1 border rounded-md px-3 py-2 text-sm"
                  >
                    <option value="">Select category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Amount"
                    value={row.amount}
                    onChange={(e) => handleRowChange(i, "amount", e.target.value)}
                    className="w-40 border rounded-md px-3 py-2 text-sm"
                  />

                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    className="text-red-500 text-sm px-2"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addRow}
              className="text-blue-600 text-sm mt-2"
            >
              + Add another fee item
            </button>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-md text-sm disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Fee Structure"}
          </button>
        </form>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold mb-4">Existing Fee Structures</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Class</th>
                <th className="py-2 pr-4">Session</th>
                <th className="py-2 pr-4">Due Date</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4"></th>
              </tr>
            </thead>
            <tbody>
              {structures.map((s) => (
                <tr key={s.id} className="border-b last:border-0">
                  <td className="py-2 pr-4">{s.name}</td>
                  <td className="py-2 pr-4">{s.school_class_name}</td>
                  <td className="py-2 pr-4">{s.session_name}</td>
                  <td className="py-2 pr-4">{s.due_date || "—"}</td>
                  <td className="py-2 pr-4">
                    {s.is_active ? (
                      <span className="text-green-600">Active</span>
                    ) : (
                      <span className="text-gray-400">Inactive</span>
                    )}
                  </td>
                  <td className="py-2 pr-4">
                    <button
                      onClick={() => handleDeleteStructure(s.id)}
                      className="text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {structures.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-gray-400">
                    No fee structures yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={showAddClass}
        onClose={() => setShowAddClass(false)}
        title="Add Class"
      >
        <form onSubmit={handleCreateClass} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Class Name
            </label>
            <input
              type="text"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              placeholder="e.g. Class 10"
              required
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={savingClass}
            className="bg-blue-600 text-white px-6 py-2 rounded-md text-sm disabled:opacity-50"
          >
            {savingClass ? "Saving..." : "Add Class"}
          </button>
        </form>
      </Modal>
    </div>
  );
}