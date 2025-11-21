'use client';

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
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-bold text-lg">Soal #{index + 1}</h3>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded text-sm"
          >
            ✏️ Edit
          </button>
          <button
            onClick={onDelete}
            className="text-red-600 hover:bg-red-50 px-3 py-1 rounded text-sm"
          >
            🗑️ Hapus
          </button>
        </div>
      </div>

      <div className="mb-3">
        <p className="text-sm text-gray-600 mb-1">
          Tipe: <span className="font-medium">{getQuestionTypeName(question.question_type)}</span>
        </p>
        <div className="prose max-w-none text-gray-800 whitespace-pre-wrap">
          {question.question_text}
        </div>
      </div>

      <div className="mb-3">
        <p className="text-sm font-medium mb-2">Pilihan:</p>
        <div className="space-y-1">
          {question.options.map((opt, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="font-medium text-gray-700">{String.fromCharCode(65 + idx)}.</span>
              <span className="text-gray-800">{opt}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded p-3 mb-3">
        <p className="text-sm font-medium text-green-800 mb-1">Jawaban Benar:</p>
        {question.question_type === 'single' && (
          <p className="text-green-700">{String.fromCharCode(65 + question.correct_answer_index)}</p>
        )}
        {question.question_type === 'multiple' && question.correct_answers && (
          <p className="text-green-700">
            {question.correct_answers.map(i => String.fromCharCode(65 + i)).join(', ')}
          </p>
        )}
        {question.question_type === 'reasoning' && question.reasoning_answers && (
          <div className="space-y-1">
            {Object.entries(question.reasoning_answers).map(([idx, val]) => (
              <p key={idx} className="text-green-700">
                {String.fromCharCode(65 + parseInt(idx))}: {val === 'benar' ? '✓ Benar' : '✗ Salah'}
              </p>
            ))}
          </div>
        )}
      </div>

      {question.explanation && (
        <div className="bg-blue-50 border border-blue-200 rounded p-3">
          <p className="text-sm font-medium text-blue-800 mb-1">Pembahasan:</p>
          <p className="text-blue-700 text-sm">{question.explanation}</p>
        </div>
      )}
    </div>
  );
}