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

      <table className="w-full border">
        <thead>
          <tr>
            <th>Admission No</th>
            <th>Name</th>
            <th>Class</th>
            <th>Section</th>
            <th>Phone</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
{
students.map((student)=>(
<tr key={student.id}>

<td>{student.admission_no}</td>

<td>
{student.first_name} {student.last_name}
</td>

<td>
{student.school_class_name}
</td>

<td>
{student.section_name}
</td>

<td>
{student.phone}
</td>

<td>
{student.verification_status}
</td>
<td>

  {student.verification_status === "PENDING" && (
    <>
      <button onClick={() => handleVerify(student.id)}>
        Verify
      </button>

      <button onClick={() => handleReject(student.id)}>
        Reject
      </button>
    </>
  )}


  {student.verification_status === "VERIFIED" && (
    <button onClick={() => handleReopen(student.id)}>
      Reopen
    </button>
  )}


  {student.verification_status === "REJECTED" && (
    <button onClick={() => handleReopen(student.id)}>
      Review Again
    </button>
  )}

</td>
</tr>
))
}
</tbody>
      </table>
    </div>
  );
}