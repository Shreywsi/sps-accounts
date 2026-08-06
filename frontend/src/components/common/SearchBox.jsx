import { Search } from "lucide-react";

export default function SearchBox({
  value,
  onChange,
  placeholder = "Search...",
}) {
  return (
    <div className="relative w-80">
      <Search
        size={18}
        className="
          absolute
          left-3
          top-3
          text-gray-400
        "
      />

      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="
          w-full
          border
          border-gray-300
          pl-10
          pr-4
          py-2
          focus:outline-none
          focus:ring-2
          focus:ring-blue-500
        "
      />
    </div>
  );
}