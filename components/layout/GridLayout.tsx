type GridLayoutProps = {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  responsive?: boolean;
};

export function GridLayout({ 
  children, 
  columns = 2, 
  gap = 'lg',
  responsive = true 
}: GridLayoutProps) {
  const gaps = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
  };

  const gridCols = {
    1: 'grid-cols-1',
    2: responsive ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-2',
    3: responsive ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-3',
    4: responsive ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-4',
  };

  return (
    <div className={`grid ${gridCols[columns]} ${gaps[gap]}`}>
      {children}
    </div>
  );
}
