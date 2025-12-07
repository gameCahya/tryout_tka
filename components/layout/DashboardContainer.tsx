type DashboardContainerProps = {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
};

export function DashboardContainer({ children, maxWidth = 'xl' }: DashboardContainerProps) {
  const maxWidths = {
    sm: 'max-w-3xl',
    md: 'max-w-4xl',
    lg: 'max-w-5xl',
    xl: 'max-w-6xl',
    '2xl': 'max-w-7xl',
    full: 'max-w-full',
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 transition-colors">
      <div className={`${maxWidths[maxWidth]} mx-auto`}>
        {children}
      </div>
    </div>
  );
}