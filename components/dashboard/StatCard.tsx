type StatCardProps = {
  title: string;
  value: number | string;
  subtitle: string;
  icon: string;
  gradient: 'purple' | 'indigo' | 'green' | 'blue' | 'yellow' | 'orange';
};

export function StatCard({ title, value, subtitle, icon, gradient }: StatCardProps) {
  const gradients = {
    purple: 'from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700',
    indigo: 'from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700',
    green: 'from-green-500 to-green-600 dark:from-green-600 dark:to-green-700',
    blue: 'from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700',
    yellow: 'from-yellow-500 to-yellow-600 dark:from-yellow-600 dark:to-yellow-700',
    orange: 'from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700',
  };

  const textColors = {
    purple: 'text-purple-100',
    indigo: 'text-indigo-100',
    green: 'text-green-100',
    blue: 'text-blue-100',
    yellow: 'text-yellow-100',
    orange: 'text-orange-100',
  };

  return (
    <div className={`bg-gradient-to-br ${gradients[gradient]} p-6 rounded-xl shadow-lg text-white`}>
      <div className="flex items-center justify-between mb-2">
        <p className={textColors[gradient]}>{title}</p>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-3xl font-bold">{value}</p>
      <p className={`text-sm ${textColors[gradient]} mt-1`}>{subtitle}</p>
    </div>
  );
}
