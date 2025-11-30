// app/tryout/[id]/components/NavigationButtons.tsx

type NavigationButtonsProps = {
  currentIndex: number;
  totalQuestions: number;
  submitting: boolean;
  onPrev: () => void;
  onNext: () => void;
  onSubmit: () => void;
};

export default function NavigationButtons({
  currentIndex,
  totalQuestions,
  submitting,
  onPrev,
  onNext,
  onSubmit,
}: NavigationButtonsProps) {
  const isFirstQuestion = currentIndex === 0;
  const isLastQuestion = currentIndex === totalQuestions - 1;

  return (
    <div className="flex justify-between items-center gap-4">
      <button
        onClick={onPrev}
        disabled={isFirstQuestion}
        className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-white rounded disabled:opacity-50 hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors disabled:cursor-not-allowed"
      >
        ← Sebelumnya
      </button>

      {isLastQuestion ? (
        <button
          onClick={onSubmit}
          disabled={submitting}
          className="px-6 py-2 bg-green-600 dark:bg-green-500 text-white rounded disabled:opacity-50 hover:bg-green-700 dark:hover:bg-green-600 transition-colors font-medium disabled:cursor-not-allowed"
        >
          {submitting ? 'Menyimpan...' : '✓ Selesai'}
        </button>
      ) : (
        <button
          onClick={onNext}
          className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
        >
          Berikutnya →
        </button>
      )}
    </div>
  );
}