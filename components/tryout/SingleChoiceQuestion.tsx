// app/tryout/[id]/components/SingleChoiceQuestion.tsx

type SingleChoiceQuestionProps = {
  options: string[];
  selectedAnswer: number;
  onAnswerSelect: (index: number) => void;
};

export default function SingleChoiceQuestion({
  options,
  selectedAnswer,
  onAnswerSelect,
}: SingleChoiceQuestionProps) {
  return (
    <div className="space-y-3">
      {options.map((option, idx) => {
        const isSelected = selectedAnswer === idx;

        return (
          <button
            key={idx}
            type="button"
            onClick={() => onAnswerSelect(idx)}
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
                className={`w-5 h-5 border-2 rounded-full flex items-center justify-center ${
                  isSelected ? 'border-blue-500' : 'border-gray-400 dark:border-gray-500'
                }`}
              >
                {isSelected && <div className="w-3 h-3 bg-blue-500 rounded-full"></div>}
              </div>
            </div>
            <span className="flex-1">
              <strong>{String.fromCharCode(65 + idx)}.</strong> {option}
            </span>
          </button>
        );
      })}
    </div>
  );
}