// ============================================
// FILE: components/admin/QuestionList.tsx
// ============================================
'use client';

type Tryout = { 
  id: string; 
  title: string 
};

type Question = {
  id: string;
  question_text: string;
  options: string[];
  correct_answer_index: number;
  correct_answers: number[] | null;
  reasoning_answers: { [key: number]: 'benar' | 'salah' } | null;
  question_type: 'single' | 'multiple' | 'reasoning';
  explanation: string;
  tryout_id: string;
};

type QuestionListProps = {
  tryouts: Tryout[];
  questions: Question[];
  selectedTryout: string;
  onTryoutChange: (tryoutId: string) => void;
  onEdit: (question: Question) => void;
  onDelete: (questionId: string) => void;
};

export default function QuestionList({
  tryouts,
  questions,
  selectedTryout,
  onTryoutChange,
  onEdit,
  onDelete,
}: QuestionListProps) {
  
  const getQuestionTypeName = (type: string) => {
    if (type === 'single') return 'Single Answer';
    if (type === 'multiple') return 'Multiple Answer (MCMA)';
    return 'Reasoning (Benar/Salah)';
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 transition-colors">
      {/* Tryout Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Pilih Tryout untuk Melihat Soal
        </label>
        <select
          value={selectedTryout}
          onChange={(e) => onTryoutChange(e.target.value)}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="">-- Pilih Tryout --</option>
          {tryouts.map((tryout) => (
            <option key={tryout.id} value={tryout.id}>
              {tryout.title}
            </option>
          ))}
        </select>
      </div>

      {/* Empty State - No Tryout Selected */}
      {!selectedTryout && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
            Pilih Tryout
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Silakan pilih tryout dari dropdown di atas untuk melihat daftar soal
          </p>
        </div>
      )}

      {/* Empty State - No Questions */}
      {selectedTryout && questions.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
            Belum Ada Soal
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
            Belum ada soal untuk tryout ini. Mulai tambahkan soal baru!
          </p>
        </div>
      )}

      {/* Questions List */}
      {selectedTryout && questions.length > 0 && (
        <div className="space-y-4">
          {/* Header Info */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Soal: <span className="font-semibold text-gray-900 dark:text-white">{questions.length}</span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {tryouts.find(t => t.id === selectedTryout)?.title}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Klik "Edit" untuk mengubah atau "Hapus" untuk menghapus soal
              </p>
            </div>
          </div>

          {/* Question Cards - Inline */}
          {questions.map((question, index) => (
            <div key={question.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md dark:hover:shadow-xl transition-shadow bg-white dark:bg-gray-800">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">Soal #{index + 1}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => onEdit(question)}
                    className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-3 py-1 rounded text-sm transition-colors"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => onDelete(question.id)}
                    className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1 rounded text-sm transition-colors"
                  >
                    🗑️ Hapus
                  </button>
                </div>
              </div>

              <div className="mb-3">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Tipe: <span className="font-medium text-gray-900 dark:text-white">{getQuestionTypeName(question.question_type)}</span>
                </p>
                <div className="prose max-w-none text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                  {question.question_text}
                </div>
              </div>

              <div className="mb-3">
                <p className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Pilihan:</p>
                <div className="space-y-1">
                  {question.options.map((opt, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="font-medium text-gray-700 dark:text-gray-300">{String.fromCharCode(65 + idx)}.</span>
                      <span className="text-gray-800 dark:text-gray-200">{opt}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-3 mb-3">
                <p className="text-sm font-medium text-green-800 dark:text-green-300 mb-1">Jawaban Benar:</p>
                {question.question_type === 'single' && (
                  <p className="text-green-700 dark:text-green-400">{String.fromCharCode(65 + question.correct_answer_index)}</p>
                )}
                {question.question_type === 'multiple' && question.correct_answers && (
                  <p className="text-green-700 dark:text-green-400">
                    {question.correct_answers.map(i => String.fromCharCode(65 + i)).join(', ')}
                  </p>
                )}
                {question.question_type === 'reasoning' && question.reasoning_answers && (
                  <div className="space-y-1">
                    {Object.entries(question.reasoning_answers).map(([idx, val]) => (
                      <p key={idx} className="text-green-700 dark:text-green-400">
                        {String.fromCharCode(65 + parseInt(idx))}: {val === 'benar' ? '✓ Benar' : '✗ Salah'}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {question.explanation && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-3">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">Pembahasan:</p>
                  <p className="text-blue-700 dark:text-blue-400 text-sm">{question.explanation}</p>
                </div>
              )}
            </div>
          ))}

          {/* Footer Info */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Menampilkan {questions.length} soal
            </p>
          </div>
        </div>
      )}
    </div>
  );
}