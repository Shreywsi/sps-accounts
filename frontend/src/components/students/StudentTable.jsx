import Card from "../common/Card";
import EmptyState from "../common/EmptyState";

export default function StudentTable({ students = [] }) {
  if (students.length === 0) {
    return (
      <Card>
        <EmptyState message="No students found." />
      </Card>
    );
  }

  return (
    <Card className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b text-left text-sm text-gray-500">
            <th className="py-3">Admission No</th>
            <th>Name</th>
            <th>Class</th>
            <th>Phone</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {students.map((student) => (
            <tr
              key={student.id}
              className="border-b last:border-0 hover:bg-gray-50"
            >
              <td className="py-4">
                {student.admission_no}
              </td>

              <td>
                {student.first_name} {student.last_name}
              </td>

              <td>
                {student.current_class?.name || "-"}
              </td>

              <td>
                {student.phone || "-"}
              </td>

              <td>
                <span className="text-green-600">
                  Active
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}