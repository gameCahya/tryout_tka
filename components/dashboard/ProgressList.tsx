import { ProgressCard } from './ProgressCard';
import { EmptyState } from '@/components/common/EmptyState';

type ProgressListProps = {
  title: string;
  progress: Array<{
    id: string;
    user_id: string;
    user_name: string;
    tryout_id: string;
    tryout_title: string;
    score: number | null;
    completed_at: string | null;
  }>;
  onViewDetail: (tryoutId: string, userId: string) => void;
  maxItems?: number;
};

export function ProgressList({ title, progress, onViewDetail, maxItems }: ProgressListProps) {
  const displayedProgress = maxItems ? progress.slice(0, maxItems) : progress;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {title}
        </h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {progress.length} hasil
        </span>
      </div>

      {progress.length === 0 ? (
        <EmptyState
          icon="📊"
          title="Belum Ada Progress"
          message="Belum ada siswa yang mengerjakan tryout"
        />
      ) : (
        <div className="space-y-3">
          {displayedProgress.map((item) => (
            <ProgressCard
              key={item.id}
              progress={item}
              onViewDetail={onViewDetail}
              tryoutId={item.tryout_id}
              userId={item.user_id}
            />
          ))}
        </div>
      )}
    </div>
  );
}