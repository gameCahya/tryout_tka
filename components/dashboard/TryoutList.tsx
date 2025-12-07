import { TryoutCard } from './TryoutCard';
import { EmptyState } from '@/components/common/EmptyState';

type TryoutListProps = {
  title: string;
  tryouts: Array<{
    id: string;
    title: string;
    total_questions: number;
    duration_minutes: number;
    student_count?: number;
  }>;
  onViewResults?: (id: string) => void;
  onViewDetail?: (id: string) => void;
  onEdit?: (id: string) => void;
  showStudentCount?: boolean;
  showResultsButton?: boolean;
  showEditButton?: boolean;
  emptyMessage?: string;
  emptyAction?: {
    label: string;
    onClick: () => void;
  };
  maxItems?: number;
};

export function TryoutList({
  title,
  tryouts,
  onViewResults,
  onViewDetail,
  onEdit,
  showStudentCount = true,
  showResultsButton = true,
  showEditButton = false,
  emptyMessage = 'Belum ada tryout',
  emptyAction,
  maxItems,
}: TryoutListProps) {
  const displayedTryouts = maxItems ? tryouts.slice(0, maxItems) : tryouts;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {title}
        </h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {tryouts.length} tryout
        </span>
      </div>

      {tryouts.length === 0 ? (
        <EmptyState
          icon="📭"
          title="Belum Ada Tryout"
          message={emptyMessage}
          action={emptyAction}
        />
      ) : (
        <div className="space-y-3">
          {displayedTryouts.map((tryout) => (
            <TryoutCard
              key={tryout.id}
              tryout={tryout}
              onViewResults={onViewResults}
              onViewDetail={onViewDetail}
              onEdit={onEdit}
              showStudentCount={showStudentCount}
              showResultsButton={showResultsButton}
              showEditButton={showEditButton}
            />
          ))}
        </div>
      )}
    </div>
  );
}
