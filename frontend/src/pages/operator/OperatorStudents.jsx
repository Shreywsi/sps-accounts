import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import EmptyState from "../../components/common/EmptyState";
import Loader from "../../components/ui/Loader";
import Modal from "../../components/ui/Modal";
import StudentForm from "../../components/students/StudentForm";
import { Trash2, Eye, Edit, Search, Filter } from "lucide-react";
import API from "../../api/axios";
import toast from "react-hot-toast";
import {
  getClasses,
  getSections,
  createSection,
} from "../../api/academics";
import { getStudents } from "../../api/students";

export default function OperatorStudents() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");

  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const [showAddSection, setShowAddSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const [savingSection, setSavingSection] = useState(false);

  const [showStudentForm, setShowStudentForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);

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

  useEffect(() => {
    // Filter students based on search and status
    let filtered = students;

    // Search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((student) =>
        student.first_name.toLowerCase().includes(searchLower) ||
        student.last_name.toLowerCase().includes(searchLower) ||
        student.admission_no?.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter(
        (student) => student.verification_status === filterStatus
      );
    }

    setFilteredStudents(filtered);
  }, [students, search, filterStatus]);

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
    // Navigate to a full page instead of opening a popup
    navigate(`/operator/students/${student.id}`);
  };

  const handleStudentSaved = () => {
    setShowStudentForm(false);
    setEditingStudent(null);
    loadStudents();
  };

  const handleDelete = async () => {
    if (!studentToDelete) return;

    try {
      await API.delete(`/students/${studentToDelete.id}/`);
      toast.success("Student deleted successfully");
      setStudents(students.filter((s) => s.id !== studentToDelete.id));
      setShowDeleteModal(false);
      setStudentToDelete(null);
    } catch (error) {
      toast.error("Failed to delete student");
      console.error("Error deleting student:", error);
    }
  };

  const confirmDelete = (student, e) => {
    e.stopPropagation(); // Prevent row click
    setStudentToDelete(student);
    setShowDeleteModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "VERIFIED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-600 mt-1">
            Manage and view all student records
          </p>
        </div>
        <Button onClick={openAddStudent}>+ Add Student</Button>
      </div>

      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Class
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm"
            >
              <option value="">All Classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
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
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Name or Admission No"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="text-gray-400 w-5 h-5" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="VERIFIED">Verified</option>
              <option value="REJECTED">Rejected</option>
            </select>
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
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr
                  key={student.id}
                  className="border-b last:border-0 hover:bg-gray-50"
                >
                  <td 
                    className="px-4 py-3 cursor-pointer hover:text-blue-600"
                    onClick={() => openEditStudent(student)}
                  >
                    {student.admission_no}
                  </td>
                  <td 
                    className="px-4 py-3 cursor-pointer"
                    onClick={() => openEditStudent(student)}
                  >
                    <div className="font-medium text-gray-900">
                      {student.first_name} {student.last_name}
                    </div>
                  </td>
                  <td className="px-4 py-3">{student.age || "-"}</td>
                  <td className="px-4 py-3">{student.gender || "-"}</td>
                  <td className="px-4 py-3">{student.school_class_name || "-"}</td>
                  <td className="px-4 py-3">{student.section_name || "-"}</td>
                  <td className="px-4 py-3">{student.phone || "-"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        student.verification_status
                      )}`}
                    >
                      {student.verification_status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => openEditStudent(student)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="View Student"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => openEditStudent(student)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                        title="Edit Student"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => confirmDelete(student, e)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete Student"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Deletion
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete student{" "}
              <strong>
                {studentToDelete?.first_name} {studentToDelete?.last_name}
              </strong>
              ? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setStudentToDelete(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}