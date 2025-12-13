// components/admin/form/OptionsManager.tsx
'use client';

type OptionsManagerProps = {
  options: string[];
  onChange: (options: string[]) => void;
};

export default function OptionsManager({ options, onChange }: OptionsManagerProps) {
  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    onChange(newOptions);
  };

  const addOption = () => {
    onChange([...options, '']);
  };

  const removeOption = (index: number) => {
    if (options.length <= 1) {
      alert('Minimal harus ada 1 pilihan jawaban');
      return;
    }
    onChange(options.filter((_, i) => i !== index));
  };

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Pilihan Jawaban (Minimal 1)
        </label>
        <button
          type="button"
          onClick={addOption}
          className="text-sm bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded transition-colors"
        >
          ➕ Tambah Opsi
        </button>
      </div>
      
      <div className="space-y-2">
        {options.map((option, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="w-8 text-center font-medium text-gray-700 dark:text-gray-300">
              {String.fromCharCode(65 + idx)}.
            </span>
            <input
              type="text"
              value={option}
              onChange={(e) => handleOptionChange(idx, e.target.value)}
              className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder={`Opsi ${String.fromCharCode(65 + idx)}`}
            />
            {options.length > 1 && (
              <button
                type="button"
                onClick={() => removeOption(idx)}
                className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
                title="Hapus opsi"
              >
                🗑️
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}