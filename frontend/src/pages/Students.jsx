import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStudents } from "../api/students";

export default function Students() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);

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

  const openStudent = (student) => {
    navigate(`/students/${student.id}`);
  };

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
            </tr>
          </thead>

          <tbody>
            {students.map((student) => (
              <tr
                key={student.id}
                onClick={() => openStudent(student)}
                className="border-b last:border-0 hover:bg-gray-50 cursor-pointer"
              >
                <td className="px-4 py-3">{student.admission_no}</td>

                <td className="px-4 py-3 text-blue-600">
                  {student.first_name} {student.last_name}
                </td>

                <td className="px-4 py-3">{student.school_class_name}</td>

                <td className="px-4 py-3">{student.section_name}</td>

                <td className="px-4 py-3">{student.phone}</td>

                <td className="px-4 py-3">
                  <span
                    className={
                      "px-2 py-1 rounded-full text-xs font-medium " +
                      (student.verification_status === "VERIFIED"
                        ? "bg-green-100 text-green-700"
                        : student.verification_status === "REJECTED"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700")
                    }
                  >
                    {student.verification_status}
                  </span>
                  {student.verification_status === "REJECTED" &&
                    student.rejection_reason && (
                      <div className="text-xs text-gray-500 mt-1 max-w-xs">
                        Reason: {student.rejection_reason}
                      </div>
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}