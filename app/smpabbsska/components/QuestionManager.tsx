import { Tryout, Question } from '../types';
import QuestionCard from './QuestionCard';

interface QuestionManagerProps {
  selectedTryout: Tryout | null;
  questions: Question[];
  onAddQuestion: () => void;
  onEditQuestion: (question: Question) => void;
  onDeleteQuestion: (questionId: string) => void;
  onToggleStatus: (tryout: Tryout) => void;
}

export default function QuestionManager({
  selectedTryout,
  questions,
  onAddQuestion,
  onEditQuestion,
  onDeleteQuestion,
  onToggleStatus,
}: QuestionManagerProps) {
  if (!selectedTryout) {
    return (
      <div className="flex-1 min-w-0">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-16 text-center">
          <div className="text-5xl mb-4">👈</div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Pilih Tryout</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mx-auto">
            Klik salah satu tryout di panel kiri untuk mulai mengelola soal-soalnya.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{selectedTryout.title}</h2>
              {selectedTryout.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{selectedTryout.description}</p>
              )}
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 px-2.5 py-1 rounded-full font-medium">
                  📋 {questions.length} soal
                </span>
                <span className="text-xs bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 px-2.5 py-1 rounded-full font-medium">
                  ⏱ {selectedTryout.duration_minutes} menit
                </span>
                <button
                  onClick={() => onToggleStatus(selectedTryout)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                    selectedTryout.is_active
                      ? 'bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400'
                  }`}
                >
                  {selectedTryout.is_active ? '✓ Aktif' : '⏸ Nonaktif'} (klik toggle)
                </button>
              </div>
            </div>
            <button
              onClick={onAddQuestion}
              className="flex items-center gap-2 bg-linear-to-r from-blue-600 to-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-green-700 transition-all shadow-sm hover:shadow-md shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tambah Soal
            </button>
          </div>
        </div>

        {/* Questions */}
        {questions.length === 0 ? (
          <div className="p-16 text-center">
            <div className="text-4xl mb-3">📄</div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-1">Belum ada soal</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              Klik &quot;Tambah Soal&quot; untuk mulai membuat soal tryout ini.
            </p>
            <button
              onClick={onAddQuestion}
              className="bg-linear-to-r from-blue-600 to-green-600 text-white px-6 py-2.5 rounded-xl font-medium text-sm hover:from-blue-700 hover:to-green-700 transition-all shadow-sm hover:shadow-md"
            >
              Tambah Soal Pertama
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {questions.map((q, idx) => (
              <QuestionCard
                key={q.id}
                question={q}
                index={idx}
                onEdit={onEditQuestion}
                onDelete={onDeleteQuestion}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
