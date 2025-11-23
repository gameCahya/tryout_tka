// ============================================
// FILE: components/admin/AnswerSelector.tsx
// ============================================
'use client';

type AnswerSelectorProps = {
  questionType: 'single' | 'multiple' | 'reasoning';
  options: string[];
  correctAnswerIndex: number;
  correctAnswers: number[];
  reasoningAnswers: { [key: number]: 'benar' | 'salah' };
  onCorrectAnswerChange: (index: number) => void;
  onCorrectAnswersChange: (answers: number[]) => void;
  onReasoningAnswersChange: (answers: { [key: number]: 'benar' | 'salah' }) => void;
};

export default function AnswerSelector({
  questionType,
  options,
  correctAnswerIndex,
  correctAnswers,
  reasoningAnswers,
  onCorrectAnswerChange,
  onCorrectAnswersChange,
  onReasoningAnswersChange,
}: AnswerSelectorProps) {
  
  const handleMultipleToggle = (index: number) => {
    const newAnswers = [...correctAnswers];
    const answerIndex = newAnswers.indexOf(index);
    
    if (answerIndex > -1) {
      newAnswers.splice(answerIndex, 1);
    } else {
      newAnswers.push(index);
    }
    
    onCorrectAnswersChange(newAnswers.sort());
  };

  const handleReasoningChange = (optionIndex: number, value: 'benar' | 'salah') => {
    const newAnswers = { ...reasoningAnswers };
    newAnswers[optionIndex] = value;
    onReasoningAnswersChange(newAnswers);
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
        Jawaban Benar {questionType === 'multiple' && '(Pilih lebih dari satu untuk MCMA)'}
        {questionType === 'reasoning' && '(Pilih Benar/Salah untuk setiap pernyataan)'}
      </label>
      
      {questionType === 'single' ? (
        // Single Answer - Radio Button
        <select
          value={correctAnswerIndex}
          onChange={(e) => onCorrectAnswerChange(parseInt(e.target.value))}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          required
        >
          {options.map((_, idx) => (
            <option key={idx} value={idx}>
              {String.fromCharCode(65 + idx)}
            </option>
          ))}
        </select>
      ) : questionType === 'multiple' ? (
        // Multiple Answer - Checkbox
        <div className="space-y-2 p-3 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700/50">
          {options.map((option, idx) => (
            <label 
              key={idx} 
              className="flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded transition-colors"
            >
              <input
                type="checkbox"
                checked={correctAnswers.includes(idx)}
                onChange={() => handleMultipleToggle(idx)}
                className="mr-3 w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <span className="font-medium mr-2 text-gray-700 dark:text-gray-300">
                {String.fromCharCode(65 + idx)}.
              </span>
              <span className="text-sm text-gray-800 dark:text-gray-200">
                {option || <span className="text-gray-400 dark:text-gray-500 italic">(Belum diisi)</span>}
              </span>
            </label>
          ))}
          
          {correctAnswers.length === 0 && (
            <p className="text-red-500 dark:text-red-400 text-sm mt-2 flex items-center">
              <span className="mr-1">⚠️</span>
              Pilih minimal 1 jawaban benar
            </p>
          )}
          
          {correctAnswers.length > 0 && (
            <p className="text-green-600 dark:text-green-400 text-sm mt-2 font-medium flex items-center">
              <span className="mr-1">✓</span>
              Terpilih: {correctAnswers.map(i => String.fromCharCode(65 + i)).join(', ')}
            </p>
          )}
        </div>
      ) : (
        // Reasoning Type - Benar/Salah Table
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="border border-gray-300 dark:border-gray-600 p-2 text-left font-semibold text-gray-700 dark:text-gray-300 w-12">
                  #
                </th>
                <th className="border border-gray-300 dark:border-gray-600 p-2 text-left font-semibold text-gray-700 dark:text-gray-300">
                  Pernyataan
                </th>
                <th className="border border-gray-300 dark:border-gray-600 p-2 text-center font-semibold text-gray-700 dark:text-gray-300 w-24">
                  Benar
                </th>
                <th className="border border-gray-300 dark:border-gray-600 p-2 text-center font-semibold text-gray-700 dark:text-gray-300 w-24">
                  Salah
                </th>
              </tr>
            </thead>
            <tbody>
              {options.map((option, idx) => (
                <tr 
                  key={idx} 
                  className={idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700/50'}
                >
                  <td className="border border-gray-300 dark:border-gray-600 p-2 font-medium text-gray-700 dark:text-gray-300">
                    {String.fromCharCode(65 + idx)}.
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 p-2 text-gray-800 dark:text-gray-200">
                    {option || <span className="text-gray-400 dark:text-gray-500 italic">(Belum diisi)</span>}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 p-2 text-center">
                    <label className="flex items-center justify-center cursor-pointer">
                      <input
                        type="radio"
                        name={`reasoning_${idx}`}
                        checked={reasoningAnswers?.[idx] === 'benar'}
                        onChange={() => handleReasoningChange(idx, 'benar')}
                        className="w-4 h-4 text-green-600 focus:ring-2 focus:ring-green-500"
                      />
                    </label>
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 p-2 text-center">
                    <label className="flex items-center justify-center cursor-pointer">
                      <input
                        type="radio"
                        name={`reasoning_${idx}`}
                        checked={reasoningAnswers?.[idx] === 'salah'}
                        onChange={() => handleReasoningChange(idx, 'salah')}
                        className="w-4 h-4 text-red-600 focus:ring-2 focus:ring-red-500"
                      />
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {Object.keys(reasoningAnswers || {}).length < options.filter(o => o).length && (
            <p className="text-red-500 dark:text-red-400 text-sm mt-2 flex items-center">
              <span className="mr-1">⚠️</span>
              Tentukan Benar/Salah untuk semua pernyataan yang sudah diisi
            </p>
          )}
          
          {Object.keys(reasoningAnswers || {}).length > 0 && 
           Object.keys(reasoningAnswers || {}).length === options.filter(o => o).length && (
            <p className="text-green-600 dark:text-green-400 text-sm mt-2 font-medium flex items-center">
              <span className="mr-1">✓</span>
              Semua pernyataan sudah ditentukan
            </p>
          )}
        </div>
      )}
    </div>
  );
}