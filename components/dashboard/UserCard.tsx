import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';

type UserCardProps = {
  user: {
    id: string;
    full_name: string;
    school: string;
    role: string;
  };
  onViewDetail?: (userId: string) => void;
};

export function UserCard({ user, onViewDetail }: UserCardProps) {
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'danger';
      case 'teacher': return 'info';
      default: return 'default';
    }
  };

  return (
    <Card hover>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 dark:text-white mb-2">
            {user.full_name}
          </h3>
          <div className="flex flex-wrap gap-2 text-sm">
            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
              <span>🏢</span>
              <span>{user.school}</span>
            </div>
            <Badge variant={getRoleBadgeVariant(user.role)}>
              👤 {user.role}
            </Badge>
          </div>
        </div>
        {onViewDetail && (
          <button
            onClick={() => onViewDetail(user.id)}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium ml-2"
          >
            Detail
          </button>
        )}
      </div>
    </Card>
  );
}