import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Card from "../components/common/Card";
import Loader from "../components/ui/Loader";
import {
  getStudentById,
  verifyStudent,
  rejectStudent,
  reopenStudent,
} from "../api/students";

const STATUS_STYLES = {
  VERIFIED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  PENDING: "bg-yellow-100 text-yellow-700",
};

// A simple label/value row for the read-only info display
function InfoRow({ label, value }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-gray-400 mb-0.5">
        {label}
      </div>
      <div className="text-sm text-gray-800">{value || "-"}</div>
    </div>
  );
}

export default function AdminStudentDetail() {
  const { studentId } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

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
    navigate("/students");
  };

  const handleVerify = async () => {
    setActionLoading(true);
    try {
      await verifyStudent(studentId);
      loadStudent();
    } catch (err) {
      console.error("Verify error:", err);
      alert("Failed to verify student.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    const reason = window.prompt(
      "Reason for rejecting this student (shown to the operator):"
    );
    if (reason === null) return; // cancelled

    setActionLoading(true);
    try {
      await rejectStudent(studentId, reason);
      loadStudent();
    } catch (err) {
      console.error("Reject error:", err);
      alert("Failed to reject student.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReopen = async () => {
    setActionLoading(true);
    try {
      await reopenStudent(studentId);
      loadStudent();
    } catch (err) {
      console.error("Reopen error:", err);
      alert("Failed to reopen student.");
    } finally {
      setActionLoading(false);
    }
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

      {student?.verification_status === "REJECTED" &&
        student.rejection_reason && (
          <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-md border border-red-200 mb-4">
            <strong>You rejected this student.</strong> Reason:{" "}
            {student.rejection_reason}
          </div>
        )}

      {loading ? (
        <Card>
          <Loader label="Loading student..." />
        </Card>
      ) : error ? (
        <Card>
          <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-md border border-red-200">
            {error}
          </div>
        </Card>
      ) : (
        <>
          <Card>
            {/* Photo on the right, info on the left — same layout style as the operator side */}
            <div className="flex flex-col-reverse lg:flex-row-reverse gap-6">
              <div className="lg:w-52 shrink-0">
                <div className="w-40 h-48 lg:w-48 lg:h-56 rounded-md border-2 border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center mx-auto">
                  {student.photo ? (
                    <img
                      src={student.photo}
                      alt="Student"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-gray-400 px-2 text-center">
                      No photo uploaded
                    </span>
                  )}
                </div>
              </div>

              <div className="flex-1 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <InfoRow label="Admission No" value={student.admission_no} />
                  <InfoRow label="Roll Number" value={student.roll_number} />
                  <InfoRow
                    label="Full Name"
                    value={`${student.first_name} ${student.last_name}`}
                  />
                  <InfoRow label="Age" value={student.age} />
                  <InfoRow label="Gender" value={student.gender} />
                  <InfoRow label="Class" value={student.school_class_name} />
                  <InfoRow label="Section" value={student.section_name} />
                  <InfoRow label="Father's Name" value={student.father_name} />
                  <InfoRow label="Mother's Name" value={student.mother_name} />
                  <InfoRow label="Phone" value={student.phone} />
                  <InfoRow label="Email" value={student.email} />
                </div>

                <InfoRow label="Address" value={student.address} />

                {student.custom_values && student.custom_values.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2 border-t pt-4">
                      Additional Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {student.custom_values.map((cv) => (
                        <InfoRow
                          key={cv.field_id}
                          label={cv.field_name}
                          value={cv.value}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          <div className="flex gap-3 mt-6">
            {student.verification_status === "PENDING" && (
              <>
                <button
                  onClick={handleVerify}
                  disabled={actionLoading}
                  className="px-5 py-2 bg-green-600 text-white rounded-md text-sm disabled:opacity-50"
                >
                  {actionLoading ? "Working..." : "Verify"}
                </button>
                <button
                  onClick={handleReject}
                  disabled={actionLoading}
                  className="px-5 py-2 bg-red-600 text-white rounded-md text-sm disabled:opacity-50"
                >
                  {actionLoading ? "Working..." : "Reject"}
                </button>
              </>
            )}

            {student.verification_status === "VERIFIED" && (
              <button
                onClick={handleReopen}
                disabled={actionLoading}
                className="px-5 py-2 bg-yellow-500 text-white rounded-md text-sm disabled:opacity-50"
              >
                {actionLoading ? "Working..." : "Reopen"}
              </button>
            )}

            {student.verification_status === "REJECTED" && (
              <button
                onClick={handleReopen}
                disabled={actionLoading}
                className="px-5 py-2 bg-blue-600 text-white rounded-md text-sm disabled:opacity-50"
              >
                {actionLoading ? "Working..." : "Review Again"}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}