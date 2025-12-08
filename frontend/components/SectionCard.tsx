"use client";

export default function SectionCard({ title, description, onAdd, children }) {
  return (
    <div className="bg-[#0C1A2A] border border-cyan-500/20 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-cyan-400">{title}</h2>
          <p className="text-gray-500 text-sm">{description}</p>
        </div>

        <button
          onClick={onAdd}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm"
        >
          + Add
        </button>
      </div>

      {children}
    </div>
  );
}
