import { useState, useEffect } from "react";
import { AlertCircle, DollarSign, User, Calendar } from "lucide-react";
import API from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const UnpaidStudents = () => {
  const { user } = useAuth();
  const [unpaidStudents, setUnpaidStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === "ADMIN" || user?.role === "OPERATOR") {
      fetchUnpaidStudents();
    }
  }, [user]);

  const fetchUnpaidStudents = async () => {
    try {
      const response = await API.get("/students/unpaid_students/");
      setUnpaidStudents(response.data);
    } catch (error) {
      toast.error("Failed to fetch unpaid students");
      console.error("Error fetching unpaid students:", error);
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== "ADMIN" && user?.role !== "OPERATOR") {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-600">This section is only available for admins and operators</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Students with Unpaid Fees</h2>
          <p className="text-gray-600 mt-1">
            {unpaidStudents.length} student(s) with pending payments
          </p>
        </div>
      </div>

      {unpaidStudents.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <DollarSign className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">All Caught Up!</h3>
          <p className="text-gray-600">All students have paid their fees.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Due
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paid
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {unpaidStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="h-6 w-6 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {student.first_name} {student.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {student.admission_no}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {student.school_class_name || "N/A"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {student.section_name || ""}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ₹{student.total_fee_due?.toFixed(2) || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-green-600 font-medium">
                        ₹{student.total_fee_paid?.toFixed(2) || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${
                        student.fee_balance > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        ₹{student.fee_balance?.toFixed(2) || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        student.fee_status === 'PAID' ? 'bg-green-100 text-green-800' :
                        student.fee_status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {student.fee_status === 'PAID' ? 'Paid' :
                         student.fee_status === 'PARTIAL' ? 'Partial' :
                         'Unpaid'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${student.payment_progress || 0}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {student.payment_progress?.toFixed(1) || 0}%
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnpaidStudents;