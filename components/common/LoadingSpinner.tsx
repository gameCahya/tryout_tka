type LoadingSpinnerProps = {
  message?: string;
  fullScreen?: boolean;
};

export function LoadingSpinner({ 
  message = 'Loading...', 
  fullScreen = true 
}: LoadingSpinnerProps) {
  const containerClass = fullScreen 
    ? 'min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900'
    : 'flex items-center justify-center p-8';

  return (
    <div className={containerClass}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">{message}</p>
      </div>
    </div>
  );
}