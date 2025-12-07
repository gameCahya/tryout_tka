type EmptyStateProps = {
  icon: string;
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
};

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 text-center">
      <div className="text-4xl mb-2">{icon}</div>
      <h3 className="font-medium text-gray-900 dark:text-white mb-1">
        {title}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {message}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className={`px-4 py-2 rounded-lg transition-colors ${
            action.variant === 'secondary'
              ? 'bg-gray-600 dark:bg-gray-700 text-white hover:bg-gray-700 dark:hover:bg-gray-600'
              : 'bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600'
          }`}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}