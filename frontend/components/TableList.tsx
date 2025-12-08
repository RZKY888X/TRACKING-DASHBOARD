export default function TableList({ columns, data }) {
  return (
    <div className="overflow-hidden rounded-lg border border-cyan-500/20">
      <table className="w-full text-sm">
        <thead className="bg-[#030E1C] text-gray-300">
          <tr>
            {columns.map((col) => (
              <th key={col} className="px-4 py-3 text-left font-medium">
                {col}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="bg-[#0D1B2A]">
          {data.map((row, i) => (
            <tr
              key={i}
              className="border-t border-cyan-500/10 hover:bg-[#0f2238]"
            >
              {Object.values(row).map((val, idx) => (
                <td key={idx} className="px-4 py-2 text-gray-300">
                  {val}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
