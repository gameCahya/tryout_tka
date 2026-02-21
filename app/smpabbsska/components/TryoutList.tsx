import { Tryout } from '../types';

interface TryoutListProps {
  tryouts: Tryout[];
  selectedTryout: Tryout | null;
  onSelect: (tryout: Tryout) => void;
  onDelete: (tryout: Tryout) => void;
  onCreateNew: () => void;
}

export default function TryoutList({
  tryouts,
  selectedTryout,
  onSelect,
  onDelete,
  onCreateNew,
}: TryoutListProps) {
  return (
    <div className="lg:w-72 xl:w-80 shrink-0">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">Daftar Tryout</h2>
          <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
            {tryouts.length}
          </span>
        </div>

        {tryouts.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-3xl mb-2">📝</div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Belum ada tryout</p>
            <button
              onClick={onCreateNew}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Buat tryout baru →
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-gray-700/50 max-h-[calc(100vh-200px)] overflow-y-auto">
            {tryouts.map(tryout => (
              <div
                key={tryout.id}
                onClick={() => onSelect(tryout)}
                className={`p-4 cursor-pointer transition-all group relative ${
                  selectedTryout?.id === tryout.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/30 border-l-4 border-transparent'
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        tryout.is_active ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                      }`} />
                      <p className={`text-sm font-semibold truncate ${
                        selectedTryout?.id === tryout.id
                          ? 'text-blue-700 dark:text-blue-300'
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {tryout.title}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 ml-3.5">
                      {tryout.total_questions} soal · {tryout.duration_minutes} mnt
                    </p>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); onDelete(tryout); }}
                    className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all p-0.5 shrink-0"
                    title="Hapus tryout"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
