// app/tryout/[id]/components/MultipleChoiceQuestion.tsx

type MultipleChoiceQuestionProps = {
  options: string[];
  selectedAnswers: number[];
  onAnswerToggle: (index: number) => void;
};

export default function MultipleChoiceQuestion({
  options,
  selectedAnswers,
  onAnswerToggle,
}: MultipleChoiceQuestionProps) {
  return (
    <>
      <div className="mb-3 inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs px-3 py-1 rounded-full font-medium">
        📋 PGK MCMA - Pilih lebih dari satu jawaban
      </div>
      
      <div className="space-y-3">
        {options.map((option, idx) => {
          const isSelected = selectedAnswers.includes(idx);

          return (
            <button
              key={idx}
              type="button"
              onClick={() => onAnswerToggle(idx)}
              className={`
                w-full text-left p-3 rounded border transition-colors flex items-start
                ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 font-medium dark:text-white'
                    : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200'
                }
              `}
            >
              <div className="flex items-center mr-3 mt-1">
                <div
                  className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
                    isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-400 dark:border-gray-500'
                  }`}
                >
                  {isSelected && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M5 13l4 4L19 7"></path>
                    </svg>
                  )}
                </div>
              </div>
              <span className="flex-1">
                <strong>{String.fromCharCode(65 + idx)}.</strong> {option}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}