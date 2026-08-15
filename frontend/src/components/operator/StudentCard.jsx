export default function StudentCard({ student }) {
  if (!student) return null;

  return (
    <div className="bg-white border rounded-lg p-6 mt-6">

      <h2 className="text-xl font-semibold mb-4">
        Student Details
      </h2>

      <div className="grid grid-cols-2 gap-4">

        <div>
          <strong>Name</strong>
          <p>{student.name}</p>
        </div>

        <div>
          <strong>Admission No</strong>
          <p>{student.admission_no}</p>
        </div>

        <div>
          <strong>Class</strong>
          <p>{student.class_name}</p>
        </div>

        <div>
          <strong>Father</strong>
          <p>{student.father_name}</p>
        </div>

      </div>

    </div>
  );
}