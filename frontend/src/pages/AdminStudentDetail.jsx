import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Card from "../components/common/Card";
import Loader from "../components/ui/Loader";
import { getStudentById } from "../api/students";

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
        </>
      )}
    </div>
  );
}