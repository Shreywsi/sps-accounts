export default function Loader({ label = "Loading..." }) {
  return (
    <div className="flex items-center justify-center py-10 text-sm text-gray-500 gap-2">
      <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
      {label}
    </div>
  );
}