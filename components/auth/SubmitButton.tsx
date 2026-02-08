// components/auth/SubmitButton.tsx
interface SubmitButtonProps {
  loading: boolean;
  loadingText: string;
  text: string;
}

export default function SubmitButton({ loading, loadingText, text }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={loading}
      className={`w-full py-3 px-4 rounded-xl text-white font-semibold shadow-lg transition-all duration-200 ${
        loading 
          ? 'bg-linear-to-r from-blue-400 to-indigo-400 cursor-not-allowed dark:from-blue-600 dark:to-indigo-600' 
          : 'bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 dark:from-blue-700 dark:to-indigo-700 dark:hover:from-blue-600 dark:hover:to-indigo-600'
      }`}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {loadingText}
        </span>
      ) : (
        text
      )}
    </button>
  );
}