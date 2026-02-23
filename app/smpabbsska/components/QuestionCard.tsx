import Image from 'next/image';
import 'katex/dist/katex.min.css';
import { Question } from '../types';

interface QuestionCardProps {
  question: Question;
  index: number;
  onEdit: (question: Question) => void;
  onDelete: (questionId: string) => void;
}

export default function QuestionCard({ question: q, index: idx, onEdit, onDelete }: QuestionCardProps) {
  return (
    <div className="p-5 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors group">
      <div className="flex items-start gap-4">
        {/* Number badge */}
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
          q.question_type === 'single'
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
            : q.question_type === 'multiple'
            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
        }`}>
          {idx + 1}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div
                className="text-sm font-medium text-gray-900 dark:text-white leading-relaxed prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: q.question_text }}
              />
              {/* Image thumbnail */}
              {q.image_url && (
                <div className="mt-2">
                  <Image
                    src={q.image_url}
                    alt={`Gambar soal ${idx + 1}`}
                    width={160}
                    height={80}
                    unoptimized
                    className="rounded-lg border border-gray-200 dark:border-gray-600 object-cover"
                    style={{ height: '80px', width: 'auto', maxWidth: '160px' }}
                  />
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button
                onClick={() => onEdit(q)}
                className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                title="Edit soal"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={() => onDelete(q.id)}
                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Hapus soal"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Options or Essay Answer */}
          {q.question_type === 'essay' ? (
            <div className="mt-2 px-3 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/50">
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">Kunci Jawaban (admin only):</p>
              <div
                className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed prose prose-xs dark:prose-invert max-w-none line-clamp-3"
                dangerouslySetInnerHTML={{ __html: q.essay_answer || '-' }}
              />
            </div>
          ) : (
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {(q.options || []).map((opt, optIdx) => {
                const isCorrect = q.question_type === 'single'
                  ? q.correct_answer_index === optIdx
                  : (q.correct_answers || []).includes(optIdx);
                return (
                  <div key={optIdx} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
                    isCorrect
                      ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 font-medium'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    <span className="font-mono text-xs opacity-60 shrink-0">{String.fromCharCode(65 + optIdx)}.</span>
                    <span className="truncate">{opt}</span>
                    {isCorrect && <span className="ml-auto shrink-0 text-xs">✓</span>}
                  </div>
                );
              })}
            </div>
          )}

          {/* Badges */}
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              q.question_type === 'single'
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                : q.question_type === 'multiple'
                ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'
                : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
            }`}>
              {q.question_type === 'single' ? 'Pilihan Ganda' : q.question_type === 'multiple' ? 'Multi Jawaban' : 'Esai'}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">{q.question_points} poin</span>
            {q.image_url && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400">
                🖼 Bergambar
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}