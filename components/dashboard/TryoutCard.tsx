import { Card } from '@/components/common/Card';

type TryoutCardProps = {
  tryout: {
    id: string;
    title: string;
    total_questions: number;
    duration_minutes: number;
    student_count?: number;
  };
  onViewResults?: (id: string) => void;
  onViewDetail?: (id: string) => void;
  onEdit?: (id: string) => void;
  showStudentCount?: boolean;
  showResultsButton?: boolean;
  showEditButton?: boolean;
};

export function TryoutCard({ 
  tryout, 
  onViewResults, 
  onViewDetail, 
  onEdit,
  showStudentCount = true,
  showResultsButton = true,
  showEditButton = false,
}: TryoutCardProps) {
  return (
    <Card hover>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 dark:text-white mb-2">
            {tryout.title}
          </h3>
          <div className="flex flex-wrap gap-2 text-sm">
            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
              <span>📝</span>
              <span>{tryout.total_questions} soal</span>
            </div>
            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
              <span>⏱️</span>
              <span>{tryout.duration_minutes} menit</span>
            </div>
            {showStudentCount && (
              <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                <span>👥</span>
                <span>{tryout.student_count || 0} siswa</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 ml-2">
          {showResultsButton && onViewResults && (
            <button
              onClick={() => onViewResults(tryout.id)}
              className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 text-sm font-medium whitespace-nowrap"
              title="Lihat Hasil"
            >
              📊 Hasil
            </button>
          )}
          {showEditButton && onEdit && (
            <button
              onClick={() => onEdit(tryout.id)}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
            >
              Edit
            </button>
          )}
          {onViewDetail && (
            <button
              onClick={() => onViewDetail(tryout.id)}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
            >
              Detail
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}