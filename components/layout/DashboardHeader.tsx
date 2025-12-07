type ActionButton = {
  icon: string;
  label: string;
  onClick: () => void;
  color: 'purple' | 'green' | 'blue' | 'red' | 'yellow' | 'orange';
  variant?: 'solid' | 'outline';
};

type DashboardHeaderProps = {
  title: string;
  subtitle: string;
  actions: ActionButton[];
};

export function DashboardHeader({ title, subtitle, actions }: DashboardHeaderProps) {
  const colorClasses = {
    purple: {
      solid: 'bg-purple-600 dark:bg-purple-500 hover:bg-purple-700 dark:hover:bg-purple-600 text-white',
      outline: 'border-2 border-purple-600 dark:border-purple-500 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20',
    },
    green: {
      solid: 'bg-green-600 dark:bg-green-500 hover:bg-green-700 dark:hover:bg-green-600 text-white',
      outline: 'border-2 border-green-600 dark:border-green-500 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20',
    },
    blue: {
      solid: 'bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white',
      outline: 'border-2 border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20',
    },
    red: {
      solid: 'bg-red-600 dark:bg-red-500 hover:bg-red-700 dark:hover:bg-red-600 text-white',
      outline: 'border-2 border-red-600 dark:border-red-500 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20',
    },
    yellow: {
      solid: 'bg-yellow-600 dark:bg-yellow-500 hover:bg-yellow-700 dark:hover:bg-yellow-600 text-white',
      outline: 'border-2 border-yellow-600 dark:border-yellow-500 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20',
    },
    orange: {
      solid: 'bg-orange-600 dark:bg-orange-500 hover:bg-orange-700 dark:hover:bg-orange-600 text-white',
      outline: 'border-2 border-orange-600 dark:border-orange-500 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20',
    },
  };

  return (
    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 py-4 border-b border-gray-200 dark:border-gray-700">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          {title}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {subtitle}
        </p>
      </div>
      
      <div className="flex flex-wrap gap-2 md:gap-3">
        {actions.map((action, index) => {
          const variant = action.variant || 'solid';
          const classes = colorClasses[action.color][variant];
          
          return (
            <button
              key={index}
              onClick={action.onClick}
              className={`flex items-center gap-2 ${classes} px-4 py-2 rounded-lg transition-colors text-sm md:text-base font-medium`}
            >
              <span>{action.icon}</span>
              <span>{action.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}