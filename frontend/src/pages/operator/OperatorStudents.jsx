import { useEffect, useState } from "react";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import EmptyState from "../../components/common/EmptyState";
import Loader from "../../components/ui/Loader";
import Modal from "../../components/ui/Modal";
import StudentForm from "../../components/students/StudentForm";
import {
  getClasses,
  createClass,
  getSections,
  createSection,
} from "../../api/academics";
import { getStudents } from "../../api/students";

export default function OperatorStudents() {
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");

  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [search, setSearch] = useState("");

  const [showAddClass, setShowAddClass] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [savingClass, setSavingClass] = useState(false);

  const [showAddSection, setShowAddSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const [savingSection, setSavingSection] = useState(false);

  const [showStudentForm, setShowStudentForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  const [error, setError] = useState("");

  const loadClasses = () => {
    getClasses()
      .then((res) => setClasses(res.data))
      .catch((err) => console.error("Failed to load classes:", err));
  };

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (!selectedClassId) {
      setSections([]);
      setSelectedSectionId("");
      return;
    }
    getSections(selectedClassId)
      .then((res) => setSections(res.data))
      .catch((err) => console.error("Failed to load sections:", err));
  }, [selectedClassId]);

  const loadStudents = () => {
    setLoadingStudents(true);
    setError("");

    const params = {};
    if (selectedClassId) params.school_class = selectedClassId;
    if (selectedSectionId) params.academic_section = selectedSectionId;

    getStudents(params)
      .then((res) => setStudents(res.data))
      .catch((err) => {
        console.error("Failed to load students:", err);
        setError("Failed to load students.");
      })
      .finally(() => setLoadingStudents(false));
  };

  useEffect(() => {
    loadStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClassId, selectedSectionId]);

  const filteredStudents = students.filter((s) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
    return (
      fullName.includes(q) ||
      s.admission_no?.toLowerCase().includes(q)
    );
  });

  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    setSavingClass(true);
    try {
      await createClass({ name: newClassName.trim() });
      setNewClassName("");
      setShowAddClass(false);
      loadClasses();
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

  const handleCreateSection = async (e) => {
    e.preventDefault();
    if (!newSectionName.trim() || !selectedClassId) return;
    setSavingSection(true);
    try {
      await createSection({
        school_class: selectedClassId,
        name: newSectionName.trim(),
      });
      setNewSectionName("");
      setShowAddSection(false);
      getSections(selectedClassId).then((res) => setSections(res.data));
    } catch (err) {
      console.error("Failed to create section:", err);
      alert(
        err.response?.data?.name?.[0] ||
          "Failed to create section. It may already exist for this class."
      );
    } finally {
      setSavingSection(false);
    }
  };

  const openAddStudent = () => {
    setEditingStudent(null);
    setShowStudentForm(true);
  };

  const openEditStudent = (student) => {
    setEditingStudent(student);
    setShowStudentForm(true);
  };

  const handleStudentSaved = () => {
    setShowStudentForm(false);
    setEditingStudent(null);
    loadStudents();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Students</h1>
        <Button onClick={openAddStudent}>+ Add Student</Button>
      </div>

      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Class
            </label>
            <div className="flex gap-2">
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="flex-1 border rounded-md px-3 py-2 text-sm"
              >
                <option value="">All Classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowAddClass(true)}
                className="px-3 py-2 border rounded-md text-sm hover:bg-gray-50"
              >
                + Class
              </button>
            </div>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Section
            </label>
            <div className="flex gap-2">
              <select
                value={selectedSectionId}
                onChange={(e) => setSelectedSectionId(e.target.value)}
                disabled={!selectedClassId}
                className="flex-1 border rounded-md px-3 py-2 text-sm disabled:bg-gray-100"
              >
                <option value="">All Sections</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowAddSection(true)}
                disabled={!selectedClassId}
                className="px-3 py-2 border rounded-md text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                + Section
              </button>
            </div>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              placeholder="Name or Admission No"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>
      </Card>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-md border border-red-200 mb-4">
          {error}
        </div>
      )}

      {loadingStudents ? (
        <Loader label="Loading students..." />
      ) : filteredStudents.length === 0 ? (
        <Card>
          <EmptyState message="No students found." />
        </Card>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="min-w-[800px] w-full">
            <thead>
              <tr className="border-b text-left text-sm text-gray-500 bg-gray-50">
                <th className="px-4 py-3">Admission No</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Age</th>
                <th className="px-4 py-3">Gender</th>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3">Section</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr
                  key={student.id}
                  onClick={() => openEditStudent(student)}
                  className="border-b last:border-0 hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-4 py-3">{student.admission_no}</td>
                  <td className="px-4 py-3 text-blue-600">
                    {student.first_name} {student.last_name}
                  </td>
                  <td className="px-4 py-3">{student.age || "-"}</td>
                  <td className="px-4 py-3">{student.gender || "-"}</td>
                  <td className="px-4 py-3">{student.school_class_name || "-"}</td>
                  <td className="px-4 py-3">{student.section_name || "-"}</td>
                  <td className="px-4 py-3">{student.phone || "-"}</td>
                  <td className="px-4 py-3">{student.verification_status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

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
          <div className="flex gap-3">
            <Button type="submit" disabled={savingClass}>
              {savingClass ? "Saving..." : "Add Class"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={showAddSection}
        onClose={() => setShowAddSection(false)}
        title="Add Section"
      >
        <form onSubmit={handleCreateSection} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Section Name
            </label>
            <input
              type="text"
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              placeholder="e.g. A"
              required
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-3">
            <Button type="submit" disabled={savingSection}>
              {savingSection ? "Saving..." : "Add Section"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={showStudentForm}
        onClose={() => setShowStudentForm(false)}
        title={editingStudent ? "Edit Student" : "Add Student"}
      >
        <StudentForm
          student={editingStudent}
          onSuccess={handleStudentSaved}
          onCancel={() => setShowStudentForm(false)}
        />
      </Modal>
    </div>
  );
}