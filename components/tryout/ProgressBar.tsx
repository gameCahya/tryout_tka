// app/tryout/[id]/components/ProgressBar.tsx

type ProgressBarProps = {
  currentIndex: number;
  total: number;
  answeredCount: number;
};

export default function ProgressBar({ currentIndex, total, answeredCount }: ProgressBarProps) {
  const progressPercentage = ((currentIndex + 1) / total) * 100;

  return (
    <div className="mb-6">
      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
        <span>Soal {currentIndex + 1} dari {total}</span>
        <span>Terjawab: {answeredCount}/{total}</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
    </div>
  );
}