import { StatCard } from '@/components/dashboard/StatCard';

type StatItem = {
  title: string;
  value: number | string;
  subtitle: string;
  icon: string;
  gradient: 'purple' | 'indigo' | 'green' | 'blue' | 'yellow' | 'orange';
};

type StatsGridProps = {
  stats: StatItem[];
  columns?: 2 | 3 | 4;
};

export function StatsGrid({ stats, columns = 4 }: StatsGridProps) {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-4 mb-8`}>
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
}