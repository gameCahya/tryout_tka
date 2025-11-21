'use client';

type TableBuilderProps = {
  tableRows: string[][];
  onChange: (rows: string[][]) => void;
};

export default function TableBuilder({ tableRows, onChange }: TableBuilderProps) {
  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    const newTable = [...tableRows];
    newTable[rowIndex][colIndex] = value;
    onChange(newTable);
  };

  const addRow = () => {
    onChange([...tableRows, Array(tableRows[0].length).fill('')]);
  };

  const removeRow = (index: number) => {
    if (tableRows.length > 2) {
      onChange(tableRows.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="mb-4 p-4 border rounded bg-gray-50">
      <label className="block text-sm font-medium mb-2">Tabel Data</label>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border">
          <tbody>
            {tableRows.map((row, rowIdx) => (
              <tr key={rowIdx}>
                {row.map((cell, colIdx) => (
                  <td key={colIdx} className="border p-1">
                    <input
                      type="text"
                      value={cell}
                      onChange={(e) => handleCellChange(rowIdx, colIdx, e.target.value)}
                      className="w-full p-1 text-sm"
                    />
                  </td>
                ))}
                {rowIdx > 0 && (
                  <td className="p-1">
                    <button
                      type="button"
                      onClick={() => removeRow(rowIdx)}
                      className="text-red-600 text-xs px-2"
                    >
                      ✕
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        onClick={addRow}
        className="mt-2 text-sm text-blue-600 hover:underline"
      >
        + Tambah Baris
      </button>
    </div>
  );
}