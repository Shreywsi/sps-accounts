import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Card from "../../components/common/Card";
import Loader from "../../components/ui/Loader";
import StudentForm from "../../components/students/StudentForm";
import { getStudentById } from "../../api/students";

const STATUS_STYLES = {
  VERIFIED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  PENDING: "bg-yellow-100 text-yellow-700",
};

export default function OperatorStudentDetail() {
  const { studentId } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStudent = () => {
    setLoading(true);
    setError("");

    getStudentById(studentId)
      .then((res) => setStudent(res.data))
      .catch((err) => {
        console.error("Failed to load student:", err);
        setError("Failed to load student.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStudent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  const handleBack = () => {
    navigate("/operator/students");
  };

  const handleSaved = () => {
    // Go back to the list so the operator sees the refreshed
    // "Pending" status reflecting the change they just submitted.
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
        {student && (
          <span
            className={
              "px-2 py-1 rounded-full text-xs font-medium " +
              (STATUS_STYLES[student.verification_status] ||
                "bg-gray-100 text-gray-700")
            }
          >
            {student.verification_status}
          </span>
        )}
      </div>

      {student?.verification_status === "REJECTED" && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-md border border-red-200 mb-4">
          <strong>Rejected by admin.</strong>{" "}
          {student.rejection_reason
            ? student.rejection_reason
            : "No reason was given."}{" "}
          Fix the information below and save to resubmit for review.
        </div>
      )}

      {student?.verification_status === "PENDING" && (
        <div className="bg-yellow-50 text-yellow-700 text-sm px-4 py-3 rounded-md border border-yellow-200 mb-4">
          This student is waiting for admin review.
        </div>
      )}

      {student?.verification_status === "VERIFIED" && (
        <div className="bg-blue-50 text-blue-700 text-sm px-4 py-3 rounded-md border border-blue-200 mb-4">
          This student is verified. Saving any change here will send it back
          to the admin for re-review.
        </div>
      )}

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