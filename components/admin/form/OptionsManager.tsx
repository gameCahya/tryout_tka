// components/admin/form/OptionsManager.tsx
'use client';

import RichTextEditor from '../editor/RichTextEditor';

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
      
      <div className="space-y-3">
        {options.map((option, idx) => (
          <div key={idx} className="flex items-start gap-2">
            <span className="w-8 text-center font-medium text-gray-700 dark:text-gray-300 pt-2">
              {String.fromCharCode(65 + idx)}.
            </span>
            <div className="flex-1">
              <RichTextEditor
                content={option}
                onChange={(content) => handleOptionChange(idx, content)}
                placeholder={`Opsi ${String.fromCharCode(65 + idx)}`}
                minHeight="80px"
                showAdvancedFormatting={false}
                allowImageUpload={true}
                helperText="💡 Gunakan x² untuk pangkat, x₂ untuk subscript, ∑ untuk formula matematika"
              />
            </div>
            {options.length > 1 && (
              <button
                type="button"
                onClick={() => removeOption(idx)}
                className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded transition-colors mt-1"
                title="Hapus opsi"
              >
                🗑️
              </button>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        💡 Tips: Setiap opsi mendukung formatting lengkap termasuk superscript (x²), subscript (H₂O), formula matematika (∑), dan gambar
      </div>
    </div>
  );
}