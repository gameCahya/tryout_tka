import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';

type ProgressCardProps = {
  progress: {
    id: string;
    user_name: string;
    tryout_title: string;
    score: number | null;
    completed_at: string | null;
  };
  onViewDetail: (tryoutId: string, userId: string) => void;
  tryoutId: string;
  userId: string;
};

export function ProgressCard({ progress, onViewDetail, tryoutId, userId }: ProgressCardProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Belum selesai';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <Card hover>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 dark:text-white mb-2">
            {progress.user_name}
          </h3>
          <div className="flex flex-wrap gap-2 text-sm">
            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
              <span>📝</span>
              <span className="truncate max-w-[150px]">{progress.tryout_title}</span>
            </div>
            <div className="flex items-center gap-1">
              {progress.score !== null ? (
                <Badge variant="success">
                  📊 {progress.score.toFixed(1)}%
                </Badge>
              ) : (
                <Badge variant="warning">
                  ⏳ Belum selesai
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 text-xs">
              <span>🕒</span>
              <span>{formatDate(progress.completed_at)}</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => onViewDetail(tryoutId, userId)}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium ml-2"
        >
          Detail →
        </button>
      </div>
    </Card>
  );
}