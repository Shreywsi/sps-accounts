import { useEffect, useState } from "react";
import { getClasses, getSections } from "../../api/academics";
import { createStudent, updateStudent } from "../../api/students";
import { getCustomFields, createCustomField } from "../../api/customFields";

const emptyForm = {
  admission_no: "",
  first_name: "",
  last_name: "",
  age: "",
  gender: "",
  school_class: "",
  academic_section: "",
  roll_number: "",
  father_name: "",
  mother_name: "",
  phone: "",
  email: "",
  address: "",
};

let dynamicRowCounter = 0;
function nextDynamicRowId() {
  dynamicRowCounter += 1;
  return `new-${dynamicRowCounter}`;
}

export default function StudentForm({ student, onSuccess, onCancel }) {
  const [form, setForm] = useState(emptyForm);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [removeExistingPhoto, setRemoveExistingPhoto] = useState(false);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Existing, already-known custom fields (predefined earlier, by anyone)
  const [customFieldDefs, setCustomFieldDefs] = useState([]);
  const [customValues, setCustomValues] = useState({}); // { fieldId: value }

  // Brand-new fields the operator is typing right now: [{ id, name, value }]
  // These don't exist yet — they get created automatically on save.
  const [dynamicFields, setDynamicFields] = useState([]);

  const isEditMode = Boolean(student);

  const loadCustomFieldDefs = () => {
    getCustomFields(true)
      .then((res) => setCustomFieldDefs(res.data))
      .catch((err) => console.error("Failed to load custom fields:", err));
  };

  useEffect(() => {
    getClasses()
      .then((res) => setClasses(res.data))
      .catch((err) => console.error("Failed to load classes:", err));

    loadCustomFieldDefs();
  }, []);

  useEffect(() => {
    if (student) {
      setForm({
        admission_no: student.admission_no || "",
        first_name: student.first_name || "",
        last_name: student.last_name || "",
        age: student.age || "",
        gender: student.gender || "",
        school_class: student.school_class || "",
        academic_section: student.academic_section || "",
        roll_number: student.roll_number || "",
        father_name: student.father_name || "",
        mother_name: student.mother_name || "",
        phone: student.phone || "",
        email: student.email || "",
        address: student.address || "",
      });

      // Load existing custom field values keyed by field id
      const existing = {};
      (student.custom_values || []).forEach((cv) => {
        existing[cv.field_id] = cv.value;
      });
      setCustomValues(existing);
      setDynamicFields([]);

      // Reset any leftover local preview when switching students
      setPhotoFile(null);
      setPhotoPreview(null);
      setRemoveExistingPhoto(false);
    } else {
      setForm(emptyForm);
      setCustomValues({});
      setDynamicFields([]);
      setRemoveExistingPhoto(false);
    }
  }, [student]);

  useEffect(() => {
    if (!form.school_class) {
      setSections([]);
      return;
    }
    getSections(form.school_class)
      .then((res) => setSections(res.data))
      .catch((err) => console.error("Failed to load sections:", err));
  }, [form.school_class]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCustomValueChange = (fieldId, value) => {
    setCustomValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0] || null;
    setPhotoFile(file);
    setPhotoPreview(file ? URL.createObjectURL(file) : null);
    // Picking a new file always overrides any pending removal
    if (file) setRemoveExistingPhoto(false);
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setRemoveExistingPhoto(true);
  };

  // --- Ad-hoc "add your own field" rows -----------------------------

  const addDynamicFieldRow = () => {
    setDynamicFields((prev) => [
      ...prev,
      { id: nextDynamicRowId(), name: "", value: "" },
    ]);
  };

  const updateDynamicField = (id, key, val) => {
    setDynamicFields((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [key]: val } : row))
    );
  };

  const removeDynamicField = (id) => {
    setDynamicFields((prev) => prev.filter((row) => row.id !== id));
  };

  // Turn the operator's typed-in name/value rows into real field_id/value
  // pairs, creating a new CustomFieldDefinition on the fly for any name
  // that doesn't already exist (matched case-insensitively).
  const resolveDynamicFields = async () => {
    const resolved = [];

    for (const row of dynamicFields) {
      const name = row.name.trim();
      const value = row.value.trim();
      if (!name || !value) continue;

      const existing = customFieldDefs.find(
        (f) => f.name.toLowerCase() === name.toLowerCase()
      );

      let fieldId = existing?.id;

      if (!fieldId) {
        try {
          const created = await createCustomField({
            name,
            field_type: "text",
          });
          fieldId = created.data.id;
        } catch (err) {
          // Someone else may have just created a field with this exact
          // name — re-check the list once before giving up.
          const refreshed = await getCustomFields(true);
          const match = refreshed.data.find(
            (f) => f.name.toLowerCase() === name.toLowerCase()
          );
          if (match) {
            fieldId = match.id;
          } else {
            throw err;
          }
        }
      }

      resolved.push({ field_id: fieldId, value });
    }

    return resolved;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const dynamicResolved = await resolveDynamicFields();

      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value !== "" && value !== null) {
          payload.append(key, value);
        }
      });
      if (photoFile) {
        payload.append("photo", photoFile);
      }
      if (removeExistingPhoto && !photoFile) {
        payload.append("remove_photo", "true");
      }

      // Custom fields must travel as a JSON string inside the multipart
      // body (the backend parses this key back into a list) since a photo
      // upload forces the whole request into multipart/form-data.
      //
      // Every field the operator has touched is sent, including ones
      // cleared back to "" — the backend treats an empty value as "delete
      // this field for this student" rather than silently ignoring it.
      const customValuesPayload = [
        ...Object.entries(customValues).map(([fieldId, value]) => ({
          field_id: fieldId,
          value: (value ?? "").toString(),
        })),
        ...dynamicResolved,
      ];

      if (customValuesPayload.length > 0) {
        payload.append("custom_values", JSON.stringify(customValuesPayload));
      }

      if (isEditMode) {
        await updateStudent(student.id, payload);
      } else {
        await createStudent(payload);
      }

      onSuccess?.();
    } catch (err) {
      console.error("Save student error:", err);
      const detail =
        err.response?.data?.detail ||
        JSON.stringify(err.response?.data) ||
        "Failed to save student.";
      setError(detail);
    } finally {
      setSaving(false);
    }
  };

  // Priority: explicit removal > freshly picked file preview > existing saved photo URL > none
  const displayPhoto = removeExistingPhoto
    ? null
    : photoPreview || student?.photo || null;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-md border border-red-200">
          {error}
        </div>
      )}

      {/* Photo panel on the right, fields on the left — like an admit card */}
      <div className="flex flex-col-reverse lg:flex-row-reverse gap-6">
        <div className="lg:w-52 shrink-0">
          <div className="lg:sticky lg:top-4 flex flex-col items-center gap-3">
            <div className="w-40 h-48 lg:w-48 lg:h-56 rounded-md border-2 border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center">
              {displayPhoto ? (
                <img
                  src={displayPhoto}
                  alt="Student"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs text-gray-400 px-2 text-center">
                  No photo uploaded
                </span>
              )}
            </div>

            <label className="w-full">
              <span className="block text-sm font-medium text-gray-700 mb-1 text-center">
                Student Photo
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="text-xs w-full"
              />
            </label>

            {displayPhoto && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="text-xs text-red-600 hover:underline"
              >
                Remove Photo
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Admission No
              </label>
              <input
                name="admission_no"
                value={form.admission_no}
                onChange={handleChange}
                required
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Roll Number
              </label>
              <input
                name="roll_number"
                type="number"
                value={form.roll_number}
                onChange={handleChange}
                required
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                required
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Age
              </label>
              <input
                name="age"
                type="number"
                value={form.age}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender
              </label>
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2 text-sm"
              >
                <option value="">Select</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Class
              </label>
              <select
                name="school_class"
                value={form.school_class}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2 text-sm"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Section
              </label>
              <select
                name="academic_section"
                value={form.academic_section}
                onChange={handleChange}
                disabled={!form.school_class}
                className="w-full border rounded-md px-3 py-2 text-sm disabled:bg-gray-100"
              >
                <option value="">Select section</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Father's Name
              </label>
              <input
                name="father_name"
                value={form.father_name}
                onChange={handleChange}
                required
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mother's Name
              </label>
              <input
                name="mother_name"
                value={form.mother_name}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              rows={2}
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
          </div>

          {/* Already-known custom fields (created earlier by anyone) */}
          {customFieldDefs.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2 border-t pt-4">
                Additional Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {customFieldDefs.map((field) => (
                  <div key={field.id}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.name}
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        type={
                          field.field_type === "number"
                            ? "number"
                            : field.field_type === "date"
                            ? "date"
                            : "text"
                        }
                        value={customValues[field.id] ?? ""}
                        onChange={(e) =>
                          handleCustomValueChange(field.id, e.target.value)
                        }
                        className="flex-1 border rounded-md px-3 py-2 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => handleCustomValueChange(field.id, "")}
                        className="text-red-500 text-sm px-2"
                        title={`Remove ${field.name} for this student`}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add a brand-new field right here — no setup needed first */}
          <div>
            <div className="flex items-center justify-between border-t pt-4 mb-2">
              <h3 className="text-sm font-semibold text-gray-700">
                Add Another Field
              </h3>
              <button
                type="button"
                onClick={addDynamicFieldRow}
                className="text-sm text-blue-600 hover:underline"
              >
                + Add Field
              </button>
            </div>

            {dynamicFields.length === 0 ? (
              <p className="text-xs text-gray-400">
                Need to record something not listed above, like Blood Group
                or Bus Route? Click "+ Add Field" and type it in.
              </p>
            ) : (
              <div className="space-y-3">
                {dynamicFields.map((row) => (
                  <div key={row.id} className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Field name (e.g. Blood Group)"
                      value={row.name}
                      onChange={(e) =>
                        updateDynamicField(row.id, "name", e.target.value)
                      }
                      className="flex-1 border rounded-md px-3 py-2 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Value (e.g. O+)"
                      value={row.value}
                      onChange={(e) =>
                        updateDynamicField(row.id, "value", e.target.value)
                      }
                      className="flex-1 border rounded-md px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeDynamicField(row.id)}
                      className="text-red-500 text-sm px-2"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 text-white px-5 py-2 rounded-md text-sm disabled:opacity-50"
        >
          {saving ? "Saving..." : isEditMode ? "Update Student" : "Add Student"}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2 rounded-md text-sm border"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}