import { useEffect, useState } from "react";
import {
  getCustomFields,
  createCustomField,
  deactivateCustomField,
  activateCustomField,
  deleteCustomField,
} from "../api/customFields";

export default function Settings() {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("text");
  const [saving, setSaving] = useState(false);

  // Which field id currently has a delete/activate/deactivate request
  // in flight, so we can disable just that row's buttons.
  const [busyId, setBusyId] = useState(null);

  const loadFields = () => {
    setLoading(true);
    getCustomFields(false) // show inactive ones too, so admin can see everything
      .then((res) => setFields(res.data))
      .catch((err) => {
        console.error("Failed to load custom fields:", err);
        setError("Failed to load custom fields.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadFields();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await createCustomField({ name: newName.trim(), field_type: newType });
      setNewName("");
      setNewType("text");
      loadFields();
    } catch (err) {
      console.error("Failed to create field:", err);
      alert(
        err.response?.data?.name?.[0] ||
          "Failed to create field. It may already exist."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (id) => {
    setBusyId(id);
    try {
      await deactivateCustomField(id);
      loadFields();
    } catch (err) {
      console.error("Failed to deactivate field:", err);
      alert("Failed to remove field from student forms.");
    } finally {
      setBusyId(null);
    }
  };

  const handleActivate = async (id) => {
    setBusyId(id);
    try {
      await activateCustomField(id);
      loadFields();
    } catch (err) {
      console.error("Failed to reactivate field:", err);
      alert("Failed to bring field back.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (field) => {
    const confirmed = window.confirm(
      `Permanently delete "${field.name}"? This also deletes every ` +
        `student's saved value for this field. This cannot be undone.\n\n` +
        `If you just want to hide it without losing data, use "Remove ` +
        `from forms" instead.`
    );
    if (!confirmed) return;

    setBusyId(field.id);
    try {
      await deleteCustomField(field.id);
      loadFields();
    } catch (err) {
      console.error("Failed to delete field:", err);
      alert("Failed to delete field.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Settings</h1>

      <div className="bg-white border rounded-md p-6 max-w-3xl">
        <h2 className="text-lg font-semibold mb-1">
          Custom Student Fields
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Add or remove extra information fields (e.g. "Blood Group", "Bus
          Route") at any time. They automatically show up on every
          student's Add / Edit form for operators to fill in.
        </p>

        <form
          onSubmit={handleCreate}
          className="flex flex-col sm:flex-row gap-3 mb-6"
        >
          <input
            type="text"
            placeholder="Field name (e.g. Blood Group)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
            className="flex-1 border rounded-md px-3 py-2 text-sm"
          />
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm"
          >
            <option value="text">Text</option>
            <option value="number">Number</option>
            <option value="date">Date</option>
          </select>
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm disabled:opacity-50"
          >
            {saving ? "Adding..." : "+ Add Field"}
          </button>
        </form>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-md border border-red-200 mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : fields.length === 0 ? (
          <p className="text-sm text-gray-500">No custom fields yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-2">Name</th>
                <th className="py-2">Type</th>
                <th className="py-2">Status</th>
                <th className="py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {fields.map((f) => {
                const isBusy = busyId === f.id;
                return (
                  <tr key={f.id} className="border-b last:border-0">
                    <td className="py-2">{f.name}</td>
                    <td className="py-2 capitalize">{f.field_type}</td>
                    <td className="py-2">
                      {f.is_active ? (
                        <span className="text-green-700">Active</span>
                      ) : (
                        <span className="text-gray-400">Removed from forms</span>
                      )}
                    </td>
                    <td className="py-2 text-right space-x-3 whitespace-nowrap">
                      {f.is_active ? (
                        <button
                          onClick={() => handleDeactivate(f.id)}
                          disabled={isBusy}
                          className="text-yellow-700 text-xs hover:underline disabled:opacity-50"
                        >
                          Remove from forms
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActivate(f.id)}
                          disabled={isBusy}
                          className="text-green-700 text-xs hover:underline disabled:opacity-50"
                        >
                          Bring back
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(f)}
                        disabled={isBusy}
                        className="text-red-600 text-xs hover:underline disabled:opacity-50"
                      >
                        Delete permanently
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}