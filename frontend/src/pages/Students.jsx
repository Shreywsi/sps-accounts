import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStudents } from "../api/students";
import { Trash2, Eye, Edit, Search } from "lucide-react";
import API from "../api/axios";
import toast from "react-hot-toast";

export default function Students() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    // Filter students based on search only
    let filtered = students;

    // Search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((student) =>
        student.first_name.toLowerCase().includes(searchLower) ||
        student.last_name.toLowerCase().includes(searchLower) ||
        student.admission_no.toLowerCase().includes(searchLower)
      );
    }

    setFilteredStudents(filtered);
  }, [students, searchTerm]);

  const fetchStudents = () => {
    getStudents()
      .then((res) => {
        console.log("Students API:", res.data);
        setStudents(res.data);
      })
      .catch((err) => {
        console.log("Students Error:", err.response);
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
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

  const openStudent = (student) => {
    navigate(`/students/${student.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-600 mt-1">
            Manage and view all student records
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search students by name or admission number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
            />
          </div>

        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  Admission No
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  Name
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  Class
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  Section
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  Phone
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-500">
                    No students found
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td 
                      className="py-3 px-4 text-gray-900 cursor-pointer hover:text-blue-600"
                      onClick={() => openStudent(student)}
                    >
                      {student.admission_no}
                    </td>

                    <td 
                      className="py-3 px-4 cursor-pointer"
                      onClick={() => openStudent(student)}
                    >
                      <div className="font-medium text-gray-900">
                        {student.first_name} {student.last_name}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-gray-700">
                      {student.school_class_name || "N/A"}
                    </td>

                    <td className="py-3 px-4 text-gray-700">
                      {student.section_name || "N/A"}
                    </td>

                    <td className="py-3 px-4 text-gray-700">
                      {student.phone || "N/A"}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => openStudent(student)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="View Student"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => openStudent(student)}
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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