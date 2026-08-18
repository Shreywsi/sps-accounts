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
      <table className="min-w-[600px] w-full">
        <thead>
          <tr className="border-b text-left text-sm text-gray-500">
            <th className="px-4 py-3">Admission No</th>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Class</th>
            <th className="px-4 py-3">Phone</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>

        <tbody>
          {students.map((student) => (
            <tr
              key={student.id}
              className="border-b last:border-0 hover:bg-gray-50"
            >
              <td className="px-4 py-4">{student.admission_no}</td>

              <td className="px-4 py-4">{student.first_name} {student.last_name}</td>

              <td className="px-4 py-4">{student.current_class?.name || "-"}</td>

              <td className="px-4 py-4">{student.phone || "-"}</td>

              <td className="px-4 py-4">
                <span className="text-green-600">Active</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}