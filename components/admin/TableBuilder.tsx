// ============================================
// FILE: components/admin/TableBuilder.tsx
// ============================================
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
    <div className="mb-4 p-4 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700/50">
      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Tabel Data</label>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
          <tbody>
            {tableRows.map((row, rowIdx) => (
              <tr key={rowIdx} className={rowIdx === 0 ? 'bg-gray-100 dark:bg-gray-700' : ''}>
                {row.map((cell, colIdx) => (
                  <td key={colIdx} className="border border-gray-300 dark:border-gray-600 p-1">
                    <input
                      type="text"
                      value={cell}
                      onChange={(e) => handleCellChange(rowIdx, colIdx, e.target.value)}
                      className="w-full p-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-0 focus:ring-1 focus:ring-blue-500 rounded"
                      placeholder={rowIdx === 0 ? 'Header' : 'Data'}
                    />
                  </td>
                ))}
                {rowIdx > 0 && (
                  <td className="p-1 border border-gray-300 dark:border-gray-600">
                    <button
                      type="button"
                      onClick={() => removeRow(rowIdx)}
                      className="text-red-600 dark:text-red-400 text-xs px-2 py-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      title="Hapus baris"
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
        className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
      >
        + Tambah Baris
      </button>
    </div>
  );
}