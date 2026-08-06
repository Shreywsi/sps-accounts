export default function EmptyState({
  message = "No data available.",
}) {
  return (
    <div
      className="
        py-12
        text-center
        text-gray-500
      "
    >
      {message}
    </div>
  );
}