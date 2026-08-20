import { useEffect, useState } from "react";
import { getClasses, getSections } from "../../api/academics";
import { createStudent, updateStudent } from "../../api/students";

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

export default function StudentForm({ student, onSuccess, onCancel }) {
  const [form, setForm] = useState(emptyForm);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isEditMode = Boolean(student);

  useEffect(() => {
    getClasses()
      .then((res) => setClasses(res.data))
      .catch((err) => console.error("Failed to load classes:", err));
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
      // Reset any leftover local preview when switching students
      setPhotoFile(null);
      setPhotoPreview(null);
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

  const handlePhotoChange = (e) => {
    const file = e.target.files[0] || null;
    setPhotoFile(file);
    setPhotoPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value !== "" && value !== null) {
          payload.append(key, value);
        }
      });
      if (photoFile) {
        payload.append("photo", photoFile);
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

  // Priority: freshly picked file preview > existing saved photo URL > none
  const displayPhoto = photoPreview || student?.photo || null;

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