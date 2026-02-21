interface OptionEditorProps {
  options: string[];
  questionType: 'single' | 'multiple';
  correctAnswerIndex: number;
  correctAnswers: number[];
  onOptionChange: (index: number, value: string) => void;
  onCorrectSingleChange: (index: number) => void;
  onCorrectMultiToggle: (index: number) => void;
  onAddOption: () => void;
  onRemoveOption: (index: number) => void;
}

export default function OptionEditor({
  options,
  questionType,
  correctAnswerIndex,
  correctAnswers,
  onOptionChange,
  onCorrectSingleChange,
  onCorrectMultiToggle,
  onAddOption,
  onRemoveOption,
}: OptionEditorProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          Pilihan Jawaban <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {questionType === 'single'
            ? '🔵 Klik lingkaran = jawaban benar'
            : '✅ Centang semua jawaban benar'}
        </p>
      </div>

      <div className="space-y-2.5">
        {options.map((opt, i) => {
          const isMarkedCorrect = questionType === 'single'
            ? correctAnswerIndex === i
            : correctAnswers.includes(i);

          return (
            <div key={i} className="flex items-center gap-2.5">
              {/* Correct answer selector */}
              {questionType === 'single' ? (
                <button
                  onClick={() => onCorrectSingleChange(i)}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    isMarkedCorrect
                      ? 'border-green-500 bg-green-500'
                      : 'border-gray-300 dark:border-gray-600 hover:border-green-400'
                  }`}
                >
                  {isMarkedCorrect && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                </button>
              ) : (
                <button
                  onClick={() => onCorrectMultiToggle(i)}
                  className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                    isMarkedCorrect
                      ? 'border-green-500 bg-green-500'
                      : 'border-gray-300 dark:border-gray-600 hover:border-green-400'
                  }`}
                >
                  {isMarkedCorrect && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              )}

              {/* Letter label */}
              <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-400 shrink-0">
                {String.fromCharCode(65 + i)}
              </div>

              {/* Input */}
              <input
                type="text"
                value={opt}
                onChange={e => onOptionChange(i, e.target.value)}
                placeholder={`Pilihan ${String.fromCharCode(65 + i)}`}
                className={`flex-1 px-3 py-2.5 border text-sm rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  isMarkedCorrect
                    ? 'border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-900/10'
                    : 'border-gray-200 dark:border-gray-600'
                }`}
              />

              {/* Remove button */}
              {options.length > 2 && (
                <button
                  onClick={() => onRemoveOption(i)}
                  className="text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {options.length < 6 && (
        <button
          onClick={onAddOption}
          className="mt-3 flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah pilihan jawaban
        </button>
      )}
    </div>
  );
}
