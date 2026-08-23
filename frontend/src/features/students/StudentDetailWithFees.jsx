import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  DollarSign, 
  Calendar, 
  Clock, 
  Receipt, 
  Upload, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Plus,
  Edit,
  Trash2,
  Eye,
  User,
  Phone,
  Mail,
  MapPin,
  Hash,
  Users,
  X
} from "lucide-react";
import API from "../../api/axios";
import toast from "react-hot-toast";
import StudentForm from "../../components/students/StudentForm";

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
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [showEditPersonalModal, setShowEditPersonalModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    payment_type: "MONTHLY",
    amount: "",
    payment_method: "cash",
    receipt: null,
    notes: "",
  });
  const [feeData, setFeeData] = useState({
    annual_fee: "",
    monthly_fee: "",
    cab_fee: "",
    fee_due_day: "10",
    late_fee_per_day: "10",
    additional_fees: {},
  });

  useEffect(() => {
    fetchStudent();
    fetchPayments();
  }, [studentId]);

  const fetchStudent = async () => {
    try {
      const response = await API.get(`/students/${studentId}/`);
      setStudent(response.data);
      setFeeData({
        annual_fee: response.data.annual_fee || "",
        monthly_fee: response.data.monthly_fee || "",
        cab_fee: response.data.cab_fee || "",
        fee_due_day: response.data.fee_due_day || "10",
        late_fee_per_day: response.data.late_fee_per_day || "10",
        additional_fees: response.data.additional_fees || {},
      });
    } catch (error) {
      toast.error("Failed to fetch student details");
      console.error("Error fetching student:", error);
    }
  };

  const fetchPayments = async () => {
    try {
      const response = await API.get(`/fees/simple-payments/?student=${studentId}`);
      setPayments(response.data);
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append("student", studentId);
    formData.append("payment_type", paymentData.payment_type);
    formData.append("amount", paymentData.amount);
    formData.append("payment_method", paymentData.payment_method);
    formData.append("notes", paymentData.notes);
    
    if (paymentData.receipt) {
      formData.append("receipt", paymentData.receipt);
    }

    try {
      await API.post("/fees/simple-payments/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success("Payment recorded successfully");
      setShowPaymentModal(false);
      setPaymentData({
        payment_type: "MONTHLY",
        amount: "",
        payment_method: "cash",
        receipt: null,
        notes: "",
      });
      fetchPayments();
    } catch (error) {
      toast.error("Failed to record payment");
      console.error("Error recording payment:", error);
    }
  };

  const handleFeeUpdate = async (e) => {
    e.preventDefault();

    try {
      await API.patch(`/students/${studentId}/`, feeData);
      toast.success("Fee structure updated successfully");
      setShowFeeModal(false);
      fetchStudent();
    } catch (error) {
      toast.error("Failed to update fee structure");
      console.error("Error updating fees:", error);
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (!confirm("Are you sure you want to delete this payment?")) return;

    try {
      await API.delete(`/fees/simple-payments/${paymentId}/`);
      toast.success("Payment deleted successfully");
      fetchPayments();
    } catch (error) {
      toast.error("Failed to delete payment");
      console.error("Error deleting payment:", error);
    }
  };

  const calculateLateFee = () => {
    if (!student) return 0;
    
    const today = new Date();
    const dueDay = student.fee_due_day;
    const currentDay = today.getDate();
    
    if (currentDay <= dueDay) return 0;
    
    const daysLate = currentDay - dueDay;
    return daysLate * parseFloat(student.late_fee_per_day);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
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

  const lateFee = calculateLateFee();

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
          <InfoField icon={Calendar} label="Age" value={student.age} />
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

      {/* Fee Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Fee Structure</h2>
          <button
            onClick={() => setShowFeeModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Edit className="w-4 h-4" />
            Edit Fees
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm">Annual Fee</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              ₹{student.annual_fee || 0}
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">Monthly Fee</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              ₹{student.monthly_fee || 0}
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm">Cab Fee</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              ₹{student.cab_fee || 0}
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Due Date</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {student.fee_due_day || 10}th of every month
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">Late Fee/Day</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              ₹{student.late_fee_per_day || 10}
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm">Total Monthly</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">
              ₹{student.total_monthly_fee || 0}
            </p>
          </div>
        </div>

        {/* Late Fee Warning */}
        {lateFee > 0 && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Late Fee Alert</span>
            </div>
            <p className="text-red-700 mt-1">
              Current late fee: ₹{lateFee.toFixed(2)}
            </p>
          </div>
        )}

        {/* Additional Fees */}
        {student.additional_fees && Object.keys(student.additional_fees).length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold text-gray-700 mb-2">Additional Fees</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.entries(student.additional_fees).map(([name, amount]) => (
                <div key={name} className="p-2 bg-gray-50 rounded text-sm">
                  <span className="text-gray-600">{name.replace(/_/g, ' ')}:</span>
                  <span className="font-medium ml-2">₹{amount}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Payment Collection */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Payment Collection</h2>
          <button
            onClick={() => setShowPaymentModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Plus className="w-4 h-4" />
            Record Payment
          </button>
        </div>

        {payments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Receipt className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No payments recorded yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Method</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Receipt</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-900">
                      {new Date(payment.payment_date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-gray-700">
                      {payment.payment_type.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">
                      ₹{payment.amount}
                    </td>
                    <td className="py-3 px-4 text-gray-700">
                      {payment.payment_method}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {payment.receipt ? (
                        <a 
                          href={payment.receipt} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          View
                        </a>
                      ) : (
                        <span className="text-gray-400">No receipt</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDeletePayment(payment.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Delete Payment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Record Payment
            </h3>
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Type
                </label>
                <select
                  value={paymentData.payment_type}
                  onChange={(e) => setPaymentData({...paymentData, payment_type: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="MONTHLY">Monthly Fee</option>
                  <option value="ANNUAL">Annual Fee</option>
                  <option value="CAB">Cab Fee</option>
                  <option value="ADDITIONAL">Additional Fee</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentData.payment_method}
                  onChange={(e) => setPaymentData({...paymentData, payment_method: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Receipt (Optional)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    onChange={(e) => setPaymentData({...paymentData, receipt: e.target.files[0]})}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                    accept="image/*"
                  />
                  <Upload className="w-5 h-5 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData({...paymentData, notes: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  rows="2"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fee Edit Modal */}
      {showFeeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Edit Fee Structure
            </h3>
            <form onSubmit={handleFeeUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Annual Fee
                </label>
                <input
                  type="number"
                  value={feeData.annual_fee}
                  onChange={(e) => setFeeData({...feeData, annual_fee: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monthly Fee
                </label>
                <input
                  type="number"
                  value={feeData.monthly_fee}
                  onChange={(e) => setFeeData({...feeData, monthly_fee: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cab Fee
                </label>
                <input
                  type="number"
                  value={feeData.cab_fee}
                  onChange={(e) => setFeeData({...feeData, cab_fee: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fee Due Day (1-31)
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={feeData.fee_due_day}
                  onChange={(e) => setFeeData({...feeData, fee_due_day: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Late Fee Per Day
                </label>
                <input
                  type="number"
                  value={feeData.late_fee_per_day}
                  onChange={(e) => setFeeData({...feeData, late_fee_per_day: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowFeeModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Update Fees
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDetailWithFees;