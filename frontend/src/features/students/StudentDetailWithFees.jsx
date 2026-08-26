import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  CheckCircle,
  Edit,
  User,
  Phone,
  Mail,
  MapPin,
  Hash,
  Users,
  ChevronDown,
  ChevronUp,
  X
} from "lucide-react";
import API from "../../api/axios";
import toast from "react-hot-toast";
import StudentForm from "../../components/students/StudentForm";
import FeeCollectionPanel from "../../components/fees/FeeCollectionPanel";

const InfoField = ({ icon: Icon, label, value }) => (
  <div className="p-4 bg-gray-50 rounded-lg">
    <div className="flex items-center gap-2 text-gray-500 mb-1">
      {Icon && <Icon className="w-4 h-4" />}
      <span className="text-sm">{label}</span>
    </div>
    <p className="text-base font-semibold text-gray-900 break-words">
      {value || <span className="text-gray-400 font-normal">Not provided</span>}
    </p>
  </div>
);

const StudentDetailWithFees = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditPersonalModal, setShowEditPersonalModal] = useState(false);
  const [showFees, setShowFees] = useState(true);

  useEffect(() => {
    fetchStudent();
  }, [studentId]);

  const fetchStudent = async () => {
    try {
      setLoading(true);
      const response = await API.get(`/students/${studentId}/`);
      setStudent(response.data);
    } catch (error) {
      toast.error("Failed to fetch student details");
      console.error("Error fetching student:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-12 text-gray-500">
        Student not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 space-y-6">
      {/* Student Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {student.photo ? (
              <img
                src={student.photo}
                alt={student.first_name}
                className="w-28 h-28 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                <User className="w-12 h-12 text-gray-400" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {student.first_name} {student.last_name}
              </h1>
              <p className="text-gray-600">{student.admission_no}</p>
              <div className="flex items-center gap-2 mt-2">
                {student.school_class_name && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                    {student.school_class_name}
                  </span>
                )}
                {student.section_name && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm">
                    {student.section_name}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Back
          </button>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
          <button
            onClick={() => setShowEditPersonalModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Edit className="w-4 h-4" />
            Edit Details
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <InfoField icon={User} label="Full Name" value={`${student.first_name} ${student.last_name}`.trim()} />
          <InfoField icon={Hash} label="Admission No" value={student.admission_no} />
          <InfoField icon={Hash} label="Roll Number" value={student.roll_number} />
          <InfoField icon={Users} label="Class & Section" value={[student.school_class_name, student.section_name].filter(Boolean).join(" - ")} />
          <InfoField icon={User} label="Gender" value={student.gender ? student.gender.charAt(0) + student.gender.slice(1).toLowerCase() : ""} />
          <InfoField icon={User} label="Age" value={student.age} />
          <InfoField icon={User} label="Father's Name" value={student.father_name} />
          <InfoField icon={User} label="Mother's Name" value={student.mother_name} />
          <InfoField icon={Phone} label="Phone" value={student.phone} />
          <InfoField icon={Mail} label="Email" value={student.email} />
          <InfoField icon={MapPin} label="Address" value={student.address} />
          <InfoField
            icon={CheckCircle}
            label="Verification Status"
            value={
              student.verification_status && (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  student.verification_status === "VERIFIED"
                    ? "bg-green-100 text-green-800"
                    : student.verification_status === "REJECTED"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}>
                  {student.verification_status}
                </span>
              )
            }
          />
        </div>

        {/* Additional custom fields, if any */}
        {student.custom_values && student.custom_values.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold text-gray-700 mb-2">Additional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {student.custom_values.map((cv) => (
                <InfoField key={cv.field_id} label={cv.field_name} value={cv.value} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fees - embedded directly here (not a separate page) so it's
          always right under the student it belongs to. It reads
          whatever fee structure is currently defined for this
          student's class, so editing the fee structure elsewhere
          shows up here automatically - same panel used on the
          standalone Fee Collection page, just embedded instead of
          navigated to. */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Fees</h2>
          <button
            onClick={() => setShowFees(!showFees)}
            className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
          >
            {showFees ? "Hide" : "Show"}
            {showFees ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {showFees && <FeeCollectionPanel student={student} />}
      </div>

      {/* Edit Personal Information Modal */}
      {showEditPersonalModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Edit Personal Information
              </h3>
              <button
                onClick={() => setShowEditPersonalModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <StudentForm
              student={student}
              onSuccess={() => {
                setShowEditPersonalModal(false);
                toast.success("Student details updated successfully");
                fetchStudent();
              }}
              onCancel={() => setShowEditPersonalModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDetailWithFees;
