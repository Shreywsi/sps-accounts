export default function StatCard({
  title,
  value,
  icon: Icon,
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-gray-500">
            {title}
          </p>

          <h2 className="text-3xl font-bold mt-2">
            {value}
          </h2>
        </div>

        <Icon className="text-blue-600" size={34} />
      </div>
    </div>
  );
}