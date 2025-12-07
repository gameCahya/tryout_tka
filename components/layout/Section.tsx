type SectionProps = {
  title?: string;
  subtitle?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  children: React.ReactNode;
  className?: string;
};

export function Section({ title, subtitle, action, children, className = '' }: SectionProps) {
  return (
    <section className={`mb-8 ${className}`}>
      {(title || subtitle || action) && (
        <div className="flex items-center justify-between mb-4">
          <div>
            {title && (
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {subtitle}
              </p>
            )}
          </div>
          {action && (
            <button
              onClick={action.onClick}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
            >
              {action.label} →
            </button>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
