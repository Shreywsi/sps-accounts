import { useState } from "react";

export default function StudentSearch({ onSearch }) {
  const [search, setSearch] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!search.trim()) return;

    onSearch(search);
  };

  return (
    <div className="bg-white rounded-lg border p-6">
      <h2 className="text-xl font-semibold mb-4">
        Search Student
      </h2>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row gap-3"
      >
        <input
          type="text"
          placeholder="Admission No or Student Name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border rounded-md px-4 py-2"
        />

        <button
          type="submit"
          className="bg-blue-600 text-white px-6 rounded-md w-full sm:w-auto"
        >
          Search
        </button>
      </form>
    </div>
  );
}