import { useState } from "react";
import StudentSearch from "../../components/operator/StudentSearch";
import FeeSummary from "../../components/operator/FeeSummary";
import PaymentForm from "../../components/operator/PaymentForm";
import ReceiptPreview from "../../components/operator/ReceiptPreview";
import Loader from "../../components/ui/Loader";
import { getStudents } from "../../api/students";
import { getStudentFees } from "../../api/fees";

export default function OperatorFeeCollection() {
  const [student, setStudent] = useState(null);
  const [studentFees, setStudentFees] = useState([]);
  const [selectedFeeId, setSelectedFeeId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState(null);

  const handleSearch = async (query) => {
    setLoading(true);
    setError("");
    setStudent(null);
    setStudentFees([]);
    setSelectedFeeId("");

    try {
      const { data } = await getStudents({ search: query });
      const results = data.results || data;

      if (!results.length) {
        setError("No student found.");
        return;
      }

      const found = results[0];
      setStudent(found);

      const { data: fees } = await getStudentFees({ student: found.id });
      const feeList = fees.results || fees;
      setStudentFees(feeList);

      if (feeList.length) setSelectedFeeId(String(feeList[0].id));
    } catch (err) {
      console.error("Search failed:", err);
      setError("Failed to search student.");
    } finally {
      setLoading(false);
    }
  };

  const selectedFee = studentFees.find(
    (f) => String(f.id) === String(selectedFeeId)
  );

  const handlePaymentSuccess = (payment) => {
    setReceipt(payment);

    getStudentFees({ student: student.id }).then((res) => {
      setStudentFees(res.data.results || res.data);
    });
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Fee Collection</h1>

      <StudentSearch onSearch={handleSearch} />

      {loading && <Loader label="Searching..." />}

      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-md border border-red-200 mt-4">
          {error}
        </div>
      )}

      {student && (
        <div className="bg-white border rounded-lg p-6 mt-6">
          <h2 className="text-xl font-semibold mb-2">
            {student.first_name} {student.last_name}
          </h2>
          <p className="text-sm text-gray-500">
            Admission No: {student.admission_no} · Class:{" "}
            {student.school_class_name || student.school_class}
          </p>

          {studentFees.length > 1 && (
            <div className="mt-4">
              <label className="text-sm text-gray-600">Select Fee Record</label>
              <select
                value={selectedFeeId}
                onChange={(e) => setSelectedFeeId(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm mt-1"
              >
                {studentFees.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.fee_structure_name || f.fee_structure} — Balance ₹
                    {f.balance}
                  </option>
                ))}
              </select>
            </div>
          )}

          {studentFees.length === 0 && (
            <p className="text-sm text-gray-400 mt-4">
              No fee structure assigned to this student yet.
            </p>
          )}
        </div>
      )}

      {selectedFee && (
        <>
          <FeeSummary studentFee={selectedFee} />
          <PaymentForm studentFee={selectedFee} onSuccess={handlePaymentSuccess} />
        </>
      )}

      {receipt && (
        <ReceiptPreview
          payment={receipt}
          student={student}
          onClose={() => setReceipt(null)}
        />
      )}
    </div>
  );
}