import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Card from "../../components/common/Card";
import Loader from "../../components/ui/Loader";
import StudentForm from "../../components/students/StudentForm";
import { getStudentById } from "../../api/students";

export default function OperatorStudentDetail() {
  const { studentId } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");

    getStudentById(studentId)
      .then((res) => setStudent(res.data))
      .catch((err) => {
        console.error("Failed to load student:", err);
        setError("Failed to load student.");
      })
      .finally(() => setLoading(false));
  }, [studentId]);

  const handleBack = () => {
    navigate("/operator/students");
  };

  const handleSaved = () => {
    navigate("/operator/students");
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={handleBack}
          className="px-3 py-2 border rounded-md text-sm hover:bg-gray-50 flex items-center gap-1"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-semibold">
          {student ? `${student.first_name} ${student.last_name}` : "Student"}
        </h1>
      </div>

      <Card>
        {loading ? (
          <Loader label="Loading student..." />
        ) : error ? (
          <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-md border border-red-200">
            {error}
          </div>
        ) : (
          <StudentForm
            student={student}
            onSuccess={handleSaved}
            onCancel={handleBack}
          />
        )}
      </Card>
    </div>
  );
}