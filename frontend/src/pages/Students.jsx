import { useEffect, useState } from "react";
import { 
  getStudents, 
  verifyStudent, 
  rejectStudent, 
  reopenStudent 
} from "../api/students";

export default function Students() {
  const [students, setStudents] = useState([]);
  const handleVerify = async (id) => {
  try {
    const res = await verifyStudent(id);

    console.log(res.data);

    // refresh students list
    const updated = await getStudents();
    setStudents(updated.data);

  } catch (error) {
    console.error("Verify error:", error);
  }
};
const handleReject = async (id) => {
  try {
    const res = await rejectStudent(id);

    console.log(res.data);

    const updated = await getStudents();
    setStudents(updated.data);

  } catch (error) {
    console.error("Reject error:", error);
  }
};
const handleReopen = async (id) => {
  try {
    const res = await reopenStudent(id);

    console.log(res.data);

    const updated = await getStudents();
    setStudents(updated.data);

  } catch (error) {
    console.error("Reopen error:", error);
  }
};
  useEffect(() => {
  getStudents()
    .then((res) => {
      console.log("Students API:", res.data);
      setStudents(res.data);
    })
    .catch((err) => {
      console.log("Students Error:", err.response);
      console.error(err);
    });
}, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Students</h1>

      <div className="overflow-x-auto bg-white border rounded-md">
        <table className="min-w-[720px] w-full divide-y">
          <thead className="bg-gray-50">
            <tr className="text-left text-sm text-gray-600">
              <th className="px-4 py-3">Admission No</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Class</th>
              <th className="px-4 py-3">Section</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>

          <tbody>
            {students.map((student) => (
              <tr
                key={student.id}
                className="border-b last:border-0 hover:bg-gray-50"
              >
                <td className="px-4 py-3">{student.admission_no}</td>

                <td className="px-4 py-3">
                  {student.first_name} {student.last_name}
                </td>

                <td className="px-4 py-3">{student.school_class_name}</td>

                <td className="px-4 py-3">{student.section_name}</td>

                <td className="px-4 py-3">{student.phone}</td>

                <td className="px-4 py-3">{student.verification_status}</td>

                <td className="px-4 py-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    {student.verification_status === "PENDING" && (
                      <>
                        <button
                          onClick={() => handleVerify(student.id)}
                          className="px-3 py-1 bg-green-600 text-white rounded-md text-sm"
                        >
                          Verify
                        </button>

                        <button
                          onClick={() => handleReject(student.id)}
                          className="px-3 py-1 bg-red-600 text-white rounded-md text-sm"
                        >
                          Reject
                        </button>
                      </>
                    )}


                    {student.verification_status === "VERIFIED" && (
                      <button
                        onClick={() => handleReopen(student.id)}
                        className="px-3 py-1 bg-yellow-500 text-white rounded-md text-sm"
                      >
                        Reopen
                      </button>
                    )}


                    {student.verification_status === "REJECTED" && (
                      <button
                        onClick={() => handleReopen(student.id)}
                        className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm"
                      >
                        Review Again
                      </button>
                    )}

                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}