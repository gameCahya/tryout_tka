// components/admin/QuestionCard.tsx
'use client';

import HTMLRenderer from './HTMLRenderer';

type Question = {
  id: string;
  question_text: string;
  options: string[];
  correct_answer_index: number;
  correct_answers: number[] | null;
  reasoning_answers: { [key: number]: 'benar' | 'salah' } | null;
  question_type: 'single' | 'multiple' | 'reasoning';
  explanation: string;
};

type QuestionCardProps = {
  question: Question;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
};

export default function QuestionCard({ question, index, onEdit, onDelete }: QuestionCardProps) {
  const getQuestionTypeName = (type: string) => {
    if (type === 'single') return 'Single Answer';
    if (type === 'multiple') return 'Multiple Answer (MCMA)';
    return 'Reasoning (Benar/Salah)';
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md dark:hover:shadow-xl transition-shadow bg-white dark:bg-gray-800">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-bold text-lg text-gray-900 dark:text-white">Soal #{index + 1}</h3>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-3 py-1 rounded text-sm transition-colors"
          >
            ✏️ Edit
          </button>
          <button
            onClick={onDelete}
            className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1 rounded text-sm transition-colors"
          >
            🗑️ Hapus
          </button>
        </div>
      </div>

      <div className="mb-3">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Tipe: <span className="font-medium text-gray-900 dark:text-white">{getQuestionTypeName(question.question_type)}</span>
        </p>
        <HTMLRenderer 
          content={question.question_text} 
          className="text-gray-800 dark:text-gray-200"
        />
      </div>

      <div className="mb-3">
        <p className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Pilihan:</p>
        <div className="space-y-2">
          {question.options.map((opt, idx) => (
            <div key={idx} className="flex items-start gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
              <span className="font-medium text-gray-700 dark:text-gray-300 min-w-[24px]">
                {String.fromCharCode(65 + idx)}.
              </span>
              <HTMLRenderer 
                content={opt} 
                className="text-gray-800 dark:text-gray-200 flex-1"
              />
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
          <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">Pembahasan:</p>
          <HTMLRenderer 
            content={question.explanation} 
            className="text-blue-700 dark:text-blue-400 text-sm"
          />
        </div>
      )}
    </div>
  );
}