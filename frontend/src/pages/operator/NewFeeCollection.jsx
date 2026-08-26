import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import toast from "react-hot-toast";
import { getStudents, getStudentById } from "../api/students";
import FeeCollectionPanel from "../components/fees/FeeCollectionPanel";

export default function NewFeeCollection() {
  const [searchParams] = useSearchParams();
  const preloadedStudentId = searchParams.get("student");

  const [searchQuery, setSearchQuery] = useState("");
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!preloadedStudentId) return;

    (async () => {
      try {
        setLoading(true);
        const res = await getStudentById(preloadedStudentId);
        setSelectedStudent(res.data);
      } catch (error) {
        toast.error("Failed to load student");
        console.error(error);
      } finally {
        setLoading(false);
      }
    })();
  }, [preloadedStudentId]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      const res = await getStudents({ search: searchQuery });
      setStudents(res.data.results || res.data);
    } catch (error) {
      toast.error("Failed to search students");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setStudents([]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Fee Collection</h1>
        <p className="text-sm text-gray-500">
          Collect fees with auto-populated fee structure
        </p>
      </div>

      {/* Student Search */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name, admission no, or roll no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full border rounded-md px-4 py-2"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-blue-600 text-white rounded-md flex items-center gap-2"
          >
            <Search size={18} />
            Search
          </button>
        </div>

        {/* Search Results */}
        {students.length > 0 && (
          <div className="mt-4 border rounded-md max-h-64 overflow-y-auto">
            {students.map((student) => (
              <div
                key={student.id}
                onClick={() => handleSelectStudent(student)}
                className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
              >
                <div className="font-medium">
                  {student.first_name} {student.last_name}
                </div>
                <div className="text-sm text-gray-500">
                  {student.admission_no} · Class: {student.school_class_name || student.school_class}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Student Info + Fee Collection */}
      {selectedStudent && (
        <>
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-semibold">
              {selectedStudent.first_name} {selectedStudent.last_name}
            </h2>
            <p className="text-sm text-gray-500">
              Admission No: {selectedStudent.admission_no} · Class:{" "}
              {selectedStudent.school_class_name || selectedStudent.school_class}
            </p>
          </div>

          <FeeCollectionPanel student={selectedStudent} />
        </>
      )}

      {loading && !selectedStudent && (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
}
