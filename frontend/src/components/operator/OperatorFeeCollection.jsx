import { useState } from "react";
import StudentSearch from "../../components/operator/StudentSearch";
import StudentFeeLedger from "../../components/operator/StudentFeeLedger";
import Loader from "../../components/ui/Loader";
import { getStudents } from "../../api/students";

const CURRENT_YEAR = new Date().getFullYear();

// Rewired onto the monthly ledger (see MIGRATION_GUIDE.md). Search a
// student, see every month of the year at a glance, record a payment for
// whichever month needs it. The old FeeStructure/StudentFee flow this
// used to call is deprecated - payments here always go through admin
// review before they count.
export default function OperatorFeeCollection() {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [year, setYear] = useState(CURRENT_YEAR);

  const handleSearch = async (query) => {
    setLoading(true);
    setError("");
    setStudent(null);

    try {
      const { data } = await getStudents({ search: query });
      const results = data.results || data;

      if (!results.length) {
        setError("No student found.");
        return;
      }

      setStudent(results[0]);
    } catch (err) {
      console.error("Search failed:", err);
      setError("Failed to search student.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Fee collection</h1>

      <StudentSearch onSearch={handleSearch} />

      {loading && <Loader label="Searching..." />}

      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-md border border-red-200 mt-4">
          {error}
        </div>
      )}

      {student && (
        <div className="bg-white border rounded-lg p-6 mt-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-1">
              {student.first_name} {student.last_name}
            </h2>
            <p className="text-sm text-gray-500">
              Admission No: {student.admission_no} · Class:{" "}
              {student.school_class_name || student.school_class}
            </p>
          </div>

          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border rounded-md px-3 py-2 text-sm"
          >
            {[CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      )}

      <StudentFeeLedger student={student} year={year} />
    </div>
  );
}